import{createClient}from'@supabase/supabase-js';
import{NextRequest,NextResponse}from'next/server';
const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
export async function POST(req:NextRequest){
  try{
    const{scanner_registration_id,target_registration_id}=await req.json();
    if(!scanner_registration_id||!target_registration_id)return NextResponse.json({error:'Missing fields'},{status:400});
    const{data:sp}=await supabase.from('guest_profiles').select('id').eq('registration_id',scanner_registration_id).single();
    const{data:tp}=await supabase.from('guest_profiles').select('id').eq('registration_id',target_registration_id).single();
    if(!sp||!tp)return NextResponse.json({error:'Profile not found'},{status:404});
    const{data:handshake}=await supabase.from('handshakes').select('id').or(`and(guest_a_id.eq.${sp.id},guest_b_id.eq.${tp.id}),and(guest_a_id.eq.${tp.id},guest_b_id.eq.${sp.id})`).single();
    if(!handshake)return NextResponse.json({error:'No connection found'},{status:404});
    await supabase.from('handshakes').update({networking_status:'unlocked'}).eq('id',handshake.id);
    await supabase.from('profile_unlocks').insert({handshake_id:handshake.id,unlocker_id:sp.id,unlocked_id:tp.id});
    return NextResponse.json({success:true});
  }catch(err){
    return NextResponse.json({error:'Server error'},{status:500});
  }
}
