import{createClient}from'@supabase/supabase-js';
import{NextRequest,NextResponse}from'next/server';
import{rateLimit}from'@/lib/rateLimit';
import{signQRPayload}from'@/lib/qrSecurity';

const supabase=createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WINDOW_MS=60000; // QR payloads rotate every 60 seconds

export async function GET(req:NextRequest){
  try{
    const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
    if(!(await rateLimit('qr-generate:'+ip,30,60000))) {
      return NextResponse.json({error:'Too many requests.'},{status:429});
    }

    const regId=req.nextUrl.searchParams.get('reg_id');
    const accessToken=req.nextUrl.searchParams.get('access_token');
    if(!regId){
      return NextResponse.json({error:'Missing reg_id'},{status:400});
    }
    if(!accessToken){
      return NextResponse.json({error:'Missing access_token'},{status:401});
    }

    // Without this, anyone who learns a registration id (a UUID that shows
    // up in plenty of places — handshake target ids, this very endpoint's
    // own URL) could mint someone else's entry QR and check in as them, or
    // mint their rotating networking QR to impersonate an unlock. The
    // access_token is the one thing only the real guest holds.
    const{data:registration}=await supabase
      .from('registrations')
      .select('id,access_token')
      .eq('id',regId)
      .single();

    if(!registration){
      return NextResponse.json({error:'Registration not found'},{status:404});
    }
    if(registration.access_token!==accessToken){
      return NextResponse.json({error:'Not authorized for this registration'},{status:401});
    }

    const windowId=Math.floor(Date.now()/WINDOW_MS);

    // Entry QR (scanned once at the door) doesn't need to rotate — it's a
    // one-time physical check-in, not a repeated profile-unlock action, so
    // unlike the networking QR it's safe and more practical for it to stay
    // stable for the registration's lifetime.
    const entryPayload=signQRPayload(`presence:entry:${regId}`);

    // Networking QR rotates every 60s so a screenshot stops working quickly.
    const unlockPayload=signQRPayload(`presence:unlock:${regId}:${windowId}`);

    return NextResponse.json({
      entryPayload,
      unlockPayload,
      refreshInMs:WINDOW_MS-(Date.now()%WINDOW_MS),
    });

  }catch(err){
    console.error('QR generate error:',err);
    return NextResponse.json({error:'Server error'},{status:500});
  }
}
