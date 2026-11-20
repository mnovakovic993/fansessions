import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCode, upsertCreatorFromTokens } from '@/lib/fanvue';
import { unsign } from '@/lib/crypto';
import { SESSION_COOKIE, SESSION_MAX_AGE, setCookie, sessionValue } from '@/lib/session';

export const dynamic = 'force-dynamic';

function fail(reason) {
  const url = new URL('/', process.env.APP_URL);
  url.searchParams.set('error', reason);
  return NextResponse.redirect(url.toString());
}

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  if (params.get('error')) return fail(params.get('error'));

  const saved = unsign(cookies().get('fs_oauth')?.value);
  if (!saved || saved.state !== params.get('state')) return fail('state_mismatch');

  const code = params.get('code');
  if (!code) return fail('missing_code');

  let tokens;
  try {
    tokens = await exchangeCode(code, saved.verifier);
  } catch (e) {
    console.error(e);
    return fail('token_exchange_failed');
  }

  let creatorId;
  try {
    creatorId = await upsertCreatorFromTokens(tokens);
  } catch (e) {
    console.error(e, e.cause);
    return fail(e.message === 'db_failed' ? 'db_failed' : 'profile_failed');
  }

  const res = NextResponse.redirect(new URL('/dashboard', process.env.APP_URL).toString());
  setCookie(res, SESSION_COOKIE, sessionValue(creatorId), SESSION_MAX_AGE);
  setCookie(res, 'fs_oauth', '', 0);
  return res;
}
