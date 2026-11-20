import { NextResponse } from 'next/server';
import { currentFan } from '@/lib/session';
import { db } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const fan = await currentFan();
  if (!fan) return NextResponse.json({ error: 'not_signed_in' }, { status: 401 });
  const { data } = await db()
    .from('bookings')
    .select('id, status, starts_at, ends_at, fan_uuid, creator_id')
    .eq('id', params.id)
    .maybeSingle();
  if (!data || data.fan_uuid !== fan.fanUuid || data.creator_id !== fan.creator.id)
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ id: data.id, status: data.status, startsAt: data.starts_at, endsAt: data.ends_at });
}
