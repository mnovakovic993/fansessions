import { db } from './supabase';
import { openSlots } from './time';

export const HOLD_MINUTES = 10;

// Bookings that block a slot: confirmed ones, and holds that have not expired yet.
export async function busyBookings(creatorId) {
  const nowIso = new Date().toISOString();
  const { data } = await db()
    .from('bookings')
    .select('id, starts_at, ends_at, status, hold_expires_at')
    .eq('creator_id', creatorId)
    .gte('ends_at', nowIso)
    .in('status', ['held', 'confirmed']);
  return (data || []).filter((b) => b.status === 'confirmed' || (b.hold_expires_at && b.hold_expires_at > nowIso));
}

export async function slotsFor(creator, pkg) {
  const [{ data: rules }, busy] = await Promise.all([
    db().from('availability_rules').select('weekday, start_time, end_time').eq('creator_id', creator.id),
    busyBookings(creator.id),
  ]);
  return openSlots({
    timeZone: creator.timezone,
    rules: rules || [],
    busy,
    durationMin: pkg.duration_min,
    bufferMin: creator.buffer_min ?? 15,
  });
}

export async function bookablePackages(creatorId) {
  const { data } = await db()
    .from('packages')
    .select('id, duration_min, price_cents, external_action_id')
    .eq('creator_id', creatorId)
    .eq('active', true)
    .not('external_action_id', 'is', null)
    .order('duration_min');
  return data || [];
}
