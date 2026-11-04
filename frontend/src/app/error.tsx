"use client";

import Link from "next/link";

/** Global error boundary for unexpected failures (e.g. backend down during SSR). */
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <h1>Something went wrong</h1>
      <div className="notice error" role="alert">
        The operation could not be completed. Make sure the backend is running.
      </div>
      <div className="actions">
        <button type="button" className="button" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="button secondary">
          Back to the list
        </Link>
      </div>
    </>
  );
}
