import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";
import { appRouter } from "./router";
import { seed } from "./seed";

const PORT = Number(process.env.PORT ?? 4000);
// Só a origem do frontend pode chamar a API pelo navegador.
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";

if (process.env.SEED !== "false") seed();

/**
 * Adapter HTTP standalone do próprio tRPC, sem Express/Fastify: para um CRUD
 * em memória, um framework a mais não agregaria nada ("menos é mais").
 */
const server = createHTTPServer({
  router: appRouter,
  middleware: cors({ origin: CORS_ORIGIN }),
  onError({ error, path }) {
    // Erros esperados (validação, não encontrado) não poluem o log.
    if (error.code === "INTERNAL_SERVER_ERROR") {
      console.error(`[trpc] erro em ${path}:`, error);
    }
  },
});

server.listen(PORT);
console.log(`Servidor tRPC ouvindo em http://localhost:${PORT}`);
