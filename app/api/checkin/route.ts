import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyQRPayload } from '@/lib/qrSecurity';
import { rateLimit } from '@/lib/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!(await rateLimit('checkin:' + ip, 60, 60000))) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }
    const { qr_payload, event_id, scanner_token } = await req.json();
    if (!qr_payload || !event_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // The scanner page checks events.scanner_token client-side before
    // letting someone start scanning, but that alone doesn't stop a direct
    // POST here — anyone with an event_id and any captured qr_payload
    // could check a stranger in remotely without ever holding the scanner
    // link. Enforce the same check server-side.
    if (!scanner_token) {
      return NextResponse.json({ error: 'Missing scanner_token' }, { status: 401 });
    }
    const { data: scanEvent } = await supabase.from('events').select('scanner_token').eq('id', event_id).single();
    if (!scanEvent || scanEvent.scanner_token !== scanner_token) {
      return NextResponse.json({ error: 'Not authorized to scan for this event' }, { status: 401 });
    }

    const regId = verifyQRPayload(qr_payload, 'presence:entry:');
    if (!regId) {
      return NextResponse.json({ success: false, reason: 'invalid', message: 'Invalid or tampered QR code' });
    }
    const { data: reg } = await supabase.from('registrations').select('id,guest_name,event_id,checked_in,checked_in_at,status').eq('id', regId).single();
    if (!reg) return NextResponse.json({ success: false, reason: 'not_found', message: 'Ticket not found' });
    if (reg.event_id !== event_id) return NextResponse.json({ success: false, reason: 'wrong_event', message: 'Ticket is for a different event' });
    if (reg.status === 'pending') return NextResponse.json({ success: false, reason: 'unpaid', message: 'Payment pending — entry not permitted', name: reg.guest_name });
    if (reg.checked_in) return NextResponse.json({ success: false, reason: 'already_checked_in', message: 'Already checked in', name: reg.guest_name, time: reg.checked_in_at });
    const { data: updated, error: updateErr } = await supabase.from('registrations').update({ checked_in: true, checked_in_at: new Date().toISOString() }).eq('id', regId).eq('checked_in', false).select('id,guest_name,checked_in_at').single();
    if (updateErr || !updated) {
      const { data: current } = await supabase.from('registrations').select('guest_name,checked_in_at').eq('id', regId).single();
      return NextResponse.json({ success: false, reason: 'already_checked_in', message: 'Already checked in on another device', name: current?.guest_name, time: current?.checked_in_at });
    }
    return NextResponse.json({ success: true, message: 'Welcome', name: updated.guest_name, time: updated.checked_in_at });
  } catch (err) {
    console.error('Checkin error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
