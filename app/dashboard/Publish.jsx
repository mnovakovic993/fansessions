'use client';

import { useEffect, useState } from 'react';

const REVIEW_TEXT = {
  pending_review: 'Waiting for Fanvue review. Only you can open it until it is approved.',
  approved: 'Live on your profile.',
  rejected: 'Rejected by Fanvue review.',
};

export default function Publish({ hasExperience }) {
  const [experience, setExperience] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!hasExperience) return;
    fetch('/api/experience')
      .then((r) => r.json())
      .then((d) => setExperience(d.experience || null))
      .catch(() => {});
  }, [hasExperience]);

  async function publish() {
    setBusy(true);
    setMessage(null);
    const res = await fetch('/api/experience', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setExperience(data.experience);
      setMessage({ ok: true, text: 'Published. Prices and packages on Fanvue now match your settings.' });
    } else if (data.error === 'reconnect_required') {
      setMessage({ ok: false, text: 'Fanvue needs new permissions. Sign out and connect with Fanvue again, then publish.' });
    } else if (data.error === 'no_active_packages') {
      setMessage({ ok: false, text: 'Turn on at least one package and save your settings first.' });
    } else {
      setMessage({ ok: false, text: `Publishing failed (${data.status || data.error || 'error'}).` });
    }
  }

  return (
    <section className="card stack">
      <h2>Booking on your Fanvue profile</h2>
      <p className="muted" style={{ margin: 0 }}>
        Adds a “Book a 1:1 video call” experience to your profile, with one paid option per package. Publish again
        after changing packages or prices.
      </p>
      {experience && (
        <div className="muted">
          Status: {REVIEW_TEXT[experience.reviewStatus] || experience.reviewStatus || 'unknown'}
          {experience.reviewRejection?.message ? ` — ${experience.reviewRejection.message}` : ''}
          {experience.url && (
            <>
              {' '}
              <a href={experience.url} target="_blank" rel="noreferrer">Open on Fanvue</a>
            </>
          )}
        </div>
      )}
      <div className="row">
        <button className="btn" type="button" onClick={publish} disabled={busy}>
          {busy ? 'Publishing…' : experience ? 'Update on Fanvue' : 'Publish on Fanvue'}
        </button>
        {message && <span className={message.ok ? 'success' : 'error'}>{message.text}</span>}
      </div>
    </section>
  );
}
