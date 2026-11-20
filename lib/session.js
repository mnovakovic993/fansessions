import { cookies } from 'next/headers';
import { sign, unsign } from './crypto';
import { db } from './supabase';

export const SESSION_COOKIE = 'fs_session';
export const FAN_COOKIE = 'fs_fan';
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
export const FAN_MAX_AGE = 12 * 60 * 60 * 1000;

// Writes a cookie that also works inside Fanvue's iframe:
// SameSite=None + Secure, and Partitioned (CHIPS) so browsers that block third-party cookies still keep it.
export function setCookie(response, name, value, maxAgeMs) {
  const parts = [
    `${name}=${value}`,
    'Path=/',
    `Max-Age=${Math.max(0, Math.floor(maxAgeMs / 1000))}`,
    'HttpOnly',
    'Secure',
    'SameSite=None',
    'Partitioned',
  ];
  response.headers.append('Set-Cookie', parts.join('; '));
  return response;
}

export function sessionValue(creatorId) {
  return sign({ cid: creatorId, exp: Date.now() + SESSION_MAX_AGE });
}

export function fanSessionValue({ fanUuid, creatorId, experienceUuid }) {
  return sign({ fan: fanUuid, cid: creatorId, exp_uuid: experienceUuid, exp: Date.now() + FAN_MAX_AGE });
}

export async function currentCreator() {
  const session = unsign(cookies().get(SESSION_COOKIE)?.value);
  if (!session?.cid) return null;
  const { data } = await db().from('creators').select('*').eq('id', session.cid).maybeSingle();
  return data || null;
}

// Returns { fanUuid, creator, experienceUuid } for a fan who opened the booking experience, or null.
export async function currentFan() {
  const session = unsign(cookies().get(FAN_COOKIE)?.value);
  if (!session?.fan || !session?.cid) return null;
  const { data: creator } = await db().from('creators').select('*').eq('id', session.cid).maybeSingle();
  if (!creator) return null;
  return { fanUuid: session.fan, creator, experienceUuid: session.exp_uuid };
}
