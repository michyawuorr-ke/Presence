import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { recordConnection } from "@/lib/recordConnection";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Stage B dual-write endpoint for card connections (/u/[slug]) — the one
// place in the app where the caller genuinely has a Supabase Auth session
// (hosts and anyone who's claimed an account log in via magic link), so
// this verifies that session directly instead of the guest access_token
// pattern used in connections/record.
export async function POST(req: NextRequest) {
  try {
    const { receiver_master_profile_id } = await req.json();
    if (!receiver_master_profile_id) {
      return NextResponse.json({ error: "Missing receiver_master_profile_id" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Missing session" }, { status: 401 });

    const { data: { user }, error: sessionError } = await supabase.auth.getUser(token);
    if (sessionError || !user?.email) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    const { data: viewerProfile } = await supabase
      .from("master_profiles")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();
    if (!viewerProfile) return NextResponse.json({ ok: true, skipped: "no_master_profile" });

    const result = await recordConnection({
      profileAId: viewerProfile.id,
      profileBId: receiver_master_profile_id,
      eventId: null,
      status: "connected",
      source: "card",
      requestedBy: viewerProfile.id,
    });

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("connections/card error:", e?.message);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
