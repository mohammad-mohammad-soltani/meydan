"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, LoaderCircle, Send, UserRoundX } from "lucide-react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { isAuthApiError } from "@/lib/meydan-api";
import { InviteSpeakerForm } from "./InviteSpeakerForm";
import { createInvitation } from "../services/speaker-invitations.service";
import type { CreateInvitationInput, InvitableSpeaker } from "../types";

export type SpeakerInviteTarget = {
  /** Linked user account id — invitations are addressed to user accounts. */
  userId?: string | null;
  name: string;
  avatarUrl?: string;
  expertise?: string;
  categories?: InvitableSpeaker["categories"];
  verifiedSpeaker?: boolean;
};

const toneClasses = {
  soft: "border border-brand-border bg-brand-muted text-brand hover:bg-brand hover:text-brand-foreground",
  solid: "bg-brand text-brand-foreground hover:bg-brand-hover",
  ghost: "border border-border bg-surface text-foreground-secondary hover:bg-hover hover:text-brand",
} as const;

const sizeClasses = {
  sm: "min-h-8 gap-1.5 px-3 text-[11px]",
  md: "min-h-10 gap-1.5 px-4 text-xs",
} as const;

/**
 * The single entry point for inviting a speaker, used by the speaker directory
 * and by a speaker's public profile. The square-only rule is enforced by the
 * API; this component just routes guests to login and explains the rule to
 * signed-in accounts that are not squares.
 */
export function SpeakerInviteButton({
  speaker,
  canInvite,
  venue = "",
  initiativeId,
  tone = "soft",
  size = "sm",
  className = "",
  showIcon = true,
  onInvited,
}: {
  speaker: SpeakerInviteTarget;
  /** True only for the signed-in square that owns the invitation venue. */
  canInvite: boolean;
  venue?: string;
  initiativeId?: string;
  tone?: keyof typeof toneClasses;
  size?: keyof typeof sizeClasses;
  className?: string;
  showIcon?: boolean;
  onInvited?: () => void;
}) {
  const { requireAuth } = useAuthGate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const target: InvitableSpeaker | null = speaker.userId
    ? {
        userId: String(speaker.userId),
        creatorId: "",
        name: speaker.name,
        avatarUrl: speaker.avatarUrl,
        role: "",
        expertise: speaker.expertise || "",
        categories: speaker.categories || [],
        verifiedSpeaker: Boolean(speaker.verifiedSpeaker),
      }
    : null;

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const start = () => {
    if (!target) return;
    if (!requireAuth()) return;
    if (!canInvite) {
      setNotice("دعوت سخنران فقط از حساب میدان امکان‌پذیر است.");
      return;
    }
    setError(null);
    setOpen(true);
  };

  const submit = async (input: CreateInvitationInput) => {
    setBusy(true);
    setError(null);
    try {
      await createInvitation(input);
      setOpen(false);
      setNotice(`دعوت‌نامه برای ${speaker.name} ارسال شد.`);
      onInvited?.();
    } catch (reason) {
      setError(
        isAuthApiError(reason)
          ? "برای ارسال دعوت باید با حساب میدان وارد شوید."
          : "ثبت دعوت انجام نشد. دوباره تلاش کنید.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (!target) {
    return (
      <span
        title="این سخنران هنوز حساب کاربری متصل ندارد."
        className={`inline-flex shrink-0 cursor-not-allowed items-center justify-center rounded-pill border border-border bg-surface-muted font-black text-disabled-foreground ${sizeClasses[size]} ${className}`}
      >
        <UserRoundX aria-hidden="true" className="h-3.5 w-3.5" />
        بدون حساب
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`inline-flex shrink-0 items-center justify-center rounded-pill font-black transition-colors disabled:opacity-60 ${toneClasses[tone]} ${sizeClasses[size]} ${className}`}
      >
        {busy ? (
          <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
        ) : showIcon ? (
          <Send aria-hidden="true" className="h-3.5 w-3.5" />
        ) : null}
        دعوت
      </button>

      {open ? (
        <InviteSpeakerForm
          presetSpeaker={target}
          venue={venue}
          initiativeId={initiativeId}
          busy={busy}
          submitError={error}
          onClose={() => {
            setOpen(false);
            setError(null);
          }}
          onSubmit={submit}
        />
      ) : null}

      {notice
        ? createPortal(
            <p
              role="status"
              aria-live="polite"
              className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[110] flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-solid-dark px-4 py-2.5 text-xs font-bold text-on-solid shadow-dialog lg:bottom-5"
            >
              <Check aria-hidden="true" className="h-4 w-4 text-success" />
              {notice}
            </p>,
            document.body,
          )
        : null}
    </>
  );
}
