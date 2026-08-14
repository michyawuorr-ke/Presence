import { supabase } from "@/lib/supabase/client";
import { HOST_REGISTRATION_STATUS } from "@/lib/hostRole";

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
  // Dedupe/React key. "event" connections key off the other person's
  // master_profile_id now (was email — see loadEventConnections); "card"
  // connections already used master_profile_id via profile_connections.
  // "shared" entries (anonymous scanners with no account) have neither,
  // so they key off the profile_contact_requests row id instead.
  id: string;
  // "event": met via a handshake at a live event — always mutual.
  // "card": both people are Oreeti users who connected via the universal
  //   identity card (/u/[slug]) — mutual, both see each other.
  // "shared": someone scanned your card and sent their name+phone back
  //   through the anonymous "Send Details Back" form, but has no Oreeti
  //   account — one-way until (if ever) they create one and connect for
  //   real, at which point that becomes a separate "card" entry.
  source: "event" | "card" | "shared";
  mutual: boolean;
  display_name: string;
  organisation: string | null;
  phone?: string | null;
  slug?: string | null;
  created_at?: string | null;
  events_met_at: { event_id: string; event_title: string }[];
}

/** Every event this person has touched — as a guest (via registrations
 * matched by email) or as a host (via the hosts table matched by email).
 * Both surface in the same list; is_host distinguishes them for display,
 * not for filtering — the whole point is one unified "My Events" view. */
/** Cheap standalone check for whether this email has a hosts row at all —
 * used to decide whether to show a host-dashboard entry point on /home,
 * without needing the full loadMyEvents fetch.
 *
 * This is a different question from isHostRegistration/isOrganizerProfile
 * in @/lib/hostRole (person-level, cross-event, vs. those two which are
 * per-event) — intentionally not folded into that file. See the comment
 * there for how all three relate. */
export async function checkIsHost(email: string): Promise<boolean> {
  const { data } = await supabase.from("hosts").select("id").eq("email", email).maybeSingle();
  return !!data;
}

/** Event ids this person has archived from their own /home view — doesn't
 * affect the event itself or anyone else's view of it. */
export async function loadArchivedEventIds(email: string): Promise<Set<string>> {
  const { data } = await supabase.from("home_archived_events").select("event_id").eq("email", email);
  return new Set((data || []).map((r: any) => r.event_id));
}

export async function archiveEvent(email: string, eventId: string): Promise<void> {
  await supabase.from("home_archived_events").insert({ email, event_id: eventId });
}

export async function unarchiveEvent(email: string, eventId: string): Promise<void> {
  await supabase.from("home_archived_events").delete().eq("email", email).eq("event_id", eventId);
}

/** Same pattern as the event-archive functions above, applied to the
 * Connects tab — per-viewer only, doesn't touch the underlying connection
 * data (handshakes/profile_connections/etc) at all. */
export async function loadArchivedConnectionIds(email: string): Promise<Set<string>> {
  const { data } = await supabase.from("home_archived_connections").select("connection_id").eq("email", email);
  return new Set((data || []).map((r: any) => r.connection_id));
}

export async function archiveConnection(email: string, connectionId: string): Promise<void> {
  await supabase.from("home_archived_connections").insert({ email, connection_id: connectionId });
}

export async function unarchiveConnection(email: string, connectionId: string): Promise<void> {
  await supabase.from("home_archived_connections").delete().eq("email", email).eq("connection_id", connectionId);
}

/** One-way — no unhide path is exposed in the UI for this one, unlike
 * archive. The underlying connection data is untouched either way; this
 * only ever affects what shows in this one person's own list. */
export async function loadDeletedConnectionIds(email: string): Promise<Set<string>> {
  const { data } = await supabase.from("home_deleted_connections").select("connection_id").eq("email", email);
  return new Set((data || []).map((r: any) => r.connection_id));
}

export async function deleteConnection(email: string, connectionId: string): Promise<void> {
  await supabase.from("home_deleted_connections").insert({ email, connection_id: connectionId });
}

