import { cookies } from 'next/headers';
import { sign, unsign } from './crypto';
import { db } from './supabase';

export const SESSION_COOKIE = 'fs_session';
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

// SameSite=None + Secure so the session also works later when the app runs inside Fanvue's iframe.
export const cookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
  maxAge: Math.floor(maxAgeMs / 1000),
});

export function sessionValue(creatorId) {
  return sign({ cid: creatorId, exp: Date.now() + THIRTY_DAYS });
}

export const SESSION_MAX_AGE = THIRTY_DAYS;

export async function currentCreator() {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  const session = unsign(raw);
  if (!session?.cid) return null;
  const { data } = await db().from('creators').select('*').eq('id', session.cid).maybeSingle();
  return data || null;
}
