import { TRPCError } from "@trpc/server";
import { taskStore } from "./store";
import { createTaskInput, listTasksInput, taskIdInput, updateTaskInput } from "./task";
import { publicProcedure, router } from "./trpc";

/**
 * Throwing a `TRPCError` is how a procedure reports an expected failure: tRPC
 * turns the code into the matching HTTP status (NOT_FOUND -> 404) and sends
 * the message to the client, where it is shown to the user.
 */
function taskNotFound(id: string): never {
  throw new TRPCError({
    code: "NOT_FOUND",
    message: `Task ${id} not found. It may have been deleted.`,
  });
}

/**
 * Task procedures. Each one declares its input schema with `.input()`, which
 * tRPC validates before running the handler (invalid input -> BAD_REQUEST),
 * and whose type is inferred all the way to the frontend.
 *
 * - `query`: read-only, sent as HTTP GET (cacheable, used during SSR).
 * - `mutation`: changes state, sent as HTTP POST.
 */
const taskRouter = router({
  /** Paginated list, newest first. Feeds the SSR first page and infinite scroll. */
  list: publicProcedure.input(listTasksInput).query(({ input }) => taskStore.list(input)),

  /** Single task, used by the edit page to pre-fill the form. */
  byId: publicProcedure
    .input(taskIdInput)
    .query(({ input }) => taskStore.get(input.id) ?? taskNotFound(input.id)),

  /** Creates a task; `id` and `dataCriacao` are generated on the server. */
  create: publicProcedure.input(createTaskInput).mutation(({ input }) => taskStore.create(input)),

  /** Replaces title and description of an existing task. */
  update: publicProcedure
    .input(updateTaskInput)
    .mutation(({ input }) => taskStore.update(input) ?? taskNotFound(input.id)),

  /** Deletes a task and returns its id so the client can update its cache. */
  delete: publicProcedure.input(taskIdInput).mutation(({ input }) => {
    if (!taskStore.delete(input.id)) taskNotFound(input.id);
    return { id: input.id };
  }),
});

/**
 * Root router. Nesting under `task` namespaces the procedures, which become
 * the HTTP paths `/task.list`, `/task.create`, and so on.
 */
export const appRouter = router({ task: taskRouter });

/**
 * The only thing the frontend imports from the backend, and only as a *type*
 * (`import type`). This gives end-to-end type safety without shipping any
 * server code to the client bundle.
 */
export type AppRouter = typeof appRouter;
