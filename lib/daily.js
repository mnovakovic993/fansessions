// Daily REST API (https://docs.daily.co/reference/rest-api).
const DAILY_API = 'https://api.daily.co/v1';

function key() {
  const k = (process.env.DAILY_API_KEY || '').trim();
  if (!k) throw new Error('DAILY_API_KEY must be set');
  return k;
}

async function daily(method, path, body) {
  const res = await fetch(DAILY_API + path, {
    method,
    headers: { Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`Daily ${method} ${path} failed: ${res.status} ${data.error || ''} ${data.info || ''}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const roomNameFor = (bookingId) => `b-${String(bookingId).replace(/[^a-zA-Z0-9-]/g, '')}`;

// Private 2-person room that opens 10 minutes early and ejects everyone 5 minutes after the booked end.
export async function ensureRoom(booking) {
  const name = roomNameFor(booking.id);
  const nbf = Math.floor(new Date(booking.starts_at).getTime() / 1000) - 10 * 60;
  const exp = Math.floor(new Date(booking.ends_at).getTime() / 1000) + 5 * 60;
  try {
    return await daily('GET', `/rooms/${name}`);
  } catch (e) {
    if (e.status !== 404) throw e;
  }
  return daily('POST', '/rooms', {
    name,
    privacy: 'private',
    properties: {
      nbf,
      exp,
      eject_at_room_exp: true,
      max_participants: 2,
      enable_prejoin_ui: true,
      enable_chat: true,
      enable_screenshare: false,
      enable_recording: false,
    },
  });
}

export async function meetingToken({ roomName, userName, isOwner, expUnix }) {
  const data = await daily('POST', '/meeting-tokens', {
    properties: {
      room_name: roomName,
      user_name: userName,
      is_owner: !!isOwner,
      exp: expUnix,
      eject_at_token_exp: true,
    },
  });
  return data.token;
}

export function roomUrl(roomName, token) {
  const domain = (process.env.DAILY_DOMAIN || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `https://${domain}/${roomName}?t=${encodeURIComponent(token)}`;
}
