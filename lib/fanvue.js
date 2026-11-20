import { db } from './supabase';
import { encrypt, decrypt } from './crypto';

export const FANVUE_AUTH_URL = 'https://auth.fanvue.com/oauth2/auth';
export const FANVUE_TOKEN_URL = 'https://auth.fanvue.com/oauth2/token';
export const FANVUE_API = 'https://api.fanvue.com';
export const FANVUE_API_VERSION = '2025-06-26';

// Every added scope makes connected creators authorise again.
export const SCOPES = ['openid', 'offline_access', 'offline', 'read:self', 'read:experience', 'write:experience'];

export const FANVUE_PLATFORM = 'https://www.fanvue.com';

export function redirectUri() {
  return `${process.env.APP_URL}/api/auth/callback`;
}

function basicAuth() {
  // Trim: a pasted value often carries a trailing space or line break, which Fanvue rejects as invalid_client.
  const id = (process.env.FANVUE_CLIENT_ID || '').trim();
  const secret = (process.env.FANVUE_CLIENT_SECRET || '').trim();
  if (!id || !secret) throw new Error('FANVUE_CLIENT_ID and FANVUE_CLIENT_SECRET must be set');
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');
}

async function tokenRequest(params) {
  const res = await fetch(FANVUE_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: basicAuth(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`Fanvue token request failed: ${data.error || res.status}`);
    err.code = data.error;
    throw err;
  }
  return data;
}

export function exchangeCode(code, verifier) {
  return tokenRequest({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
    code_verifier: verifier,
  });
}

export function refreshTokens(refreshToken) {
  return tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken });
}

export async function apiRequest(method, path, accessToken, body, extraHeaders = {}) {
  const res = await fetch(FANVUE_API + path, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Fanvue-API-Version': FANVUE_API_VERSION,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`Fanvue API ${method} ${path} failed: ${res.status} ${text.slice(0, 300)}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function apiGet(path, accessToken) {
  return apiRequest('GET', path, accessToken);
}

export function tokenColumns(tokens) {
  const cols = {
    access_token_enc: encrypt(tokens.access_token),
    token_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
  };
  // A refresh response may omit the refresh token; keep the stored one in that case.
  if (tokens.refresh_token) cols.refresh_token_enc = encrypt(tokens.refresh_token);
  return cols;
}

// Embedded creator surface: trade Fanvue's short-lived session token for OAuth tokens.
export async function authorizeOnBehalf(sessionToken, challenge, state) {
  const res = await fetch(`${FANVUE_PLATFORM}/api/v1/app-integrations/authorize-on-behalf`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sessionToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code_challenge: challenge, code_challenge_method: 'S256', state }),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`authorize-on-behalf failed: ${res.status} ${data.error || ''}`);
    err.code = data.error;
    throw err;
  }
  if (data.state !== state) throw new Error('authorize-on-behalf state mismatch');
  return data.code;
}

// Saves (or updates) the creator behind a fresh set of tokens and returns their row id.
export async function upsertCreatorFromTokens(tokens) {
  const me = await apiGet('/v1/users/me', tokens.access_token);
  const user = me?.data ?? me;
  const fanvueUuid = user?.uuid || user?.userUuid || user?.id;
  if (!fanvueUuid) throw new Error('profile_missing_uuid');
  const { data, error } = await db()
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
  if (error) throw Object.assign(new Error('db_failed'), { cause: error });
  return data.id;
}

// Returns a valid access token for a creator, refreshing it 10 minutes before it expires.
// Refresh tokens are single-use, so the new pair is saved immediately.
export async function accessTokenFor(creator) {
  const expiresAt = creator.token_expires_at ? new Date(creator.token_expires_at).getTime() : 0;
  if (expiresAt - Date.now() > 10 * 60 * 1000) return decrypt(creator.access_token_enc);
  const tokens = await refreshTokens(decrypt(creator.refresh_token_enc));
  await db()
    .from('creators')
    .update({ ...tokenColumns(tokens), updated_at: new Date().toISOString() })
    .eq('id', creator.id);
  return tokens.access_token;
}
