import{NextRequest,NextResponse}from'next/server';
import{createClient}from'@supabase/supabase-js';

const supabase=createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req:NextRequest){
  try{
    const{event_id,host_email}=await req.json();
    if(!event_id||!host_email){
      return NextResponse.json({error:'Missing fields'},{status:400});
    }

    // Verify event exists and belongs to this host
    const{data:event}=await supabase
      .from('events')
      .select('*')
      .eq('id',event_id)
      .single();

    if(!event){
      return NextResponse.json({error:'Event not found'},{status:404});
    }

    // Get host details
    const{data:host}=await supabase
      .from('hosts')
      .select('*')
      .eq('email',host_email)
      .single();

    if(!host){
      return NextResponse.json({error:'Host not found'},{status:404});
    }

    // Get host profile
    const{data:hostProfile}=await supabase
      .from('host_profiles')
      .select('*')
      .eq('host_id',host.id)
      .single();

    // Check if host already has a registration for this event
    const{data:existingReg}=await supabase
      .from('registrations')
      .select('*')
      .eq('event_id',event_id)
      .eq('guest_email',host_email)
      .eq('status','host')
      .single();

    let registration=existingReg;

    if(!existingReg){
      // Create host registration
      const accessToken=Array.from(
        crypto.getRandomValues(new Uint8Array(32))
      ).map(b=>b.toString(16).padStart(2,'0')).join('');

      const guestUrl=`${process.env.NEXT_PUBLIC_APP_URL}/e/${event.slug}/g/${accessToken}`;

      const{data:newReg}=await supabase
        .from('registrations')
        .insert({
          event_id,
          guest_name:hostProfile?.display_name||host.name,
          guest_email:host_email,
          guest_phone:host.phone||'',
          status:'host',
          amount:0,
          paid:true,
          access_token:accessToken,
          guest_access_link:guestUrl,
        })
        .select()
        .single();

      registration=newReg;
    }

    // Update event status to live
    await supabase
      .from('events')
      .update({status:'live'})
      .eq('id',event_id);

    return NextResponse.json({
      success:true,
      host_link:registration.guest_access_link,
      access_token:registration.access_token,
    });

  }catch(err){
    console.error('Go live error:',err);
    return NextResponse.json({error:'Server error'},{status:500});
  }
}
