import{NextRequest,NextResponse}from'next/server';
import{createClient}from'@supabase/supabase-js';

const supabase=createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req:NextRequest){
  const eventId=req.nextUrl.searchParams.get('event_id');
  if(!eventId)return NextResponse.json({error:'Missing event_id'},{status:400});

  // Get event host
  const{data:event}=await supabase
    .from('events')
    .select('host_id,status')
    .eq('id',eventId)
    .single();

  if(!event||event.status==='ended'){
    return NextResponse.json({host:null});
  }

  // Get host info first
  const{data:host}=await supabase
    .from('hosts')
    .select('id,name,email')
    .eq('id',event.host_id)
    .single();

  if(!host)return NextResponse.json({host:null});

  // Get host profile using hosts.id
  const{data:hostProfile}=await supabase
    .from('host_profiles')
    .select('*')
    .eq('host_id',host.id)
    .eq('show_in_events',true)
    .single();

  if(!hostProfile)return NextResponse.json({host:null});

  return NextResponse.json({
    host:{
      ...hostProfile,
      display_name:hostProfile.display_name||host?.name,
      is_host:true,
    }
  });
}
