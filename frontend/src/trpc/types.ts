import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../backend/src/router";

/** Types derived from the router: if the backend changes, the frontend build fails. */
type RouterOutputs = inferRouterOutputs<AppRouter>;

export type TaskPage = RouterOutputs["task"]["list"];
export type Task = RouterOutputs["task"]["byId"];
