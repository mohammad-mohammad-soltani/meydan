"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { BadgeCheck, Check, HandHeart, LoaderCircle, Plus, UsersRound, X } from "lucide-react";
import { isAuthApiError, meydanApi } from "@/lib/meydan-api";

type InitiativeParticipant = {
  id: string;
  type: "user" | "square";
  display_name: string;
  avatar_url?: string;
  verified?: boolean;
  joined_at?: string;
};

type ParticipantsResponse = {
  items: InitiativeParticipant[];
  participant_count: number;
};

type InitiativeResponse = {
  participant_count?: number;
  viewer_state?: { joined?: boolean } | null;
};

type JoinResponse = {
  joined: boolean;
  participant_count: number;
};

function numericActorId(value: string): number {
  return Number(value.match(/(\d+)$/)?.[1] || 0);
}

function redirectToLogin() {
  if (typeof window !== "undefined") window.location.assign("/auth");
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
  const [joined, setJoined] = useState(initialJoined);
  const [participantCount, setParticipantCount] = useState<number | null>(initialParticipantCount ?? null);
  const [isToggling, setIsToggling] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [members, setMembers] = useState<InitiativeParticipant[]>([]);
  const [membersError, setMembersError] = useState("");

  useEffect(() => {
    setJoined(initialJoined);
    setParticipantCount(initialParticipantCount ?? null);

    if (initialParticipantCount !== undefined) return;

    let active = true;
    void meydanApi<InitiativeResponse>(`/initiatives/${initiativeId}`)
      .then((initiative) => {
        if (!active) return;
        setParticipantCount(initiative.participant_count ?? 0);
        if (initiative.viewer_state) setJoined(Boolean(initiative.viewer_state.joined));
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [initiativeId, initialJoined, initialParticipantCount]);

  const loadMembers = async () => {
    setMembersOpen(true);
    setMembersLoading(true);
    setMembersError("");
    try {
      const result = await meydanApi<ParticipantsResponse>(`/initiatives/${initiativeId}/participants`);
      setMembers(result.items || []);
      setParticipantCount(result.participant_count ?? result.items?.length ?? 0);
    } catch {
      setMembersError("دریافت فهرست افراد انجام نشد.");
    } finally {
      setMembersLoading(false);
    }
  };

  const toggleJoin = async () => {
    if (isToggling) return;

    const previousJoined = joined;
    const previousCount = participantCount;
    const nextJoined = !joined;

    setJoined(nextJoined);
    setParticipantCount((current) => current === null ? current : Math.max(0, current + (nextJoined ? 1 : -1)));
    setIsToggling(true);

    try {
      const result = await meydanApi<JoinResponse>(`/initiatives/${initiativeId}/join`, {
        method: nextJoined ? "PUT" : "DELETE",
      });
      setJoined(Boolean(result.joined));
      setParticipantCount(result.participant_count ?? 0);
      if (membersOpen) void loadMembers();
    } catch (reason) {
      setJoined(previousJoined);
      setParticipantCount(previousCount);
      if (isAuthApiError(reason)) redirectToLogin();
    } finally {
      setIsToggling(false);
    }
  };

  const countLabel = participantCount === null
    ? "در حال دریافت اعضا…"
    : participantCount > 0
      ? `${participantCount.toLocaleString("fa-IR")} نفر پیوسته‌اند`
      : "هنوز کسی نپیوسته است";

  return (
    <>
      <div dir="rtl" className="pointer-events-auto relative z-10 mt-3 w-full overflow-hidden rounded-[16px] border border-warning-border bg-warning-surface/50 px-3 py-3 sm:px-3.5">
        <div aria-hidden="true" className="absolute -left-8 -top-10 h-28 w-28 rounded-full bg-warning/10 blur-3xl" />
        <div className="relative flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-warning/10 text-warning">
            <HandHeart aria-hidden="true" className="h-[19px] w-[19px]" strokeWidth={2} />
          </div>

          <div className="min-w-0 flex-1">
            <strong className="block text-[12px] font-black leading-5 text-warning-foreground sm:text-[13px]">
              شما هم به این کار خوب بپیوندید
            </strong>
            <button type="button" onClick={() => void loadMembers()} className="mt-0.5 inline-flex max-w-full items-center gap-1 text-[10px] leading-5 text-muted-foreground transition-colors hover:text-foreground sm:text-[11px]">
              <UsersRound aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{countLabel}</span>
              {participantCount !== null && participantCount > 0 ? <span className="shrink-0 font-bold text-warning-foreground">مشاهده افراد</span> : null}
            </button>
          </div>

          <button
            type="button"
            onClick={() => void toggleJoin()}
            disabled={isToggling}
            aria-label={joined ? "لغو پیوستن به کار خوب" : "پیوستن به کار خوب"}
            className={`relative z-20 inline-flex h-10 max-w-[42%] shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 text-[11px] font-black shadow-sm transition-all duration-200 active:scale-[0.94] disabled:cursor-wait disabled:opacity-70 sm:px-4 sm:text-[12px] ${
              joined
                ? "border border-success-border bg-success-surface text-success shadow-none"
                : "bg-warning text-on-solid hover:brightness-105"
            }`}
          >
            {isToggling ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : joined ? (
              <Check aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            ) : (
              <Plus aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            )}
            <span className="truncate">{joined ? "پیوسته‌اید" : label || "پیوستن"}</span>
          </button>
        </div>
      </div>

      {membersOpen ? (
        <div role="dialog" aria-modal="true" aria-label="افراد پیوسته به کار خوب" className="fixed inset-0 z-[90] flex items-end justify-center bg-overlay p-3 sm:items-center" onClick={() => setMembersOpen(false)}>
          <div className="w-full max-w-sm overflow-hidden rounded-panel border border-border bg-popover text-popover-foreground shadow-dialog" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-divider px-4 py-3">
              <div>
                <h2 className="text-sm font-black text-foreground">افراد پیوسته به این کار خوب</h2>
                {participantCount !== null ? <p className="mt-0.5 text-[10px] text-muted-foreground">{participantCount.toLocaleString("fa-IR")} نفر</p> : null}
              </div>
              <button type="button" onClick={() => setMembersOpen(false)} aria-label="بستن" className="grid h-10 w-10 place-items-center rounded-full text-icon-muted hover:bg-hover hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60dvh] overflow-y-auto p-2">
              {membersLoading ? (
                <div className="flex items-center justify-center gap-2 px-4 py-10 text-xs text-muted-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin" />در حال دریافت افراد…
                </div>
              ) : membersError ? (
                <p className="px-4 py-8 text-center text-xs text-danger">{membersError}</p>
              ) : members.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-muted-foreground">هنوز کاربری به این کار خوب نپیوسته است.</p>
              ) : (
                <div className="divide-y divide-divider">
                  {members.map((member) => {
                    const actorId = numericActorId(member.id);
                    const href = `/profile/${member.type}/${actorId}` as Route;
                    return (
                      <Link key={`${member.type}-${member.id}`} href={href} onClick={() => setMembersOpen(false)} className="flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-hover">
                        {member.avatar_url ? (
                          <Image src={member.avatar_url} alt="" width={40} height={40} unoptimized={member.avatar_url.startsWith("http")} className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-border" />
                        ) : (
                          <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-muted text-xs font-black text-brand">{member.display_name.slice(0, 1)}</span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate text-xs font-black text-foreground">{member.display_name}</span>
                            {member.verified ? <BadgeCheck aria-label="حساب تأییدشده" className="h-4 w-4 shrink-0 fill-verified text-on-solid" /> : null}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-muted-foreground">{member.type === "square" ? "میدان" : "کاربر میدان"}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
