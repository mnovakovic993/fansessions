import { sign, unsign } from './crypto';

// Joining opens a new browser tab, where the cookies set inside Fanvue's iframe are not available
// (they are partitioned to Fanvue). So the join link carries a signed, short-lived ticket instead.
export const OPEN_BEFORE_MIN = 10;
export const CLOSE_AFTER_MIN = 5;

export function joinTicket({ bookingId, role, who }) {
  return sign({ b: bookingId, r: role, w: who, exp: Date.now() + 3 * 24 * 60 * 60 * 1000 });
}

export function readTicket(value) {
  const t = unsign(value);
  if (!t?.b || !['fan', 'creator'].includes(t.r)) return null;
  return { bookingId: t.b, role: t.r, who: t.w };
}

export function joinUrl(ticket) {
  return `${process.env.APP_URL}/call?t=${encodeURIComponent(ticket)}`;
}

export function callWindow(booking, now = Date.now()) {
  const opens = new Date(booking.starts_at).getTime() - OPEN_BEFORE_MIN * 60000;
  const closes = new Date(booking.ends_at).getTime() + CLOSE_AFTER_MIN * 60000;
  if (now < opens) return 'early';
  if (now > closes) return 'over';
  return 'open';
}
