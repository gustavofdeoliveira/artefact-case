import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";
import { appRouter } from "./router";
import { seed } from "./seed";

const PORT = Number(process.env.PORT ?? 4000);
// Only the frontend origin may call the API from a browser.
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";

if (process.env.SEED !== "false") seed();

/**
 * tRPC's own standalone HTTP adapter, with no Express/Fastify: for an
 * in-memory CRUD an extra HTTP framework would add nothing. It maps each
 * procedure to a path (`/task.list`, ...) and supports request batching,
 * which the frontend's `httpBatchLink` uses.
 */
const server = createHTTPServer({
  router: appRouter,
  // Runs before tRPC handles the request; answers CORS preflights.
  middleware: cors({ origin: CORS_ORIGIN }),
  onError({ error, path }) {
    // Expected errors (validation, not found) are not logged as failures.
    if (error.code === "INTERNAL_SERVER_ERROR") {
      console.error(`[trpc] error on ${path}:`, error);
    }
  },
});

server.listen(PORT);
console.log(`tRPC server listening on http://localhost:${PORT}`);
