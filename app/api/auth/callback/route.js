import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCode, apiGet, tokenColumns } from '@/lib/fanvue';
import { unsign } from '@/lib/crypto';
import { db } from '@/lib/supabase';
import { SESSION_COOKIE, SESSION_MAX_AGE, cookieOptions, sessionValue } from '@/lib/session';

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

  let me;
  try {
    me = await apiGet('/v1/users/me', tokens.access_token);
  } catch (e) {
    console.error(e);
    return fail('profile_failed');
  }
  const user = me?.data ?? me;
  const fanvueUuid = user?.uuid || user?.userUuid || user?.id;
  if (!fanvueUuid) return fail('profile_missing_uuid');

  const { data: creator, error } = await db()
    .from('creators')
    .upsert(
      {
        fanvue_user_uuid: String(fanvueUuid),
        handle: user.handle ?? null,
        display_name: user.displayName ?? user.display_name ?? null,
        ...tokenColumns(tokens),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'fanvue_user_uuid' }
    )
    .select('id')
    .single();
  if (error) {
    console.error(error);
    return fail('db_failed');
  }

  const res = NextResponse.redirect(new URL('/dashboard', process.env.APP_URL).toString());
  res.cookies.set(SESSION_COOKIE, sessionValue(creator.id), cookieOptions(SESSION_MAX_AGE));
  res.cookies.set('fs_oauth', '', cookieOptions(0));
  return res;
}
