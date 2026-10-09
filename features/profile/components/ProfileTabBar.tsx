"use client";

import { useEffect, useRef, type ComponentType, type RefObject, type SVGProps } from "react";

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
  barRef: externalBarRef,
}: {
  tabs: ProfileTabItem<Id>[];
  active: Id;
  onChange: (id: Id) => void;
  label: string;
  /** Lets a swipe pager follow the strip (its bottom edge, its titles). */
  barRef?: RefObject<HTMLDivElement | null>;
}) {
  const ownBarRef = useRef<HTMLDivElement>(null);
  const barRef = externalBarRef ?? ownBarRef;
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
  }, [active, barRef]);

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
            className={`relative flex shrink-0 snap-center items-center whitespace-nowrap px-3.5 pb-[15px] pt-[9px] text-[13px] transition-colors duration-200 ${
              selected ? "font-extrabold text-foreground [--tab-w:1]" : "font-semibold text-muted-foreground [--tab-w:0] hover:text-foreground-secondary"
            }`}
          >
            {/* The icon grows in and out with the tab's weight, which a swipe feeds in step with the finger. */}
            <span aria-hidden="true" className="relative shrink-0" style={{ width: "calc(var(--tab-w) * 16px)", height: 16, marginInlineEnd: "calc(var(--tab-w) * 6px)", opacity: "var(--tab-w)" }}>
              {/* The glyph keeps its size and is scaled about its own centre, so it swells from the middle while the box beside the title opens. */}
              <Icon className="absolute left-1/2 top-1/2 h-4 w-4" style={{ transform: "translate(-50%, -50%) scale(var(--tab-w))" }} />
            </span>
            {/* A hidden bold copy reserves the selected width, so titles never shift neighbours. */}
            <span className="grid">
              <span aria-hidden="true" className="invisible col-start-1 row-start-1 font-extrabold">{tab.label}</span>
              <span className="col-start-1 row-start-1">{tab.label}</span>
            </span>
            {tab.count !== undefined ? <sup className="ms-1.5 text-[9.5px] opacity-70">{tab.count.toLocaleString("fa-IR")}</sup> : null}
            <i
              data-tab-rule=""
              aria-hidden="true"
              className={`absolute inset-x-3.5 bottom-0 h-[2.5px] origin-center rounded-[3px] bg-foreground transition-transform duration-[250ms] ease-out ${selected ? "scale-x-100" : "scale-x-0"}`}
            />
          </button>
        );
      })}
    </div>
  );
}
