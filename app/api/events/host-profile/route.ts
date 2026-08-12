import{NextRequest,NextResponse}from'next/server';
import { rateLimit } from '@/lib/rateLimit';
import{createClient}from'@supabase/supabase-js';
import{ORGANIZER_ROLE}from'@/lib/hostRole';

const supabase=createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — fetch host node for display in the networking list
export async function GET(req:NextRequest){
  const eventId=req.nextUrl.searchParams.get('event_id');
  if(!eventId)return NextResponse.json({error:'Missing event_id'},{status:400});

  const{data:event}=await supabase
    .from('events')
    .select('host_id,status')
    .eq('id',eventId)
    .single();

  if(!event||event.status==='ended'){
    return NextResponse.json({host:null});
  }

  const{data:host}=await supabase
    .from('hosts')
    .select('id,name,email')
    .eq('id',event.host_id)
    .single();

  if(!host)return NextResponse.json({host:null});

  const{data:hostProfile}=await supabase
    .from('host_profiles')
    .select('*')
    .eq('host_id',host.id)
    .eq('show_in_events',true)
    .single();

  if(!hostProfile)return NextResponse.json({host:null});

  const{count:eventsCount}=await supabase
    .from('events')
    .select('id',{count:'exact',head:true})
    .eq('host_id',host.id);

  return NextResponse.json({
    host:{
      ...hostProfile,
      display_name:hostProfile.display_name||host?.name,
      events_count:eventsCount??0,
      is_host:true,
    }
  });
}

// POST — upsert a guest_profiles row for the host using service role
// (bypasses RLS which blocks anon inserts). Called from bootstrapIdentity.
export async function POST(req:NextRequest){
  try{
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!rateLimit('host-profile:' + ip, 20, 60000)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    const{registration_id,event_id,display_name,role_title,organisation,bio,linkedin_url,website_url,portfolio_url}=await req.json();
    if(!registration_id||!event_id)return NextResponse.json({error:'Missing fields'},{status:400});

    // Check if already exists
    const{data:existing}=await supabase
      .from('guest_profiles')
      .select('*')
      .eq('registration_id',registration_id)
      .maybeSingle();

    if(existing)return NextResponse.json({profile:existing});

    const{data:profile,error}=await supabase
      .from('guest_profiles')
      .insert({
        registration_id,
        event_id,
        display_name:    display_name||'Host',
        role_title:      role_title||'Event Host',
        organisation:    organisation||'',
        bio:             bio||'',
        linkedin_url:    linkedin_url||null,
        website_url:     website_url||null,
        portfolio_url:   portfolio_url||null,
        role:            ORGANIZER_ROLE,
        networking_visible: true,
        aura_active:     false,
        show_linkedin:   true,
        show_website:    true,
        show_portfolio:  true,
      })
      .select()
      .single();

    if(error)return NextResponse.json({error:error.message},{status:500});
    return NextResponse.json({profile});
  }catch(err:any){
    return NextResponse.json({error:err.message},{status:500});
  }
}
