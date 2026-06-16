import{createClient}from'@supabase/supabase-js';
import{NextRequest,NextResponse}from'next/server';
import{rateLimit}from'@/lib/rateLimit';
import{sanitizeString}from'@/lib/sanitize';
import{verifyQRPayload}from'@/lib/qrSecurity';

const supabase=createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req:NextRequest){
  try{
    // Rate limit by IP
    const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
    if(!rateLimit('unlock:'+ip,20,60000)){
      return NextResponse.json({error:'Too many requests.'},{status:429});
    }

    // Parse and sanitize inputs
    const body=await req.json();
    const scanner_registration_id=sanitizeString(body.scanner_registration_id,36);
    const raw_target=sanitizeString(body.target_registration_id||'',200);

    // Verify HMAC if signed payload provided
    let target_registration_id=raw_target;
    if(raw_target.includes(':')){
      const verified=verifyQRPayload(raw_target,'presence:unlock:');
      if(!verified){
        return NextResponse.json({error:'Invalid or tampered QR code'},{status:403});
      }
      target_registration_id=verified;
    }

    if(!scanner_registration_id||!target_registration_id){
      return NextResponse.json({error:'Missing fields'},{status:400});
    }

    // Validate both registrations exist and are for the SAME event
    const{data:scannerReg}=await supabase
      .from('registrations')
      .select('id,event_id,status,paid')
      .eq('id',scanner_registration_id)
      .single();

    const{data:targetReg}=await supabase
      .from('registrations')
      .select('id,event_id,status')
      .eq('id',target_registration_id)
      .single();

    if(!scannerReg||!targetReg){
      return NextResponse.json({error:'Registration not found'},{status:404});
    }

    // Prevent cross-event scanning
    if(scannerReg.event_id!==targetReg.event_id){
      return NextResponse.json({error:'Invalid scan — different events'},{status:403});
    }

    // Check event is still live
    const{data:event}=await supabase
      .from('events')
      .select('status')
      .eq('id',scannerReg.event_id)
      .single();

    if(!event||event.status!=='live'){
      return NextResponse.json({error:'Networking has closed for this event'},{status:403});
    }

    // Get guest profiles
    const{data:sp}=await supabase
      .from('guest_profiles')
      .select('id')
      .eq('registration_id',scanner_registration_id)
      .single();

    const{data:tp}=await supabase
      .from('guest_profiles')
      .select('id')
      .eq('registration_id',target_registration_id)
      .single();

    if(!sp||!tp){
      return NextResponse.json({error:'Profile not found'},{status:404});
    }

    // Prevent self-scan
    if(sp.id===tp.id){
      return NextResponse.json({error:'Cannot scan your own QR'},{status:400});
    }

    // Find handshake between the two
    const{data:handshake}=await supabase
      .from('handshakes')
      .select('id')
      .or(`and(sender_id.eq.${sp.id},receiver_id.eq.${tp.id}),and(sender_id.eq.${tp.id},receiver_id.eq.${sp.id})`)
      .single();

    if(!handshake){
      return NextResponse.json({error:'No connection found. Connect first before scanning.'},{status:404});
    }

    // handshakes has no per-side unlock-status column in the real schema —
    // an established handshake is already treated as fully connected, so
    // there's nothing to flip here. We still record the unlock event itself
    // (who scanned whom, when) since profile_unlocks is a real audit table.
    const{data:existingUnlock}=await supabase
      .from('profile_unlocks')
      .select('id')
      .eq('handshake_id',handshake.id)
      .eq('unlocker_id',sp.id)
      .eq('unlocked_id',tp.id)
      .maybeSingle();

    if(existingUnlock){
      return NextResponse.json({success:true,already:true});
    }

    await supabase
      .from('profile_unlocks')
      .insert({
        handshake_id:handshake.id,
        unlocker_id:sp.id,
        unlocked_id:tp.id,
      });

    return NextResponse.json({success:true});

  }catch(err){
    console.error('Unlock error:',err);
    return NextResponse.json({error:'Server error'},{status:500});
  }
}
