import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Shows which settings are present (never their values), to check a deployment.
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
  const env = Object.fromEntries(names.map((n) => [n, process.env[n] ? 'set' : 'MISSING']));
  return NextResponse.json({ ok: true, env });
}
