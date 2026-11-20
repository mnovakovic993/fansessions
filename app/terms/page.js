import { LegalPage, OPERATOR, SUPPORT_EMAIL } from '../legal';

export const metadata = { title: 'Terms of Service · Fan Sessions' };

export default function Terms() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These terms cover your use of Fan Sessions (“the app”), operated by {OPERATOR}, Serbia. By connecting or using the app you
        agree to them. They apply alongside Fanvue’s own terms and policies, which always take precedence for anything on Fanvue.
      </p>

      <h2>1. What the app does</h2>
      <p>
        Creators set call lengths, prices and availability. Fans book a time and pay through Fanvue. At the booked time, both join a
        private 1:1 video call in a browser tab. The app is a booking and video tool; the call itself is a service the creator
        provides to the fan.
      </p>

      <h2>2. Who can use it</h2>
      <p>You must be 18 or older, have a Fanvue account in good standing, and follow Fanvue’s rules.</p>

      <h2>3. Payments, fees and refunds</h2>
      <ul>
        <li>Fans pay the price the creator sets, through Fanvue. Fanvue’s fees apply.</li>
        <li>
          Creators who connect the app agree to the app’s revenue share shown on Fanvue’s consent screen, which Fanvue deducts from
          the creator’s earnings on bookings made through the app.
        </li>
        <li>
          Refunds are handled through Fanvue. If a creator misses a confirmed call, the fan can ask for a new time or contact{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we will help request a refund from Fanvue. If a fan does not
          join a confirmed call, the booking is not refunded.
        </li>
      </ul>

      <h2>4. Calls and conduct</h2>
      <ul>
        <li>Calls are limited to the booked length and end automatically shortly after.</li>
        <li>
          Everything said or shown on a call must follow Fanvue’s content policies and the law. No harassment, threats, hate,
          sharing of someone else’s personal data, recording without consent, or content involving anyone under 18.
        </li>
        <li>Use “Report a problem” during a call, or email us. We may suspend access for anyone who breaks these rules.</li>
        <li>The app does not record calls. Do not record the other person without their clear consent.</li>
      </ul>

      <h2>5. Creators’ responsibilities</h2>
      <p>
        Creators are responsible for the calls they sell, for being available at booked times, and for their own taxes. Keep your
        availability and prices up to date, and publish again on Fanvue after changing packages.
      </p>

      <h2>6. Availability of the service</h2>
      <p>
        We work to keep the app running, but it depends on Fanvue, Daily and our hosting providers and is provided “as is”. We are
        not liable for indirect losses or for outages of third-party services. Nothing in these terms limits rights you have under
        consumer law.
      </p>

      <h2>7. Ending use</h2>
      <p>
        Creators can disconnect the app at any time in their Fanvue settings. Calls already paid for remain the creator’s
        responsibility. We may stop offering the app with reasonable notice to connected creators.
      </p>

      <h2>8. Changes and law</h2>
      <p>
        We may update these terms and will show the date at the top. The laws of Serbia apply, without limiting mandatory consumer
        protections where you live.
      </p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
