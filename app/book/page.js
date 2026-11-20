import { currentFan } from '@/lib/session';
import { bookablePackages } from '@/lib/bookings';
import Booking from './Booking';
import Upcoming from '../Upcoming';
import { upcomingFor } from '@/lib/upcoming';

export const dynamic = 'force-dynamic';

export default async function BookPage() {
  const fan = await currentFan();
  if (!fan) {
    return (
      <main className="wrap stack">
        <h1>Session expired</h1>
        <p className="muted">Close this window and open the booking from the creator’s profile again.</p>
      </main>
    );
  }

  const packages = await bookablePackages(fan.creator.id);
  const name = fan.creator.display_name || fan.creator.handle || 'this creator';
  const calls = await upcomingFor({ creatorId: fan.creator.id, fanUuid: fan.fanUuid, role: 'fan', who: fan.fanUuid, creatorName: name });

  return (
    <main className="wrap stack">
      <div>
        <div className="muted">Private 1:1 video call</div>
        <h1>Book a call with {name}</h1>
      </div>
      <Upcoming calls={calls} title="Your booked calls" />
      {!fan.creator.accepting || packages.length === 0 ? (
        <p className="muted">{name} is not taking bookings right now. Check back later.</p>
      ) : (
        <Booking
          packages={packages.map((p) => ({ id: p.id, durationMin: p.duration_min, priceCents: p.price_cents }))}
          creatorName={name}
        />
      )}
    </main>
  );
}
