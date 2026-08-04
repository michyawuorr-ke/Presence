import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Full delete, per explicit decision: master_profiles row and the
// auth.users entry are both genuinely removed. Past connections
// (handshakes, profile_connections) are NOT deleted — they belong partly
// to the other person too. handshakes/guest_profiles have no direct FK to
// master_profiles (matched by email only) so they're untouched
// mechanically. profile_connections has ON DELETE SET NULL on both sides
// (fixed from CASCADE specifically for this) so the other party's record
// of the connection survives, just with this side nulled out.
export async function POST(req: NextRequest) {
  const { authUserId } = await req.json();
  if (!authUserId) {
    return NextResponse.json({ error: 'Missing authUserId' }, { status: 400 });
  }

  // Delete the master_profiles row first — if this fails, we haven't
  // touched the auth account yet, so nothing is left in a half-deleted state.
  const { error: profileError } = await supabase
    .from('master_profiles')
    .delete()
    .eq('auth_user_id', authUserId);

  if (profileError) {
    return NextResponse.json({ error: 'Failed to delete profile: ' + profileError.message }, { status: 500 });
  }

  // Then the actual auth account — only the service role can do this.
  const { error: authError } = await supabase.auth.admin.deleteUser(authUserId);

  if (authError) {
    // The profile is already gone at this point, but the login itself
    // still exists — surface this clearly rather than claim success.
    return NextResponse.json({ error: 'Profile deleted, but account removal failed: ' + authError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
