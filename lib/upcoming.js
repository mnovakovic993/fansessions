import { db } from './supabase';
import { joinTicket, joinUrl, CLOSE_AFTER_MIN } from './calls';

// Confirmed calls that have not ended yet, each with a personal join link.
export async function upcomingFor({ creatorId, fanUuid, role, who }) {
  let q = db()
    .from('bookings')
    .select('id, starts_at, ends_at, status, fan_uuid, packages(duration_min)')
    .eq('creator_id', creatorId)
    .eq('status', 'confirmed')
    .gte('ends_at', new Date(Date.now() - CLOSE_AFTER_MIN * 60000).toISOString())
    .order('starts_at');
  if (fanUuid) q = q.eq('fan_uuid', fanUuid);
  const { data } = await q;
  return (data || []).map((b) => ({
    id: b.id,
    startsAt: b.starts_at,
    endsAt: b.ends_at,
    durationMin: b.packages?.duration_min ?? null,
    joinUrl: joinUrl(joinTicket({ bookingId: b.id, role, who })),
  }));
}
