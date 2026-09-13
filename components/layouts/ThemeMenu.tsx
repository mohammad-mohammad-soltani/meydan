"use client";

import { Check, Circle, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { applyTheme, type ThemeName } from "@/lib/theme";
import { useTheme } from "./useTheme";

const options: Array<{
  value: ThemeName;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "روز", icon: Sun },
  { value: "dark", label: "شب", icon: Moon },
  { value: "black", label: "تیره", icon: Circle },
];

export function ThemeMenu() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (!open) return;

    const close = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!wrapperRef.current?.contains(target)) setOpen(false);
    };

    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  const ActiveIcon = options.find((option) => option.value === theme)?.icon ?? Moon;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="انتخاب تم"
        className="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface-muted text-icon transition-colors hover:bg-hover hover:text-warning"
      >
        <ActiveIcon className="h-4 w-4" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="انتخاب تم سایت"
          className="ui-enter absolute left-0 top-[calc(100%+.5rem)] z-[80] w-36 overflow-hidden rounded-card border border-border bg-popover p-1.5 text-popover-foreground shadow-popover"
        >
          {options.map(({ value, label, icon: Icon }) => {
            const active = value === theme;
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  applyTheme(value);
                  setOpen(false);
                }}
                className={`flex min-h-10 w-full items-center gap-2 rounded-xl px-2.5 text-right text-xs font-black transition-colors ${
                  active
                    ? "bg-selected text-selected-foreground"
                    : "text-foreground-secondary hover:bg-hover hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {active ? <Check className="h-4 w-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
