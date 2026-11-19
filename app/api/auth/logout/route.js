import { NextResponse } from 'next/server';
import { SESSION_COOKIE, cookieOptions } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.redirect(new URL('/', process.env.APP_URL).toString(), 303);
  res.cookies.set(SESSION_COOKIE, '', cookieOptions(0));
  return res;
}
