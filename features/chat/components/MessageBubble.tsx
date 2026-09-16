import { CheckCheck, Clock3, Copy, CornerUpRight, Forward, MapPin, MoreVertical, Pencil, Trash2, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { parseSquareLocationMessage } from "../chat-utils";
import { chatUploadKey, subscribeToChatUploadProgress, type ChatUploadProgressDetail } from "../chat-upload-progress";
import { MediaGallery } from "@/features/media/components/MediaGallery";
import { mediaItemFromNamedAttachment } from "@/features/media/media-utils";
import {
  getMessageActionButtonClass,
  getMessageMenuPosition,
  MESSAGE_MENU_HEIGHT,
  MESSAGE_MENU_WIDTH,
} from "../message-menu";
import type { ChatAttachment, ChatMessage, MessageStatus } from "../types";

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

type MenuPosition = { x: number; y: number };

function faPercent(value: number): string {
  return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(Math.round(value))}٪`;
}

function MessageAttachment({ attachment, scope, transfer }: { attachment: ChatAttachment; scope: string; transfer: ChatUploadProgressDetail | null }) {
  const isVisual = /^(image|video)\//i.test(attachment.mimeType);
  const progress = Math.min(100, Math.max(0, transfer?.progress ?? 0));

  return (
    <div className="relative mb-1 overflow-hidden rounded-xl">
      <MediaGallery
        items={[mediaItemFromNamedAttachment(attachment)]}
        scope={scope}
        tone="bubble"
      />

      {transfer && isVisual ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/45 text-white backdrop-blur-[1px]">
          <div className="relative grid h-16 w-16 place-items-center">
            <svg aria-hidden="true" className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/25" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                pathLength="100"
                strokeDasharray="100"
                strokeDashoffset={100 - progress}
                className="text-white transition-[stroke-dashoffset] duration-150"
              />
            </svg>
            <span className="relative text-xs font-black tabular-nums">{faPercent(progress)}</span>
          </div>
          <span className="rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm">
            {transfer.phase === "processing" ? "در حال پردازش ویدیو…" : "در حال آپلود…"}
          </span>
        </div>
      ) : null}

      {transfer && !isVisual ? (
        <div className="border-t border-white/10 bg-black/10 px-2 py-1.5">
          <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-message-meta">
            <span>{transfer.phase === "processing" ? "در حال پردازش…" : "در حال آپلود…"}</span>
            <span className="tabular-nums">{faPercent(progress)}</span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/15">
            <span className="block h-full rounded-full bg-current transition-[width] duration-150" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** A shared square location renders as a map card instead of raw text. */
function MessageLocationCard({ location }: { location: NonNullable<ReturnType<typeof parseSquareLocationMessage>> }) {
  const card = (
    <div className="mb-1.5 min-w-[220px] overflow-hidden rounded-xl bg-active">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground">
          <MapPin aria-hidden="true" className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-xs font-black">موقعیت میدان · {location.name}</strong>
          <small className="mt-0.5 block truncate text-[10px] opacity-70">
            {location.address || "موقعیت روی نقشه"}
          </small>
        </span>
      </div>
      {location.url ? (
        <span className="block border-t border-divider px-3 py-1.5 text-center text-[10px] font-black text-brand">
          مشاهده روی نقشه
        </span>
      ) : null}
    </div>
  );

  if (!location.url) return card;

  return (
    <a
      href={location.url}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      className="block outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {card}
    </a>
  );
}

export function MessageBubble({ message, isOwn, onReply, onCopy, onEdit, onDelete, onForward, onReact }: MessageBubbleProps) {
  const StatusIcon = statusIcon[message.status];
  const location = parseSquareLocationMessage(message.body);
  const isVisualAttachment = Boolean(message.attachment && /^(image|video)\//i.test(message.attachment.mimeType));
  const hasAttachment = Boolean(message.attachment);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ x: 8, y: 8 });
  const [transfer, setTransfer] = useState<ChatUploadProgressDetail | null>(() =>
    message.status === "sending" && message.attachment
      ? { key: chatUploadKey(message.attachment.name, message.attachment.size), progress: 0, phase: "uploading" }
      : null,
  );
  const longPressTimer = useRef<number | null>(null);

  useEffect(() => {
    const attachment = message.attachment;
    if (message.status !== "sending" || !attachment) {
      setTransfer(null);
      return;
    }

    const key = chatUploadKey(attachment.name, attachment.size);
    setTransfer((current) => current?.key === key ? current : { key, progress: 0, phase: "uploading" });

    return subscribeToChatUploadProgress((detail) => {
      if (detail.key === key) setTransfer(detail);
    });
  }, [message.attachment, message.status]);

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const closeMenu = () => {
    clearLongPress();
    setMenuOpen(false);
  };

  const openMenuAt = (x: number, y: number) => {
    setMenuPosition(getMessageMenuPosition({
      x,
      y,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      menuWidth: MESSAGE_MENU_WIDTH,
      menuHeight: MESSAGE_MENU_HEIGHT,
    }));
    setMenuOpen(true);
  };

  const openMenuFromButton = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = isOwn
      ? rect.left - MESSAGE_MENU_WIDTH - 8
      : rect.right + 8;
    openMenuAt(x, rect.top);
  };

  const handleContextMenu = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    openMenuAt(event.clientX, event.clientY);
  };

  const longPressStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    clearLongPress();
    const { clientX, clientY } = event;
    longPressTimer.current = window.setTimeout(() => openMenuAt(clientX, clientY), 480);
  };

  const longPressEnd = () => clearLongPress();
  const action = (callback: () => void) => { callback(); closeMenu(); };

  return (
    <div className={`relative flex ${isOwn ? "justify-start" : "justify-end"}`}>
      <div
        className={`group relative ${
          isVisualAttachment
            ? "w-[min(78vw,20rem)] max-w-[84%]"
            : hasAttachment
              ? "w-[min(74vw,18rem)] max-w-[84%]"
              : "max-w-[84%]"
        }`}
        onContextMenu={handleContextMenu}
        onPointerDown={longPressStart}
        onPointerUp={longPressEnd}
        onPointerCancel={longPressEnd}
        onPointerMove={longPressEnd}
      >
        <article className={`rounded-2xl text-[13px] leading-6 shadow-sm ${hasAttachment ? "px-2 py-2" : "px-3 py-2"} ${isOwn ? "rounded-tr-md bg-message-own text-message-own-foreground" : "rounded-tl-md bg-message-peer text-message-peer-foreground"}`}>
          {message.forwardedFrom ? <p className="mb-1 text-[10px] font-semibold text-success">فورواردشده از {message.forwardedFrom}</p> : null}
          {message.replyTo ? <div className={`mb-1.5 border-r-2 pr-2 text-[11px] leading-4 ${isOwn ? "border-success-border text-message-meta" : "border-info-border text-message-meta"}`}><strong className="block text-[10px]">{message.replyTo.senderName}</strong><span className="block line-clamp-1">{message.replyTo.body}</span></div> : null}
          {message.attachment ? <MessageAttachment attachment={message.attachment} scope={`chat:${message.id}`} transfer={transfer} /> : null}
          {location ? (
            <MessageLocationCard location={location} />
          ) : message.body ? (
            <p className={`whitespace-pre-wrap ${hasAttachment ? "px-1 pt-1" : ""}`}>{message.body}</p>
          ) : null}
          {message.reactions?.length ? <div className="mt-1 flex flex-wrap gap-1">{message.reactions.map((reaction) => <button key={reaction} type="button" aria-label={`حذف واکنش ${reaction}`} onClick={() => onReact(message.id, reaction)} className="rounded-full bg-surface-glass px-1.5 py-0.5 text-xs shadow-xs">{reaction}</button>)}</div> : null}
          <footer className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] leading-4 text-message-meta ${hasAttachment ? "px-1" : ""}`}><time>{message.sentAt}</time>{message.editedAt ? <span>ویرایش‌شده</span> : null}{isOwn ? <StatusIcon className="h-3.5 w-3.5" aria-label={message.status} /> : null}</footer>
        </article>

        <button
          type="button"
          aria-label="گزینه‌های پیام"
          aria-expanded={menuOpen}
          onClick={openMenuFromButton}
          className={getMessageActionButtonClass(isOwn)}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {menuOpen
        ? createPortal(
            <>
              <button type="button" aria-label="بستن گزینه‌های پیام" onClick={closeMenu} className="fixed inset-0 z-30 cursor-default" />
              <div
                role="menu"
                aria-label="گزینه‌های پیام"
                className="fixed z-40 w-52 overflow-hidden rounded-panel border border-border bg-popover p-1 text-popover-foreground shadow-popover"
                style={{ left: menuPosition.x, top: menuPosition.y }}
              >
                <div className="flex items-center justify-around border-b border-divider px-1 pb-1">{quickReactions.map((reaction) => <button key={reaction} type="button" aria-label={`واکنش ${reaction}`} onClick={() => action(() => onReact(message.id, reaction))} className="grid h-9 w-9 place-items-center rounded-full text-lg hover:bg-hover">{reaction}</button>)}</div>
                <button role="menuitem" type="button" onClick={() => action(() => onReply(message))} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-xs hover:bg-hover"><CornerUpRight className="h-4 w-4" />پاسخ</button>
                <button role="menuitem" type="button" onClick={() => action(() => onCopy(message))} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-xs hover:bg-hover"><Copy className="h-4 w-4" />کپی</button>
                <button role="menuitem" type="button" onClick={() => action(() => onForward(message))} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-xs hover:bg-hover"><Forward className="h-4 w-4" />فوروارد</button>
                {isOwn ? <button role="menuitem" type="button" onClick={() => action(() => onEdit(message))} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-xs hover:bg-hover"><Pencil className="h-4 w-4" />ویرایش</button> : null}
                {isOwn ? <button role="menuitem" type="button" onClick={() => action(() => onDelete(message))} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-xs text-danger hover:bg-danger-surface"><Trash2 className="h-4 w-4" />حذف پیام</button> : null}
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
