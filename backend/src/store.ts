import { randomUUID } from "node:crypto";
import type { CreateTaskInput, ListTasksInput, Task, UpdateTaskInput } from "./task";

/**
 * In-memory repository. The router only knows this object's interface, so
 * swapping it for a real database (e.g. Postgres + Prisma) would not touch the
 * tRPC layer. Data lives as long as the process does, as the case allows.
 */
const tasks = new Map<string, Task>();

type SortKey = Pick<Task, "dataCriacao" | "id">;

/**
 * Stable ordering: newest first, with `id` as tie-breaker because two tasks
 * can be created in the same millisecond. A total order is what makes the
 * cursor reliable.
 */
function compareTasks(a: SortKey, b: SortKey): number {
  if (a.dataCriacao !== b.dataCriacao) return b.dataCriacao - a.dataCriacao;
  return b.id.localeCompare(a.id);
}

export const taskStore = {
  /**
   * Returns one page of tasks plus the cursor for the next one (`null` when
   * there is nothing left). Sorting the whole map on every call is O(n log n),
   * which is fine for an in-memory demo; a database would use an index.
   */
  list({ limit, cursor }: ListTasksInput) {
    const sorted = [...tasks.values()].sort(compareTasks);

    // Keep only what comes *after* the cursor in the ordering. This works even
    // if the cursor's task has been deleted in the meantime.
    const remaining = cursor ? sorted.filter((task) => compareTasks(task, cursor) > 0) : sorted;

    const items = remaining.slice(0, limit);
    const last = items[items.length - 1];
    const hasMore = remaining.length > limit;

    return {
      items,
      nextCursor: hasMore && last ? { dataCriacao: last.dataCriacao, id: last.id } : null,
    };
  },

  get(id: string): Task | undefined {
    return tasks.get(id);
  },

  /** `id` and `dataCriacao` are always generated server-side. */
  create({ titulo, descricao }: CreateTaskInput, dataCriacao = Date.now()): Task {
    const task: Task = { id: randomUUID(), titulo, descricao, dataCriacao };
    tasks.set(task.id, task);
    return task;
  },

  /** Returns `undefined` when the task does not exist; the router maps it to NOT_FOUND. */
  update({ id, titulo, descricao }: UpdateTaskInput): Task | undefined {
    const current = tasks.get(id);
    if (!current) return undefined;
    const updated: Task = { ...current, titulo, descricao };
    tasks.set(id, updated);
    return updated;
  },

  /** Returns whether a task was actually removed. */
  delete(id: string): boolean {
    return tasks.delete(id);
  },
};
