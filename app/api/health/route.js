import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Shows whether each setting is present and plausible (never its value), to check a deployment.
function check(value) {
  if (!value) return 'MISSING';
  const v = value.trim();
  if (v.startsWith('<') || v.endsWith('>')) return 'PLACEHOLDER (replace with the real value)';
  if (/[^\x20-\x7E]/.test(v)) return 'INVALID (contains non-ASCII characters)';
  return 'set';
}

export async function GET() {
  const names = [
    'APP_URL',
    'FANVUE_CLIENT_ID',
    'FANVUE_CLIENT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DAILY_API_KEY',
    'DAILY_DOMAIN',
    'SESSION_SECRET',
    'TOKEN_ENCRYPTION_KEY',
  ];
  const env = Object.fromEntries(names.map((n) => [n, check(process.env[n])]));
  const ok = Object.values(env).every((s) => s === 'set');
  return NextResponse.json({ ok, env });
}
