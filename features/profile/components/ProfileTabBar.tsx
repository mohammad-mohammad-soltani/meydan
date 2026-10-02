"use client";

import { useEffect, useRef, type ComponentType, type SVGProps } from "react";

export type ProfileTabItem<Id extends string> = {
  id: Id;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  count?: number;
};

/**
 * The profile's tab strip, as in the reference design: a glass bar, the icon
 * shown on the selected tab only, a count beside each title, and an underline
 * that grows under the selected tab. The selected tab is kept centred when the
 * bar scrolls.
 */
export function ProfileTabBar<Id extends string>({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: ProfileTabItem<Id>[];
  active: Id;
  onChange: (id: Id) => void;
  label: string;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  // Centre the selected tab. Horizontal only, so the page itself never jumps; works in RTL.
  useEffect(() => {
    const bar = barRef.current;
    const tab = bar?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!bar || !tab) return;
    const barBox = bar.getBoundingClientRect();
    const tabBox = tab.getBoundingClientRect();
    const delta = tabBox.left + tabBox.width / 2 - (barBox.left + barBox.width / 2);
    if (Math.abs(delta) < 1) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bar.scrollBy({ left: delta, behavior: firstRender.current || reduce ? "auto" : "smooth" });
    firstRender.current = false;
  }, [active]);

  return (
    <div
      ref={barRef}
      role="tablist"
      aria-label={label}
      className="sticky top-0 z-20 flex snap-x snap-proximity gap-0.5 overflow-x-auto border-b border-divider bg-background/80 px-3 pt-2.5 backdrop-blur-xl no-scrollbar"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`relative flex shrink-0 snap-center items-center gap-1.5 whitespace-nowrap px-3.5 pb-[15px] pt-[9px] text-[13px] transition-colors duration-200 ${
              selected ? "font-extrabold text-foreground" : "font-semibold text-muted-foreground hover:text-foreground-secondary"
            }`}
          >
            {selected ? <Icon aria-hidden="true" className="h-4 w-4 animate-[profile-tab-icon_.25s_ease-out]" /> : null}
            {/* A hidden bold copy reserves the selected width, so titles never shift neighbours. */}
            <span className="grid">
              <span aria-hidden="true" className="invisible col-start-1 row-start-1 font-extrabold">{tab.label}</span>
              <span className="col-start-1 row-start-1">{tab.label}</span>
            </span>
            {tab.count ? <sup className="text-[9.5px] opacity-70">{tab.count.toLocaleString("fa-IR")}</sup> : null}
            <i
              aria-hidden="true"
              className={`absolute inset-x-3.5 bottom-0 h-[2.5px] origin-center rounded-[3px] bg-foreground transition-transform duration-[250ms] ease-out ${selected ? "scale-x-100" : "scale-x-0"}`}
            />
          </button>
        );
      })}
    </div>
  );
}
