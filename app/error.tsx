"use client";

import { useEffect } from "react";

/**
 * Route error boundary.
 *
 * Production keeps the friendly copy, but always surfaces the error digest and
 * message so a report can be traced to the matching server log line instead of
 * "مشکلی پیش آمد".
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep the technical detail in the browser console for support requests.
    console.error("[meydan] route error", {
      digest: error.digest,
      message: error.message,
      stack: error.stack,
    });
  }, [error]);

  const detail = [error.digest ? `digest: ${error.digest}` : null, error.message || null]
    .filter(Boolean)
    .join(" — ");

  return (
    <main className="grid min-h-[50dvh] place-items-center bg-background p-6 text-center text-foreground">
      <section className="w-full max-w-md rounded-panel border border-border bg-card p-6 shadow-card">
        <h1 className="text-lg font-black text-foreground">مشکلی پیش آمد</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          لطفاً دوباره تلاش کنید. اگر ادامه داشت، همین کد را برای پشتیبانی بفرستید.
        </p>

        {detail ? (
          <p
            dir="ltr"
            className="mt-4 break-words rounded-control border border-border bg-surface-muted px-3 py-2 text-left text-[11px] leading-5 text-foreground-subtle"
          >
            {detail}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-control bg-brand px-4 py-2.5 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand-hover"
          >
            تلاش دوباره
          </button>
          <button
            type="button"
            onClick={() => {
              // A hard navigation is the reliable escape from a broken client
              // tree; the router cache may hold the failed payload.
              window.location.reload();
            }}
            className="rounded-control border border-border px-4 py-2.5 text-sm font-bold text-foreground-secondary transition-colors hover:bg-hover"
          >
            بارگذاری دوباره صفحه
          </button>
        </div>
      </section>
    </main>
  );
}
