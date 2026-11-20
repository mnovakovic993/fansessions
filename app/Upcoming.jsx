'use client';

import { useEffect, useState } from 'react';

// Join buttons open the call in a new tab (camera and microphone are not allowed inside Fanvue's iframe).
export default function Upcoming({ calls, title = 'Upcoming calls', empty }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  if (!calls.length) {
    return empty ? (
      <section className="card stack">
        <h2>{title}</h2>
        <div className="muted">{empty}</div>
      </section>
    ) : null;
  }

  return (
    <section className="card stack">
      <h2>{title}</h2>
      {calls.map((c) => {
        const open = now >= new Date(c.startsAt).getTime() - 10 * 60000;
        return (
          <div className="row spread" key={c.id}>
            <div>
              {new Date(c.startsAt).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              {c.durationMin ? <span className="muted"> · {c.durationMin} min</span> : null}
            </div>
            <a className={open ? 'btn' : 'btn secondary'} href={c.joinUrl} target="_blank" rel="noopener noreferrer">
              {open ? 'Join call' : 'Open call page'}
            </a>
          </div>
        );
      })}
      <div className="muted">The call opens in a new tab 10 minutes before the start time.</div>
    </section>
  );
}
