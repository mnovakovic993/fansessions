import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Shows whether each setting is present and plausible (never its value), to check a deployment.
function check(value) {
  if (!value) return 'MISSING';
  const v = value.trim();
  if (v.startsWith('<') || v.endsWith('>')) return 'PLACEHOLDER (replace with the real value)';
  const bad = v.search(/[^\x20-\x7E]/);
  if (bad >= 0) return `INVALID (non-ASCII character at position ${bad} of ${v.length}; the value probably still contains instruction text)`;
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
    'FANVUE_APP_UUID',
    'FANVUE_WEBHOOK_SECRET',
  ];
  const env = Object.fromEntries(names.map((n) => [n, check(process.env[n])]));
  const ok = Object.values(env).every((s) => s === 'set');
  return NextResponse.json({ ok, env });
}
