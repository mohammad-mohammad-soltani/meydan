"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, LoaderCircle, X } from "lucide-react";
import { meydanApi } from "@/lib/meydan-api";
import { initializePushe, rememberPusheAppId } from "@/lib/pushe-web";

type PushConfig = {
  provider: "pushe";
  enabled: boolean;
  app_id: string;
  custom_id: string;
};

type State = "loading" | "hidden" | "ready" | "enabling" | "enabled" | "error";

const DISMISS_KEY = "meydan-push-prompt-dismissed-at";
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

function recentlyDismissed(): boolean {
  try {
    const value = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
    return value > 0 && Date.now() - value < DISMISS_FOR_MS;
  } catch {
    return false;
  }
}

export function PushEnrollment({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [config, setConfig] = useState<PushConfig | null>(null);
  const [state, setState] = useState<State>("loading");

  const syncSubscription = useCallback(async (pushConfig: PushConfig, interactive: boolean) => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setState("hidden");
      return;
    }

    if (Notification.permission === "denied") {
      setState("hidden");
      return;
    }

    if (!interactive && Notification.permission !== "granted") {
      setState(recentlyDismissed() ? "hidden" : "ready");
      return;
    }

    setState("enabling");
    try {
      const sdk = await initializePushe(pushConfig.app_id);
      await Promise.resolve(sdk.subscribe());
      await Promise.resolve(sdk.setCustomId(pushConfig.custom_id));
      setState(Notification.permission === "granted" ? "enabled" : "ready");
    } catch {
      setState(interactive ? "error" : "ready");
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setState("hidden");
      return;
    }

    let cancelled = false;
    meydanApi<PushConfig>("/notifications/push-config")
      .then((value) => {
        if (cancelled) return;
        setConfig(value);
        rememberPusheAppId(value.app_id);
        if (!value.enabled || !value.app_id || !value.custom_id) {
          setState("hidden");
          return;
        }
        void syncSubscription(value, false);
      })
      .catch(() => {
        if (!cancelled) setState("hidden");
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, syncSubscription]);

  if (!config || state === "loading" || state === "hidden" || state === "enabled") return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // localStorage can be unavailable in hardened browser modes.
    }
    setState("hidden");
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottom-nav-height,4rem)+0.75rem)] z-[90] mx-auto w-full max-w-xl px-3 lg:bottom-4">
      <div className="pointer-events-auto relative rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur-xl">
        <button
          type="button"
          onClick={dismiss}
          aria-label="بعداً"
          className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3 pl-8">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-skeleton text-foreground">
            <Bell className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black">اعلان‌های میدان را فعال کن</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              لایک، نظر، دعوت سخنران و پیام‌های مهم را حتی وقتی صفحه باز نیست دریافت کن.
            </p>
            {state === "error" ? (
              <p className="mt-2 text-xs font-bold text-destructive">فعال‌سازی انجام نشد؛ دوباره تلاش کن.</p>
            ) : null}
            <button
              type="button"
              disabled={state === "enabling"}
              onClick={() => void syncSubscription(config, true)}
              className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-xs font-bold text-background disabled:opacity-60"
            >
              {state === "enabling" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              فعال‌کردن اعلان‌ها
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
