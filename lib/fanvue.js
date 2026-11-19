import { db } from './supabase';
import { encrypt, decrypt } from './crypto';

export const FANVUE_AUTH_URL = 'https://auth.fanvue.com/oauth2/auth';
export const FANVUE_TOKEN_URL = 'https://auth.fanvue.com/oauth2/token';
export const FANVUE_API = 'https://api.fanvue.com';
export const FANVUE_API_VERSION = '2025-06-26';

// Scopes for phase 1. More are added later (write:experience, read:creator, write:chat),
// and every added scope makes connected creators authorise again.
export const SCOPES = ['openid', 'offline_access', 'offline', 'read:self'];

export function redirectUri() {
  return `${process.env.APP_URL}/api/auth/callback`;
}

function basicAuth() {
  const id = process.env.FANVUE_CLIENT_ID;
  const secret = process.env.FANVUE_CLIENT_SECRET;
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

export async function apiGet(path, accessToken) {
  const res = await fetch(FANVUE_API + path, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Fanvue-API-Version': FANVUE_API_VERSION,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Fanvue API ${path} failed: ${res.status}`);
  return res.json();
}

export function tokenColumns(tokens) {
  return {
    access_token_enc: encrypt(tokens.access_token),
    refresh_token_enc: encrypt(tokens.refresh_token),
    token_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
  };
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
