// Time zone helpers without external libraries.

const pad = (n) => String(n).padStart(2, '0');

function partsIn(date, timeZone) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute, s: +p.second };
}

// Milliseconds the zone is ahead of UTC at a given instant.
function offsetMs(date, timeZone) {
  const p = partsIn(date, timeZone);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - Math.floor(date.getTime() / 1000) * 1000;
}

// Wall-clock time in a zone → UTC Date (handles daylight saving changes).
export function zonedToUtc(y, m, d, h, min, timeZone) {
  const guess = Date.UTC(y, m - 1, d, h, min);
  const off1 = offsetMs(new Date(guess), timeZone);
  let t = guess - off1;
  const off2 = offsetMs(new Date(t), timeZone);
  if (off2 !== off1) t = guess - off2;
  return new Date(t);
}

// Today's calendar date in a zone, as {y, m, d}.
export function todayIn(timeZone, now = new Date()) {
  const p = partsIn(now, timeZone);
  return { y: p.y, m: p.m, d: p.d };
}

export function addDays({ y, m, d }, n) {
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

// 0 = Monday … 6 = Sunday (matches availability_rules.weekday).
export function weekdayOf({ y, m, d }) {
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export function dateKey({ y, m, d }) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).slice(0, 5).split(':').map(Number);
  return h * 60 + m;
};

/**
 * Open start times for one package over the coming days.
 * rules: [{weekday, start_time, end_time}], busy: [{starts_at, ends_at}] (confirmed or still-held bookings).
 * Returns ISO strings in UTC.
 */
export function openSlots({ timeZone, rules, busy, durationMin, bufferMin, days = 14, stepMin = 30, leadMin = 120, now = new Date() }) {
  const earliest = now.getTime() + leadMin * 60000;
  const busyRanges = busy.map((b) => [
    new Date(b.starts_at).getTime() - bufferMin * 60000,
    new Date(b.ends_at).getTime() + bufferMin * 60000,
  ]);
  const today = todayIn(timeZone, now);
  const out = [];
  for (let i = 0; i < days; i++) {
    const day = addDays(today, i);
    const wd = weekdayOf(day);
    for (const rule of rules.filter((r) => r.weekday === wd)) {
      const startM = toMinutes(rule.start_time);
      const endM = toMinutes(rule.end_time);
      for (let m = startM; m + durationMin <= endM; m += stepMin) {
        const start = zonedToUtc(day.y, day.m, day.d, Math.floor(m / 60), m % 60, timeZone).getTime();
        const end = start + durationMin * 60000;
        if (start < earliest) continue;
        if (busyRanges.some(([bs, be]) => start < be && end > bs)) continue;
        out.push(new Date(start).toISOString());
      }
    }
  }
  return [...new Set(out)].sort();
}
