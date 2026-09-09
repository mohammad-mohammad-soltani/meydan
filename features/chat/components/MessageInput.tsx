/* eslint-disable @next/next/no-img-element -- File previews use temporary local blob URLs. */
import { FileText, Paperclip, SendHorizontal, Smile, X } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import type { ChatAttachment, ChatMessage, MessageReply } from "../types";

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
  onCancelReply: () => void;
  onCancelEdit: () => void;
};

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} کیلوبایت`;
  return `${(size / (1024 * 1024)).toFixed(1)} مگابایت`;
}

export function MessageInput({ value, attachment, replyingTo, editingMessage, notice, isSending, onChange, onSubmit, onAttachmentSelected, onClearAttachment, onCancelReply, onCancelEdit }: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
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

  return (
    <footer className="shrink-0 bg-transparent px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2">
      {replyingTo || editingMessage ? <div className="mb-2 flex items-center gap-2 rounded-2xl border border-white/65 bg-white/60 px-3 py-2 shadow-[0_8px_24px_rgba(60,90,105,.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#202c33]/75"><span className="min-w-0 flex-1 border-r-2 border-sky-500 pr-2 text-right"><strong className="block text-[11px] text-sky-700 dark:text-sky-300">{editingMessage ? "ویرایش پیام" : `پاسخ به ${replyingTo?.senderName}`}</strong><span className="block truncate text-[10px] text-slate-500 dark:text-[#a9bac4]">{editingMessage?.body ?? replyingTo?.body}</span></span><button type="button" aria-label="لغو" onClick={editingMessage ? onCancelEdit : onCancelReply} className="grid h-8 w-8 place-items-center rounded-full text-slate-500 hover:bg-white/60 dark:text-[#a9bac4] dark:hover:bg-white/10"><X className="h-4 w-4" /></button></div> : null}
      {attachment ? <div className="mb-2 flex items-center gap-2 rounded-2xl border border-white/65 bg-white/60 p-2 shadow-[0_8px_24px_rgba(60,90,105,.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#202c33]/75">
        {attachment.previewUrl ? <img src={attachment.previewUrl} alt="پیش‌نمایش فایل انتخاب‌شده" className="h-12 w-12 rounded-xl object-cover" /> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-[#a9bac4]"><FileText className="h-6 w-6" /></span>}
        <div className="min-w-0 flex-1 text-right"><p className="truncate text-xs font-semibold text-slate-700 dark:text-[#e9edef]">{attachment.name}</p><p className="mt-0.5 text-[10px] text-slate-500 dark:text-[#a9bac4]">{formatFileSize(attachment.size)}</p></div>
        <button type="button" aria-label="حذف فایل انتخاب‌شده" onClick={onClearAttachment} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-white/60 dark:text-[#a9bac4] dark:hover:bg-white/10"><X className="h-4 w-4" /></button>
      </div> : null}
      <form className="flex items-end gap-2" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
        <div className="chat-composer-glass flex min-w-0 flex-1 items-end gap-1 rounded-[22px] border border-white/70 bg-white/60 px-2 shadow-[0_8px_28px_rgba(60,90,105,.14)] backdrop-blur-xl dark:border-white/10 dark:bg-[#202c33]/70 dark:shadow-[0_8px_28px_rgba(0,0,0,.25)]">
          <span className="flex h-11 w-9 shrink-0 items-center justify-center">
            <input ref={fileInputRef} type="file" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) onAttachmentSelected(file); event.target.value = ""; }} />
            <button type="button" aria-label="افزودن فایل" onClick={() => fileInputRef.current?.click()} className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-white/50 dark:text-[#a9bac4] dark:hover:bg-white/10"><Paperclip className="h-5 w-5" /></button>
          </span>
          <textarea id="directChatMessageInput" ref={textareaRef} rows={1} value={value} onChange={(event) => onChange(event.target.value)} placeholder="پیام بنویسید" className="max-h-[108px] min-h-10 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-1 py-2 text-[13px] leading-5 text-slate-800 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 placeholder:text-slate-500 dark:text-[#e9edef] dark:placeholder:text-[#9babb4]" />
          <span className={"relative flex h-11 w-9 shrink-0 items-center justify-center transition-all duration-200 ease-out " + (hasMessage ? "-translate-x-0.5 opacity-100" : "translate-x-0 opacity-100")}>
            <button type="button" aria-label="انتخاب شکلک" aria-expanded={isEmojiPickerOpen} onClick={() => setIsEmojiPickerOpen((open) => !open)} className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-white/50 dark:text-[#a9bac4] dark:hover:bg-white/10"><Smile className="h-5 w-5" /></button>
            {isEmojiPickerOpen ? <div role="dialog" aria-label="انتخاب شکلک" className="absolute bottom-full left-0 z-20 mb-2 grid w-56 grid-cols-4 gap-1 rounded-2xl border border-white/70 bg-white/90 p-2 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#202c33]/95">{emojis.map((emoji) => <button key={emoji} type="button" aria-label={`افزودن ${emoji}`} onClick={() => addEmoji(emoji)} className="grid h-10 w-10 place-items-center rounded-xl text-xl transition hover:bg-slate-100 dark:hover:bg-white/10">{emoji}</button>)}</div> : null}
          </span>
          <span aria-hidden={!hasMessage} className={"flex h-11 shrink-0 items-center justify-center overflow-hidden transition-[width] duration-200 ease-out " + (hasMessage ? "w-9" : "w-0")}>
            <button type="submit" disabled={!hasMessage || isSending} tabIndex={hasMessage ? 0 : -1} aria-label="ارسال پیام" className={"grid h-9 w-9 shrink-0 origin-center place-items-center rounded-full text-[#5c9edb] transition-[transform,opacity] duration-200 ease-out hover:bg-white/50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#8ebfe2] dark:hover:bg-white/10 " + (hasMessage ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-50 opacity-0")}><SendHorizontal className="h-5 w-5 rotate-180" /></button>
          </span>
        </div>
      </form>
      {notice ? <p className="mx-2 mt-1.5 rounded-lg bg-white/70 px-2 py-1 text-[10px] text-slate-600 backdrop-blur dark:bg-[#202c33]/75 dark:text-[#a9bac4]">{notice}</p> : null}
    </footer>
  );
}
