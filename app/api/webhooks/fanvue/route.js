import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// X-Fanvue-Signature: "t=<unix seconds>,v0=<hex hmac>[,<hex hmac during rotation>]"
// HMAC-SHA256 over "<t>.<raw body>" with the app's signing secret (Developer Area → Events → View signing secret).
function verify(rawBody, header, secret) {
  if (!header || !secret) return false;
  let timestamp = null;
  const macs = [];
  for (const part of header.split(',')) {
    const [k, v] = part.includes('=') ? part.split('=') : [null, part];
    if (k === 't') timestamp = v;
    else if (k === 'v0' || k === null) macs.push(v);
  }
  if (!timestamp || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  return macs.some((mac) => {
    const a = Buffer.from(String(mac).trim(), 'hex');
    const b = Buffer.from(expected, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

async function handleActionPayment(event) {
  const o = event.data || {};
  const bookingId = o.client_reference_id;
  if (!bookingId) return 'no_client_reference';

  const { data: booking } = await db().from('bookings').select('*').eq('id', bookingId).maybeSingle();
  if (!booking) return 'booking_not_found';
  if (booking.fan_uuid !== o.buyer?.uuid) console.warn('webhook buyer differs from booking fan', bookingId);

  if (event.type === 'app.experience.action.payment.succeeded') {
    if (booking.status === 'confirmed') return 'already_confirmed';
    // A late payment for an expired hold is still honoured if nothing else took the slot meanwhile.
    const { data: clash } = await db()
      .from('bookings')
      .select('id')
      .eq('creator_id', booking.creator_id)
      .eq('status', 'confirmed')
      .lt('starts_at', booking.ends_at)
      .gt('ends_at', booking.starts_at)
      .limit(1);
    if (clash?.length) console.error('PAID BOOKING CLASHES WITH ANOTHER — needs manual follow-up', bookingId);
    await db()
      .from('bookings')
      .update({ status: 'confirmed', purchase_ref: o.purchase_reference, hold_expires_at: null })
      .eq('id', bookingId);
    return 'confirmed';
  }
  if (event.type === 'app.experience.action.refund.created') {
    await db().from('bookings').update({ status: 'refunded' }).eq('id', bookingId);
    return 'refunded';
  }
  return 'ignored';
}

export async function POST(request) {
  const raw = await request.text();
  const secret = (process.env.FANVUE_WEBHOOK_SECRET || '').trim();
  if (!verify(raw, request.headers.get('x-fanvue-signature'), secret)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // Idempotency: each event id is processed once.
  const { error: dupError } = await db()
    .from('webhook_events')
    .insert({ id: String(event.id), type: String(event.type), payload: event });
  if (dupError) {
    if (dupError.code === '23505') return NextResponse.json({ ok: true, duplicate: true });
    console.error(dupError);
    return NextResponse.json({ error: 'db_failed' }, { status: 500 });
  }

  let outcome = 'ignored';
  try {
    if (String(event.type).startsWith('app.experience.action.')) outcome = await handleActionPayment(event);
  } catch (e) {
    console.error('webhook handling failed', e);
    await db().from('webhook_events').delete().eq('id', String(event.id)); // let Fanvue retry
    return NextResponse.json({ error: 'handler_failed' }, { status: 500 });
  }
  await db().from('webhook_events').update({ processed_at: new Date().toISOString() }).eq('id', String(event.id));
  return NextResponse.json({ ok: true, outcome });
}
