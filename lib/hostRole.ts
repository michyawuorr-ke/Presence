// "Is this person the host" is checked in three different places in this
// codebase, at three genuinely different scopes:
//
//   1. registrations.status === 'host'   — within ONE event, is this
//      specific ticket the host's own attendance record?
//   2. guest_profiles.role === 'organizer' — within ONE event, does this
//      person's networking profile carry the organizer badge?
//   3. a row in the `hosts` table (see checkIsHost in app/home/homeData.ts)
//      — cross-event, can this person create/manage events at all?
//
// #3 is a different table and a genuinely different question (person-level,
// not per-event), so it isn't folded in here. #1 and #2 SHOULD always agree
// for the same person's rows within the same event — go-live's insert sets
// both together, so they can't drift there, but they were being re-checked
// as raw string literals ('host', 'organizer') in half a dozen places with
// no shared definition. This file is that shared definition, so a future
// typo or a status/role set in only one of the two places is easier to
// catch instead of silently drifting.

export const HOST_REGISTRATION_STATUS = "host" as const;
export const ORGANIZER_ROLE = "organizer" as const;

export function isHostRegistration(registration: { status?: string | null } | null | undefined): boolean {
  return registration?.status === HOST_REGISTRATION_STATUS;
}

export function isOrganizerProfile(guestProfile: { role?: string | null } | null | undefined): boolean {
  return guestProfile?.role === ORGANIZER_ROLE;
}
