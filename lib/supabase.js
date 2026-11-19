import { createClient } from '@supabase/supabase-js';

let client;

// Server-only Supabase client. Uses the service role key, so never import this in client components.
export function db() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}
