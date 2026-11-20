export const SUPPORT_EMAIL = 'milos.novakovic.web@gmail.com';
export const OPERATOR = 'Milos Novakovic';
export const UPDATED = '20 November 2026';

export function LegalPage({ title, children }) {
  return (
    <main className="wrap stack" style={{ maxWidth: 760 }}>
      <div>
        <div className="muted">
          <a href="/">Fan Sessions</a>
        </div>
        <h1>{title}</h1>
        <div className="muted">Last updated: {UPDATED}</div>
      </div>
      <div className="legal">{children}</div>
    </main>
  );
}
