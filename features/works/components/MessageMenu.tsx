"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

export type MenuPoint = { x: number; y: number };

export type MenuReaction = { emoji: string; mine: boolean };

/**
 * One context menu for every message action (desktop right-click / ⋯ button, mobile tap).
 * Floats at a point, flips and shifts to stay inside the viewport, closes on outside press / Escape.
 */
export function MessageMenu({
  point,
  reactions,
  canReply,
  canEdit,
  canCopy,
  onReact,
  onReply,
  onCopy,
  onEdit,
  onDelete,
  onClose,
}: {
  point: MenuPoint;
  reactions: MenuReaction[] | null;
  canReply: boolean;
  canEdit: boolean;
  canCopy: boolean;
  onReact: (emoji: string, mine: boolean) => void;
  onReply: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; origin: string; visible: boolean }>({ top: 0, left: 0, origin: "top right", visible: false });
  const [confirm, setConfirm] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const margin = 10;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Prefer opening down/right-to-left (RTL app) from the point; flip when there is no room.
    let left = point.x - w;
    let originX = "right";
    if (left < margin) {
      left = point.x;
      originX = "left";
    }
    left = Math.max(margin, Math.min(left, vw - w - margin));
    let top = point.y;
    let originY = "top";
    if (top + h > vh - margin) {
      top = point.y - h;
      originY = "bottom";
    }
    top = Math.max(margin, Math.min(top, vh - h - margin));
    setPos({ top, left, origin: `${originY} ${originX}`, visible: true });
  }, [point, confirm]);

  useEffect(() => {
    const down = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const items = Array.from(ref.current?.querySelectorAll<HTMLElement>("[role^=menuitem]") ?? []);
        if (!items.length) return;
        e.preventDefault();
        const i = items.indexOf(document.activeElement as HTMLElement);
        items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
      }
    };
    const dismiss = () => onClose();
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("keydown", key);
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", dismiss, true);
    return () => {
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("keydown", key);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("scroll", dismiss, true);
    };
  }, [onClose]);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("[role^=menuitem]")?.focus({ preventScroll: true });
  }, [confirm]);

  const item = (label: string, icon: ReactNode, run: () => void, danger = false) => (
    <button type="button" role="menuitem" className={`cm-item ${danger ? "danger" : ""}`} onClick={run}>
      {icon}
      <span>{label}</span>
    </button>
  );

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="works-feature wk-portal">
      <div
        ref={ref}
        role="menu"
        aria-label="گزینه‌های پیام"
        className="cm-menu"
        style={{ top: pos.top, left: pos.left, transformOrigin: pos.origin, visibility: pos.visible ? "visible" : "hidden" }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {confirm ? (
          <div className="cm-confirm">
            <b>این پیام حذف شود؟</b>
            <div className="cm-confirm-acts">
              <button type="button" role="menuitem" className="cm-btn danger" onClick={onDelete}>
                بله، حذف شود
              </button>
              <button type="button" role="menuitem" className="cm-btn" onClick={() => setConfirm(false)}>
                انصراف
              </button>
            </div>
          </div>
        ) : (
          <>
            {reactions ? (
              <div className="cm-reacts">
                {reactions.map((r) => (
                  <button key={r.emoji} type="button" role="menuitemcheckbox" className={r.mine ? "on" : ""} aria-checked={r.mine} aria-label={`واکنش ${r.emoji}`} onClick={() => onReact(r.emoji, r.mine)}>
                    {r.emoji}
                  </button>
                ))}
              </div>
            ) : null}
            {canReply ? item("پاسخ", <Icon name="reply" size={17} />, onReply) : null}
            {canCopy ? item("کپی متن", <Icon name="copy" size={17} />, onCopy) : null}
            {canEdit ? item("ویرایش", <Icon name="edit" size={17} />, onEdit) : null}
            {canEdit ? item("حذف", <Icon name="trash" size={17} />, () => setConfirm(true), true) : null}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
