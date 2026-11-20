import { NextResponse } from 'next/server';
import { authorizeOnBehalf, exchangeCode, upsertCreatorFromTokens } from '@/lib/fanvue';
import { randomString, pkceChallenge } from '@/lib/crypto';
import { SESSION_COOKIE, SESSION_MAX_AGE, setCookie, sessionValue } from '@/lib/session';

export const dynamic = 'force-dynamic';

// Creator landing URL for the on-platform app. Fanvue opens it inside its iframe with ?token=&theme=.
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const token = params.get('token');
  const theme = params.get('theme') === 'light' ? 'light' : 'dark';
  const errorUrl = (reason) => new URL(`/embed-error?reason=${encodeURIComponent(reason)}`, process.env.APP_URL).toString();

  if (!token) return NextResponse.redirect(errorUrl('missing_token'));

  try {
    const verifier = randomString(32);
    const state = randomString(16);
    const code = await authorizeOnBehalf(token, pkceChallenge(verifier), state);
    const tokens = await exchangeCode(code, verifier);
    const creatorId = await upsertCreatorFromTokens(tokens);

    const res = NextResponse.redirect(new URL(`/dashboard?embedded=1&theme=${theme}`, process.env.APP_URL).toString());
    setCookie(res, SESSION_COOKIE, sessionValue(creatorId), SESSION_MAX_AGE);
    return res;
  } catch (e) {
    console.error('creator embed sign-in failed', e, e.cause);
    return NextResponse.redirect(errorUrl(e.code || 'sign_in_failed'));
  }
}
