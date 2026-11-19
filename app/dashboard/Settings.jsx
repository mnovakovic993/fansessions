'use client';

import { useState } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DURATIONS = [10, 15, 20, 30, 45, 60];
const DEFAULT_PACKAGES = [
  { durationMin: 10, priceCents: 1500, active: true },
  { durationMin: 20, priceCents: 2500, active: true },
  { durationMin: 30, priceCents: 3500, active: false },
];

function timezones() {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return ['Europe/London', 'Europe/Belgrade', 'America/New_York', 'America/Los_Angeles'];
  }
}

export default function Settings({ initial }) {
  const [accepting, setAccepting] = useState(initial.accepting);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [bufferMin, setBufferMin] = useState(initial.bufferMin);
  const [packages, setPackages] = useState(initial.packages.length ? initial.packages : DEFAULT_PACKAGES);
  const [hours, setHours] = useState(() => {
    const byDay = DAYS.map((_, i) => ({ on: false, start: '17:00', end: '21:00', weekday: i }));
    for (const r of initial.availability) byDay[r.weekday] = { on: true, start: r.start, end: r.end, weekday: r.weekday };
    return byDay;
  });
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  const updatePackage = (i, patch) => setPackages((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const updateDay = (i, patch) => setHours((hs) => hs.map((h, j) => (j === i ? { ...h, ...patch } : h)));
  const unusedDurations = DURATIONS.filter((d) => !packages.some((p) => p.durationMin === d));

  async function save() {
    setSaving(true);
    setStatus(null);
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accepting,
        timezone,
        bufferMin: Number(bufferMin),
        packages: packages.map((p) => ({ ...p, priceCents: Math.round(Number(p.priceCents)) })),
        availability: hours.filter((h) => h.on).map(({ weekday, start, end }) => ({ weekday, start, end })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) setStatus({ ok: true, text: 'Saved.' });
    else setStatus({ ok: false, text: (data.details || [data.error || 'Could not save']).join(' · ') });
  }

  return (
    <div className="stack">
      <section className="card row spread">
        <div>
          <h2>Accept bookings</h2>
          <div className="muted">{accepting ? 'Fans can book calls.' : 'Paused: fans see that you are not available.'}</div>
        </div>
        <input
          type="checkbox"
          aria-label="Accept bookings"
          checked={accepting}
          onChange={(e) => setAccepting(e.target.checked)}
        />
      </section>

      <section className="card stack">
        <h2>Packages</h2>
        {packages.map((p, i) => (
          <div className="row spread" key={p.durationMin}>
            <label className="row" style={{ color: 'var(--text)', fontSize: 15 }}>
              <input type="checkbox" checked={p.active} onChange={(e) => updatePackage(i, { active: e.target.checked })} />
              {p.durationMin} minutes
            </label>
            <div className="row">
              <label htmlFor={`price-${i}`}>Price (USD)</label>
              <input
                id={`price-${i}`}
                type="number"
                min="3"
                max="500"
                step="1"
                style={{ width: 100 }}
                value={p.priceCents / 100}
                onChange={(e) => updatePackage(i, { priceCents: Math.round(Number(e.target.value) * 100) })}
              />
              <button
                className="btn secondary"
                type="button"
                onClick={() => setPackages((ps) => ps.filter((_, j) => j !== i))}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {unusedDurations.length > 0 && (
          <div className="row">
            <label htmlFor="add-duration">Add a length</label>
            <select
              id="add-duration"
              value=""
              onChange={(e) => {
                const d = Number(e.target.value);
                if (d) setPackages((ps) => [...ps, { durationMin: d, priceCents: 2000, active: true }].sort((a, b) => a.durationMin - b.durationMin));
              }}
            >
              <option value="">Choose…</option>
              {unusedDurations.map((d) => (
                <option key={d} value={d}>{d} minutes</option>
              ))}
            </select>
          </div>
        )}
        <div className="muted">Fanvue allows prices from $3 to $500.</div>
      </section>

      <section className="card stack">
        <h2>Availability</h2>
        <div className="row">
          <label htmlFor="tz">Time zone</label>
          <select id="tz" value={timezone} onChange={(e) => setTimezone(e.target.value)} style={{ maxWidth: 280 }}>
            {timezones().map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
        {hours.map((h, i) => (
          <div className="row spread" key={DAYS[i]}>
            <label className="row" style={{ color: 'var(--text)', fontSize: 15, minWidth: 140 }}>
              <input type="checkbox" checked={h.on} onChange={(e) => updateDay(i, { on: e.target.checked })} />
              {DAYS[i]}
            </label>
            <div className="row">
              <input
                type="time"
                aria-label={`${DAYS[i]} start`}
                value={h.start}
                disabled={!h.on}
                onChange={(e) => updateDay(i, { start: e.target.value })}
              />
              <span className="muted">to</span>
              <input
                type="time"
                aria-label={`${DAYS[i]} end`}
                value={h.end}
                disabled={!h.on}
                onChange={(e) => updateDay(i, { end: e.target.value })}
              />
            </div>
          </div>
        ))}
        <div className="row">
          <label htmlFor="buffer">Break between calls (minutes)</label>
          <input
            id="buffer"
            type="number"
            min="0"
            max="60"
            style={{ width: 90 }}
            value={bufferMin}
            onChange={(e) => setBufferMin(e.target.value)}
          />
        </div>
      </section>

      <div className="row">
        <button className="btn" type="button" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
        {status && <span className={status.ok ? 'success' : 'error'}>{status.text}</span>}
      </div>
    </div>
  );
}
