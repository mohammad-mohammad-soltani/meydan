import { Shield, UserCheck } from "lucide-react";
import type { ProfileTab } from "../types";

type ProfileTabsProps = { activeTab: ProfileTab; onChange: (tab: ProfileTab) => void; };

export function ProfileTabs({ activeTab, onChange }: ProfileTabsProps) {
  return <div className="mx-4 flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-bold dark:border-slate-800 dark:bg-slate-900"><button type="button" onClick={() => onChange("resume")} className={"flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition " + (activeTab === "resume" ? "bg-white text-brand-red shadow-sm dark:bg-[#070a0f]" : "text-slate-500 dark:text-slate-400")}><UserCheck className="h-4 w-4" />رزومه شخصی من</button><button type="button" onClick={() => onChange("square")} className={"flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition " + (activeTab === "square" ? "bg-white text-brand-red shadow-sm dark:bg-[#070a0f]" : "text-slate-500 dark:text-slate-400")}><Shield className="h-4 w-4" />پایگاه میدان من</button></div>;
}