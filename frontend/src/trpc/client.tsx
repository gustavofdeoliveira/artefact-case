"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState, type ReactNode } from "react";
import type { AppRouter } from "../../../backend/src/router";
import { API_URL } from "@/lib/config";

/** Typed tRPC hooks (useQuery, useInfiniteQuery, useMutation...). */
export const trpc = createTRPCReact<AppRouter>();

export function TRPCProvider({ children }: { children: ReactNode }) {
  // `useState` keeps a single instance per browser tab across re-renders.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // Data coming from SSR is considered fresh for 30s, so the same
          // request is not repeated right after hydration.
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({ links: [httpBatchLink({ url: API_URL })] }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
