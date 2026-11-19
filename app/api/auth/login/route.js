import { NextResponse } from 'next/server';
import { FANVUE_AUTH_URL, SCOPES, redirectUri } from '@/lib/fanvue';
import { randomString, pkceChallenge, sign } from '@/lib/crypto';
import { cookieOptions } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const state = randomString(32);
  const verifier = randomString(32);

  const url = new URL(FANVUE_AUTH_URL);
  url.searchParams.set('client_id', (process.env.FANVUE_CLIENT_ID || '').trim());
  url.searchParams.set('redirect_uri', redirectUri());
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', SCOPES.join(' '));
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', pkceChallenge(verifier));
  url.searchParams.set('code_challenge_method', 'S256');

  const res = NextResponse.redirect(url.toString());
  const tenMinutes = 10 * 60 * 1000;
  res.cookies.set('fs_oauth', sign({ state, verifier, exp: Date.now() + tenMinutes }), cookieOptions(tenMinutes));
  return res;
}
