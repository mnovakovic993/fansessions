import { NextResponse } from 'next/server';
import { readTicket } from '@/lib/calls';
import { db } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const ticket = readTicket(body.ticket);
  if (!ticket) return NextResponse.json({ error: 'invalid_ticket' }, { status: 401 });
  const reason = String(body.reason || '').trim().slice(0, 1000);
  if (!reason) return NextResponse.json({ error: 'missing_reason' }, { status: 400 });

  const { error } = await db()
    .from('call_reports')
    .insert({ booking_id: ticket.bookingId, reporter_role: ticket.role, reporter_uuid: ticket.who, reason });
  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'db_failed' }, { status: 500 });
  }
  console.warn('CALL REPORT', ticket.bookingId, ticket.role);
  return NextResponse.json({ ok: true });
}
