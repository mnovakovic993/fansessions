import { NextResponse } from 'next/server';
import { currentFan } from '@/lib/session';
import { db } from '@/lib/supabase';
import { HOLD_MINUTES, bookablePackages, slotsFor } from '@/lib/bookings';

export const dynamic = 'force-dynamic';

// Reserves a slot for a few minutes while the fan pays in Fanvue's dialog.
export async function POST(request) {
  const fan = await currentFan();
  if (!fan) return NextResponse.json({ error: 'not_signed_in' }, { status: 401 });
  if (!fan.creator.accepting) return NextResponse.json({ error: 'not_accepting' }, { status: 409 });

  const body = await request.json().catch(() => ({}));
  const pkg = (await bookablePackages(fan.creator.id)).find((p) => p.id === body.packageId);
  if (!pkg) return NextResponse.json({ error: 'unknown_package' }, { status: 404 });

  const startsAt = new Date(body.startsAt);
  if (Number.isNaN(startsAt.getTime())) return NextResponse.json({ error: 'invalid_time' }, { status: 400 });
  const slots = await slotsFor(fan.creator, pkg);
  if (!slots.includes(startsAt.toISOString())) return NextResponse.json({ error: 'slot_taken' }, { status: 409 });

  const endsAt = new Date(startsAt.getTime() + pkg.duration_min * 60000);
  const { data, error } = await db()
    .from('bookings')
    .insert({
      creator_id: fan.creator.id,
      fan_uuid: fan.fanUuid,
      package_id: pkg.id,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: 'held',
      hold_expires_at: new Date(Date.now() + HOLD_MINUTES * 60000).toISOString(),
    })
    .select('id')
    .single();
  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'db_failed' }, { status: 500 });
  }

  return NextResponse.json({ bookingId: data.id, externalActionId: pkg.external_action_id });
}
