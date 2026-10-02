"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

/**
 * Fixed-position popover rendered into <body> (so list/stream overflow never clips it),
 * wrapped in `.works-feature` so the design tokens and scoped styles still apply.
 */
export function Popover({
  anchor,
  onClose,
  className = "picker",
  children,
}: {
  anchor: RefObject<HTMLElement | null>;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<{ top: number; right: number; visibility: "hidden" | "visible" }>({ top: 0, right: 12, visibility: "hidden" });

  useLayoutEffect(() => {
    const place = () => {
      const a = anchor.current?.getBoundingClientRect();
      const el = ref.current;
      if (!a || !el) return;
      const w = Math.min(290, window.innerWidth - 24);
      const h = el.offsetHeight;
      let top = a.top - h - 8;
      if (top < 10) top = Math.min(window.innerHeight - h - 10, a.bottom + 8);
      let right = window.innerWidth - a.right;
      right = Math.max(12, Math.min(right, window.innerWidth - w - 12));
      setStyle({ top, right, visibility: "visible" });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [anchor, children]);

  useEffect(() => {
    const down = (e: PointerEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || anchor.current?.contains(t)) return;
      onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [anchor, onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="works-feature wk-portal">
      <div ref={ref} className={className} style={{ top: style.top, right: style.right, left: "auto", visibility: style.visibility }} role="dialog">
        {children}
      </div>
    </div>,
    document.body,
  );
}