export async function loadMyEvents(email: string): Promise<MyEvent[]> {
  const [{ data: guestRegs }, { data: hostRow }] = await Promise.all([
    supabase
      .from("registrations")
      .select("event_id,access_token,events(id,title,venue,start_time,status,slug,banner_url)")
      .eq("guest_email", email)
      .neq("status", HOST_REGISTRATION_STATUS),
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
 * count, not two separate unrelated connection rows.
 *
 * Also merges in the two universal-identity-card sources, which are
 * intentionally NOT deduped against the event-based ones (or each other) —
 * doing that well would mean matching across email/phone/name heuristically,
 * which risks silently merging two different people. Someone you know from
 * both an event and a card scan may appear twice; that's the safer failure
 * mode. */
export async function loadMyConnections(email: string): Promise<MyConnection[]> {
  const { data: myProfile } = await supabase
    .from("master_profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!myProfile?.id) return [];

  const [eventConnections, cardConnections, sharedWithMe] = await Promise.all([
    loadEventConnections(myProfile.id),
    loadCardConnections(myProfile.id),
    loadSharedWithMe(myProfile.id),
  ]);

  return [...sharedWithMe, ...cardConnections, ...eventConnections];
}

async function loadEventConnections(myMasterProfileId: string): Promise<MyConnection[]> {
  // Step 1: every guest_profiles.id that belongs to this person across all
  // their registrations — linked directly via master_profile_id now,
  // instead of joining through registrations.guest_email.
  const { data: myGuestProfiles } = await supabase
    .from("guest_profiles")
    .select("id")
    .eq("master_profile_id", myMasterProfileId);
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
  const handshakesByOtherParty = new Map<string, string[]>(); // otherPartyId -> event_ids

  handshakes.forEach((h: any) => {
    const otherId = myIdSet.has(h.sender_id) ? h.receiver_id : h.sender_id;
    otherPartyIds.add(otherId);
    const list = handshakesByOtherParty.get(otherId) || [];
    list.push(h.event_id);
    handshakesByOtherParty.set(otherId, list);
  });

  // Step 3: resolve each connected guest_profiles.id back to a person via
  // master_profile_id directly — two guest_profiles rows for the same
  // person (met at two different events) now collapse into one
  // MyConnection entry via that shared id, with no email round-trip and
  // no risk of a case/typo mismatch silently splitting them into two.
  // Guests who never created an Oreeti account (master_profile_id still
  // null) can't be identified across events and are skipped here — the
  // same limitation the email version had, just no longer silent about it.
  const { data: theirGuestProfiles } = await supabase
    .from("guest_profiles")
    .select("id,display_name,organisation,master_profile_id")
    .in("id", Array.from(otherPartyIds));

  const { data: events } = await supabase.from("events").select("id,title");
  const titleByEventId = new Map<string, string>((events || []).map((e: any) => [e.id, e.title]));

  const byMasterProfile = new Map<string, MyConnection>();
  (theirGuestProfiles || []).forEach((gp: any) => {
    if (!gp.master_profile_id || gp.master_profile_id === myMasterProfileId) return; // unlinked or self
    const eventIds = handshakesByOtherParty.get(gp.id) || [];
    const existing = byMasterProfile.get(gp.master_profile_id);
    const newMeetings = eventIds.map(eid => ({ event_id: eid, event_title: titleByEventId.get(eid) || "an event" }));
    if (existing) {
      existing.events_met_at.push(...newMeetings);
    } else {
      byMasterProfile.set(gp.master_profile_id, {
        id: gp.master_profile_id,
        source: "event",
        mutual: true,
        display_name: gp.display_name,
        organisation: gp.organisation,
        events_met_at: newMeetings,
      });
    }
  });

  return Array.from(byMasterProfile.values()).sort(
    (a, b) => b.events_met_at.length - a.events_met_at.length
  );
}

/** Mutual connections made via the universal identity card (/u/[slug]) —
 * both people are Oreeti users, so both sides of this same insert show up
 * in each person's Connects list. */
async function loadCardConnections(myMasterProfileId: string): Promise<MyConnection[]> {
  const { data: rows } = await supabase
    .from("profile_connections")
    .select("sender_id,receiver_id,created_at")
    .or(`sender_id.eq.${myMasterProfileId},receiver_id.eq.${myMasterProfileId}`);
  if (!rows || rows.length === 0) return [];

  const otherIds = Array.from(new Set(
    rows.map((r: any) => (r.sender_id === myMasterProfileId ? r.receiver_id : r.sender_id))
  ));
  const { data: profiles } = await supabase
    .from("master_profiles")
    .select("id,display_name,organisation,email,slug")
    .in("id", otherIds);

  const createdAtByOtherId = new Map<string, string>();
  rows.forEach((r: any) => {
    const otherId = r.sender_id === myMasterProfileId ? r.receiver_id : r.sender_id;
    createdAtByOtherId.set(otherId, r.created_at);
  });

  return (profiles || []).map((p: any) => ({
    id: p.email || p.id,
    source: "card" as const,
    mutual: true,
    display_name: p.display_name,
    organisation: p.organisation,
    slug: p.slug,
    created_at: createdAtByOtherId.get(p.id) || null,
    events_met_at: [],
  }));
}

/** One-way: an anonymous scanner sent their name + phone back through the
 * public card's "Send Details Back" form. They have no account, so there's
 * nothing on their side to reciprocate yet. */
async function loadSharedWithMe(myMasterProfileId: string): Promise<MyConnection[]> {
  const { data: rows } = await supabase
    .from("profile_contact_requests")
    .select("id,name,phone,created_at")
    .eq("master_profile_id", myMasterProfileId)
    .order("created_at", { ascending: false });
  if (!rows) return [];

  return rows.map((r: any) => ({
    id: r.id,
    source: "shared" as const,
    mutual: false,
    display_name: r.name,
    organisation: null,
    phone: r.phone,
    created_at: r.created_at,
    events_met_at: [],
  }));
}
