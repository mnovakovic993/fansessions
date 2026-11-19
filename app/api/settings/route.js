import { NextResponse } from 'next/server';
import { currentCreator } from '@/lib/session';
import { db } from '@/lib/supabase';
import { loadSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const DURATIONS = [10, 15, 20, 30, 45, 60];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function GET() {
  const creator = await currentCreator();
  if (!creator) return NextResponse.json({ error: 'not_signed_in' }, { status: 401 });
  return NextResponse.json(await loadSettings(creator.id));
}

function validTimezone(tz) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function PUT(request) {
  const creator = await currentCreator();
  if (!creator) return NextResponse.json({ error: 'not_signed_in' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'invalid_json' }, { status: 400 });

  const errors = [];
  const packages = Array.isArray(body.packages) ? body.packages : [];
  for (const p of packages) {
    if (!DURATIONS.includes(p.durationMin)) errors.push(`Unsupported duration ${p.durationMin}`);
    if (!Number.isInteger(p.priceCents) || p.priceCents < 300 || p.priceCents > 50000)
      errors.push(`Price for ${p.durationMin} min must be between $3 and $500`);
  }
  if (new Set(packages.map((p) => p.durationMin)).size !== packages.length) errors.push('Each duration can appear once');

  const availability = Array.isArray(body.availability) ? body.availability : [];
  for (const a of availability) {
    if (!Number.isInteger(a.weekday) || a.weekday < 0 || a.weekday > 6) errors.push('Invalid weekday');
    if (!TIME.test(a.start) || !TIME.test(a.end) || a.end <= a.start) errors.push('Invalid hours');
  }

  const timezone = String(body.timezone || '');
  if (!validTimezone(timezone)) errors.push('Invalid time zone');
  const bufferMin = Number(body.bufferMin);
  if (!Number.isInteger(bufferMin) || bufferMin < 0 || bufferMin > 60) errors.push('Break must be 0–60 minutes');

  if (errors.length) return NextResponse.json({ error: 'validation', details: errors }, { status: 400 });

  const id = creator.id;
  const client = db();
  const now = new Date().toISOString();

  const { error: e1 } = await client
    .from('creators')
    .update({ accepting: !!body.accepting, timezone, buffer_min: bufferMin, updated_at: now })
    .eq('id', id);

  // Packages: keep rows (they will carry Fanvue action ids later), update or insert, deactivate removed ones.
  const { data: existing } = await client.from('packages').select('id, duration_min').eq('creator_id', id);
  const keep = new Set(packages.map((p) => p.durationMin));
  const upserts = packages.map((p) => ({
    creator_id: id,
    duration_min: p.durationMin,
    price_cents: p.priceCents,
    active: !!p.active,
  }));
  const { error: e2 } = upserts.length
    ? await client.from('packages').upsert(upserts, { onConflict: 'creator_id,duration_min' })
    : { error: null };
  const removed = (existing || []).filter((p) => !keep.has(p.duration_min)).map((p) => p.id);
  if (removed.length) await client.from('packages').update({ active: false }).in('id', removed);

  // Availability: replace all rules.
  await client.from('availability_rules').delete().eq('creator_id', id);
  const { error: e3 } = availability.length
    ? await client.from('availability_rules').insert(
        availability.map((a) => ({ creator_id: id, weekday: a.weekday, start_time: a.start, end_time: a.end }))
      )
    : { error: null };

  const dbError = e1 || e2 || e3;
  if (dbError) {
    console.error(dbError);
    return NextResponse.json({ error: 'db_failed' }, { status: 500 });
  }
  return NextResponse.json(await loadSettings(id));
}
