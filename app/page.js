import { redirect } from 'next/navigation';
import { currentCreator } from '@/lib/session';

export const dynamic = 'force-dynamic';

const ERRORS = {
  access_denied: 'You declined the connection on Fanvue.',
  state_mismatch: 'The sign-in link expired. Please try again.',
  token_exchange_failed: 'Fanvue did not accept the sign-in. Check the app settings and try again.',
  profile_failed: 'Signed in, but your Fanvue profile could not be loaded.',
  db_failed: 'Signed in, but your account could not be saved. Please try again.',
};

export default async function Home({ searchParams }) {
  const creator = await currentCreator().catch(() => null);
  if (creator) redirect('/dashboard');
  const error = searchParams?.error;

  return (
    <main className="wrap stack">
      <h1>Fan Sessions</h1>
      <p className="muted">
        Sell paid 1:1 video calls to your fans. Set your call lengths, prices and hours; fans book and pay on
        Fanvue.
      </p>
      {error && <p className="error">{ERRORS[error] || `Sign-in failed (${error}).`}</p>}
      <div>
        <a className="btn" href="/api/auth/login">Connect with Fanvue</a>
      </div>
    </main>
  );
}
