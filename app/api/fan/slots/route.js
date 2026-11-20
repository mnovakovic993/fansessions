import { NextResponse } from 'next/server';
import { currentFan } from '@/lib/session';
import { bookablePackages, slotsFor } from '@/lib/bookings';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const fan = await currentFan();
  if (!fan) return NextResponse.json({ error: 'not_signed_in' }, { status: 401 });
  if (!fan.creator.accepting) return NextResponse.json({ slots: [], accepting: false });

  const packageId = new URL(request.url).searchParams.get('packageId');
  const pkg = (await bookablePackages(fan.creator.id)).find((p) => p.id === packageId);
  if (!pkg) return NextResponse.json({ error: 'unknown_package' }, { status: 404 });

  return NextResponse.json({ slots: await slotsFor(fan.creator, pkg), accepting: true });
}
