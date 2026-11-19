import { redirect } from 'next/navigation';
import { currentCreator } from '@/lib/session';
import { loadSettings } from '@/lib/settings';
import Settings from './Settings';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const creator = await currentCreator();
  if (!creator) redirect('/');
  const settings = await loadSettings(creator.id);

  return (
    <main className="wrap stack">
      <div className="row spread">
        <div>
          <div className="muted">Fan Sessions</div>
          <h1>Video calls</h1>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="btn secondary" type="submit">Sign out</button>
        </form>
      </div>
      <p className="muted">
        Signed in as {creator.display_name || creator.handle || 'your Fanvue account'}
        {creator.handle ? ` (@${creator.handle})` : ''}.
      </p>
      <Settings initial={settings} />
    </main>
  );
}
