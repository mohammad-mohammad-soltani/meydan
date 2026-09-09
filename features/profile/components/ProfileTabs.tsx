import { Shield, UserCheck } from "lucide-react";
import type { ProfileTab } from "../types";

type ProfileTabsProps = { activeTab: ProfileTab; onChange: (tab: ProfileTab) => void; };

export function ProfileTabs({ activeTab, onChange }: ProfileTabsProps) {
  const tabClass = (active: boolean) => `flex flex-1 items-center justify-center gap-1.5 rounded-control py-2 transition-colors ${active ? "bg-surface text-brand shadow-xs" : "text-muted-foreground hover:bg-hover hover:text-foreground"}`;
  return (
    <div className="mx-4 flex rounded-card border border-border bg-surface-muted p-1 text-xs font-bold">
      <button type="button" onClick={() => onChange("resume")} aria-pressed={activeTab === "resume"} className={tabClass(activeTab === "resume")}><UserCheck className="h-4 w-4" />رزومه شخصی من</button>
      <button type="button" onClick={() => onChange("square")} aria-pressed={activeTab === "square"} className={tabClass(activeTab === "square")}><Shield className="h-4 w-4" />پایگاه میدان من</button>
    </div>
  );
}
