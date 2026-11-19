import { db } from './supabase';

export async function loadSettings(creatorId) {
  const [{ data: creator }, { data: packages }, { data: rules }] = await Promise.all([
    db().from('creators').select('accepting, timezone, buffer_min').eq('id', creatorId).single(),
    db().from('packages').select('duration_min, price_cents, active').eq('creator_id', creatorId).order('duration_min'),
    db().from('availability_rules').select('weekday, start_time, end_time').eq('creator_id', creatorId).order('weekday'),
  ]);
  return {
    accepting: creator?.accepting ?? false,
    timezone: creator?.timezone ?? 'Europe/London',
    bufferMin: creator?.buffer_min ?? 15,
    packages: (packages || []).map((p) => ({ durationMin: p.duration_min, priceCents: p.price_cents, active: p.active })),
    availability: (rules || []).map((r) => ({
      weekday: r.weekday,
      start: String(r.start_time).slice(0, 5),
      end: String(r.end_time).slice(0, 5),
    })),
  };
}
