import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  let body: any
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), { status: 200 })
  }

  const { TransAmount, MSISDN, TransID, BillRefNumber } = body

  if (!TransID) {
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), { status: 200 })
  }

  // Normalize phone — Safaricom sends 2547XXXXXXXX, we store 07XXXXXXXX or 2547XXXXXXXX
  const normalized = MSISDN?.replace(/^254/, "0")

  // Match by phone number on a pending registration
  const { data: reg } = await supabase
    .from("registrations")
    .select("id, status, amount_expected")
    .or(`guest_phone.eq.${MSISDN},guest_phone.eq.${normalized}`)
    .eq("status", "pending")
    .eq("paid", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (!reg) {
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), { status: 200 })
  }

  if (reg.status === "confirmed") {
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), { status: 200 })
  }

  if (Number(TransAmount) < Number(reg.amount_expected)) {
    await supabase
      .from("registrations")
      .update({ status: "underpaid", mpesa_receipt: TransID })
      .eq("id", reg.id)
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), { status: 200 })
  }

  await supabase
    .from("registrations")
    .update({
      status: "confirmed",
      paid: true,
      mpesa_receipt: TransID,
      paid_at: new Date().toISOString(),
    })
    .eq("id", reg.id)

  return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), { status: 200 })
})
