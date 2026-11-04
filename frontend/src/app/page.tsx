import { TaskList } from "@/components/TaskList";
import { PAGE_SIZE } from "@/lib/config";
import { serverClient } from "@/trpc/server";

// Data lives in the backend's memory and changes all the time: the page is
// rendered on every request (SSR), never statically generated.
export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  created: "Task created successfully.",
  updated: "Task updated successfully.",
};

type Props = { searchParams: Promise<{ msg?: string }> };

export default async function TasksPage({ searchParams }: Props) {
  const { msg } = await searchParams;

  // If the backend is down, the page still renders with a clear error.
  const firstPage = await serverClient.task.list.query({ limit: PAGE_SIZE }).catch(() => null);

  return (
    <>
      <h1>My tasks</h1>
      {firstPage ? (
        <TaskList firstPage={firstPage} initialMessage={msg ? MESSAGES[msg] : undefined} />
      ) : (
        <div className="notice error" role="alert">
          Could not load tasks. Make sure the backend is running and reload the page.
        </div>
      )}
    </>
  );
}
