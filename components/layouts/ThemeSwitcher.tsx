"use client";

import { Circle, Moon, Sun } from "lucide-react";
import { applyTheme, type ThemeName } from "@/lib/theme";
import { useTheme } from "./useTheme";

const options: Array<{ value: ThemeName; label: string; icon: typeof Sun }> = [
  { value: "light", label: "روز", icon: Sun },
  { value: "dark", label: "شب", icon: Moon },
  { value: "black", label: "آمولد", icon: Circle },
];

/**
 * Always-visible theme control for the desktop sidebar. Rendered as a
 * segmented radiogroup so the current theme and the alternatives are visible
 * without opening a menu.
 */
const MODE_LABEL: Record<ThemeName, string> = { light: "حالت روز", dark: "حالت شب", black: "مشکی خالص" };

export function ThemeSwitcher({ className = "", variant = "sidebar" }: { className?: string; variant?: "sidebar" | "drawer" }) {
  const theme = useTheme();

  if (variant === "drawer") {
    // The mobile drawer: a caption row, then one pill with the three modes side by side.
    return (
      <>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold">پوسته و رنگ برنامه:</span>
          <span className="text-[10px] font-bold">{MODE_LABEL[theme] ?? ""}</span>
        </div>
        <div role="radiogroup" aria-label="انتخاب پوستهٔ نمایش" className={`grid grid-cols-3 gap-1.5 rounded-full bg-surface-muted p-1 ${className}`}>
          {options.map(({ value, label, icon: Icon }) => {
            const active = value === theme;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => applyTheme(value)}
                className={`flex items-center justify-center gap-1 rounded-full px-1 py-2 text-xs transition active:scale-95 ${active ? "bg-foreground font-black text-background" : "font-bold text-muted-foreground hover:text-foreground"}`}
              >
                {value === "black" ? null : <Icon aria-hidden="true" className="h-3.5 w-3.5" />}
                <span>{value === "black" ? "آمولد" : label}</span>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="انتخاب پوستهٔ نمایش"
      className={`grid grid-cols-3 gap-1 rounded-2xl border border-[var(--theme-switch-border)] bg-[var(--theme-switch)] p-1 ${className}`}
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
            className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-black transition-colors ${
              active
                ? "bg-[var(--theme-switch-on)] shadow-[inset_0_0_0_1px_var(--theme-switch-on-border)] text-[var(--theme-switch-on-foreground)]"
                : "text-foreground-secondary hover:bg-hover hover:text-foreground"
            }`}
          >
            <Icon aria-hidden="true" className={`h-3.5 w-3.5 ${value === "black" ? "fill-current" : ""}`} />
            <span>{value === "black" ? "تیره" : label}</span>
          </button>
        );
      })}
    </div>
  );
}
