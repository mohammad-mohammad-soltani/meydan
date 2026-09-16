/* eslint-disable @next/next/no-img-element -- File previews use temporary local blob URLs. */
import { FileText, Paperclip, SendHorizontal, Smile, X } from "lucide-react";
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
    <footer className="shrink-0 bg-transparent px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2">
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

      <form className="flex items-end gap-2" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
        <div className={`flex min-w-0 flex-1 items-end gap-1 rounded-[22px] px-2 ${glassPanelClass}`}>
          <span className="flex h-11 w-9 shrink-0 items-center justify-center">
            <button type="button" aria-label="افزودن پیوست" aria-expanded={isAttachmentOpen} onClick={() => setIsAttachmentOpen(true)} className={iconButtonClass}><Paperclip className="h-5 w-5" /></button>
          </span>
          <textarea id="directChatMessageInput" ref={textareaRef} rows={1} value={value} onChange={(event) => onChange(event.target.value)} placeholder="پیام بنویسید" className="max-h-[108px] min-h-10 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-1 py-2 text-[13px] leading-5 text-foreground outline-none placeholder:text-placeholder focus-visible:outline-none" />
          <span className={`relative flex h-11 w-9 shrink-0 items-center justify-center transition-all duration-200 ease-out ${hasMessage ? "-translate-x-0.5 opacity-100" : "translate-x-0 opacity-100"}`}>
            <button type="button" aria-label="انتخاب شکلک" aria-expanded={isEmojiPickerOpen} onClick={() => setIsEmojiPickerOpen((open) => !open)} className={iconButtonClass}><Smile className="h-5 w-5" /></button>
            {isEmojiPickerOpen ? <div role="dialog" aria-label="انتخاب شکلک" className="absolute bottom-full left-0 z-20 mb-2 grid w-56 grid-cols-4 gap-1 rounded-panel border border-border bg-popover p-2 shadow-popover backdrop-blur-xl">{emojis.map((emoji) => <button key={emoji} type="button" aria-label={`افزودن ${emoji}`} onClick={() => addEmoji(emoji)} className="grid h-10 w-10 place-items-center rounded-xl text-xl transition-colors hover:bg-hover">{emoji}</button>)}</div> : null}
          </span>
          <span aria-hidden={!hasMessage} className={`flex h-11 shrink-0 items-center justify-center overflow-hidden transition-[width] duration-200 ease-out ${hasMessage ? "w-9" : "w-0"}`}>
            <button type="submit" disabled={!hasMessage || isSending} tabIndex={hasMessage ? 0 : -1} aria-label="ارسال پیام" className={`grid h-9 w-9 shrink-0 origin-center place-items-center rounded-full bg-brand text-brand-foreground shadow-card transition-[transform,opacity,background-color] duration-200 ease-out hover:bg-brand-hover active:scale-95 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground ${hasMessage ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-50 opacity-0"}`}><SendHorizontal className="h-5 w-5 rotate-180" /></button>
          </span>
        </div>
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
