import type { FeedTab } from "../types";

type FeedTabsProps = {
  activeTab: FeedTab;
  onChange: (tab: FeedTab) => void;
};

export function FeedTabs({ activeTab, onChange }: FeedTabsProps) {
  const tabClass = (active: boolean) => `relative z-10 flex-1 px-2 py-3 text-xs font-black transition-colors duration-200 ${active ? "text-brand" : "text-muted-foreground hover:bg-hover hover:text-foreground"}`;

  return (
    <div role="tablist" aria-label="نوع تایم‌لاین" data-active-tab={activeTab} className="relative flex w-full border-b border-border bg-surface-glass backdrop-blur">
      <button role="tab" type="button" onClick={() => onChange("for-you")} aria-selected={activeTab === "for-you"} className={tabClass(activeTab === "for-you")}>
        برای شما
      </button>
      <button role="tab" type="button" onClick={() => onChange("following")} aria-selected={activeTab === "following"} className={tabClass(activeTab === "following")}>
        دنبال‌شده‌ها
      </button>
      <span aria-hidden="true" className={`pointer-events-none absolute bottom-0 right-0 h-0.5 w-1/2 bg-brand transition-transform duration-300 ease-out ${activeTab === "following" ? "-translate-x-full" : "translate-x-0"}`} />
    </div>
  );
}
