/* eslint-disable @next/next/no-img-element -- Message attachments use temporary local blob URLs. */
import { CheckCheck, Clock3, Copy, CornerUpRight, FileText, Forward, MoreVertical, Pencil, Trash2, TriangleAlert } from "lucide-react";
import { useRef, useState } from "react";
import type { ChatMessage, MessageStatus } from "../types";

const statusIcon: Record<MessageStatus, typeof CheckCheck> = { sending: Clock3, sent: CheckCheck, failed: TriangleAlert };
const quickReactions = ["👍", "❤️", "😂", "🔥"];

type MessageBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
  onReply: (message: ChatMessage) => void;
  onCopy: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
  onForward: (message: ChatMessage) => void;
  onReact: (messageId: string, reaction: string) => void;
};

function formatFileSize(size: number) { return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} کیلوبایت` : `${(size / (1024 * 1024)).toFixed(1)} مگابایت`; }

export function MessageBubble({ message, isOwn, onReply, onCopy, onEdit, onDelete, onForward, onReact }: MessageBubbleProps) {
  const StatusIcon = statusIcon[message.status];
  const [menuOpen, setMenuOpen] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const closeMenu = () => { if (longPressTimer.current) window.clearTimeout(longPressTimer.current); setMenuOpen(false); };
  const openMenu = () => setMenuOpen(true);
  const action = (callback: () => void) => { callback(); closeMenu(); };
  const longPressStart = () => { longPressTimer.current = window.setTimeout(openMenu, 480); };
  const longPressEnd = () => { if (longPressTimer.current) window.clearTimeout(longPressTimer.current); };

  return (
    <div className={`group relative flex ${isOwn ? "justify-start" : "justify-end"}`} onContextMenu={(event) => { event.preventDefault(); openMenu(); }} onPointerDown={longPressStart} onPointerUp={longPressEnd} onPointerCancel={longPressEnd}>
      <article className={`relative max-w-[84%] rounded-2xl px-3 py-2 text-[13px] leading-6 shadow-sm ${isOwn ? "rounded-tr-md bg-message-own text-message-own-foreground" : "rounded-tl-md bg-message-peer text-message-peer-foreground"}`}>
        <button type="button" aria-label="گزینه‌های پیام" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="absolute left-1 top-1 grid h-7 w-7 place-items-center rounded-full opacity-0 transition hover:bg-hover focus:opacity-100 group-hover:opacity-100"><MoreVertical className="h-4 w-4" /></button>
        {message.forwardedFrom ? <p className="mb-1 text-[10px] font-semibold text-success">فورواردشده از {message.forwardedFrom}</p> : null}
        {message.replyTo ? <div className={`mb-1.5 border-r-2 pr-2 text-[11px] leading-4 ${isOwn ? "border-success-border text-message-meta" : "border-info-border text-message-meta"}`}><strong className="block text-[10px]">{message.replyTo.senderName}</strong><span className="block line-clamp-1">{message.replyTo.body}</span></div> : null}
        {message.attachment ? message.attachment.previewUrl ? <img src={message.attachment.previewUrl} alt={message.attachment.name} className="mb-1.5 max-h-64 w-full rounded-xl object-cover" /> : <div className="mb-1.5 flex items-center gap-2 rounded-xl bg-active p-2"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-glass text-icon-muted"><FileText className="h-5 w-5" /></span><span className="min-w-0 text-right"><strong className="block truncate text-xs">{message.attachment.name}</strong><small className="block text-[10px] opacity-70">{formatFileSize(message.attachment.size)}</small></span></div> : null}
        {message.body ? <p className="whitespace-pre-wrap">{message.body}</p> : null}
        {message.reactions?.length ? <div className="mt-1 flex flex-wrap gap-1">{message.reactions.map((reaction) => <button key={reaction} type="button" aria-label={`حذف واکنش ${reaction}`} onClick={() => onReact(message.id, reaction)} className="rounded-full bg-surface-glass px-1.5 py-0.5 text-xs shadow-xs">{reaction}</button>)}</div> : null}
        <footer className="mt-0.5 flex items-center justify-end gap-1 text-[10px] leading-4 text-message-meta"><time>{message.sentAt}</time>{message.editedAt ? <span>ویرایش‌شده</span> : null}{isOwn ? <StatusIcon className="h-3.5 w-3.5" aria-label={message.status} /> : null}</footer>
      </article>

      {menuOpen ? (
        <>
          <button type="button" aria-label="بستن گزینه‌های پیام" onClick={closeMenu} className="fixed inset-0 z-30 cursor-default" />
          <div role="menu" aria-label="گزینه‌های پیام" className={`absolute z-40 w-52 overflow-hidden rounded-panel border border-border bg-popover p-1 text-popover-foreground shadow-popover ${isOwn ? "left-0 bottom-full mb-2" : "right-0 bottom-full mb-2"}`}>
            <div className="flex items-center justify-around border-b border-divider px-1 pb-1">{quickReactions.map((reaction) => <button key={reaction} type="button" aria-label={`واکنش ${reaction}`} onClick={() => action(() => onReact(message.id, reaction))} className="grid h-9 w-9 place-items-center rounded-full text-lg hover:bg-hover">{reaction}</button>)}</div>
            <button role="menuitem" type="button" onClick={() => action(() => onReply(message))} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-xs hover:bg-hover"><CornerUpRight className="h-4 w-4" />پاسخ</button>
            <button role="menuitem" type="button" onClick={() => action(() => onCopy(message))} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-xs hover:bg-hover"><Copy className="h-4 w-4" />کپی</button>
            <button role="menuitem" type="button" onClick={() => action(() => onForward(message))} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-xs hover:bg-hover"><Forward className="h-4 w-4" />فوروارد</button>
            {isOwn ? <button role="menuitem" type="button" onClick={() => action(() => onEdit(message))} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-xs hover:bg-hover"><Pencil className="h-4 w-4" />ویرایش</button> : null}
            <button role="menuitem" type="button" onClick={() => action(() => onDelete(message))} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-xs text-danger hover:bg-danger-surface"><Trash2 className="h-4 w-4" />{isOwn ? "حذف پیام" : "حذف برای من"}</button>
          </div>
        </>
      ) : null}
    </div>
  );
}
