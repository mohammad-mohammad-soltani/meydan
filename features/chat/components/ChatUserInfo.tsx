"use client";

import { chatAvatar } from "@/components/shared/generated-media";
import { ArrowRight, AtSign, Bell, BellOff, ExternalLink, FileText, Link2, MessageCircle, Music2, Play } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { attachmentSource, classifyChatAttachment, collectConversationSharedItems, participantProfileHref } from "../chat-utils";
import type { ChatMessage, Conversation } from "../types";

type Tab = "media" | "files" | "links";

export function ChatUserInfo({
  conversation,
  messages,
  muted,
  isLeaving = false,
  onBack,
  onChat,
  onToggleMute,
  onOpenProfile,
}: {
  conversation: Conversation;
  messages: ChatMessage[];
  muted: boolean;
  isLeaving?: boolean;
  onBack: () => void;
  onChat: () => void;
  onToggleMute: () => void;
  onOpenProfile: (href: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("media");
  const { participant } = conversation;
  const avatar = participant.avatarUrl || chatAvatar(participant.avatarTone);
  const shared = useMemo(() => collectConversationSharedItems(messages), [messages]);
  const profileHref = participantProfileHref(participant);

  return (
    <section className={`flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background ${isLeaving ? "ui-view-leave" : "ui-view-enter"}`} aria-label={`اطلاعات ${participant.name}`}>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface-glass px-3 backdrop-blur-md">
        <button type="button" onClick={onBack} disabled={isLeaving} aria-label="بازگشت به گفتگو" className="grid h-10 w-10 place-items-center rounded-full text-icon hover:bg-hover disabled:text-disabled-foreground"><ArrowRight className="h-6 w-6" /></button>
        <strong className="text-sm font-bold text-foreground">اطلاعات کاربر</strong>
        <button type="button" onClick={() => onOpenProfile(profileHref)} className="grid h-10 w-10 place-items-center rounded-full text-verified hover:bg-hover" aria-label="نمایش صفحه اصلی"><ExternalLink className="h-5 w-5" /></button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
        <section className="px-5 pb-6 pt-6 text-center">
          <Image src={avatar} alt={participant.name} width={176} height={176} unoptimized={typeof avatar === "string" && avatar.startsWith("http")} className="mx-auto h-40 w-40 rounded-full object-cover shadow-lg sm:h-44 sm:w-44" />
          <div className="mt-4 flex items-center justify-center gap-1.5"><h1 className="text-xl font-black text-foreground sm:text-2xl">{participant.name}</h1></div>
          <p className={`mt-1 text-sm ${participant.isOnline ? "text-verified" : "text-muted-foreground"}`}>{participant.isOnline ? "آنلاین" : "آخرین بازدید اخیراً"}</p>

          <div className="mx-auto mt-5 grid w-full max-w-sm grid-cols-2 gap-2">
            <button type="button" onClick={onChat} disabled={isLeaving} className="flex items-center justify-center gap-2 rounded-2xl bg-verified px-4 py-3 text-sm font-bold text-on-solid shadow-sm hover:opacity-90 disabled:opacity-60"><MessageCircle className="h-5 w-5" /><span>پیام</span></button>
            <button type="button" onClick={() => onOpenProfile(profileHref)} className="flex items-center justify-center gap-2 rounded-2xl bg-surface-muted px-4 py-3 text-sm font-bold text-foreground hover:bg-hover"><ExternalLink className="h-5 w-5" /><span>صفحه اصلی</span></button>
          </div>
        </section>

        <div className="w-full flex justify-center">
          <section className="mx-4 overflow-hidden rounded-[1.6rem] border border-border bg-surface shadow-sm w-9/10">
            <div className="flex items-center gap-3 border-b border-divider px-4 py-3.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-info-surface text-info"><AtSign className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1 text-right"><strong className="block truncate text-sm text-foreground">{participant.handle}</strong><small className="text-xs text-muted-foreground">نام کاربری</small></div>
            </div>
            <button type="button" onClick={onToggleMute} className="flex w-full items-center gap-3 px-4 py-3.5 text-right hover:bg-hover">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${muted ? "bg-danger-surface text-danger" : "bg-success-surface text-success"}`}>{muted ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}</span>
              <span className="min-w-0 flex-1"><strong className="block text-sm text-foreground">اعلان‌ها</strong><small className="text-xs text-muted-foreground">{muted ? "بی‌صدا" : "فعال"}</small></span>
              <span aria-hidden="true" className={`relative h-7 w-12 rounded-full transition-colors ${muted ? "bg-surface-muted" : "bg-verified"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${muted ? "right-1" : "right-6"}`} /></span>
            </button>
          </section>
        </div>

        <section className="mt-5 border-t border-divider">
          <div className="sticky top-0 z-10 mx-auto grid max-w-2xl grid-cols-3 bg-background/95 p-2 backdrop-blur">
            {(["media", "files", "links"] as const).map((item) => {
              const label = item === "media" ? "رسانه" : item === "files" ? "فایل‌ها" : "پیوندها";
              const count = shared[item].length;
              return <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-xl px-2 py-2.5 text-xs font-bold transition ${tab === item ? "bg-active text-verified" : "text-muted-foreground hover:bg-hover"}`}>{label}{count ? ` (${count.toLocaleString("fa-IR")})` : ""}</button>;
            })}
          </div>

          <div className="mx-auto min-h-56 max-w-2xl p-2 sm:p-3">
            {tab === "media" ? (
              shared.media.length ? <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">{shared.media.map((item) => {
                const source = attachmentSource(item.attachment);
                const kind = classifyChatAttachment({ mimeType: item.attachment.mimeType });
                return <a key={item.id} href={source || undefined} target={source ? "_blank" : undefined} rel="noreferrer" className="relative aspect-square overflow-hidden rounded-lg bg-surface-muted">{kind === "image" && source ? <img src={source} alt={item.attachment.name || "رسانه"} className="h-full w-full object-cover" /> : kind === "video" && source ? <><video src={source} muted preload="metadata" className="h-full w-full object-cover" /><span className="absolute inset-0 grid place-items-center bg-black/20 text-white"><Play className="h-7 w-7 fill-current" /></span></> : null}</a>;
              })}</div> : <EmptyState icon={<Play className="h-6 w-6" />} text="هنوز عکس یا ویدیویی در این گفتگو نیست." />
            ) : null}

            {tab === "files" ? (
              shared.files.length ? <div className="space-y-1">{shared.files.map((item) => {
                const source = attachmentSource(item.attachment);
                const audio = classifyChatAttachment({ mimeType: item.attachment.mimeType }) === "audio";
                return <a key={item.id} href={source || undefined} target={source ? "_blank" : undefined} rel="noreferrer" className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-hover"><span className="grid h-11 w-11 place-items-center rounded-xl bg-active text-verified">{audio ? <Music2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}</span><span className="min-w-0 flex-1 text-right"><strong className="block truncate text-xs text-foreground">{item.attachment.name || "فایل"}</strong><small className="text-[10px] text-muted-foreground">{audio ? "صوت" : "فایل"}</small></span></a>;
              })}</div> : <EmptyState icon={<FileText className="h-6 w-6" />} text="هنوز فایلی در این گفتگو نیست." />
            ) : null}

            {tab === "links" ? (
              shared.links.length ? <div className="space-y-1">{shared.links.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-hover"><span className="grid h-11 w-11 place-items-center rounded-xl bg-info-surface text-info"><Link2 className="h-5 w-5" /></span><span dir="ltr" className="min-w-0 flex-1 truncate text-left text-xs text-verified">{item.url}</span></a>)}</div> : <EmptyState icon={<Link2 className="h-6 w-6" />} text="هنوز پیوندی در این گفتگو نیست." />
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="grid min-h-48 place-items-center text-center text-muted-foreground"><div><span className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-surface-muted">{icon}</span><p className="text-xs">{text}</p></div></div>;
}
