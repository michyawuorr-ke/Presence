"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
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
        networkMode:          "online",     // Don't queue queries when offline
      },
      mutations: {
        retry:     1,
        networkMode: "online",
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
