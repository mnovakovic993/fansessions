import { LegalPage, SUPPORT_EMAIL } from '../legal';

export const metadata = { title: 'Help & Support · Fan Sessions' };

export default function Support() {
  return (
    <LegalPage title="Help & Support">
      <p>
        Questions, problems or security reports: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We reply within 2 business
        days. For security issues, put “Security” in the subject.
      </p>

      <h2>For creators: getting started</h2>
      <ol>
        <li>Install Fan Sessions from the Fanvue App Store and open it. You are signed in with your Fanvue account.</li>
        <li>Turn on the call lengths you want to offer (10 to 60 minutes) and set a price for each ($3–$500).</li>
        <li>Choose your time zone, the days and hours you are available, and a break between calls.</li>
        <li>Switch on “Accept bookings” and save.</li>
        <li>Click “Publish on Fanvue”. A “Book a 1:1 video call” experience appears on your profile once Fanvue approves it.</li>
        <li>Booked calls appear under “Upcoming calls”. Click “Join call” at the booked time; the call opens in a new tab.</li>
      </ol>
      <p>After changing packages or prices, save and click “Update on Fanvue” so your profile shows the new options.</p>

      <h2>For fans: booking a call</h2>
      <ol>
        <li>Open “Book a 1:1 video call” on the creator’s Fanvue profile.</li>
        <li>Pick a length and a time. Times are shown in your own time zone.</li>
        <li>Pay on Fanvue. Your booking is confirmed once the payment goes through.</li>
        <li>At the booked time, open the booking again and click “Join call”. Allow camera and microphone when your browser asks.</li>
      </ol>

      <h2>Common questions</h2>
      <p><strong>Is the call recorded?</strong> No. Calls are live only.</p>
      <p><strong>What if the creator does not show up?</strong> Email us with the date of the call and we will help arrange a new time or a refund through Fanvue.</p>
      <p><strong>Camera or microphone not working?</strong> Check that your browser has permission for this site, close other apps using the camera, and reload the call page.</p>

      <p>
        See also the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
      </p>
    </LegalPage>
  );
}
