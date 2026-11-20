import { redirect } from 'next/navigation';
import { currentCreator } from '@/lib/session';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Fan Sessions · Paid 1:1 video calls for Fanvue creators',
  description:
    'Sell private video calls of 10 to 60 minutes at your own prices. Fans book a time and pay on Fanvue; the call opens at the booked time with a timer.',
  openGraph: {
    title: 'Fan Sessions · Paid 1:1 video calls for Fanvue creators',
    description: 'Fans book a time on your Fanvue profile and pay there. You show up and talk.',
    images: ['/preview-1.jpg'],
  },
};

const ERRORS = {
  access_denied: 'You declined the connection on Fanvue.',
  state_mismatch: 'The sign-in link expired. Please try again.',
  token_exchange_failed: 'Fanvue did not accept the sign-in. Check the app settings and try again.',
  profile_failed: 'Signed in, but your Fanvue profile could not be loaded.',
  db_failed: 'Signed in, but your account could not be saved. Please try again.',
};

const STEPS = [
  ['Set your terms', 'Choose call lengths from 10 to 60 minutes, a price for each, and the hours in the week you are free.', '/preview-2.jpg'],
  ['Fans book and pay on Fanvue', 'A booking option appears on your profile. Fans see open times in their own time zone, pick one and pay in Fanvue’s checkout.', '/preview-3.jpg'],
  ['Talk at the booked time', 'The call opens in a new tab 10 minutes before the start. A timer keeps it to the booked length, then the room closes.', '/preview-4.jpg'],
];

const FEATURES = [
  ['Your prices', 'Anything from $3 to $500 per call, per length.'],
  ['No double bookings', 'A time is held for 10 minutes while the fan pays, and only confirmed once Fanvue reports the payment.'],
  ['Breaks between calls', 'Set a buffer so calls never run back to back.'],
  ['Private and never recorded', 'One room per booking, two people at most, recording turned off.'],
  ['Calendar reminders', 'Both sides can add the call to Google, Apple or Outlook calendar with a reminder.'],
  ['Know what happened', 'After each call you see whether it took place or someone did not join, plus any problem reports.'],
];

const FAQ = [
  ['What does it cost?', 'Nothing up front and no monthly fee. Fan Sessions keeps 15% of what you earn from calls; Fanvue shows this when you connect the app. Fanvue’s usual fees apply as with any other sale.'],
  ['How do I get paid?', 'Fans pay through Fanvue, so the money arrives in your Fanvue balance like any other sale. Fan Sessions never handles your payouts.'],
  ['What do fans need?', 'A Fanvue account and a browser with a camera and microphone. Nothing to install.'],
  ['What if a fan does not show up?', 'The booking is not refunded, and the no-show shows up in your past calls. If you are the one who misses a call, the fan can ask for a new time or a refund through Fanvue.'],
  ['Is my content safe?', 'Calls are not recorded by Fan Sessions and the room closes 5 minutes after the booked end.'],
];

export default async function Home({ searchParams }) {
  const creator = await currentCreator().catch(() => null);
  if (creator) redirect('/dashboard');
  const error = searchParams?.error;

  return (
    <main className="landing">
      <header className="lp-nav">
        <div className="row" style={{ gap: 10 }}>
          <img src="/logo.png" alt="" width="32" height="32" style={{ borderRadius: 8 }} />
          <strong>Fan Sessions</strong>
        </div>
        <a className="btn secondary" href="/api/auth/login">Connect with Fanvue</a>
      </header>

      <section className="lp-hero">
        <div className="stack">
          <span className="badge">For Fanvue creators</span>
          <h1 className="lp-title">Sell paid 1:1 video calls to your fans</h1>
          <p className="lp-lead">
            Set your prices and the hours you are free. Fans book a time on your Fanvue profile and pay there. At the booked
            time, you talk.
          </p>
          {error && <p className="error">{ERRORS[error] || `Sign-in failed (${error}).`}</p>}
          <div className="row">
            <a className="btn" href="/api/auth/login">Connect with Fanvue</a>
            <a href="#how">How it works</a>
          </div>
          <div className="muted small">No monthly fee. Takes about five minutes to set up.</div>
        </div>
        <img className="lp-shot" src="/preview-1.jpg" alt="Fan Sessions booking and call screens" width="1200" height="675" />
      </section>

      <section id="how" className="lp-section stack">
        <h2 className="lp-h2">How it works</h2>
        <div className="lp-steps">
          {STEPS.map(([title, text, img], i) => (
            <div key={title} className="card stack">
              <img className="lp-thumb" src={img} alt="" width="1200" height="675" loading="lazy" />
              <div className="muted small">Step {i + 1}</div>
              <h3>{title}</h3>
              <p className="muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section stack">
        <h2 className="lp-h2">What you get</h2>
        <div className="lp-grid">
          {FEATURES.map(([title, text]) => (
            <div key={title} className="card">
              <h3>{title}</h3>
              <p className="muted" style={{ margin: '6px 0 0' }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section stack">
        <h2 className="lp-h2">Questions</h2>
        <div className="stack">
          {FAQ.map(([q, a]) => (
            <details key={q} className="card">
              <summary>{q}</summary>
              <p className="muted" style={{ margin: '10px 0 0' }}>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="lp-section card stack lp-cta">
        <h2 className="lp-h2">Ready to take your first booking?</h2>
        <p className="muted">Connect your Fanvue account, set a price and your hours, and publish to your profile.</p>
        <div>
          <a className="btn" href="/api/auth/login">Connect with Fanvue</a>
        </div>
      </section>

      <footer className="footer">
        <a href="/support">Help &amp; Support</a>
        <a href="/terms">Terms of Service</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="mailto:milos.novakovic.web@gmail.com">milos.novakovic.web@gmail.com</a>
      </footer>
    </main>
  );
}
