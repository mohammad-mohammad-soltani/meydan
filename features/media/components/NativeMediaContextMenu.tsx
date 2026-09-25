"use client";

import { Copy, Download, ExternalLink, Share2 } from "lucide-react";
import { createPortal } from "react-dom";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { isNaghshmanNativeWindow, postNativeAction } from "@/lib/native-bridge";

type Position = { x: number; y: number };

type NativeMediaContextMenuProps = {
  url: string;
  title: string;
  children: ReactNode;
};

/**
 * Android-only long-press / right-click menu for image media. It is deliberately
 * invisible in a browser, where ordinary browser context menus remain intact.
 */
export function NativeMediaContextMenu({ url, title, children }: NativeMediaContextMenuProps) {
  const [active, setActive] = useState(
    () => typeof window !== "undefined" && isNaghshmanNativeWindow(window),
  );
  const [position, setPosition] = useState<Position | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const update = () => setActive(isNaghshmanNativeWindow(window));
    window.addEventListener("naghshman:native-ready", update);
    return () => window.removeEventListener("naghshman:native-ready", update);
  }, []);

  useEffect(() => {
    if (!position) return;
    const close = () => setPosition(null);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [position]);

  const clearPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  const open = (x: number, y: number) => {
    setPosition({
      x: Math.max(12, Math.min(x, window.innerWidth - 224)),
      y: Math.max(12, Math.min(y, window.innerHeight - 248)),
    });
  };

  const onContextMenu = (event: MouseEvent<HTMLSpanElement>) => {
    if (!active) return;
    event.preventDefault();
    open(event.clientX, event.clientY);
  };

  const onPointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    if (!active || event.pointerType === "mouse") return;
    clearPress();
    pressTimer.current = setTimeout(() => open(event.clientX, event.clientY), 520);
  };

  const action = (type: "save-media" | "share" | "copy-link" | "open-browser") => {
    if (typeof window === "undefined") return;
    postNativeAction(window, {
      type,
      url,
      ...(type === "save-media" ? { filename: title } : {}),
      ...(type === "share" ? { title } : {}),
    });
    setPosition(null);
  };

  return (
    <>
      <span
        className="contents"
        onContextMenu={onContextMenu}
        onPointerDown={onPointerDown}
        onPointerUp={clearPress}
        onPointerCancel={clearPress}
        onPointerMove={clearPress}
      >
        {children}
      </span>
      {position ? createPortal(
        <div
          dir="rtl"
          role="menu"
          aria-label="گزینه‌های تصویر"
          onPointerDown={(event) => event.stopPropagation()}
          style={{ top: position.y, left: position.x }}
          className="fixed z-[200] w-52 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 text-foreground shadow-2xl shadow-black/20 backdrop-blur-xl"
        >
          <MenuButton icon={<Download className="h-4 w-4" />} label="ذخیره در گالری" onClick={() => action("save-media")} />
          <MenuButton icon={<Share2 className="h-4 w-4" />} label="اشتراک‌گذاری" onClick={() => action("share")} />
          <MenuButton icon={<Copy className="h-4 w-4" />} label="کپی پیوند" onClick={() => action("copy-link")} />
          <MenuButton icon={<ExternalLink className="h-4 w-4" />} label="بازکردن در مرورگر" onClick={() => action("open-browser")} />
        </div>,
        document.body,
      ) : null}
    </>
  );
}

function MenuButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right text-xs font-bold outline-none transition-colors hover:bg-brand-muted hover:text-brand focus-visible:bg-brand-muted focus-visible:text-brand"
    >
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-surface-sunken text-brand">{icon}</span>
      {label}
    </button>
  );
}
