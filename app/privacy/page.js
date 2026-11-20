import { LegalPage, OPERATOR, SUPPORT_EMAIL } from '../legal';

export const metadata = { title: 'Privacy Policy · Fan Sessions' };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        Fan Sessions (“the app”, “we”) lets Fanvue creators sell paid 1:1 video calls to their fans. The app is operated by{' '}
        {OPERATOR}, Serbia. This policy explains what we collect, why, and your choices. Contact: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Creators:</strong> your Fanvue user ID, handle and display name; OAuth access and refresh tokens issued by Fanvue
          (stored encrypted); your call packages, prices, weekly availability, time zone and booking settings.
        </li>
        <li>
          <strong>Fans:</strong> your Fanvue user ID (shared with us by Fanvue when you open the booking), and the calls you book:
          creator, package, date and time, and booking status.
        </li>
        <li>
          <strong>Payments:</strong> all payments are processed by Fanvue. We never see or store card or bank details. Fanvue sends
          us a payment reference and status so we can confirm your booking.
        </li>
        <li>
          <strong>Video calls:</strong> calls run on Daily (daily.co). Audio and video are streamed live between the two participants
          and are <strong>not recorded</strong> by the app. In-call chat is not stored by us.
        </li>
        <li>
          <strong>Problem reports:</strong> if you report a problem during a call, we store your report text, your role (fan or
          creator) and the booking it relates to.
        </li>
        <li>
          <strong>Technical logs:</strong> our hosting provider keeps standard server logs (such as IP address, time and requested
          page) for security and troubleshooting.
        </li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To let creators set up and publish bookable calls, and to let fans book, pay for and join them.</li>
        <li>To confirm payments, prevent double bookings, and run the call at the booked time.</li>
        <li>To handle problem reports, keep the service safe and comply with Fanvue’s policies and the law.</li>
      </ul>
      <p>
        The legal bases are performance of the service you asked for, our legitimate interest in keeping it secure, and legal
        obligations. We do not sell your data and do not use it for advertising.
      </p>

      <h2>Who we share it with</h2>
      <ul>
        <li><strong>Fanvue</strong> — the platform the app runs on, which handles sign-in and payments.</li>
        <li><strong>Daily</strong> (video calls), <strong>Vercel</strong> (hosting) and <strong>Supabase</strong> (database, EU region) — service providers that process data on our behalf.</li>
        <li>Authorities, where the law requires it.</li>
      </ul>
      <p>Some providers may process data outside your country, including in the United States, under appropriate safeguards.</p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Creator accounts and settings: while the app is connected, and deleted within 30 days after you ask us to.</li>
        <li>Booking records: up to 24 months, for payment disputes and accounting, then deleted or anonymised.</li>
        <li>Problem reports: up to 24 months.</li>
      </ul>

      <h2>Your rights</h2>
      <p>
        You can ask to access, correct, export or delete your data, or object to how we use it, by writing to{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Creators can disconnect the app at any time in their Fanvue account
        settings. You may also complain to your local data protection authority.
      </p>

      <h2>Security</h2>
      <p>
        Fanvue tokens are encrypted at rest, the database is not publicly accessible, and all traffic uses HTTPS. To report a
        security issue, write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with “Security” in the subject.
      </p>

      <h2>Age</h2>
      <p>The app is only for people who are 18 or older and allowed to use Fanvue.</p>

      <h2>Changes</h2>
      <p>We will update this page when the policy changes and show the date at the top.</p>
    </LegalPage>
  );
}
