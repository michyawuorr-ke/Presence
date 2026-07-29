import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

// ─── Query Keys ──────────────────────────────────────────────────────────────
// Centralised key factory prevents typos and makes cache invalidation precise.
export const keys = {
  profile:        (profileId: string) => ["guest_profile", profileId] as const,
  connections:    (profileId: string) => ["connections", profileId] as const,
  pendingCount:   (profileId: string, eventId: string) => ["pending_count", profileId, eventId] as const,
  pendingRequests:(profileId: string, eventId: string) => ["pending_requests", profileId, eventId] as const,
  attendees:      (eventId: string) => ["attendees", eventId] as const,
  stations:       (eventId: string) => ["stations", eventId] as const,
  hostNode:       (eventId: string) => ["host_node", eventId] as const,
  savedNotes:     (profileId: string) => ["saved_notes", profileId] as const,
  incomingSignals:(profileId: string, eventId: string) => ["incoming_signals", profileId, eventId] as const,
  introductions:  (profileId: string, eventId: string) => ["introductions", profileId, eventId] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

/** Current guest's own profile — used in ProfileTab and as identity across tabs */
export function useGuestProfile(profileId: string | undefined) {
  return useQuery({
    queryKey: keys.profile(profileId ?? ""),
    enabled: !!profileId,
    staleTime: 60_000, // Profile rarely changes mid-event
    queryFn: async () => {
      const { data } = await supabase
        .from("guest_profiles")
        .select("*")
        .eq("id", profileId!)
        .single();
      return data;
    },
  });
}

/** All connections (handshakes) for a profile — used in ProfileTab */
export function useConnections(profileId: string | undefined) {
  return useQuery({
    queryKey: keys.connections(profileId ?? ""),
    enabled: !!profileId,
    staleTime: 15_000,
    queryFn: async () => {
      const { data: handshakes } = await supabase
        .from("handshakes")
        .select("id,sender_id,receiver_id,status")
        .or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`);

      if (!handshakes?.length) return [];

      const connectedIds = handshakes.map((h: any) =>
        h.sender_id === profileId ? h.receiver_id : h.sender_id
      );

      const [{ data: profiles }, { data: unlocks }] = await Promise.all([
        supabase.from("guest_profiles").select("*").in("id", connectedIds),
        // Load profile_unlocks for THIS profile — both directions.
        // A connection is only "unlocked" if an actual QR scan happened.
        supabase.from("profile_unlocks")
          .select("unlocker_id,unlocked_id")
          .or(`unlocker_id.eq.${profileId},unlocked_id.eq.${profileId}`),
      ]);

      // Build a set of profile ids where a scan has occurred in either direction
      const scannedSet = new Set<string>();
      (unlocks || []).forEach((u: any) => {
        if (u.unlocker_id === profileId) scannedSet.add(u.unlocked_id);
        if (u.unlocked_id === profileId) scannedSet.add(u.unlocker_id);
      });

      const mapped = (profiles || []).map((p: any) => {
        const hs = handshakes.find(
          (h: any) => h.sender_id === p.id || h.receiver_id === p.id
        );
        return {
          ...p,
          handshakeId: hs?.id,
          // Only true after an actual QR scan — not just from connecting
          qrUnlocked: scannedSet.has(p.id),
        };
      });
      // Host/organizer always first, then everyone else in order received
      return mapped.sort((a: any, b: any) => {
        if (a.role === "organizer") return -1;
        if (b.role === "organizer") return 1;
        return 0;
      });
    },
  });
}

/** Count of pending handshake requests — drives nav badge */
export function usePendingCount(profileId: string | undefined, eventId: string | undefined) {
  return useQuery({
    queryKey: keys.pendingCount(profileId ?? "", eventId ?? ""),
    enabled: !!profileId && !!eventId,
    staleTime: 10_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("handshake_requests")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", profileId!)
        .eq("event_id", eventId!)
        .eq("status", "pending")
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
      return count ?? 0;
    },
  });
}

/** Pending requests with requester details — used in ProfileTab */
export function usePendingRequests(profileId: string | undefined, eventId: string | undefined) {
  return useQuery({
    queryKey: keys.pendingRequests(profileId ?? "", eventId ?? ""),
    enabled: !!profileId && !!eventId,
    staleTime: 10_000,
    queryFn: async () => {
      const { data: reqs } = await supabase
        .from("handshake_requests")
        .select("id,requester_id,reason")
        .eq("recipient_id", profileId!)
        .eq("event_id", eventId!)
        .eq("status", "pending")
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      if (!reqs?.length) return [];

      const { data: requesters } = await supabase
        .from("guest_profiles")
        .select("id,display_name,role_title,networking_intents")
        .in("id", reqs.map((r: any) => r.requester_id));

      return reqs.map((r: any) => {
        const requester = (requesters || []).find((p: any) => p.id === r.requester_id);
        return requester
          ? { requestId: r.id, reason: r.reason, ...requester }
          : { requestId: r.id };
      }).filter((r: any) => r.id && r.display_name);
    },
  });
}

/** Attendees for an event — used in PreEventDiscovery */
export function useEventAttendees(eventId: string | undefined, currentProfileId: string | undefined) {
  return useQuery({
    queryKey: keys.attendees(eventId ?? ""),
    enabled: !!eventId && !!currentProfileId,
    staleTime: 20_000,
    queryFn: async () => {
      // Join roles so AttendeeCard gets badge + label without hardcoding
      const { data } = await supabase
        .from("guest_profiles")
        .select("id,display_name,role_title,organisation,networking_intents,target_station_id,role,roles(badge,label)")
        .eq("event_id", eventId!)
        .eq("networking_visible", true)
        .neq("id", currentProfileId!);
      return (data || []).map((r: any) => ({
        ...r,
        role_badge: r.roles?.badge ?? "👤",
        role_label: r.roles?.label ?? r.role,
      }));
    },
  });
}

/** Event stations — used in PreEventDiscovery, ProfileTab (signal meetup), onboarding */
export function useEventStations(eventId: string | undefined) {
  return useQuery({
    queryKey: keys.stations(eventId ?? ""),
    enabled: !!eventId,
    staleTime: 5 * 60_000, // Stations rarely change during an event
    queryFn: async () => {
      const { data } = await supabase
        .from("event_stations")
        .select("id,name,subtitle")
        .eq("event_id", eventId!);
      return data || [];
    },
  });
}

/** Host node for an event — used in NetworkingTab and PreEventDiscovery */
export function useHostNode(eventId: string | undefined, isHost: boolean) {
  return useQuery({
    queryKey: keys.hostNode(eventId ?? ""),
    enabled: !!eventId && !isHost,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const res = await fetch("/api/events/host-profile?event_id=" + eventId);
      const data = await res.json();
      return data.host ?? null;
    },
  });
}

/** Private memory notes — used in ProfileTab */
export function useSavedNotes(profileId: string | undefined) {
  return useQuery({
    queryKey: keys.savedNotes(profileId ?? ""),
    enabled: !!profileId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("connection_notes")
        .select("about_id,note")
        .eq("author_id", profileId!);
      const map: Record<string, string> = {};
      (data || []).forEach((n: any) => { if (n.note) map[n.about_id] = n.note; });
      return map;
    },
  });
}

/** Incoming meetup signals — used in ProfileTab */
export function useIncomingSignals(profileId: string | undefined, eventId: string | undefined) {
  return useQuery({
    queryKey: keys.incomingSignals(profileId ?? "", eventId ?? ""),
    enabled: !!profileId && !!eventId,
    staleTime: 10_000,
    queryFn: async () => {
      const { data: signals } = await supabase
        .from("meetup_signals")
        .select("id,sender_id,station_id,custom_location,status")
        .eq("recipient_id", profileId!)
        .eq("event_id", eventId!)
        .eq("status", "pending");

      if (!signals?.length) return [];

      const senderIds = signals.map((s: any) => s.sender_id);
      const stationIds = signals.map((s: any) => s.station_id).filter(Boolean);

      const [{ data: senders }, { data: stations }] = await Promise.all([
        supabase.from("guest_profiles").select("id,display_name").in("id", senderIds),
        stationIds.length > 0
          ? supabase.from("event_stations").select("id,name").in("id", stationIds)
          : Promise.resolve({ data: [] }),
      ]);

      return signals.map((s: any) => ({
        ...s,
        senderName: (senders || []).find((p: any) => p.id === s.sender_id)?.display_name || "Someone",
        locationLabel:
          s.custom_location ||
          (stations || []).find((st: any) => st.id === s.station_id)?.name ||
          "a meetup spot",
      }));
    },
  });
}

// ─── Invalidation helpers ─────────────────────────────────────────────────────
// Call these after mutations so the cache stays in sync without a full page reload.

/** Host introductions pending for this guest — used in ConnectionsTab */
export function useIntroductions(profileId: string | undefined, eventId: string | undefined) {
  return useQuery({
    queryKey: keys.introductions(profileId ?? "", eventId ?? ""),
    enabled: !!profileId && !!eventId,
    staleTime: 10_000,
    queryFn: async () => {
      // Fetch introductions where this guest is either party
      const { data: intros } = await supabase
        .from("host_introductions")
        .select("id,guest_a_id,guest_b_id,note,status_a,status_b,created_at")
        .eq("event_id", eventId!)
        .or(`guest_a_id.eq.${profileId},guest_b_id.eq.${profileId}`);

      if (!intros?.length) return [];

      // Filter to only introductions where THIS guest's status is still pending
      const myPending = intros.filter((i: any) => {
        const isA = i.guest_a_id === profileId;
        return isA ? i.status_a === "pending" : i.status_b === "pending";
      });

      // For each introduction, fetch the OTHER person's profile (Level 1 reveal)
      const otherIds = myPending.map((i: any) =>
        i.guest_a_id === profileId ? i.guest_b_id : i.guest_a_id
      );

      const { data: others } = await supabase
        .from("guest_profiles")
        .select("id,display_name,industry,networking_intents,role")
        .in("id", otherIds);

      return myPending.map((i: any) => {
        const isA      = i.guest_a_id === profileId;
        const otherId  = isA ? i.guest_b_id : i.guest_a_id;
        const myStatus = isA ? i.status_a  : i.status_b;
        const other    = (others || []).find((p: any) => p.id === otherId);
        return { id: i.id, isA, myStatus, other, note: i.note };
      }).filter((i: any) => i.other && i.myStatus === "pending");
    },
  });
}

export function useInvalidators(profileId: string, eventId: string) {
  const qc = useQueryClient();
  return {
    invalidateConnections:  () => qc.invalidateQueries({ queryKey: keys.connections(profileId) }),
    invalidatePending:      () => {
      qc.invalidateQueries({ queryKey: keys.pendingCount(profileId, eventId) });
      qc.invalidateQueries({ queryKey: keys.pendingRequests(profileId, eventId) });
    },
    invalidateAttendees:    () => qc.invalidateQueries({ queryKey: keys.attendees(eventId) }),
    invalidateSignals:      () => qc.invalidateQueries({ queryKey: keys.incomingSignals(profileId, eventId) }),
    invalidateNotes:        () => qc.invalidateQueries({ queryKey: keys.savedNotes(profileId) }),
    invalidateIntroductions:() => qc.invalidateQueries({ queryKey: keys.introductions(profileId, eventId) }),
  };
}
