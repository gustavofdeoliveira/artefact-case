/** tRPC server URL, used both during SSR and in the browser. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Number of tasks fetched per page (infinite scroll). */
export const PAGE_SIZE = 10;

// A fixed time zone guarantees the date rendered on the server (SSR) matches
// the one rendered in the browser, avoiding hydration mismatches.
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function formatDate(timestamp: number) {
  return dateFormatter.format(timestamp);
}
