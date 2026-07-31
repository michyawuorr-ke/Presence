import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { guest_profile_id, display_name, role_title, organisation, bio, linkedin_url, website_url, portfolio_url, phone_number } = await req.json();
    if (!guest_profile_id) return NextResponse.json({ error: 'Missing guest_profile_id' }, { status: 400 });

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
