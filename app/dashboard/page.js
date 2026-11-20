import { redirect } from 'next/navigation';
import { currentCreator } from '@/lib/session';
import { loadSettings } from '@/lib/settings';
import Settings from './Settings';
import Publish from './Publish';
import Upcoming from '../Upcoming';
import PastCalls from './PastCalls';
import { upcomingFor, recentFor } from '@/lib/upcoming';
import { settleBookings } from '@/lib/lifecycle';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const creator = await currentCreator();
  if (!creator) redirect('/');
  const settings = await loadSettings(creator.id);
  await settleBookings({ creatorId: creator.id }).catch((e) => console.error('settle failed', e));
  const [calls, past] = await Promise.all([
    upcomingFor({ creatorId: creator.id, role: 'creator', who: creator.fanvue_user_uuid }),
    recentFor({ creatorId: creator.id }),
  ]);

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
      <Upcoming calls={calls} empty="No calls booked yet." />
      <PastCalls calls={past} />
      <Settings initial={settings} />
      <Publish hasExperience={!!creator.experience_uuid} />
    </main>
  );
}
