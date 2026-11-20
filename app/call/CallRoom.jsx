'use client';

import { useEffect, useState } from 'react';

function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

const mmss = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export default function CallRoom({ state, src, startsAt, endsAt, ticket, otherName }) {
  const now = useNow();
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reportStatus, setReportStatus] = useState(null);
  const opens = start - 10 * 60000;

  // While waiting, reload once the room opens so the server hands out the call.
  useEffect(() => {
    if (state === 'early' && now >= opens) window.location.reload();
  }, [state, now, opens]);

  if (state === 'early') {
    return (
      <main className="wrap stack">
        <h1>Your call starts soon</h1>
        <p className="muted">
          Starts at {new Date(startsAt).toLocaleString(undefined, { weekday: 'long', hour: '2-digit', minute: '2-digit' })}. This
          page opens the call 10 minutes before, on its own. Keep it open.
        </p>
        <p>Opens in {mmss(opens - now)}</p>
      </main>
    );
  }

  async function sendReport() {
    setReportStatus('sending');
    const res = await fetch('/api/call/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket, reason }),
    });
    setReportStatus(res.ok ? 'sent' : 'failed');
  }

  const remaining = end - now;
  const status =
    now < start ? `Starts in ${mmss(start - now)}` : remaining > 0 ? `${mmss(remaining)} left` : 'Time is up — the call closes in a few minutes';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div className="row spread" style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)' }}>
        <div>
          <strong>Call with {otherName}</strong>
          <span className="muted" style={{ marginLeft: 12 }}>{status}</span>
        </div>
        <button className="btn secondary" type="button" onClick={() => setReportOpen((v) => !v)}>
          Report a problem
        </button>
      </div>
      {reportOpen && (
        <div className="row" style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)' }}>
          <label htmlFor="reason">What happened?</label>
          <input
            id="reason"
            style={{ flex: 1, minWidth: 200 }}
            value={reason}
            maxLength={1000}
            onChange={(e) => setReason(e.target.value)}
          />
          <button className="btn" type="button" onClick={sendReport} disabled={!reason.trim() || reportStatus === 'sending'}>
            Send report
          </button>
          {reportStatus === 'sent' && <span className="success">Thanks, we received it.</span>}
          {reportStatus === 'failed' && <span className="error">Could not send. Try again.</span>}
        </div>
      )}
      <iframe
        title="Video call"
        src={src}
        allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
        style={{ flex: 1, border: 0, width: '100%' }}
      />
    </div>
  );
}
