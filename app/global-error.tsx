"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: it replaces the root layout, so it must render its own
 * <html>/<body> and cannot rely on the app's providers or design tokens.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[meydan] global error", {
      digest: error.digest,
      message: error.message,
      stack: error.stack,
    });
  }, [error]);

  const detail = [error.digest ? `digest: ${error.digest}` : null, error.message || null]
    .filter(Boolean)
    .join(" — ");

  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#171717",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "26rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 900 }}>مشکلی پیش آمد</h1>
          <p style={{ marginTop: ".5rem", fontSize: ".875rem", opacity: 0.75 }}>
            لطفاً دوباره تلاش کنید. اگر ادامه داشت، همین کد را برای پشتیبانی بفرستید.
          </p>
          {detail ? (
            <p
              dir="ltr"
              style={{
                marginTop: "1rem",
                padding: ".5rem .75rem",
                border: "1px solid rgba(255,255,255,.2)",
                borderRadius: ".75rem",
                fontSize: ".6875rem",
                wordBreak: "break-word",
                textAlign: "left",
                opacity: 0.65,
              }}
            >
              {detail}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.25rem",
              border: 0,
              borderRadius: "9999px",
              padding: ".625rem 1.25rem",
              background: "#dc2626",
              color: "#ffffff",
              fontSize: ".875rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            تلاش دوباره
          </button>
        </div>
      </body>
    </html>
  );
}
