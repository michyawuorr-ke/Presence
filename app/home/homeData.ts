import { supabase } from "@/lib/supabase/client";

export interface MyEvent {
  id: string;
  title: string;
  venue: string;
  start_time: string;
  status: string;
  slug: string;
  banner_url: string | null;
  is_host: boolean;
  access_token: string | null;
}

export interface MyConnection {
  // Keyed by email — this is the "same person across events" identity,
  // since handshakes/guest_profiles have no direct link to master_profiles.
  email: string;
  display_name: string;
  organisation: string | null;
  events_met_at: { event_id: string; event_title: string }[];
}

/** Every event this person has touched — as a guest (via registrations
 * matched by email) or as a host (via the hosts table matched by email).
 * Both surface in the same list; is_host distinguishes them for display,
 * not for filtering — the whole point is one unified "My Events" view. */
/** Cheap standalone check for whether this email has a hosts row at all —
 * used to decide whether to show a host-dashboard entry point on /home,
 * without needing the full loadMyEvents fetch. */
export async function checkIsHost(email: string): Promise<boolean> {
  const { data } = await supabase.from("hosts").select("id").eq("email", email).maybeSingle();
  return !!data;
}

export async function loadMyEvents(email: string): Promise<MyEvent[]> {
  const [{ data: guestRegs }, { data: hostRow }] = await Promise.all([
    supabase
      .from("registrations")
      .select("event_id,access_token,events(id,title,venue,start_time,status,slug,banner_url)")
      .eq("guest_email", email)
      .neq("status", "host"),
    supabase.from("hosts").select("id").eq("email", email).maybeSingle(),
  ]);

  const guestEvents: MyEvent[] = (guestRegs || [])
    .filter((r: any) => r.events)
    .map((r: any) => ({
      id: r.events.id,
      title: r.events.title,
      venue: r.events.venue,
      start_time: r.events.start_time,
      status: r.events.status,
      slug: r.events.slug,
      banner_url: r.events.banner_url,
      is_host: false,
      access_token: r.access_token,
    }));

  let hostedEvents: MyEvent[] = [];
  if (hostRow?.id) {
    const { data: hosted } = await supabase
      .from("events")
      .select("id,title,venue,start_time,status,slug,banner_url")
      .eq("host_id", hostRow.id);
    hostedEvents = (hosted || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      venue: e.venue,
      start_time: e.start_time,
      status: e.status,
      slug: e.slug,
      banner_url: e.banner_url,
      is_host: true,
      access_token: null, // hosts use the dashboard, not a guest access link
    }));
  }

  // A person could theoretically be both a guest AND the host of the same
  // event in edge cases (testing, or hosting an event they also attended
  // as staff) — dedupe by event id, preferring the host record since it
  // carries more relevant context for someone who ran the event.
  const merged = new Map<string, MyEvent>();
  guestEvents.forEach(e => merged.set(e.id, e));
  hostedEvents.forEach(e => merged.set(e.id, e));

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );
}

/** Cross-event connections — the same person recognized across multiple
 * events, not just per-event handshakes. Joins handshakes → guest_profiles
 * → registrations (for email) since there's no direct FK from handshakes
 * to master_profiles. Grouped by email so "met at 2 events" is a real
 * count, not two separate unrelated connection rows. */
export async function loadMyConnections(email: string): Promise<MyConnection[]> {
  // Step 1: find every guest_profiles.id that belongs to THIS person
  // across all their registrations (by email) — a person has one
  // guest_profiles row per event they've attended.
  const { data: myRegs } = await supabase
    .from("registrations")
    .select("id")
    .eq("guest_email", email);
  const myRegIds = (myRegs || []).map((r: any) => r.id);
  if (myRegIds.length === 0) return [];

  const { data: myGuestProfiles } = await supabase
    .from("guest_profiles")
    .select("id,event_id")
    .in("registration_id", myRegIds);
  const myGuestProfileIds = (myGuestProfiles || []).map((g: any) => g.id);
  if (myGuestProfileIds.length === 0) return [];

  // Step 2: every handshake involving any of those guest_profiles rows —
  // this is every connection this person has made, across every event.
  const { data: handshakes } = await supabase
    .from("handshakes")
    .select("sender_id,receiver_id,event_id")
    .or(
      myGuestProfileIds.map(id => `sender_id.eq.${id}`).join(",") + "," +
      myGuestProfileIds.map(id => `receiver_id.eq.${id}`).join(",")
    );
  if (!handshakes || handshakes.length === 0) return [];

  const myIdSet = new Set(myGuestProfileIds);
  const otherPartyIds = new Set<string>();
  const eventByHandshake = new Map<string, string>(); // otherPartyId -> Set handled below
  const handshakesByOtherParty = new Map<string, string[]>(); // otherPartyId -> event_ids

  handshakes.forEach((h: any) => {
    const otherId = myIdSet.has(h.sender_id) ? h.receiver_id : h.sender_id;
    otherPartyIds.add(otherId);
    const list = handshakesByOtherParty.get(otherId) || [];
    list.push(h.event_id);
    handshakesByOtherParty.set(otherId, list);
  });

  // Step 3: resolve each connected guest_profiles.id back to a person —
  // via their registration's email — so two different guest_profiles rows
  // for the same person (met at two different events) collapse into one
  // MyConnection entry instead of two.
  const { data: theirGuestProfiles } = await supabase
    .from("guest_profiles")
    .select("id,display_name,organisation,registration_id")
    .in("id", Array.from(otherPartyIds));

  const theirRegIds = (theirGuestProfiles || []).map((g: any) => g.registration_id).filter(Boolean);
  const { data: theirRegs } = await supabase
    .from("registrations")
    .select("id,guest_email")
    .in("id", theirRegIds);
  const emailByRegId = new Map<string, string>(
    (theirRegs || []).map((r: any) => [r.id, (r.guest_email || "").toLowerCase()])
  );

  const { data: events } = await supabase.from("events").select("id,title");
  const titleByEventId = new Map<string, string>((events || []).map((e: any) => [e.id, e.title]));

  const byEmail = new Map<string, MyConnection>();
  (theirGuestProfiles || []).forEach((gp: any) => {
    const theirEmail = emailByRegId.get(gp.registration_id);
    if (!theirEmail || theirEmail === email) return; // skip self-matches
    const eventIds = handshakesByOtherParty.get(gp.id) || [];
    const existing = byEmail.get(theirEmail);
    const newMeetings = eventIds.map(eid => ({ event_id: eid, event_title: titleByEventId.get(eid) || "an event" }));
    if (existing) {
      existing.events_met_at.push(...newMeetings);
    } else {
      byEmail.set(theirEmail, {
        email: theirEmail,
        display_name: gp.display_name,
        organisation: gp.organisation,
        events_met_at: newMeetings,
      });
    }
  });

  return Array.from(byEmail.values()).sort(
    (a, b) => b.events_met_at.length - a.events_met_at.length
  );
}
