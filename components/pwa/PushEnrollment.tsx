"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { meydanApi } from "@/lib/meydan-api";
import { enableWebPush, type WebPushConfig } from "@/lib/web-push";

type State = "loading" | "hidden" | "ready" | "enabling" | "enabled" | "error";

const PROMPT_HIDDEN_KEY = "meydan-push-prompt-hidden";

function promptHidden(): boolean {
  try {
    return window.localStorage.getItem(PROMPT_HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

function hidePromptPermanently(): void {
  try {
    window.localStorage.setItem(PROMPT_HIDDEN_KEY, "1");
  } catch {
    // localStorage can be unavailable in hardened/private browser modes.
  }
}

export function PushEnrollment({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [config, setConfig] = useState<WebPushConfig | null>(null);
  const [state, setState] = useState<State>("loading");

  const syncSubscription = useCallback(async (pushConfig: WebPushConfig, interactive: boolean) => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("hidden");
      return;
    }

    if (Notification.permission === "denied") {
      setState("hidden");
      return;
    }

    if (!interactive && Notification.permission !== "granted") {
      setState(promptHidden() ? "hidden" : "ready");
      return;
    }

    // Existing granted permissions are repaired/synchronised silently. Hiding
    // this transient state prevents the permission card flashing on every load.
    setState("enabling");
    try {
      const result = await enableWebPush(pushConfig, interactive);
      if (result === "enabled") {
        hidePromptPermanently();
        setState("enabled");
      } else if (result === "prompt") {
        setState(promptHidden() ? "hidden" : "ready");
      } else {
        setState("hidden");
      }
    } catch {
      // Once the browser permission is granted the app should never nag again.
      // A failed backend sync will be retried silently on a later mount.
      if (Notification.permission === "granted") {
        hidePromptPermanently();
        setState("hidden");
      } else {
        setState(promptHidden() ? "hidden" : interactive ? "error" : "ready");
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setState("hidden");
      return;
    }

    let cancelled = false;
    meydanApi<WebPushConfig>("/push/config", { suppressAuthRedirect: true })
      .then((value) => {
        if (cancelled) return;
        setConfig(value);
        if (!value.enabled || !value.vapid_public_key) {
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

  if (
    !config ||
    state === "loading" ||
    state === "hidden" ||
    state === "enabled" ||
    state === "enabling"
  ) {
    return null;
  }

  const dismiss = () => {
    hidePromptPermanently();
    setState("hidden");
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottom-nav-height,4rem)+0.75rem)] z-[90] mx-auto w-full max-w-xl px-3 lg:bottom-4">
      <div className="pointer-events-auto relative rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur-xl">
        <button
          type="button"
          onClick={dismiss}
          aria-label="دیگر نمایش نده"
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
              لایک، نظر، دعوت سخنران و پیام جدید را حتی وقتی میدان بسته است دریافت کن.
            </p>
            {state === "error" ? (
              <p className="mt-2 text-xs font-bold text-destructive">فعال‌سازی انجام نشد؛ دوباره تلاش کن.</p>
            ) : null}
            <button
              type="button"
              onClick={() => void syncSubscription(config, true)}
              className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-xs font-bold text-background transition-opacity hover:opacity-90"
            >
              <Bell className="h-4 w-4" />
              فعال‌کردن اعلان‌ها
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
