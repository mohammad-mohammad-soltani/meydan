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
    <nav aria-label="بخش‌های بسته محتوا" className="sticky top-0 z-20 box-border grid h-[50px] grid-cols-3 border-b border-divider bg-background">
      {TABS.map((tab) => {
        const on = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href as Route}
            replace
            scroll={false}
            aria-current={on ? "page" : undefined}
            className={`relative flex h-[49px] items-center justify-center text-center text-sm font-bold transition-colors ${on ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label}
          </Link>
        );
      })}
      {/* One underline that slides between the tabs (the strip reads right to left). */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-[3px] w-1/3 transition-transform duration-300 ease-out after:absolute after:inset-x-1/4 after:bottom-0 after:h-[3px] after:rounded-t-full after:bg-brand after:content-['']"
        style={{ transform: `translateX(${-TABS.findIndex((tab) => tab.id === active) * 100}%)` }}
      />
    </nav>
  );
}
