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
    if(!rateLimit('qr-generate:'+ip,30,60000)){
      return NextResponse.json({error:'Too many requests.'},{status:429});
    }

    const regId=req.nextUrl.searchParams.get('reg_id');
    if(!regId){
      return NextResponse.json({error:'Missing reg_id'},{status:400});
    }

    const{data:registration}=await supabase
      .from('registrations')
      .select('id')
      .eq('id',regId)
      .single();

    if(!registration){
      return NextResponse.json({error:'Registration not found'},{status:404});
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
