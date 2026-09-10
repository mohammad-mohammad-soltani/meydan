import { BriefcaseBusiness, CalendarDays, MapPin } from "lucide-react";
import type { ProfileDetails, ProfileSection, ProfileTab } from "../types";

type ProfileInfoProps = { profile: ProfileDetails; tab: ProfileTab; expandedSections: Set<ProfileSection>; onToggleSection: (section: ProfileSection) => void };

function Stats({ items }: { items: ProfileDetails["squareStats"] }) {
  return <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground-subtle">{items.slice(0, 3).map((item, index) => <span key={`${item.label}-${index}`}><strong className={item.tone === "success" ? "font-black text-success" : "font-black text-foreground"}>{item.value}</strong> <span>{item.label}</span></span>)}</div>;
}

export function ProfileInfo({ profile, tab }: ProfileInfoProps) {
  const isSquare = tab === "square";
  const stats = isSquare ? profile.squareStats : profile.resumeStats;
  return <section className="border-b border-divider px-4 pb-5"><p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{profile.about || (isSquare ? "این میدان برای روایت‌کردن تجربه‌ها و اتفاق‌های محله فعال است." : "عضو میدان")}</p>{profile.skills.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{profile.skills.map((skill) => <span key={skill} className="text-xs text-brand">#{skill.replace(/^#/, "")}</span>)}</div> : null}<div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-foreground-subtle">{profile.identity.subtitle ? <span className="inline-flex items-center gap-1.5"><BriefcaseBusiness aria-hidden="true" className="h-4 w-4" />{profile.identity.subtitle}</span> : null}{profile.identity.location ? <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="h-4 w-4" />{profile.identity.location}</span> : null}<span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="h-4 w-4" />عضو میدان</span></div><Stats items={stats} /></section>;
}
