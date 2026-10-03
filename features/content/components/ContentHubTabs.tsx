import Link from "next/link";
import type { Route } from "next";

export type HubTab = "top" | "ava" | "notes";

const TABS: Array<{ id: HubTab; label: string; href: string }> = [
  { id: "top", label: "پیشخوان", href: "/content" },
  { id: "ava", label: "آوا", href: "/content?tab=ava" },
  { id: "notes", label: "یادداشت", href: "/content?tab=notes" },
];

/** The three tabs of «بسته محتوا». Each is a link, so a tab survives refresh and sharing. */
export function ContentHubTabs({ active }: { active: HubTab }) {
  return (
    <nav aria-label="بخش‌های بسته محتوا" className="sticky top-0 z-20 grid grid-cols-3 border-b border-divider bg-surface-glass backdrop-blur-md">
      {TABS.map((tab) => {
        const on = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href as Route}
            replace
            scroll={false}
            aria-current={on ? "page" : undefined}
            className={`relative py-3.5 text-center text-sm font-black transition-colors ${on ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label}
            <span aria-hidden="true" className={`absolute inset-x-[22%] bottom-0 h-[3px] rounded-full bg-brand transition-opacity ${on ? "opacity-100" : "opacity-0"}`} />
          </Link>
        );
      })}
    </nav>
  );
}
