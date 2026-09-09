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

  return <div className={"group relative flex " + (isOwn ? "justify-start" : "justify-end")} onContextMenu={(event) => { event.preventDefault(); openMenu(); }} onPointerDown={longPressStart} onPointerUp={longPressEnd} onPointerCancel={longPressEnd}>
    <article className={"relative max-w-[84%] rounded-2xl px-3 py-2 text-[13px] leading-6 shadow-sm " + (isOwn ? "rounded-tr-md bg-[#d9fdd3] text-[#172b1d] dark:bg-[#005c4b] dark:text-[#e8fff7]" : "rounded-tl-md bg-white text-slate-800 dark:bg-[#202c33] dark:text-[#e9edef]")}>
      <button type="button" aria-label="گزینه‌های پیام" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="absolute left-1 top-1 grid h-7 w-7 place-items-center rounded-full opacity-0 transition hover:bg-black/5 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-white/10"><MoreVertical className="h-4 w-4" /></button>
      {message.forwardedFrom ? <p className="mb-1 text-[10px] font-semibold text-emerald-700/80 dark:text-emerald-200/80">فورواردشده از {message.forwardedFrom}</p> : null}
      {message.replyTo ? <div className={"mb-1.5 border-r-2 pr-2 text-[11px] leading-4 " + (isOwn ? "border-emerald-700/40 text-[#315c44] dark:text-[#b6dac5]" : "border-sky-500/60 text-slate-500 dark:text-[#a9bac4]")}><strong className="block text-[10px]">{message.replyTo.senderName}</strong><span className="block line-clamp-1">{message.replyTo.body}</span></div> : null}
      {message.attachment ? message.attachment.previewUrl ? <img src={message.attachment.previewUrl} alt={message.attachment.name} className="mb-1.5 max-h-64 w-full rounded-xl object-cover" /> : <div className={"mb-1.5 flex items-center gap-2 rounded-xl p-2 " + (isOwn ? "bg-black/5 dark:bg-black/15" : "bg-slate-100 dark:bg-white/5")}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/65 text-slate-500 dark:bg-white/10 dark:text-[#a9bac4]"><FileText className="h-5 w-5" /></span><span className="min-w-0 text-right"><strong className="block truncate text-xs">{message.attachment.name}</strong><small className="block text-[10px] opacity-70">{formatFileSize(message.attachment.size)}</small></span></div> : null}
      {message.body ? <p className="whitespace-pre-wrap">{message.body}</p> : null}
      {message.reactions?.length ? <div className="mt-1 flex flex-wrap gap-1">{message.reactions.map((reaction) => <button key={reaction} type="button" aria-label={`حذف واکنش ${reaction}`} onClick={() => onReact(message.id, reaction)} className="rounded-full bg-white/55 px-1.5 py-0.5 text-xs shadow-sm dark:bg-black/20">{reaction}</button>)}</div> : null}
      <footer className={"mt-0.5 flex items-center justify-end gap-1 text-[10px] leading-4 " + (isOwn ? "text-[#5f7e66] dark:text-[#9ccabc]" : "text-slate-400 dark:text-[#8696a0]")}><time>{message.sentAt}</time>{message.editedAt ? <span>ویرایش‌شده</span> : null}{isOwn ? <StatusIcon className="h-3.5 w-3.5" aria-label={message.status} /> : null}</footer>
    </article>
    {menuOpen ? <><button type="button" aria-label="بستن گزینه‌های پیام" onClick={closeMenu} className="fixed inset-0 z-30 cursor-default" /><div role="menu" aria-label="گزینه‌های پیام" className={"absolute z-40 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl dark:border-white/10 dark:bg-[#23313a] " + (isOwn ? "left-0 bottom-full mb-2" : "right-0 bottom-full mb-2")}>
      <div className="flex items-center justify-around border-b border-slate-100 px-1 pb-1 dark:border-white/10">{quickReactions.map((reaction) => <button key={reaction} type="button" aria-label={`واکنش ${reaction}`} onClick={() => action(() => onReact(message.id, reaction))} className="grid h-9 w-9 place-items-center rounded-full text-lg hover:bg-slate-100 dark:hover:bg-white/10">{reaction}</button>)}</div>
      <button role="menuitem" type="button" onClick={() => action(() => onReply(message))} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-xs hover:bg-slate-100 dark:hover:bg-white/10"><CornerUpRight className="h-4 w-4" />پاسخ</button>
      <button role="menuitem" type="button" onClick={() => action(() => onCopy(message))} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-xs hover:bg-slate-100 dark:hover:bg-white/10"><Copy className="h-4 w-4" />کپی</button>
      <button role="menuitem" type="button" onClick={() => action(() => onForward(message))} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-xs hover:bg-slate-100 dark:hover:bg-white/10"><Forward className="h-4 w-4" />فوروارد</button>
      {isOwn ? <button role="menuitem" type="button" onClick={() => action(() => onEdit(message))} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-xs hover:bg-slate-100 dark:hover:bg-white/10"><Pencil className="h-4 w-4" />ویرایش</button> : null}
      <button role="menuitem" type="button" onClick={() => action(() => onDelete(message))} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-xs text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"><Trash2 className="h-4 w-4" />{isOwn ? "حذف پیام" : "حذف برای من"}</button>
    </div></> : null}
  </div>;
}
