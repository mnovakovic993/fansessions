import { NextResponse } from 'next/server';
import { apiRequest, accessTokenFor } from '@/lib/fanvue';
import { db } from '@/lib/supabase';
import { FAN_COOKIE, FAN_MAX_AGE, fanSessionValue, setCookie } from '@/lib/session';

export const dynamic = 'force-dynamic';

// Exchanges a fan launch token. The call needs an access token issued to this app with read:experience;
// we use a connected creator's token (preferring the most recently active ones).
async function exchangeLaunchToken(launchToken) {
  const { data: creators } = await db()
    .from('creators')
    .select('*')
    .not('experience_uuid', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(3);
  let lastError;
  for (const creator of creators || []) {
    try {
      const appToken = await accessTokenFor(creator);
      return await apiRequest('POST', '/experiences/token/exchange', appToken, { token: launchToken });
    } catch (e) {
      lastError = e;
      // 400 = expired or invalid launch token: no other credential will fix that.
      if (e.status === 400) break;
    }
  }
  throw lastError || new Error('no_connected_creator');
}

// Fan experience URL. Fanvue opens it with ?token= (valid 10 minutes), plus ?theme= and ?presentation=dialog.
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const token = params.get('token');
  const theme = params.get('theme') === 'light' ? 'light' : 'dark';
  const errorUrl = (reason) => new URL(`/embed-error?reason=${encodeURIComponent(reason)}`, process.env.APP_URL).toString();
  if (!token) return NextResponse.redirect(errorUrl('missing_token'));

  let result;
  try {
    result = await exchangeLaunchToken(token);
  } catch (e) {
    console.error('fan launch token exchange failed', e);
    return NextResponse.redirect(errorUrl(e.status === 400 ? 'link_expired' : 'exchange_failed'));
  }

  if (!result?.entitlement?.isEntitled) return NextResponse.redirect(errorUrl('not_entitled'));

  const { data: creator } = await db()
    .from('creators')
    .select('id')
    .eq('fanvue_user_uuid', result.experience.creatorUuid)
    .maybeSingle();
  if (!creator) return NextResponse.redirect(errorUrl('creator_not_connected'));

  const res = NextResponse.redirect(new URL(`/book?theme=${theme}`, process.env.APP_URL).toString());
  setCookie(
    res,
    FAN_COOKIE,
    fanSessionValue({ fanUuid: result.fanUuid, creatorId: creator.id, experienceUuid: result.experience.uuid }),
    FAN_MAX_AGE
  );
  return res;
}
