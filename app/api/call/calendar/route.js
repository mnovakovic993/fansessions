import { db } from '@/lib/supabase';
import { readTicket, joinUrl } from '@/lib/calls';

export const dynamic = 'force-dynamic';

const stamp = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s) => String(s).replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

// A calendar file for one booked call, with a reminder 15 minutes before and the join link inside.
export async function GET(request) {
  const t = new URL(request.url).searchParams.get('t');
  const ticket = readTicket(t);
  if (!ticket) return new Response('Link not valid', { status: 401 });

  const { data: b } = await db()
    .from('bookings')
    .select('id, starts_at, ends_at, status, fan_uuid, creators(display_name, handle, fanvue_user_uuid)')
    .eq('id', ticket.bookingId)
    .maybeSingle();
  const allowed =
    b &&
    ((ticket.role === 'fan' && b.fan_uuid === ticket.who) ||
      (ticket.role === 'creator' && b.creators?.fanvue_user_uuid === ticket.who));
  if (!allowed) return new Response('Link not valid', { status: 401 });

  const creator = b.creators?.display_name || b.creators?.handle || 'creator';
  const title = ticket.role === 'fan' ? `Video call with ${creator}` : 'Fan Sessions video call';
  const link = joinUrl(t);
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fan Sessions//EN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${b.id}-${ticket.role}@fansessions`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(b.starts_at)}`,
    `DTEND:${stamp(b.ends_at)}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(`Join here (opens 10 minutes before the start): ${link}`)}`,
    `URL:${link}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(title)} starts in 15 minutes`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="fan-sessions-call.ics"',
      'Cache-Control': 'no-store',
    },
  });
}
