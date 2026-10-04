"use client";

import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LoaderCircle, LogIn, LogOut, UserRound } from "lucide-react";
import { closeRealtimeSession } from "@/lib/realtime/user-channel";
import { getMe } from "@/lib/me-client";

type ApiMe = {
  account_type?: "user" | "square" | "media" | "collective" | "organization" | "speaker" | "official";
  profile?: { id?: number; full_name?: string; avatar_url?: string; handle?: string };
  /** Profile of an entity account of any kind. */
  entity?: { id?: number; name?: string; avatar_url?: string; handle?: string } | null;
  square?: { id?: number; name?: string; avatar_url?: string; handle?: string } | null;
};

type Viewer = { name: string; avatarUrl?: string; handle?: string };

function identityFrom(me: ApiMe): Viewer {
  if (me.account_type === "square" || me.account_type === "media" || me.account_type === "collective" || me.account_type === "organization") {
    const entity = me.entity ?? me.square;
    return { name: entity?.name || "حساب من", avatarUrl: entity?.avatar_url || undefined, handle: entity?.handle };
  }
  return { name: me.profile?.full_name || "کاربر میدان", avatarUrl: me.profile?.avatar_url || undefined, handle: me.profile?.handle };
}

/**
 * Desktop sidebar identity: avatar, name and a logout action in a single row.
 *
 * The row is exactly as tall as the theme switcher at the bottom of the
 * opposite sidebar (`h-[3.375rem]`), so the two sidebars stay symmetrical.
 * Identity is read client-side from `/me` so the shared app layout does not pay
 * for an extra API round trip on every page render.
 */
export function SidebarUserCard({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [loading, setLoading] = useState(isAuthenticated);
  const [confirming, setConfirming] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    void getMe<ApiMe>()
      .then((me) => {
        if (active) setViewer(identityFrom(me));
      })
      .catch(() => {
        if (active) setViewer(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  async function confirmLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { accept: "application/json" },
      });
      if (!response.ok) throw new Error("logout failed");

      // A hard navigation is required: a client transition would keep the
      // pre-logout RSC payload cached, so Back could restore the session view.
      document.documentElement.dataset.meydanAuthenticated = "false";
      closeRealtimeSession();
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- logout must discard the router cache
      window.location.assign("/auth");
    } catch {
      setError("خروج انجام نشد.");
      setLoggingOut(false);
    }
  }

  const rowClass =
    "flex h-[3.375rem] items-center gap-2 rounded-2xl border border-[var(--sidebar-card-border)] bg-[var(--sidebar-card)] p-2 text-card-foreground";

  if (!isAuthenticated) {
    return (
      <div className={rowClass}>
        <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-muted text-icon-muted">
          <UserRound className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1 truncate px-1 text-xs font-black text-foreground">مهمان</span>
        <Link
          href="/auth"
          className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-brand px-3 py-2 text-[11px] font-black text-brand-foreground transition-colors hover:bg-brand-hover"
        >
          <LogIn aria-hidden="true" className="h-3.5 w-3.5" />
          ورود
        </Link>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className={rowClass} role="group" aria-label="تأیید خروج از حساب">
        <span
          role={error ? "alert" : undefined}
          className={`min-w-0 flex-1 truncate ps-2 text-[11px] font-bold ${error ? "text-danger" : "text-foreground-secondary"}`}
        >
          {error || "خروج از حساب؟"}
        </span>
        <button
          type="button"
          onClick={() => {
            setError("");
            setConfirming(false);
          }}
          disabled={loggingOut}
          className="shrink-0 rounded-pill border border-border px-3 py-2 text-[11px] font-black text-foreground-secondary transition-colors hover:bg-hover hover:text-foreground disabled:opacity-60"
        >
          انصراف
        </button>
        <button
          type="button"
          onClick={() => void confirmLogout()}
          disabled={loggingOut}
          className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-danger px-3 py-2 text-[11px] font-black text-on-solid transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
        >
          {loggingOut ? <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : null}
          {loggingOut ? "…" : "خروج"}
        </button>
      </div>
    );
  }

  return (
    <div className={rowClass}>
      <Link
        href="/profile"
        aria-label="مشاهدهٔ نمایه"
        className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-xl transition-colors hover:bg-hover"
      >
        {viewer?.avatarUrl ? (
          <OptimizedAvatar
            src={viewer.avatarUrl}
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-border"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-muted text-xs font-black text-foreground"
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : viewer?.name.trim().slice(0, 1) || <UserRound className="h-5 w-5" />}
          </span>
        )}
        <span className="min-w-0 flex-1 pe-1">
          <span className="block truncate text-xs font-black text-foreground">
            {loading ? "در حال دریافت…" : viewer?.name || "نمایهٔ من"}
          </span>
          {viewer?.handle ? <span className="block truncate text-[10px] text-muted-foreground latin-digits" dir="ltr">@{viewer.handle}</span> : null}
        </span>
      </Link>

      <button
        type="button"
        onClick={() => {
          setError("");
          setConfirming(true);
        }}
        title="خروج از حساب"
        aria-label="خروج از حساب"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:border-danger-border hover:bg-danger-surface hover:text-danger-foreground"
      >
        <LogOut aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
