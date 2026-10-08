"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, HandHeart } from "lucide-react";
import type { InitiativeParticipant } from "../types";
import { participantProfileHref } from "../services/initiatives.service";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { AccountBadges } from "@/components/shared/AccountBadges";

const typeLabels: Record<InitiativeParticipant["type"], string> = {
  user: "کاربر میدان",
  square: "میدان",
  media: "رسانه",
  collective: "مجموعه",
  organization: "سازمان",
  memorial: "یادبود",
};

function ParticipantRow({ participant }: { participant: InitiativeParticipant }) {
  return (
    <Link
      href={participantProfileHref(participant) as Route}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      {participant.avatarUrl ? (
        <OptimizedAvatar
          src={participant.avatarUrl}
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-border/70"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-muted text-xs font-black text-icon"
        >
          {participant.name.slice(0, 1)}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <strong className="truncate text-sm font-black leading-6 text-foreground">{participant.name}</strong>
          <AccountBadges verified={participant.verified} speaker={participant.verifiedSpeaker} official={participant.verifiedOfficial} kind={participant.type} size="md" />
        </div>
        <p className="mt-0.5 text-[11px] text-foreground-subtle">{typeLabels[participant.type]}</p>
      </div>

      <ChevronLeft aria-hidden="true" className="h-4 w-4 shrink-0 text-icon-muted" />
    </Link>
  );
}

export function ParticipantsView({
  participants,
  participantCount,
}: {
  participants: InitiativeParticipant[];
  participantCount: number;
}) {
  const router = useRouter();
  const handleBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/home");
  };

  return (
    <section className="ui-enter flex min-h-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 flex min-h-12 items-center gap-2 border-b border-border bg-surface-glass px-4 py-2 shadow-xs backdrop-blur-xl">
        <Link
          href="/home"
          onClick={(event) => {
            event.preventDefault();
            handleBack();
          }}
          aria-label="بازگشت"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-icon-muted transition-colors hover:bg-hover hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-black leading-tight text-foreground">افراد پیوسته به این کار</h1>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {participantCount.toLocaleString("fa-IR")} نفر
          </p>
        </div>
      </header>

      <main className="flex-1">
        {participants.length === 0 ? (
          <div className="grid min-h-56 place-items-center px-6 text-center">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-warning-surface text-warning">
                <HandHeart aria-hidden="true" className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-bold text-foreground">هنوز کسی به این کار نپیوسته است</p>
              <p className="mx-auto mt-2 max-w-xs text-xs leading-6 text-foreground-subtle">
                اولین نفری باشید که به این کار می‌پیوندد.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-4 my-4 overflow-hidden rounded-card border border-border bg-card shadow-xs">
            <div className="divide-y divide-divider">
              {participants.map((participant) => (
                <ParticipantRow key={`${participant.type}-${participant.id}`} participant={participant} />
              ))}
            </div>
          </div>
        )}
      </main>
    </section>
  );
}
