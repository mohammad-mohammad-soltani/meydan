"use client";

import { useCallback, useState } from "react";
import { ArrowRight, Inbox, LoaderCircle, Send } from "lucide-react";
import { isAuthApiError } from "@/lib/meydan-api";
import { InvitationCard } from "./InvitationCard";
import { InviteSpeakerForm } from "./InviteSpeakerForm";
import {
  cancelInvitation,
  createInvitation,
  decideInvitation,
  getInvitableSpeakers,
  getSpeakerInvitations,
} from "../services/speaker-invitations.service";
import type {
  CreateInvitationInput,
  InvitableSpeaker,
  InvitationBox,
  SpeakerCategory,
  SpeakerInvitation,
} from "../types";

const tabs: Array<{ id: InvitationBox; label: string; icon: typeof Inbox }> = [
  { id: "received", label: "دعوت‌های دریافتی", icon: Inbox },
  { id: "sent", label: "دعوت‌های ارسالی", icon: Send },
];

export function SpeakerInvitationsView({
  initialReceived,
  initialSent = [],
  categories = [],
  canInvite = false,
  venue = "",
}: {
  initialReceived: SpeakerInvitation[];
  initialSent?: SpeakerInvitation[];
  categories?: SpeakerCategory[];
  /** Only square accounts may invite; the API enforces this too. */
  canInvite?: boolean;
  /** The inviting square's own address, previewed in the composer. */
  venue?: string;
}) {
  const [box, setBox] = useState<InvitationBox>("received");
  const [received, setReceived] = useState(initialReceived);
  const [sent, setSent] = useState(initialSent);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [composerOpen, setComposerOpen] = useState(false);
  const [speakers, setSpeakers] = useState<InvitableSpeaker[]>([]);
  const [speakersLoading, setSpeakersLoading] = useState(false);
  const [speakersError, setSpeakersError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const items = box === "received" ? received : sent;

  const refresh = useCallback(async (target: InvitationBox) => {
    setIsLoading(true);
    setError(null);
    try {
      const next = await getSpeakerInvitations(target);
      if (target === "received") setReceived(next);
      else setSent(next);
    } catch (reason) {
      if (isAuthApiError(reason)) {
        setError("برای مشاهده دعوت‌ها باید وارد شوید.");
      } else {
        setError("دریافت دعوت‌ها انجام نشد.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data arrives from the server component, so a refetch is only needed
  // when the viewer switches boxes — handled here rather than in an effect.
  const selectBox = (next: InvitationBox) => {
    if (next === box) return;
    setBox(next);
    void refresh(next);
  };

  const loadSpeakers = useCallback(async (query: string) => {
    setSpeakersLoading(true);
    setSpeakersError(null);
    try {
      setSpeakers(await getInvitableSpeakers(query));
    } catch {
      setSpeakersError("دریافت فهرست سخنرانان انجام نشد.");
    } finally {
      setSpeakersLoading(false);
    }
  }, []);

  const openComposer = () => {
    setComposerOpen(true);
    void loadSpeakers("");
  };

  const submitInvitation = async (input: CreateInvitationInput) => {
    setSubmitting(true);
    try {
      await createInvitation(input);
      setComposerOpen(false);
      setBox("sent");
      await refresh("sent");
    } catch (reason) {
      setSpeakersError(isAuthApiError(reason) ? "برای ارسال دعوت باید وارد شوید." : "ثبت دعوت انجام نشد. دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  };

  const decide = async (id: string, status: "accepted" | "rejected") => {
    setBusyId(id);
    setError(null);
    try {
      const updated = await decideInvitation(id, status);
      setReceived((current) => current.map((item) => (item.id === id ? updated : item)));
      // An accepted invitation releases contact details for the inviter's copy too.
      setSent((current) => current.map((item) => (item.id === id ? { ...item, status: updated.status } : item)));
    } catch {
      setError("ثبت پاسخ انجام نشد. دوباره تلاش کنید.");
      await refresh("received");
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const updated = await cancelInvitation(id);
      setSent((current) => current.map((item) => (item.id === id ? updated : item)));
    } catch {
      setError("لغو دعوت انجام نشد.");
      await refresh("sent");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="ui-enter flex min-h-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-surface-glass px-4 pt-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.history.length > 1 && window.history.back()}
            aria-label="بازگشت"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-icon-muted transition-colors hover:bg-hover hover:text-brand"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-sm font-black text-foreground">دعوت‌های سخنرانی</h1>
          {canInvite ? (
            <button
              type="button"
              onClick={openComposer}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-pill bg-brand px-3 text-[11px] font-black text-brand-foreground transition-colors hover:bg-brand-hover"
            >
              <Send className="h-3.5 w-3.5" />
              دعوت جدید
            </button>
          ) : null}
        </div>

        <div role="tablist" aria-label="دعوت‌های دریافتی و ارسالی" className="mt-2.5 flex border-b border-border">
          {tabs.map((tab) => {
            const active = box === tab.id;
            const count = tab.id === "received"
              ? received.filter((item) => item.status === "pending").length
              : sent.length;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectBox(tab.id)}
                className={`relative flex min-h-11 flex-1 items-center justify-center gap-1.5 px-2 text-xs font-black transition-colors ${active ? "text-brand" : "text-foreground-secondary hover:text-foreground"}`}
              >
                <tab.icon aria-hidden="true" className="h-4 w-4" />
                {tab.label}
                {count > 0 ? (
                  <span className="rounded-full bg-brand-muted px-1.5 text-[10px] font-black text-brand">
                    {count.toLocaleString("fa-IR")}
                  </span>
                ) : null}
                {/* One shared indicator sliding between the two columns. */}
                {active ? (
                  <span aria-hidden="true" className="absolute bottom-0 right-0 h-[3px] w-full rounded-full bg-brand" />
                ) : null}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 space-y-2 p-4">
        {error ? (
          <p role="alert" className="rounded-control bg-danger-surface px-3 py-2 text-xs font-bold text-danger-foreground">
            {error}
          </p>
        ) : null}

        {isLoading ? (
          <div className="space-y-2" aria-busy="true" aria-label="در حال دریافت دعوت‌ها">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-24 animate-pulse rounded-card border border-border bg-card" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="grid min-h-56 place-items-center px-6 text-center">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-muted text-brand">
                <Inbox aria-hidden="true" className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-bold text-foreground">
                {box === "received" ? "هنوز دعوت سخنرانی دریافت نکرده‌اید" : "هنوز دعوت سخنرانی ارسال نکرده‌اید"}
              </p>
              <p className="mx-auto mt-2 max-w-xs text-xs leading-6 text-foreground-subtle">
                {box === "received"
                  ? "دعوت‌هایی که برای شما ارسال شود در این بخش نمایش داده می‌شود."
                  : "می‌توانید از دکمه «دعوت جدید» یک سخنران را دعوت کنید."}
              </p>
            </div>
          </div>
        ) : (
          items.map((invitation) => (
            <div key={invitation.id}>
              <InvitationCard
                invitation={invitation}
                perspective={box === "received" ? "speaker" : "inviter"}
                busy={busyId === invitation.id}
                onAccept={box === "received" ? () => void decide(invitation.id, "accepted") : undefined}
                onReject={box === "received" ? () => void decide(invitation.id, "rejected") : undefined}
              />
              {box === "sent" && invitation.status === "pending" ? (
                <button
                  type="button"
                  disabled={busyId === invitation.id}
                  onClick={() => void cancel(invitation.id)}
                  className="mt-1 text-[10px] font-bold text-foreground-subtle transition-colors hover:text-danger-foreground disabled:opacity-60"
                >
                  لغو دعوت
                </button>
              ) : null}
            </div>
          ))
        )}

        {isLoading && items.length > 0 ? (
          <p className="flex items-center justify-center gap-2 py-3 text-[11px] text-muted-foreground">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            به‌روزرسانی…
          </p>
        ) : null}
      </main>

      {composerOpen ? (
        <InviteSpeakerForm
          speakers={speakers}
          speakersLoading={speakersLoading}
          speakersError={speakersError}
          categories={categories}
          venue={venue}
          busy={submitting}
          onSearch={(query) => void loadSpeakers(query)}
          onClose={() => setComposerOpen(false)}
          onSubmit={submitInvitation}
        />
      ) : null}
    </section>
  );
}
