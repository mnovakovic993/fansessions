import { db } from '@/lib/supabase';
import { readTicket, callWindow } from '@/lib/calls';
import { ensureRoom, meetingToken, roomUrl } from '@/lib/daily';
import CallRoom from './CallRoom';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Video call · Fan Sessions' };

function Message({ title, text }) {
  return (
    <main className="wrap stack">
      <h1>{title}</h1>
      <p className="muted">{text}</p>
    </main>
  );
}

export default async function CallPage({ searchParams }) {
  const ticket = readTicket(searchParams?.t);
  if (!ticket) return <Message title="Link not valid" text="Open the call again from your booking on Fanvue." />;

  const { data: booking } = await db()
    .from('bookings')
    .select('*, creators(display_name, handle, fanvue_user_uuid), packages(duration_min)')
    .eq('id', ticket.bookingId)
    .maybeSingle();
  if (!booking) return <Message title="Booking not found" text="This booking does not exist." />;

  const allowed =
    (ticket.role === 'fan' && booking.fan_uuid === ticket.who) ||
    (ticket.role === 'creator' && booking.creators?.fanvue_user_uuid === ticket.who);
  if (!allowed) return <Message title="Link not valid" text="This link belongs to someone else." />;
  if (booking.status !== 'confirmed' && booking.status !== 'completed')
    return <Message title="Call not available" text={`This booking is ${booking.status.replace(/_/g, ' ')}.`} />;

  const when = callWindow(booking);
  if (when === 'early') {
    return <CallRoom state="early" startsAt={booking.starts_at} endsAt={booking.ends_at} />;
  }
  if (when === 'over') return <Message title="This call has ended" text="The time for this call is over." />;

  const room = await ensureRoom(booking);
  if (booking.daily_room !== room.name) await db().from('bookings').update({ daily_room: room.name }).eq('id', booking.id);

  const creatorName = booking.creators?.display_name || booking.creators?.handle || 'Creator';
  const token = await meetingToken({
    roomName: room.name,
    userName: ticket.role === 'creator' ? creatorName : 'Fan',
    userId: `${ticket.role}:${ticket.who}`,
    isOwner: ticket.role === 'creator',
    expUnix: Math.floor(new Date(booking.ends_at).getTime() / 1000) + 5 * 60,
  });

  return (
    <CallRoom
      state="open"
      src={roomUrl(room.name, token)}
      startsAt={booking.starts_at}
      endsAt={booking.ends_at}
      ticket={searchParams.t}
      otherName={ticket.role === 'creator' ? 'your fan' : creatorName}
    />
  );
}
