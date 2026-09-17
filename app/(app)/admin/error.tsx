"use client";

import { useEffect } from "react";
import { AdminErrorState } from "@/features/admin/components/AdminStateViews";
import { adminErrorMessage } from "@/features/admin/services/admin-api";

/**
 * The admin panel's error boundary. It keeps the panel chrome (the section nav
 * lives in the layout, which stays mounted) and renders the shared retryable
 * error state with the Persian message from the API.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[meydan] admin route error", {
      digest: error.digest,
      message: error.message,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="bg-background text-foreground">
      <AdminErrorState
        message={adminErrorMessage(error, "بارگذاری این بخش پنل ممکن نشد.")}
        onRetry={reset}
      />
    </div>
  );
}
