"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, HandHeart, LoaderCircle, Plus, UsersRound } from "lucide-react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { loginHref, rememberReturnTo } from "@/lib/auth-navigation";
import { isAuthApiError, meydanApi } from "@/lib/meydan-api";

type InitiativeResponse = {
  participant_count?: number;
  viewer_state?: { joined?: boolean } | null;
};

type JoinResponse = {
  joined: boolean;
  participant_count: number;
};

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  rememberReturnTo(returnTo);
  window.location.assign(loginHref(returnTo));
}

export function ConnectedGoodActionCard({
  initiativeId,
  label,
  initialJoined,
  initialParticipantCount,
}: {
  initiativeId: number;
  label: string;
  initialJoined: boolean;
  initialParticipantCount?: number;
}) {
  const { requireAuth } = useAuthGate();
  const [joined, setJoined] = useState(initialJoined);
  const [participantCount, setParticipantCount] = useState(initialParticipantCount ?? 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void meydanApi<InitiativeResponse>(`/initiatives/${initiativeId}`)
      .then((data) => {
        setParticipantCount(data.participant_count ?? 0);
        if (data.viewer_state) setJoined(Boolean(data.viewer_state.joined));
      })
      .catch(() => undefined);
  }, [initiativeId]);

  async function toggleJoin() {
    if (loading || !requireAuth()) return;
    setLoading(true);
    const next = !joined;
    setJoined(next);
    setParticipantCount((v) => Math.max(0, v + (next ? 1 : -1)));
    try {
      const result = await meydanApi<JoinResponse>(`/initiatives/${initiativeId}/join`, {
        method: next ? "PUT" : "DELETE",
      });
      setJoined(result.joined);
      setParticipantCount(result.participant_count ?? 0);
    } catch (reason) {
      setJoined(!next);
      if (isAuthApiError(reason)) redirectToLogin();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir="rtl"
      // The timeline card body is pointer-events-none behind a full-card link,
      // so this block has to opt back in for its button and link to work.
      className="pointer-events-auto relative z-10 mt-3 w-full rounded-[16px] border border-warning-border bg-warning-surface/50 p-3"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-warning/10 text-warning"
          >
            <HandHeart className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <strong className="block text-[13px] font-black leading-6 text-foreground sm:text-xs">
              شما هم به این کار خوب بپیوندید
            </strong>

            <Link
              href={`/initiatives/${initiativeId}/participants`}
              className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-control text-[11px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <UsersRound aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span className="tabular-nums">
                {participantCount.toLocaleString("fa-IR")} نفر پیوسته‌اند
              </span>
              <span aria-hidden="true" className="text-foreground-subtle">
                ·
              </span>
              <span className="font-bold text-warning-foreground">مشاهده افراد</span>
            </Link>
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          aria-pressed={joined}
          onClick={() => void toggleJoin()}
          className={`inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-black outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70 sm:min-h-10 sm:w-auto ${
            joined ? "bg-success-surface text-success" : "bg-warning text-warning-solid-foreground hover:brightness-105"
          }`}
        >
          {loading ? (
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />
          ) : joined ? (
            <Check aria-hidden="true" className="h-4 w-4" />
          ) : (
            <Plus aria-hidden="true" className="h-4 w-4" />
          )}
          <span className="whitespace-nowrap">{joined ? "پیوسته‌اید" : label || "پیوستن"}</span>
        </button>
      </div>
    </div>
  );
}
