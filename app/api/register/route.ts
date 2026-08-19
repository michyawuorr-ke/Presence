import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rateLimit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generatePaymentRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const short = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map(b => chars[b % chars.length]).join("");
  return `955154-${short}`;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    if (!rateLimit("register:ip:" + ip, 5, 600000)) {
      return NextResponse.json({ error: "Too many registrations. Please try again later." }, { status: 429 });
    }

    const { name, email, phone, event_id, ticket_type_id, role, quantity } = await req.json();

    if (!name?.trim() || !email?.trim() || !event_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (!rateLimit("register:email:" + email.toLowerCase(), 2, 3600000)) {
      return NextResponse.json({ error: "This email has been used too many times recently." }, { status: 429 });
    }

    const { data: event } = await supabase
      .from("events")
      .select("id, slug, status, host_id")
      .eq("id", event_id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    let ticketPrice = 0;
    if (ticket_type_id) {
      const { data: ticket } = await supabase
        .from("ticket_types")
        .select("id, price, is_active")
        .eq("id", ticket_type_id)
        .eq("event_id", event_id)
        .eq("is_active", true)
        .single();

      if (!ticket) {
        return NextResponse.json({ error: "Invalid ticket type" }, { status: 400 });
      }
      ticketPrice = Number(ticket.price ?? 0);
    }

    const qty = Math.max(1, Math.min(10, Number(quantity) || 1));
    const totalAmount = ticketPrice * qty;
    const isFree = totalAmount <= 0;

    const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, "0")).join("");
    const accessToken = Date.now().toString(16) + "-" + randomBytes;
    const guestUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://oreeti.com"}/e/${event.slug}/g/${accessToken}`;

    const paymentRef = isFree ? null : generatePaymentRef();

    const { data: reg, error: regError } = await supabase
      .from("registrations")
      .insert({
        event_id,
        ticket_type_id: ticket_type_id || null,
        guest_name: name.trim(),
        guest_email: email.trim().toLowerCase(),
        guest_phone: phone?.trim() || null,
        role: role || "attendee",
        status: isFree ? "confirmed" : "pending",
        amount: totalAmount,
        amount_expected: totalAmount,
        paid: isFree,
        access_token: accessToken,
        guest_access_link: guestUrl,
        payment_ref: paymentRef,
      })
      .select("id")
      .single();

    if (regError) {
      console.error("Registration insert error:", regError);
      return NextResponse.json({ error: "Registration failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      registration_id: reg.id,
      access_token: accessToken,
      guest_url: guestUrl,
      is_free: isFree,
      total_amount: totalAmount,
      payment_ref: paymentRef,
    });

  } catch (err) {
    console.error("Register route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
