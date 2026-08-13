// Client-side helper for the six places that send a handshake_requests
// insert directly (PreEventDiscovery, MatchRecommendations, ForYouTab,
// NetworkingTab, MissedConnections, ConnectionsTab) and the one place that
// approves/declines one (ConnectionsTab). Fire-and-forget: Stage B (see
// docs/architecture/01-person-model.md) is a shadow-write, so a failure
// here must never surface to the guest or block anything — the insert
// into handshake_requests/handshakes that already succeeded is what's
// authoritative during this stage.
export function dualWriteConnectionRequest(params: {
  accessToken: string | null | undefined;
  requesterGuestProfileId: string;
  recipientGuestProfileId: string;
  eventId: string;
  status: "requested" | "connected" | "declined";
}) {
  if (!params.accessToken) return;
  fetch("/api/connections/record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token: params.accessToken,
      requester_guest_profile_id: params.requesterGuestProfileId,
      recipient_guest_profile_id: params.recipientGuestProfileId,
      event_id: params.eventId,
      status: params.status,
    }),
  }).catch(() => {});
}
