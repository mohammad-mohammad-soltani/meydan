"use client";

import { forwardRef, type RefObject } from "react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import type { FeedTab } from "../types";

type FeedTabsProps = {
  activeTab: FeedTab;
  onChange: (tab: FeedTab) => void;
  /**
   * Handed to the pager, which moves the underline with the finger through a
   * direct style write rather than a render per frame.
   */
  indicatorRef?: RefObject<HTMLSpanElement | null>;
};

export const FeedTabs = forwardRef<HTMLDivElement, FeedTabsProps>(function FeedTabs(
  { activeTab, onChange, indicatorRef },
  ref,
) {
  const { requireAuth } = useAuthGate();
  const tabClass = (active: boolean) => ` z-10 flex-1 px-2 py-4 text-xs font-black transition-colors duration-200 ${active ? "text-brand font-black" : "text-muted-foreground hover:bg-hover hover:text-foreground"}`;

  return (
    <div ref={ref} role="tablist" aria-label="نوع تایم‌لاین" data-active-tab={activeTab} className="sticky top-0 z-30 flex w-full border-b border-border bg-surface-glass backdrop-blur">
      <button role="tab" type="button" onClick={() => onChange("for-you")} aria-selected={activeTab === "for-you"} className={tabClass(activeTab === "for-you")}>
        برای شما
      </button>
      <button role="tab" type="button" onClick={() => { if (requireAuth("/home")) onChange("following"); }} aria-selected={activeTab === "following"} className={tabClass(activeTab === "following")}>
        دنبال‌شده‌ها
      </button>
      <span
        ref={indicatorRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-0.5 w-1/2 bg-brand transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${activeTab === "following" ? -100 : 0}%)` }}
      />
    </div>
  );
});
