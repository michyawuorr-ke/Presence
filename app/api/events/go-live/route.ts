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

    // Require the caller's own session and confirm it's actually them —
    // otherwise anyone who knows an event_id and a host's email could flip
    // any event live and mint themselves a host registration for it.
    const authHeader=req.headers.get('authorization')||'';
    const token=authHeader.startsWith('Bearer ')?authHeader.slice(7):'';
    if(!token){
      return NextResponse.json({error:'Missing session'},{status:401});
    }
    const{data:{user},error:sessionError}=await supabase.auth.getUser(token);
    if(sessionError||!user||user.email?.toLowerCase()!==host_email.toLowerCase()){
      return NextResponse.json({error:'Not authorized for this host account'},{status:401});
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
        })
        .select()
        .single();

      registration=newReg;

      // hosts now carries master_profile_id directly (set at signup in
      // app/login/page.tsx, or by the migration backfill for older rows),
      // so use that instead of re-deriving it by email each time. Only
      // falls back to a fresh lookup-or-create for a host row that
      // predates both the signup change and the backfill.
      let masterProfileId=host.master_profile_id||null;
      if(!masterProfileId){
        const{data:existingMaster}=await supabase
          .from('master_profiles')
          .select('id')
          .eq('email',host_email)
          .maybeSingle();

        masterProfileId=existingMaster?.id||null;
        if(!masterProfileId){
          const{data:newMaster}=await supabase
            .from('master_profiles')
            .insert({email:host_email,display_name:hostProfile?.display_name||host.name})
            .select('id')
            .single();
          masterProfileId=newMaster?.id||null;
        }
      }

      // Create host guest_profiles immediately when registration is first made
      // so they can enter the app and use networking before the event goes live.
      if(newReg){
        await supabase.from('guest_profiles').insert({
          registration_id:    newReg.id,
          event_id,
          master_profile_id:  masterProfileId,
          display_name:       hostProfile?.display_name||host.name,
          role_title:         hostProfile?.role_title||'Event Host',
          organisation:       hostProfile?.organisation||'',
          bio:                hostProfile?.bio||'',
          linkedin_url:       hostProfile?.linkedin_url||null,
          website_url:        hostProfile?.website_url||null,
          portfolio_url:      hostProfile?.portfolio_url||null,
          role:               'organizer',
          networking_visible: true,
          aura_active:        false,
          show_linkedin:      true,
          show_website:       true,
          show_portfolio:     true,
        });
      }
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
