"use client";

import { Check, Clock, Plus } from "lucide-react";
import { forwardRef, useState, useSyncExternalStore, type RefObject } from "react";
import { PIN_OPTIONS, pinnedLabel, readPinned, subscribePinned, writePinned } from "../pinned-tab";
import type { FeedFilter } from "../types";
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
  /** The pinned category is a shortcut to the for-you feed with that filter. */
  activeFilter?: FeedFilter;
  onPinnedSelect?: (filter: FeedFilter) => void;
};

export const FeedTabs = forwardRef<HTMLDivElement, FeedTabsProps>(function FeedTabs(
  { activeTab, onChange, indicatorRef, activeFilter, onPinnedSelect },
  ref,
) {
  const { requireAuth } = useAuthGate();
  const pinned = useSyncExternalStore(subscribePinned, readPinned, () => null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pinnedActive = Boolean(pinned) && activeTab === "for-you" && activeFilter === pinned;
  const columns = pinned ? 3 : 2;
  const slot = pinnedActive ? 2 : activeTab === "following" ? 1 : 0;
  const tabClass = (active: boolean) => ` z-10 flex-1 px-2 py-3 text-xs font-bold transition-colors duration-200 ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`;

  return (
    <div ref={ref} role="tablist" aria-label="نوع تایم‌لاین" data-active-tab={activeTab} className="sticky top-0 z-30 flex w-full bg-background">
      <button type="button" aria-label="سنجاق کردن یک دسته" onClick={() => setPickerOpen(true)} className="grid w-11 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-foreground"><Plus aria-hidden="true" className="h-[18px] w-[18px]" /></button>
      <button role="tab" type="button" onClick={() => onChange("for-you")} aria-selected={activeTab === "for-you" && !pinnedActive} className={tabClass(activeTab === "for-you" && !pinnedActive)}>
        برای شما
      </button>
      <button role="tab" type="button" onClick={() => { if (requireAuth("/home")) onChange("following"); }} aria-selected={activeTab === "following"} className={tabClass(activeTab === "following")}>
        دنبال‌شده‌ها
      </button>
      {pinned ? (
        <button role="tab" type="button" onClick={() => onPinnedSelect?.(pinned)} aria-selected={pinnedActive} className={tabClass(pinnedActive)}>
          {pinnedLabel(pinned)}
        </button>
      ) : null}
      <span
        ref={indicatorRef}
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-0 right-11 h-[3px] transition-transform duration-300 ease-out after:absolute after:inset-x-1/4 after:bottom-0 after:h-[3px] after:rounded-t-full after:bg-brand after:content-['']`}
        style={{ width: `calc((100% - 2.75rem) / ${columns})`, transform: `translateX(${-slot * 100}%)` }}
      />
      {pickerOpen ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-overlay backdrop-blur-sm sm:items-center" role="presentation" onClick={() => setPickerOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="سنجاق دستهٔ جدید" dir="rtl" onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-t-3xl border border-border bg-popover p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-3xl">
            <h2 className="text-base font-black">سنجاق دستهٔ جدید</h2>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">یک دسته را به‌عنوان تب سوم کنار «برای شما» و «دنبال‌شده‌ها» سنجاق کن.</p>
            <div className="mt-4 space-y-2">
              {PIN_OPTIONS.map((option) => {
                const on = pinned === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={option.soon}
                    onClick={() => {
                      writePinned(option.id as FeedFilter);
                      onPinnedSelect?.(option.id as FeedFilter);
                      setPickerOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-sm font-black ${on ? "border-brand/50 bg-brand-muted" : "border-border bg-surface-muted"} disabled:opacity-60`}
                  >
                    {option.label}
                    {option.soon ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground"><Clock aria-hidden="true" className="h-3 w-3" />به‌زودی</span> : on ? <span className="inline-flex items-center gap-1 text-[11px] text-brand"><Check aria-hidden="true" className="h-3.5 w-3.5" />سنجاق‌شده</span> : null}
                  </button>
                );
              })}
              {pinned ? (
                <button type="button" onClick={() => { writePinned(null); setPickerOpen(false); }} className="w-full rounded-2xl px-4 py-3.5 text-right text-sm font-black text-brand">برداشتن سنجاق</button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
});
