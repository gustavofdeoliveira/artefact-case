"use client";

import { useEffect } from "react";

export type NoticeProps = { kind: "success" | "error"; text: string };

/**
 * Feedback message. Success notices dismiss themselves; errors stay until
 * closed so the user has time to read them. `role` makes screen readers
 * announce the message.
 */
export function Notice({ kind, text, onClose }: NoticeProps & { onClose: () => void }) {
  useEffect(() => {
    if (kind !== "success") return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [kind, text, onClose]);

  return (
    <div className={`notice ${kind}`} role={kind === "error" ? "alert" : "status"}>
      <span>{text}</span>
      <button type="button" className="notice-close" onClick={onClose} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
