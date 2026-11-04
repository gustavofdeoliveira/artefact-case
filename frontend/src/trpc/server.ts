import { createTRPCClient, httpBatchLink } from "@trpc/client";
// `import type`: only the type crosses the boundary, so no backend code ends
// up in the frontend bundle.
import type { AppRouter } from "../../../backend/src/router";
import { API_URL } from "@/lib/config";

/**
 * Vanilla tRPC client for Server Components (SSR). Since the backend is a
 * separate service, the Next.js server also reaches it over HTTP.
 */
export const serverClient = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: API_URL })],
});
