/* eslint-disable @next/next/no-img-element -- File previews use temporary local blob URLs. */
import { FileText, Mic, Plus, SendHorizontal, Smile, X } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import type { ChatAttachment, ChatMessage, MessageReply } from "../types";
import { AttachmentSheet } from "./AttachmentSheet";

const emojis = ["😀", "😂", "😍", "🥳", "👍", "👏", "🙏", "❤️", "🔥", "✅", "🤝", "🎉", "💚", "😔", "🤔", "📌"];

type MessageInputProps = {
  value: string;
  attachment: ChatAttachment | null;
  replyingTo: MessageReply | null;
  editingMessage: ChatMessage | null;
  notice: string | null;
  isSending: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onAttachmentSelected: (file: File) => void;
  onClearAttachment: () => void;
  onSendSquareLocation: () => void;
  onCancelReply: () => void;
  onCancelEdit: () => void;
};

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} کیلوبایت`;
  return `${(size / (1024 * 1024)).toFixed(1)} مگابایت`;
}

function AttachmentPreview({ attachment }: { attachment: ChatAttachment }) {
  if (attachment.previewUrl && attachment.mimeType.startsWith("image/")) {
    return <img src={attachment.previewUrl} alt="پیش‌نمایش تصویر انتخاب‌شده" className="h-12 w-12 shrink-0 rounded-xl object-cover" />;
  }

  if (attachment.previewUrl && attachment.mimeType.startsWith("video/")) {
    return (
      <video
        src={attachment.previewUrl}
        muted
        playsInline
        preload="metadata"
        aria-label="پیش‌نمایش ویدیوی انتخاب‌شده"
        className="h-12 w-12 shrink-0 rounded-xl bg-black object-cover"
      />
    );
  }

  return <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface-muted text-icon-muted"><FileText className="h-6 w-6" /></span>;
}

export function MessageInput({ value, attachment, replyingTo, editingMessage, notice, isSending, onChange, onSubmit, onAttachmentSelected, onClearAttachment, onSendSquareLocation, onCancelReply, onCancelEdit }: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const hasMessage = Boolean(value.trim()) || Boolean(attachment);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 108)}px`;
  }, [value]);

  const addEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + emoji + value.slice(end));
    setIsEmojiPickerOpen(false);
    requestAnimationFrame(() => {
      textarea?.focus();
      const nextPosition = start + emoji.length;
      textarea?.setSelectionRange(nextPosition, nextPosition);
    });
  };

  const glassPanelClass = "border border-border bg-surface-glass shadow-card backdrop-blur-xl";
  const iconButtonClass = "grid h-9 w-9 place-items-center rounded-full text-icon-muted transition-colors hover:bg-hover hover:text-foreground";

  return (
    <footer className="shrink-0 border-t border-border bg-background px-3 pb-[max(.625rem,env(safe-area-inset-bottom))] pt-2.5">
      {replyingTo || editingMessage ? (
        <div className={`mb-2 flex items-center gap-2 rounded-2xl px-3 py-2 ${glassPanelClass}`}>
          <span className="min-w-0 flex-1 border-r-2 border-info pr-2 text-right"><strong className="block text-[11px] text-info">{editingMessage ? "ویرایش پیام" : `پاسخ به ${replyingTo?.senderName}`}</strong><span className="block truncate text-[10px] text-muted-foreground">{editingMessage?.body ?? replyingTo?.body}</span></span>
          <button type="button" aria-label="لغو" onClick={editingMessage ? onCancelEdit : onCancelReply} className={iconButtonClass}><X className="h-4 w-4" /></button>
        </div>
      ) : null}

      {attachment ? (
        <div className={`mb-2 flex items-center gap-2 rounded-2xl p-2 ${glassPanelClass}`}>
          <AttachmentPreview attachment={attachment} />
          <div className="min-w-0 flex-1 text-right"><p className="truncate text-xs font-semibold text-foreground-secondary">{attachment.name}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{formatFileSize(attachment.size)}</p></div>
          <button type="button" aria-label="حذف فایل انتخاب‌شده" onClick={onClearAttachment} className={iconButtonClass}><X className="h-4 w-4" /></button>
        </div>
      ) : null}

      {/* Reference composer (.ch-cf): «+» and emoji outside, a pill input, a round send button. */}
      <form className="flex items-end gap-2" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
        <button type="button" aria-label="افزودن پیوست" aria-expanded={isAttachmentOpen} onClick={() => setIsAttachmentOpen(true)} className="grid h-[46px] w-10 shrink-0 place-items-center text-icon-muted transition-colors hover:text-foreground"><Plus className="h-[22px] w-[22px]" /></button>
        <span className="relative flex h-[46px] w-10 shrink-0 items-center justify-center">
          <button type="button" aria-label="انتخاب شکلک" aria-expanded={isEmojiPickerOpen} onClick={() => setIsEmojiPickerOpen((open) => !open)} className="grid h-10 w-10 place-items-center text-icon-muted transition-colors hover:text-foreground"><Smile className="h-[22px] w-[22px]" /></button>
          {isEmojiPickerOpen ? <div role="dialog" aria-label="انتخاب شکلک" className="absolute bottom-full right-0 z-20 mb-2 grid w-56 grid-cols-4 gap-1 rounded-panel border border-border bg-popover p-2 shadow-popover backdrop-blur-xl">{emojis.map((emoji) => <button key={emoji} type="button" aria-label={`افزودن ${emoji}`} onClick={() => addEmoji(emoji)} className="grid h-10 w-10 place-items-center rounded-xl text-xl transition-colors hover:bg-hover">{emoji}</button>)}</div> : null}
        </span>
        <textarea id="directChatMessageInput" ref={textareaRef} rows={1} value={value} onChange={(event) => onChange(event.target.value)} placeholder="پیام خود را بنویسید…" className="max-h-[108px] min-h-[46px] min-w-0 flex-1 resize-none overflow-y-auto rounded-[23px] border border-border bg-surface-muted px-[18px] py-[11px] text-[14.5px] leading-6 text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none" />
        <button type="submit" disabled={isSending || !hasMessage} aria-label={hasMessage ? "ارسال پیام" : "ضبط صدا"} className={`grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full transition-[transform,opacity] duration-150 active:scale-[.92] ${hasMessage ? "bg-foreground text-background" : "text-icon-muted"}`}>
          {hasMessage ? <SendHorizontal className="h-5 w-5 rotate-180" /> : <Mic className="h-5 w-5" />}
        </button>
      </form>
      {notice ? <p className="mx-2 mt-1.5 rounded-lg bg-surface-glass px-2 py-1 text-[10px] text-muted-foreground backdrop-blur">{notice}</p> : null}

      {isAttachmentOpen ? (
        <AttachmentSheet
          onClose={() => setIsAttachmentOpen(false)}
          onSelectFile={onAttachmentSelected}
          onSendLocation={onSendSquareLocation}
        />
      ) : null}
    </footer>
  );
}
