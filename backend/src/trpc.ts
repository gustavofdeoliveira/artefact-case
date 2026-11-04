import { initTRPC } from "@trpc/server";
import { ZodError, z } from "zod";

/**
 * tRPC bootstrap. `initTRPC.create()` must be called exactly once per
 * application; it returns the builders (`router`, `procedure`) every route
 * is made from. No context is configured because there is no auth or
 * per-request state in the scope of this case.
 */
const t = initTRPC.create({
  /**
   * Shapes every error sent to the client. By default, a Zod validation error
   * reaches the client with the full list of issues serialized as JSON inside
   * `message`, which is unreadable in a UI. Here `message` becomes the first
   * issue (e.g. "Title is required.") and the per-field details are kept in
   * `data.zodError` for clients that want to highlight specific fields.
   */
  errorFormatter({ shape, error }) {
    const zodError = error.cause instanceof ZodError ? error.cause : null;
    return {
      ...shape,
      message: zodError?.issues[0]?.message ?? shape.message,
      data: {
        ...shape.data,
        zodError: zodError ? z.flattenError(zodError).fieldErrors : null,
      },
    };
  },
});

/** Creates a (sub-)router: a named group of procedures. */
export const router = t.router;

/**
 * Base procedure with no access control. With authentication in place, a
 * `protectedProcedure = t.procedure.use(authMiddleware)` would verify a JWT
 * from the request context here (see "Out of scope" in the README).
 */
export const publicProcedure = t.procedure;
