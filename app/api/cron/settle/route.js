import { NextResponse } from 'next/server';
import { settleBookings } from '@/lib/lifecycle';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Called once a day by Vercel Cron (vercel.json). With CRON_SECRET set, Vercel sends it as a Bearer token.
// Settling only moves bookings whose time is already over, so an extra call does no harm.
export async function GET(request) {
  const secret = (process.env.CRON_SECRET || '').trim();
  const auth = request.headers.get('authorization') || '';
  const fromVercelCron = (request.headers.get('user-agent') || '').startsWith('vercel-cron/');
  if (secret ? auth !== `Bearer ${secret}` : !fromVercelCron) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const result = await settleBookings();
  return NextResponse.json({ ok: true, ...result });
}
