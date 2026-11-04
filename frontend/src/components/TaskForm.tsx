"use client";

import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";
import { Notice } from "@/components/Notice";
import { trpc } from "@/trpc/client";
import type { Task } from "@/trpc/types";

// Same limits as the backend's Zod schema. The backend remains the source of
// truth; this validation exists to give the user immediate feedback.
const MAX_TITLE = 120;
const MAX_DESCRIPTION = 1000;

/** Without `task` it creates a new one; with `task` it edits the existing one. */
export function TaskForm({ task }: { task?: Task }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = Boolean(task);

  const [title, setTitle] = useState(task?.titulo ?? "");
  const [description, setDescription] = useState(task?.descricao ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const clearServerError = useCallback(() => setServerError(null), []);

  const titleError = !title.trim() ? "Title is required." : null;

  function handleSaved(msg: "created" | "updated") {
    // Drop the cached list: when the user goes back, SSR loads it fresh.
    queryClient.removeQueries({ queryKey: getQueryKey(trpc.task.list) });
    router.push(`/?msg=${msg}`);
  }

  const handleError = (error: { message: string }) => setServerError(error.message);

  const createTask = trpc.task.create.useMutation({
    onSuccess: () => handleSaved("created"),
    onError: handleError,
  });
  const updateTask = trpc.task.update.useMutation({
    onSuccess: () => handleSaved("updated"),
    onError: handleError,
  });
  const isSaving = createTask.isPending || updateTask.isPending;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (titleError) return; // block submission when the title is empty

    // The case requires the model fields to be named `titulo` and `descricao`.
    const data = { titulo: title, descricao: description };
    if (task) updateTask.mutate({ id: task.id, ...data });
    else createTask.mutate(data);
  }

  // The field error only shows after the first submit attempt, so the user
  // isn't warned before typing anything.
  const showTitleError = submitted && titleError;

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {serverError && <Notice kind="error" text={serverError} onClose={clearServerError} />}

      <div className="field">
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={MAX_TITLE}
          aria-invalid={Boolean(showTitleError)}
          aria-describedby={showTitleError ? "title-error" : undefined}
          autoFocus
        />
        {showTitleError && (
          <span id="title-error" className="field-error">
            {titleError}
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={MAX_DESCRIPTION}
        />
      </div>

      <div className="actions">
        <button type="submit" className="button" disabled={isSaving}>
          {isSaving ? "Saving..." : isEditing ? "Save changes" : "Create task"}
        </button>
        <Link href="/" className="button secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
