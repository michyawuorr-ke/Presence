import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rateLimit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generatePaymentRef(name: string): string {
  const first = name.trim().split(" ")[0].toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  return `955154${first}`;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    if (!(await rateLimit("register:ip:" + ip, 5, 600000))) {
      return NextResponse.json({ error: "Too many registrations. Please try again later." }, { status: 429 });
    }

    const { name, email, phone, event_id, ticket_type_id, role, quantity } = await req.json();

    if (!name?.trim() || !email?.trim() || !event_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (!(await rateLimit("register:email:" + email.toLowerCase(), 2, 3600000))) {
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

    const cleanEmail = email.trim().toLowerCase();

    // Someone re-registering (double-tap, retry after a dropped
    // connection, or navigating back and submitting again) should land
    // back on their existing registration, not get a second one with a
    // different access link.
    const { data: existingReg } = await supabase
      .from("registrations")
      .select("id, access_token, guest_access_link, status, paid, amount")
      .eq("event_id", event_id)
      .eq("guest_email", cleanEmail)
      .maybeSingle();

    if (existingReg) {
      return NextResponse.json({
        success: true,
        registration_id: existingReg.id,
        access_token: existingReg.access_token,
        guest_url: existingReg.guest_access_link,
        is_free: !existingReg.amount || existingReg.amount <= 0,
        total_amount: existingReg.amount,
        already_registered: true,
      });
    }

    const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, "0")).join("");
    const accessToken = Date.now().toString(16) + "-" + randomBytes;
    const guestUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://oreeti.com"}/e/${event.slug}/g/${accessToken}`;

    const paymentRef = isFree ? null : generatePaymentRef(name);

    const { data: reg, error: regError } = await supabase
      .from("registrations")
      .insert({
        event_id,
        ticket_type_id: ticket_type_id || null,
        guest_name: name.trim(),
        guest_email: cleanEmail,
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
      // Unique violation = two requests raced past the check above at
      // the exact same moment. Rare, but real at event-scale on shared
      // wifi. Fetch and return the row that won instead of failing.
      if (regError.code === "23505") {
        const { data: winner } = await supabase
          .from("registrations")
          .select("id, access_token, guest_access_link, amount")
          .eq("event_id", event_id)
          .eq("guest_email", cleanEmail)
          .maybeSingle();
        if (winner) {
          return NextResponse.json({
            success: true,
            registration_id: winner.id,
            access_token: winner.access_token,
            guest_url: winner.guest_access_link,
            is_free: !winner.amount || winner.amount <= 0,
            total_amount: winner.amount,
            already_registered: true,
          });
        }
      }
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
