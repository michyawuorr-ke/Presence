import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rateLimit";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    // This route always emails the address already on file for the
    // registration, not one the caller supplies, so it can't leak a link
    // to a stranger — but with no limit, anyone with a registration_id and
    // event_id could bomb a guest's inbox by calling it on repeat.
    if (!rateLimit("access-link:" + ip, 5, 60000)) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }
    const { registration_id, event_id } = await req.json();
    if (!registration_id || !event_id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const [{ data: reg }, { data: event }] = await Promise.all([
      supabase.from("registrations").select("guest_email,guest_name,access_token,guest_access_link").eq("id", registration_id).single(),
      supabase.from("events").select("title,slug").eq("id", event_id).single(),
    ]);

    if (!reg?.guest_email) return NextResponse.json({ error: "No email on file" }, { status: 404 });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://oreeti.com";
    const accessLink = reg.guest_access_link || `${appUrl}/e/${event.slug}/g/${reg.access_token}`;
    const firstName = reg.guest_name?.split(" ")[0] || "there";

    const { error } = await resend.emails.send({
      from: "Oreeti <events@oreeti.com>",
      to: reg.guest_email,
      subject: `Your access link for ${event.title}`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#08080a;font-family:Inter,sans-serif;color:#f0ede8;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;padding:40px 24px;"><tr><td><p style="font-size:22px;font-weight:800;margin:0 0 4px;letter-spacing:-0.03em;"><span style="color:#FFFFFF;">Or</span><span style="color:#E26D34;">ee</span><span style="color:#FFFFFF;">ti</span></p><p style="font-size:11px;color:#555;margin:0 0 40px;letter-spacing:0.15em;text-transform:uppercase;">${event.title}</p><p style="font-size:22px;font-weight:600;color:#f0ede8;margin:0 0 12px;">Hey ${firstName}</p><p style="font-size:14px;color:rgba(240,237,232,0.55);line-height:1.6;margin:0 0 32px;">Here's your personal access link for <strong style="color:#f0ede8;">${event.title}</strong>. Bookmark it or save this email — no login needed.</p><a href="${accessLink}" style="display:block;text-align:center;padding:16px 24px;background:rgba(226,109,52,0.1);border:1px solid rgba(226,109,52,0.35);border-radius:12px;color:#E26D34;font-size:14px;font-weight:600;text-decoration:none;margin-bottom:16px;">Open My Event →</a><p style="font-size:11px;color:#333;text-align:center;margin:0 0 32px;word-break:break-all;">${accessLink}</p><p style="font-size:11px;color:#333;line-height:1.6;margin:0;">This link is personal to you — don't share it.</p></td></tr></table></body></html>`,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ sent: true, to: reg.guest_email });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
