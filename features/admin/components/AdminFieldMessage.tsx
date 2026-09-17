"use client";

import { AdminNotice } from "./AdminNotice";

/**
 * The single feedback slot at the top of an admin form.
 *
 * It carries three things in one place so every form reports failures the same
 * way: the server's Persian sentence, the per-field reason codes from a 422
 * (`error.fields`), and a success message after an edit.
 *
 * `message` is either an error or a success depending on `tone`; a form with
 * both (rare) renders them as two calls rather than guessing.
 */
export function AdminFieldMessage({
  message,
  fields = {},
  tone = "error",
  labels = {},
}: {
  message: string | null;
  /** `{ phone: "taken" }` as sent by the API, or already-Persian sentences. */
  fields?: Record<string, string>;
  tone?: "error" | "success";
  /** Optional Persian name per field key, used as a prefix in the detail list. */
  labels?: Record<string, string>;
}) {
  if (!message) return null;

  const details = Object.entries(fields)
    .map(([field, reason]) => `${labels[field] ?? field}: ${reason}`)
    .join(" · ");

  return (
    <AdminNotice
      tone={tone}
      message={details ? `${message} (${details})` : message}
      autoHideMs={tone === "success" ? 4000 : undefined}
    />
  );
}
