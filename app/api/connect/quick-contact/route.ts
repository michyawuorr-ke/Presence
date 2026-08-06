import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from '@/lib/rateLimit';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Anonymous scanners have no session, so this always writes via the
// service role rather than relying on the anon RLS insert policy —
// consistent with how /api/events/host-profile/update handles writes
// from people who aren't authenticated master_profiles users.
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!rateLimit('quick-contact:' + ip, 10, 60000)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    const { master_profile_id, name, phone } = await req.json();

    const cleanName = typeof name === "string" ? name.trim().slice(0, 120) : "";
    const cleanPhone = typeof phone === "string" ? phone.trim().slice(0, 40) : "";

    if (!master_profile_id) return NextResponse.json({ error: "Missing master_profile_id" }, { status: 400 });
    if (!cleanName) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!cleanPhone) return NextResponse.json({ error: "Phone number is required" }, { status: 400 });

    const { data: owner } = await supabase
      .from("master_profiles")
      .select("id")
      .eq("id", master_profile_id)
      .maybeSingle();

    if (!owner) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const { error } = await supabase
      .from("profile_contact_requests")
      .insert({ master_profile_id, name: cleanName, phone: cleanPhone });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
