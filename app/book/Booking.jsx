'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const FANVUE_ORIGIN = /^https:\/\/([a-z0-9-]+\.)*fanvue\.com$/;
const money = (cents) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;

function dayKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function Booking({ packages, creatorName }) {
  const [pkg, setPkg] = useState(null);
  const [slots, setSlots] = useState(null);
  const [day, setDay] = useState(null);
  const [slot, setSlot] = useState(null);
  const [step, setStep] = useState('choose'); // choose | paying | confirming | done | error
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);
  const pending = useRef(null);

  // Load open times when a package is picked.
  useEffect(() => {
    if (!pkg) return;
    setSlots(null);
    setDay(null);
    setSlot(null);
    fetch(`/api/fan/slots?packageId=${pkg.id}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots || []))
      .catch(() => setSlots([]));
  }, [pkg]);

  const days = useMemo(() => {
    const map = new Map();
    for (const iso of slots || []) {
      const k = dayKey(iso);
      if (!map.has(k)) map.set(k, { key: k, date: new Date(iso), times: [] });
      map.get(k).times.push(iso);
    }
    return [...map.values()];
  }, [slots]);

  // Fanvue answers the purchase request with a postMessage. It is only UI feedback;
  // the booking is confirmed by the payment webhook, which we poll for below.
  useEffect(() => {
    function onMessage(event) {
      if (!FANVUE_ORIGIN.test(event.origin)) return;
      const msg = event.data || {};
      if (msg.type !== 'fanvue:experience:purchase-result') return;
      if (!pending.current || msg.clientReferenceId !== pending.current) return;
      if (msg.status === 'succeeded') setStep('confirming');
      else {
        setStep('choose');
        setError(msg.status === 'cancelled' ? 'Payment cancelled. The time is held for a few more minutes.' : 'Payment failed. Please try again.');
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Poll the booking until the webhook confirms it.
  useEffect(() => {
    if (step !== 'confirming' || !pending.current) return;
    let tries = 0;
    const id = setInterval(async () => {
      tries += 1;
      const r = await fetch(`/api/fan/booking/${pending.current}`).then((x) => x.json()).catch(() => null);
      if (r?.status === 'confirmed') {
        clearInterval(id);
        setBooking(r);
        setStep('done');
      } else if (tries > 40) {
        clearInterval(id);
        setStep('error');
        setError('Payment received, but the confirmation is taking longer than usual. Check back in a few minutes.');
      }
    }, 3000);
    return () => clearInterval(id);
  }, [step]);

  async function pay() {
    setError(null);
    const res = await fetch('/api/fan/hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageId: pkg.id, startsAt: slot }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error === 'slot_taken' ? 'That time was just taken. Please pick another.' : 'Could not reserve that time. Please try again.');
      if (data.error === 'slot_taken') setPkg({ ...pkg });
      return;
    }
    pending.current = data.bookingId;
    setStep('paying');
    window.parent.postMessage(
      { type: 'fanvue:experience:purchase-request', externalActionId: data.externalActionId, clientReferenceId: data.bookingId },
      '*'
    );
  }

  const fmtDay = (d) => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const fmtFull = (iso) =>
    new Date(iso).toLocaleString(undefined, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

  if (step === 'done' && booking) {
    return (
      <section className="card stack">
        <h2 className="success">You’re booked</h2>
        <p style={{ margin: 0 }}>
          {pkg.durationMin}-minute call with {creatorName}, {fmtFull(booking.startsAt)} (your time).
        </p>
        <p className="muted" style={{ margin: 0 }}>Open this booking from the creator’s profile at the time of the call to join.</p>
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="card stack">
        <h2>1. Choose a length</h2>
        {packages.map((p) => (
          <button
            key={p.id}
            type="button"
            className="btn secondary"
            style={{ justifyContent: 'space-between', borderColor: pkg?.id === p.id ? 'var(--accent)' : undefined }}
            onClick={() => setPkg(p)}
            disabled={step !== 'choose'}
          >
            <span>{p.durationMin} minutes</span>
            <span>{money(p.priceCents)}</span>
          </button>
        ))}
      </section>

      {pkg && (
        <section className="card stack">
          <h2>2. Pick a time</h2>
          <div className="muted">Times are shown in your time zone.</div>
          {slots === null && <div className="muted">Loading times…</div>}
          {slots && days.length === 0 && <div className="muted">No open times in the next two weeks.</div>}
          {days.length > 0 && (
            <div className="row">
              {days.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  className="btn secondary"
                  style={{ borderColor: day === d.key ? 'var(--accent)' : undefined }}
                  onClick={() => {
                    setDay(d.key);
                    setSlot(null);
                  }}
                  disabled={step !== 'choose'}
                >
                  {fmtDay(d.date)}
                </button>
              ))}
            </div>
          )}
          {day && (
            <div className="row">
              {days
                .find((d) => d.key === day)
                ?.times.map((iso) => (
                  <button
                    key={iso}
                    type="button"
                    className="btn secondary"
                    style={{ borderColor: slot === iso ? 'var(--accent)' : undefined }}
                    onClick={() => setSlot(iso)}
                    disabled={step !== 'choose'}
                  >
                    {fmtTime(iso)}
                  </button>
                ))}
            </div>
          )}
        </section>
      )}

      {pkg && slot && (
        <section className="card stack">
          <h2>3. Confirm and pay</h2>
          <div>
            {pkg.durationMin}-minute call · {fmtFull(slot)} · <strong>{money(pkg.priceCents)}</strong>
          </div>
          <div className="muted">You pay on Fanvue. The time is held for you for 10 minutes while you pay.</div>
          <div className="row">
            <button className="btn" type="button" onClick={pay} disabled={step !== 'choose'}>
              {step === 'paying' ? 'Waiting for payment…' : step === 'confirming' ? 'Confirming…' : `Pay ${money(pkg.priceCents)}`}
            </button>
          </div>
        </section>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
