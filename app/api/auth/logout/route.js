import { NextResponse } from 'next/server';
import { SESSION_COOKIE, setCookie } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.redirect(new URL('/', process.env.APP_URL).toString(), 303);
  setCookie(res, SESSION_COOKIE, '', 0);
  return res;
}
