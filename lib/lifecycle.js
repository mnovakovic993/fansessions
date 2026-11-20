import { db } from './supabase';
import { CLOSE_AFTER_MIN } from './calls';
import { meetingParticipants, roomNameFor } from './daily';

// Bookings move on by themselves once their time has passed:
//  - a hold that was never paid becomes "expired" (a late payment still confirms it; see the webhook),
//  - a confirmed call that has ended becomes "completed", "no_show_fan" or "no_show_creator",
//    judged by who actually joined the Daily room.
// Safe to run any number of times; it only touches bookings whose time is over.

const LOOKBACK_DAYS = 30;

export function outcomeFor(participants) {
  const roles = new Set(participants.map(roleOf).filter(Boolean));
  if (!roles.has('creator')) return 'no_show_creator';
  if (!roles.has('fan')) return 'no_show_fan';
  return 'completed';
}

// Tokens carry user_id "creator:<uuid>" / "fan:<uuid>". Calls made before that used only the name "Fan".
function roleOf(p) {
  const id = String(p.user_id || '');
  if (id.startsWith('creator:')) return 'creator';
  if (id.startsWith('fan:')) return 'fan';
  if (p.user_name === 'Fan') return 'fan';
  if (p.user_name) return 'creator';
  return null;
}

export async function settleBookings({ creatorId } = {}) {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const result = { expired: 0, settled: 0, failed: 0 };

  let holds = db().from('bookings').update({ status: 'expired' }).eq('status', 'held').lt('hold_expires_at', nowIso);
  if (creatorId) holds = holds.eq('creator_id', creatorId);
  const { data: expired, error: holdError } = await holds.select('id');
  if (holdError) console.error('expire holds failed', holdError);
  result.expired = expired?.length || 0;

  let q = db()
    .from('bookings')
    .select('id, daily_room')
    .eq('status', 'confirmed')
    .lt('ends_at', new Date(now - CLOSE_AFTER_MIN * 60000).toISOString())
    .gt('ends_at', new Date(now - LOOKBACK_DAYS * 86400000).toISOString())
    .limit(50);
  if (creatorId) q = q.eq('creator_id', creatorId);
  const { data: ended } = await q;

  for (const b of ended || []) {
    try {
      const participants = await meetingParticipants(b.daily_room || roomNameFor(b.id));
      const status = outcomeFor(participants);
      await db().from('bookings').update({ status }).eq('id', b.id).eq('status', 'confirmed');
      result.settled += 1;
    } catch (e) {
      console.error('settle booking failed', b.id, e.message);
      result.failed += 1;
    }
  }
  return result;
}
