import { TRPCClientError } from "@trpc/client";
import { notFound } from "next/navigation";
import { TaskForm } from "@/components/TaskForm";
import { serverClient } from "@/trpc/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditTaskPage({ params }: Props) {
  const { id } = await params;

  // The form arrives pre-filled (SSR). A missing or malformed id becomes a 404;
  // any other failure bubbles up to the error boundary (error.tsx).
  const task = await serverClient.task.byId.query({ id }).catch((error: unknown) => {
    const code = error instanceof TRPCClientError ? error.data?.code : undefined;
    if (code === "NOT_FOUND" || code === "BAD_REQUEST") notFound();
    throw error;
  });

  return (
    <>
      <h1>Edit task</h1>
      <TaskForm task={task} />
    </>
  );
}
