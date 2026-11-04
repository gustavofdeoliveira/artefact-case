"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Notice, type NoticeProps } from "@/components/Notice";
import { formatDate, PAGE_SIZE } from "@/lib/config";
import { trpc } from "@/trpc/client";
import type { TaskPage } from "@/trpc/types";

type Props = {
  /** First page, already fetched on the server (SSR). */
  firstPage: TaskPage;
  /** Message coming from another page (e.g. "Task created"), via query string. */
  initialMessage?: string;
};

const listInput = { limit: PAGE_SIZE };

export function TaskList({ firstPage, initialMessage }: Props) {
  const utils = trpc.useUtils();
  const [notice, setNotice] = useState<NoticeProps | null>(
    initialMessage ? { kind: "success", text: initialMessage } : null,
  );
  const closeNotice = useCallback(() => setNotice(null), []);

  // Strip the message from the URL so it doesn't show up again on refresh.
  useEffect(() => {
    if (initialMessage) window.history.replaceState(null, "", "/");
  }, [initialMessage]);

  /**
   * SSR + infinite scroll: the first page arrives ready from the server as
   * `initialData`; the following pages are fetched on the client using the
   * `nextCursor` returned by the backend.
   */
  const tasksQuery = trpc.task.list.useInfiniteQuery(listInput, {
    getNextPageParam: (page) => page.nextCursor,
    initialData: { pages: [firstPage], pageParams: [null] },
  });

  // Removes the task from the local cache instead of reloading the whole list.
  const removeFromCache = (id: string) =>
    utils.task.list.setInfiniteData(listInput, (data) =>
      data && {
        ...data,
        pages: data.pages.map((p) => ({ ...p, items: p.items.filter((t) => t.id !== id) })),
      },
    );

  const deleteTask = trpc.task.delete.useMutation({
    onSuccess: ({ id }) => {
      removeFromCache(id);
      setNotice({ kind: "success", text: "Task deleted successfully." });
    },
    onError: (error, { id }) => {
      // If it no longer exists on the server, drop it from the screen too.
      if (error.data?.code === "NOT_FOUND") removeFromCache(id);
      setNotice({ kind: "error", text: `Could not delete the task: ${error.message}` });
    },
  });

  function confirmDelete(id: string, title: string) {
    if (window.confirm(`Delete the task "${title}"?`)) deleteTask.mutate({ id });
  }

  // Sentinel at the end of the list: when it enters the viewport, fetch the next page.
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = tasksQuery;
  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasNextPage || isFetchNextPageError) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "200px" }, // start loading a bit before reaching the end
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  const tasks = tasksQuery.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      {notice && <Notice {...notice} onClose={closeNotice} />}

      {tasks.length === 0 ? (
        <p className="status">
          No tasks yet. <Link href="/tasks/new">Create the first one</Link>.
        </p>
      ) : (
        <ul className="list">
          {tasks.map((task) => {
            const deleting = deleteTask.isPending && deleteTask.variables?.id === task.id;
            return (
              <li key={task.id} className={`task${deleting ? " deleting" : ""}`}>
                <div>
                  <h2>{task.titulo}</h2>
                  {task.descricao && <p>{task.descricao}</p>}
                  <time dateTime={new Date(task.dataCriacao).toISOString()}>
                    Created {formatDate(task.dataCriacao)}
                  </time>
                </div>
                <div className="actions">
                  <Link href={`/tasks/${task.id}/edit`} className="button secondary">
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="button danger"
                    disabled={deleting}
                    onClick={() => confirmDelete(task.id, task.titulo)}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div ref={sentinel} aria-hidden />
      {isFetchingNextPage && <p className="status">Loading more tasks...</p>}
      {isFetchNextPageError && (
        <p className="status">
          Failed to load more tasks.{" "}
          <button type="button" className="button secondary" onClick={() => fetchNextPage()}>
            Try again
          </button>
        </p>
      )}
      {!hasNextPage && tasks.length > 0 && <p className="status">You've reached the end of the list.</p>}
    </>
  );
}
