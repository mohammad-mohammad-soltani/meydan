import type { FeedTab } from "../types";

type FeedTabsProps = {
  activeTab: FeedTab;
  onChange: (tab: FeedTab) => void;
};

export function FeedTabs({ activeTab, onChange }: FeedTabsProps) {
  const tabClass = (active: boolean) => `flex-1 border-b-2 px-2 py-2.5 text-xs font-black transition-colors ${active ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:bg-hover hover:text-foreground"}`;

  return (
    <div data-active-tab={activeTab} className="relative flex w-full border-b border-border bg-surface-glass backdrop-blur">
      <button type="button" onClick={() => onChange("for-you")} aria-pressed={activeTab === "for-you"} className={tabClass(activeTab === "for-you")}>
        برای شما
      </button>
      <button type="button" onClick={() => onChange("following")} aria-pressed={activeTab === "following"} className={tabClass(activeTab === "following")}>
        دنبال‌شده‌ها
      </button>
    </div>
  );
}
