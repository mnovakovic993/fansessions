export const dynamic = 'force-dynamic';

const TEXT = {
  missing_token: 'This page has to be opened from Fanvue.',
  link_expired: 'This link expired. Close it and open the booking again from the profile.',
  not_entitled: 'You do not have access to this booking.',
  creator_not_connected: 'This creator has not finished setting up bookings yet.',
  consent_required: 'Open the app from Fanvue and allow the requested access first.',
};

export default function EmbedError({ searchParams }) {
  const reason = searchParams?.reason || 'unknown';
  return (
    <main className="wrap stack">
      <h1>Something went wrong</h1>
      <p className="muted">{TEXT[reason] || `Please try again (${reason}).`}</p>
    </main>
  );
}
