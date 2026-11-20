const LABELS = {
  completed: ['Completed', 'good'],
  no_show_fan: ['Fan did not join', 'warn'],
  no_show_creator: ['You did not join', 'warn'],
  refunded: ['Refunded', ''],
  cancelled_by_fan: ['Cancelled by fan', ''],
  cancelled_by_creator: ['Cancelled by you', ''],
};

export default function PastCalls({ calls }) {
  if (!calls.length) return null;
  return (
    <section className="card stack">
      <h2>Past calls</h2>
      {calls.map((c) => {
        const [label, tone] = LABELS[c.status] || [c.status, ''];
        return (
          <div key={c.id} className="stack" style={{ gap: 4 }}>
            <div className="row spread">
              <div>
                {new Date(c.startsAt).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                {c.durationMin ? <span className="muted"> · {c.durationMin} min</span> : null}
              </div>
              <span className={`badge ${tone}`}>{label}</span>
            </div>
            {c.reports.map((r, i) => (
              <div key={i} className="muted small">
                Problem reported by {r.role === 'fan' ? 'the fan' : 'you'}: {r.reason}
              </div>
            ))}
          </div>
        );
      })}
      <div className="muted small">
        Whether a call happened is read from who joined the video room. Refunds are made on Fanvue.
      </div>
    </section>
  );
}
