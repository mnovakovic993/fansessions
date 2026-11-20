import { NextResponse } from 'next/server';
import { currentCreator } from '@/lib/session';
import { db } from '@/lib/supabase';
import { accessTokenFor, apiRequest } from '@/lib/fanvue';

export const dynamic = 'force-dynamic';

const EXPERIENCE_ID = 'video-calls';
const actionId = (durationMin) => `call_${durationMin}`;

function appUuid() {
  const id = (process.env.FANVUE_APP_UUID || '').trim();
  if (!id) throw new Error('FANVUE_APP_UUID must be set');
  return id;
}

function summary(exp) {
  if (!exp) return null;
  return {
    uuid: exp.uuid,
    url: exp.url || null,
    reviewStatus: exp.reviewStatus || null,
    reviewRejection: exp.reviewRejection || null,
    publishedAt: exp.publishedAt || null,
    suspendedAt: exp.suspendedAt || null,
  };
}

// Current state of the creator's booking experience on Fanvue.
export async function GET() {
  const creator = await currentCreator();
  if (!creator) return NextResponse.json({ error: 'not_signed_in' }, { status: 401 });
  if (!creator.experience_uuid) return NextResponse.json({ experience: null });
  try {
    const token = await accessTokenFor(creator);
    const list = await apiRequest('GET', `/experiences?appUuid=${appUuid()}`, token);
    const items = list?.data ?? list?.experiences ?? (Array.isArray(list) ? list : []);
    const exp = items.find((e) => e.uuid === creator.experience_uuid) || null;
    return NextResponse.json({ experience: summary(exp) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'fanvue_failed', status: e.status || null }, { status: 502 });
  }
}

// Publishes (or updates) the booking experience on the creator's profile, with one priced action per package.
export async function POST() {
  const creator = await currentCreator();
  if (!creator) return NextResponse.json({ error: 'not_signed_in' }, { status: 401 });

  const { data: packages } = await db()
    .from('packages')
    .select('id, duration_min, price_cents, active')
    .eq('creator_id', creator.id)
    .order('duration_min');
  const active = (packages || []).filter((p) => p.active);
  if (!active.length) return NextResponse.json({ error: 'no_active_packages' }, { status: 400 });

  const body = {
    appUuid: appUuid(),
    externalExperienceId: EXPERIENCE_ID,
    title: 'Book a 1:1 video call',
    description: 'Pick a length and a time that suits you, pay on Fanvue, and join a private video call at the booked time.',
    accessMode: 'FREE',
    deliveryMode: 'EMBEDDED',
    experienceType: 'EVENT',
    actions: active.map((p) => ({
      externalActionId: actionId(p.duration_min),
      title: `${p.duration_min}-minute video call`,
      description: `A private ${p.duration_min}-minute 1:1 video call at the time you book.`,
      priceCents: p.price_cents,
    })),
  };

  let result;
  try {
    const token = await accessTokenFor(creator);
    result = await apiRequest('POST', '/experiences', token, body);
  } catch (e) {
    console.error(e);
    const needsReconnect = e.status === 401 || e.status === 403;
    return NextResponse.json(
      { error: needsReconnect ? 'reconnect_required' : 'fanvue_failed', status: e.status || null, detail: e.data || null },
      { status: 502 }
    );
  }

  const exp = result?.experience ?? result;
  await db().from('creators').update({ experience_uuid: exp.uuid, updated_at: new Date().toISOString() }).eq('id', creator.id);
  for (const p of packages || []) {
    await db()
      .from('packages')
      .update({ external_action_id: p.active ? actionId(p.duration_min) : null })
      .eq('id', p.id);
  }
  return NextResponse.json({ experience: summary(exp) });
}
