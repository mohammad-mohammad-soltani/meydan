import { BadgeCheck, ChevronDown, Clock3 } from "lucide-react";
import type { ProfileDetails, ProfileSection, ProfileTab } from "../types";

type ProfileInfoProps = { profile: ProfileDetails; tab: ProfileTab; expandedSections: Set<ProfileSection>; onToggleSection: (section: ProfileSection) => void; };

function Stats({ items }: { items: ProfileDetails["squareStats"] }) {
  return <div className="grid grid-cols-3 gap-2 border-y border-divider py-3 text-center text-xs">{items.map((item) => <div key={item.label}><strong className={`block text-sm font-black ${item.tone === "success" ? "text-success" : "text-foreground"}`}>{item.value}</strong><span className="mt-1 block text-[10px] text-foreground-subtle">{item.label}</span></div>)}</div>;
}

export function ProfileInfo({ profile, tab, expandedSections, onToggleSection }: ProfileInfoProps) {
  if (tab === "resume") {
    return (
      <section className="space-y-3 px-4">
        <div>
          <h2 className="flex flex-wrap items-center gap-1.5 text-base font-black text-foreground">محمدصادق رضایی<span className="rounded border border-success-border bg-success-surface px-1.5 py-0.5 text-[10px] text-success">عضو فعال تبیین</span></h2>
          <p className="mt-1 text-xs text-muted-foreground">کارشناس ارشد علوم سیاسی | فعال رسانه و میدان</p>
          <p className="mt-1 text-[11px] text-foreground-subtle">{profile.identity.location}</p>
        </div>
        <Stats items={profile.resumeStats} />
        <div className="space-y-2">
          {(["about", "skills"] as ProfileSection[]).map((section) => {
            const open = expandedSections.has(section);
            const title = section === "about" ? "خلاصه سوابق و درباره من" : "مهارت‌ها و نشان‌های تخصصی";
            return (
              <div key={section} className="overflow-hidden rounded-card border border-border bg-card">
                <button type="button" onClick={() => onToggleSection(section)} className="flex w-full items-center justify-between bg-surface-muted p-3.5 text-xs font-bold text-foreground transition-colors hover:bg-hover"><span>{title}</span><ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} /></button>
                {open ? <div className="border-t border-divider bg-surface p-3.5 text-[11px] leading-7 text-foreground-secondary">{section === "about" ? profile.about : <div className="flex flex-wrap gap-2">{profile.skills.map((skill) => <span key={skill} className="rounded-xl border border-border bg-surface-muted px-3 py-1.5">{skill}</span>)}</div>}</div> : null}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3 px-4">
      <div className="flex items-start justify-between">
        <div><h2 className="flex items-center gap-1.5 text-base font-black text-foreground">{profile.identity.name}<BadgeCheck className="h-4 w-4 fill-verified text-on-solid" /></h2><p className="mt-1 text-xs text-foreground-subtle"><span dir="ltr">@{profile.identity.handle}</span> · {profile.identity.subtitle}</p></div>
      </div>
      <Stats items={profile.squareStats} />
      <div className="rounded-card border border-border bg-card p-3.5 text-card-foreground shadow-xs">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground"><Clock3 className="h-4 w-4 text-brand" />جدول امشب میدان</h3>
        <div className="mt-3 space-y-1.5">{profile.schedule.map((item) => <div key={item.id} className={`flex items-center justify-between border-b border-divider py-1.5 text-xs last:border-b-0 ${item.highlighted ? "font-bold text-warning" : "text-foreground-secondary"}`}><span>{item.title}</span><span className="font-mono text-muted-foreground">{item.time}</span></div>)}</div>
      </div>
    </section>
  );
}
