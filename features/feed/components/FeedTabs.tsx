import type { FeedTab } from "../types";

type FeedTabsProps = {
  activeTab: FeedTab;
  onChange: (tab: FeedTab) => void;
};

export function FeedTabs({ activeTab, onChange }: FeedTabsProps) {
  return (
    <div id="homeSubTabs" className="flex border-b border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-[#070a0f]/95">
      <button type="button" onClick={() => onChange("for-you")} className={"flex-1 px-4 py-4 text-sm font-black transition " + (activeTab === "for-you" ? "home-subtab-active" : "text-slate-500 dark:text-slate-400")}>
        برای شما
      </button>
      <button type="button" onClick={() => onChange("following")} className={"flex-1 px-4 py-4 text-sm font-black transition " + (activeTab === "following" ? "home-subtab-active" : "text-slate-500 dark:text-slate-400")}>
        دنبال‌شده‌ها
      </button>
    </div>
  );
}