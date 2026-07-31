"use client";
import { QueryClient, MutationCache } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useState } from "react";
import OfflineMutationToast from "./OfflineMutationToast";

// Custom DOM event name — kept as a plain string constant so
// OfflineMutationToast.tsx can listen for it without importing anything
// from this file (avoids a circular import between the two).
export const MUTATION_FAILED_EVENT = "oreeti:mutation-failed";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    // A mutation reaching this global onError means retries (retry: 1,
    // below) are already exhausted — so this only fires for genuine
    // failures, not for a mutation still paused offline waiting to retry.
    // That's exactly the case the user asked to surface: a queued action
    // that ultimately fails once back online, not routine offline pausing.
    mutationCache: new MutationCache({
      onError: (error) => {
        if (typeof window === "undefined") return;
        window.dispatchEvent(new CustomEvent(MUTATION_FAILED_EVENT, {
          detail: { message: error instanceof Error ? error.message : "Something didn't go through" },
        }));
      },
    }),
    defaultOptions: {
      queries: {
        // For 618 concurrent users: keep data fresh but don't hammer Supabase.
        // Each tab refetches when re-focused so data stays current without
        // constant polling. staleTime = how long before a background refetch
        // is triggered; gcTime = how long unused data stays in memory cache.
        staleTime:            30 * 1000,   // 30s — data considered fresh
        gcTime:               10 * 60 * 1000, // 10min — keep in memory
        refetchOnWindowFocus: true,         // Refetch when user returns to tab
        refetchOnReconnect:   true,         // Refetch after network drops
        retry:                2,            // Retry failed queries twice
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000), // Exponential backoff
        // offlineFirst: cached data renders immediately even with no
        // connection (instead of "online", which simply doesn't run the
        // query at all while offline). Guests losing signal mid-event —
        // common in Kenyan venues — still see their last-known networking
        // list, connections, etc, instead of a blank screen. Once back
        // online, paused queries refetch automatically (refetchOnReconnect
        // above already covers that).
        networkMode:          "offlineFirst",
      },
      mutations: {
        retry:     1,
        // offlineFirst here means a mutation fired while offline doesn't
        // fail immediately — it's held (queued) and fires once the
        // connection returns, instead of erroring out right away. This is
        // what makes "tap Connect while offline" work like a queued
        // Instagram like rather than a hard failure.
        networkMode: "offlineFirst",
      },
    },
  }));

  // localStorage doesn't exist during server-side render — guard against
  // that rather than letting it throw. On the server this falls back to
  // an in-memory-only persister that's immediately discarded, which is
  // fine since SSR has no "offline" concept anyway.
  const [persister] = useState(() => createSyncStoragePersister({
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    key: "oreeti-query-cache",
  }));

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        // Caps how old persisted data can be before it's discarded on
        // restore, independent of gcTime — protects against showing a
        // guest wildly stale data (e.g. from an event days ago) if they
        // reopen the app after a long gap while still offline.
        maxAge: 24 * 60 * 60 * 1000, // 24h
        // Don't persist queries that are still in an error state — retrying
        // a broken query from a stale error on reload serves no purpose.
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => query.state.status !== "error",
        },
      }}
    >
      <OfflineMutationToast />
      {children}
    </PersistQueryClientProvider>
  );
}
