import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { recordConnection } from "@/lib/recordConnection";
import { rateLimit } from "@/lib/rateLimit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Stage B dual-write endpoint for event-scoped connections (requests and
// their approve/decline). Guests never hold a Supabase Auth session, so
// this uses the same access_token-ownership check as qr/generate and
// host-profile/update — the caller proves they ARE the requester's
// registration, not just that they know its id.
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!rateLimit("connections-record:" + ip, 30, 60000)) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const { access_token, requester_guest_profile_id, recipient_guest_profile_id, event_id, status, requested_by } = await req.json();
    if (!access_token || !requester_guest_profile_id || !recipient_guest_profile_id || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data: linkedReg } = await supabase
      .from("guest_profiles")
      .select("registration_id,master_profile_id")
      .eq("id", requester_guest_profile_id)
      .single();
    if (!linkedReg) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const { data: reg } = await supabase
      .from("registrations")
      .select("access_token")
      .eq("id", linkedReg.registration_id)
      .single();
    if (!reg || reg.access_token !== access_token) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const { data: recipientProfile } = await supabase
      .from("guest_profiles")
      .select("master_profile_id")
      .eq("id", recipient_guest_profile_id)
      .single();

    // Older guest_profiles rows created before Stage 1 (or never
    // backfilled) may still have no master_profile_id — nothing to record
    // yet in that case. Not an error; the old tables still have the real
    // data for this pair, this is only a shadow-write.
    if (!linkedReg.master_profile_id || !recipientProfile?.master_profile_id) {
      return NextResponse.json({ ok: true, skipped: "unlinked_profile" });
    }

    const result = await recordConnection({
      profileAId: linkedReg.master_profile_id,
      profileBId: recipientProfile.master_profile_id,
      eventId: event_id ?? null,
      status,
      source: "request",
      requestedBy: requested_by ?? linkedReg.master_profile_id,
    });

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("connections/record error:", e?.message);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
