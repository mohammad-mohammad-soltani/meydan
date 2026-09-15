"use client";

import { useEffect, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";

function OfflineOverlay() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed inset-0 z-[1000] overflow-hidden bg-background text-foreground" role="status" aria-live="assertive">
      <div className="mx-auto flex h-full w-full max-w-xl flex-col border-x border-border bg-background">
        <div className="flex h-16 items-center gap-3 border-b border-divider px-4">
          <span className="h-10 w-10 animate-pulse rounded-full bg-skeleton" />
          <div className="flex-1 space-y-2">
            <span className="block h-3 w-28 animate-pulse rounded-full bg-skeleton" />
            <span className="block h-2.5 w-20 animate-pulse rounded-full bg-skeleton-highlight" />
          </div>
          <span className="h-9 w-9 animate-pulse rounded-xl bg-skeleton" />
        </div>

        <div className="relative flex-1 overflow-hidden px-4 py-5">
          <div className="animate-pulse space-y-4 opacity-45" aria-hidden="true">
            <div className="flex gap-2">
              <span className="h-9 w-28 rounded-full bg-skeleton" />
              <span className="h-9 w-24 rounded-full bg-skeleton-highlight" />
              <span className="h-9 w-32 rounded-full bg-skeleton" />
            </div>
            {[0, 1, 2].map((item) => (
              <div key={item} className="rounded-2xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <span className="h-11 w-11 rounded-full bg-skeleton" />
                  <div className="flex-1 space-y-2">
                    <span className="block h-3 w-32 rounded-full bg-skeleton" />
                    <span className="block h-2.5 w-20 rounded-full bg-skeleton-highlight" />
                  </div>
                </div>
                <div className="mt-5 space-y-2.5">
                  <span className="block h-3 w-full rounded-full bg-skeleton-highlight" />
                  <span className="block h-3 w-10/12 rounded-full bg-skeleton-highlight" />
                  <span className="block h-3 w-7/12 rounded-full bg-skeleton-highlight" />
                </div>
                {item === 0 ? <span className="mt-5 block h-36 w-full rounded-xl bg-skeleton" /> : null}
              </div>
            ))}
          </div>

          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="w-full max-w-sm rounded-3xl border border-border bg-background/95 p-6 text-center shadow-2xl backdrop-blur-xl">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-warning-surface text-warning">
                <WifiOff className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-lg font-black">اتصال اینترنت قطع است</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                قالب میدان آماده است؛ به محض برگشت اینترنت، محتوا دوباره بارگذاری می‌شود.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-bold text-background transition-opacity hover:opacity-90"
              >
                <RefreshCw className="h-4 w-4" />
                بررسی دوباره اتصال
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PwaRuntime() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      // One first-party root worker owns offline caching and standards-based Web Push.
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => undefined);
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return <OfflineOverlay />;
}
