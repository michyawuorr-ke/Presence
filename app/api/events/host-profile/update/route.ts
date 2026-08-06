import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { guest_profile_id, access_token, display_name, role_title, organisation, bio, linkedin_url, website_url, portfolio_url, phone_number } = await req.json();
    if (!guest_profile_id) return NextResponse.json({ error: 'Missing guest_profile_id' }, { status: 400 });
    if (!access_token) return NextResponse.json({ error: 'Missing access_token' }, { status: 400 });

    // Guests here aren't logged in via Supabase Auth — their guest link's
    // access_token IS their credential. Without checking it, anyone who
    // learns a guest_profile_id (e.g. from a network tab) could overwrite
    // any other guest's or host's networking profile.
    const { data: linkedReg } = await supabase
      .from('guest_profiles')
      .select('registration_id')
      .eq('id', guest_profile_id)
      .single();
    if (!linkedReg) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const { data: reg } = await supabase
      .from('registrations')
      .select('access_token')
      .eq('id', linkedReg.registration_id)
      .single();
    if (!reg || reg.access_token !== access_token) {
      return NextResponse.json({ error: 'Not authorized to edit this profile' }, { status: 401 });
    }

    const { data: profiles, error } = await supabase
      .from('guest_profiles')
      .update({ display_name, role_title, organisation, bio, linkedin_url, website_url, portfolio_url, phone_number })
      .eq('id', guest_profile_id)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!profiles || profiles.length === 0) return NextResponse.json({ error: 'Profile not found — check guest_profile_id' }, { status: 404 });
    return NextResponse.json({ profile: profiles[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
