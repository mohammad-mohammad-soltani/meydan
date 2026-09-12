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
    <div dir="rtl" className="mt-3 w-full rounded-[16px] border border-warning-border bg-warning-surface/50 px-3 py-3">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-warning/10 text-warning">
          <HandHeart className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <strong className="block text-xs font-black">شما هم به این کار خوب بپیوندید</strong>
          <Link href={`/initiatives/${initiativeId}/participants`} className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
            <UsersRound className="h-3.5 w-3.5" />
            <span>{participantCount.toLocaleString("fa-IR")} نفر پیوسته‌اند</span>
            <span className="font-bold text-warning-foreground">مشاهده افراد</span>
          </Link>
        </div>
        <button type="button" disabled={loading} onClick={() => void toggleJoin()} className={`inline-flex h-10 items-center gap-1 rounded-full px-4 text-xs font-black ${joined ? "bg-success-surface text-success" : "bg-warning text-on-solid"}`}>
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : joined ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {joined ? "پیوسته‌اید" : label || "پیوستن"}
        </button>
      </div>
    </div>
  );
}
