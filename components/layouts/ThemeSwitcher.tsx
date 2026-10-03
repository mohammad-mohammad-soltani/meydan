"use client";

import { Circle, Moon, Sun } from "lucide-react";
import { applyTheme, type ThemeName } from "@/lib/theme";
import { useTheme } from "./useTheme";

const options: Array<{ value: ThemeName; label: string; icon: typeof Sun }> = [
  { value: "light", label: "روز", icon: Sun },
  { value: "dark", label: "شب", icon: Moon },
  { value: "black", label: "تیره", icon: Circle },
];

/**
 * Always-visible theme control for the desktop sidebar. Rendered as a
 * segmented radiogroup so the current theme and the alternatives are visible
 * without opening a menu.
 */
export function ThemeSwitcher({ className = "" }: { className?: string }) {
  const theme = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="انتخاب پوستهٔ نمایش"
      className={`grid grid-cols-3 gap-1 rounded-2xl border border-border bg-surface-muted p-1 ${className}`}
    >
      {options.map(({ value, label, icon: Icon }) => {
        const active = value === theme;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            title={label}
            onClick={() => applyTheme(value)}
            className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-black transition-colors ${
              active
                ? "bg-brand text-brand-foreground shadow-xs"
                : "text-foreground-secondary hover:bg-hover hover:text-foreground"
            }`}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
