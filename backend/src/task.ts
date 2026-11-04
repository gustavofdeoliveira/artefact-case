import { z } from "zod";

/**
 * Domain model. Field names (`titulo`, `descricao`, `dataCriacao`) follow the
 * case specification. `dataCriacao` is an epoch timestamp in milliseconds: a
 * plain number travels through JSON losslessly, so no transformer (superjson)
 * is needed.
 */
export interface Task {
  id: string;
  titulo: string;
  descricao?: string;
  dataCriacao: number;
}

// `trim()` runs before `min(1)`, so whitespace-only titles are rejected too.
const titulo = z
  .string({ error: "Title is required." })
  .trim()
  .min(1, "Title is required.")
  .max(120, "Title must be at most 120 characters.");

// An empty description is normalized to `undefined` (optional field).
const descricao = z
  .string()
  .trim()
  .max(1000, "Description must be at most 1000 characters.")
  .optional()
  .transform((value) => (value ? value : undefined));

const id = z.uuid("Invalid task ID.");

/*
 * Input schemas. tRPC runs them before the procedure body: invalid input never
 * reaches the store and is answered with a BAD_REQUEST error.
 */
export const createTaskInput = z.object({ titulo, descricao });

// PUT semantics: the edit form sends the whole task, which avoids ambiguity
// between "field omitted" and "field cleared".
export const updateTaskInput = z.object({ id, titulo, descricao });

export const taskIdInput = z.object({ id });

/**
 * Cursor (keyset) pagination. The cursor holds the sort key of the last item
 * received, not its position, so deleting a task that is already on screen
 * does not shift the next pages (the classic offset pagination bug).
 */
export const listTasksInput = z.object({
  limit: z.number().int().min(1).max(50).default(10),
  cursor: z.object({ dataCriacao: z.number(), id: z.string() }).nullish(),
});

export type CreateTaskInput = z.infer<typeof createTaskInput>;
export type UpdateTaskInput = z.infer<typeof updateTaskInput>;
export type ListTasksInput = z.infer<typeof listTasksInput>;
