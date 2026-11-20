import { db } from './supabase';
import { joinTicket, joinUrl, CLOSE_AFTER_MIN } from './calls';

const gcalStamp = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

function googleCalendarUrl({ title, startsAt, endsAt, link }) {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${gcalStamp(startsAt)}/${gcalStamp(endsAt)}`,
    details: `Join here (opens 10 minutes before the start): ${link}`,
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

// Confirmed calls that have not ended yet, each with a personal join link and calendar links.
export async function upcomingFor({ creatorId, fanUuid, role, who, creatorName }) {
  let q = db()
    .from('bookings')
    .select('id, starts_at, ends_at, status, fan_uuid, packages(duration_min)')
    .eq('creator_id', creatorId)
    .eq('status', 'confirmed')
    .gte('ends_at', new Date(Date.now() - CLOSE_AFTER_MIN * 60000).toISOString())
    .order('starts_at');
  if (fanUuid) q = q.eq('fan_uuid', fanUuid);
  const { data } = await q;
  const title = role === 'fan' ? `Video call with ${creatorName || 'creator'}` : 'Fan Sessions video call';
  return (data || []).map((b) => {
    const ticket = joinTicket({ bookingId: b.id, role, who });
    const link = joinUrl(ticket);
    return {
      id: b.id,
      startsAt: b.starts_at,
      endsAt: b.ends_at,
      durationMin: b.packages?.duration_min ?? null,
      joinUrl: link,
      icsUrl: `${process.env.APP_URL}/api/call/calendar?t=${encodeURIComponent(ticket)}`,
      googleUrl: googleCalendarUrl({ title, startsAt: b.starts_at, endsAt: b.ends_at, link }),
    };
  });
}

const PAST_STATUSES = ['completed', 'no_show_fan', 'no_show_creator', 'refunded', 'cancelled_by_fan', 'cancelled_by_creator'];

// The creator's calls from the last two weeks, with how each one ended and any problem reports.
export async function recentFor({ creatorId }) {
  const { data } = await db()
    .from('bookings')
    .select('id, starts_at, status, packages(duration_min, price_cents), call_reports(reporter_role, reason)')
    .eq('creator_id', creatorId)
    .in('status', PAST_STATUSES)
    .gte('starts_at', new Date(Date.now() - 14 * 86400000).toISOString())
    .order('starts_at', { ascending: false })
    .limit(30);
  return (data || []).map((b) => ({
    id: b.id,
    startsAt: b.starts_at,
    status: b.status,
    durationMin: b.packages?.duration_min ?? null,
    reports: (b.call_reports || []).map((r) => ({ role: r.reporter_role, reason: r.reason })),
  }));
}
