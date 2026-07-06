# Entry System Refactor
Status: In Progress

---

## Goal

Turn Guest Entry into a production-grade architecture capable of serving millions of users while keeping the existing UI completely unchanged.

This is an architectural refactor only.

The user experience must remain identical.

---

# Current Architecture

GuestEntryPage

├── loadEntry() ✅ extracted
├── bootstrapHostProfile() ✅ extracted
├── handleFinalSubmission() ❌ still inside page
├── helper functions ❌ still inside page
├── onboarding UI
└── SceneView

The page currently still contains business logic that should eventually live inside the feature layer.

---

# Phase 1 — Bootstrap Identity

Status:
In Progress

Goal:

A host should never see onboarding.

If a host enters their own event:

Host Profile
↓

Guest Profile (event scoped)
↓

Scene

without showing onboarding.

Guests who already have an Oreeti profile should also bypass onboarding.

Instead, Oreeti creates an event-specific guest profile automatically from the master profile.

Only new users should complete onboarding.

---

Checklist

- [ ] Host bootstrap complete
- [ ] Existing guest bootstrap complete
- [ ] Brand new guest onboarding
- [ ] Event-specific guest profile creation
- [ ] Duplicate prevention
- [ ] Bootstrap idempotent

---

# Phase 2 — Extract Submission Logic

Move

handleFinalSubmission()

into

features/entry/

Responsibilities

- validation
- guest profile creation
- event profile creation
- networking setup
- station assignment
- scene transition

GuestEntryPage should only call

submitGuestEntry()

---

Checklist

- [ ] submitGuestEntry()
- [ ] remove database writes from page
- [ ] remove Supabase logic from UI

---

# Phase 3 — Extract Helper Functions

Current helpers

- getPresenceLabel()
- getIntentLabel()
- toggleIntent()
- validation helpers

Move into

features/entry/helpers.ts

GuestEntryPage becomes presentation only.

---

Checklist

- [ ] helper extraction
- [ ] validation extraction
- [ ] remove duplicated logic

---

# Phase 4 — Scene Isolation

SceneView currently owns presentation plus business logic.

Separate into

SceneView

↓

SceneController

↓

Networking Engine

↓

Realtime Engine

↓

Presence Engine

---

Checklist

- [ ] isolate SceneView
- [ ] isolate realtime subscriptions
- [ ] isolate networking actions

---

# Phase 5 — Production Hardening

Before Entry System is considered complete:

- [ ] loading states
- [ ] retry logic
- [ ] optimistic updates
- [ ] duplicate protection
- [ ] idempotent submissions
- [ ] race-condition protection
- [ ] offline recovery
- [ ] analytics hooks
- [ ] error boundaries

---

# Final Architecture

GuestEntryPage (UI only)

│

├── loadEntry()
├── bootstrapIdentity()
├── submitGuestEntry()
├── entryHelpers()
└── SceneView()

Every database operation lives inside features/.

The page becomes almost entirely presentation.

---

# Completion Criteria

The Entry System is complete when:

- UI contains almost no business logic.
- UI performs no database operations.
- Identity bootstrap is automatic.
- Hosts bypass onboarding.
- Existing guests bypass onboarding.
- New guests complete onboarding once.
- Event guest profiles are automatically created.
- SceneView is isolated.
- Business logic is reusable.
- Architecture scales to tens of millions of users without redesign.

Only after these criteria are met is the Entry System considered production-ready.
