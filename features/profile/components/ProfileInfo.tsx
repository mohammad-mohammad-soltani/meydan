import {
  Pencil,
  MapPin,
} from "lucide-react";

import { ENTITY_KIND_LABELS, isEntityKind } from "@/lib/profile-route";
import type {
  ProfileDetails,
  ProfileSection,
  ProfileTab,
} from "../types";

type ProfileInfoProps = {
  profile: ProfileDetails;
  tab: ProfileTab;
  expandedSections: Set<ProfileSection>;
  onToggleSection: (section: ProfileSection) => void;
};

function Stats({
  items,
}: {
  items: ProfileDetails["squareStats"];
}) {
  if (!items.length) return null;

  return (
    <div
      dir="rtl"
      className={`mt-2 mb-3 grid border-divider ${items.length >= 3 ? "grid-cols-3" : "grid-cols-2"}`}
    >
      {items.slice(0, 3).map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className="flex min-w-0 flex-col items-center justify-center px-2 py-3 text-center"
        >
          <strong
            className={`text-[15px] font-black leading-6 ${
              item.tone === "success"
                ? "text-success"
                : "text-foreground"
            }`}
          >
            {item.value}
          </strong>

          <span className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-[11px]">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ProfileInfo({
  profile,
  tab,
}: ProfileInfoProps) {
  const isSquare = tab === "square";
  const entityKind = isEntityKind(profile.kind) ? profile.kind : "square";

  const stats = isSquare
    ? profile.squareStats
    : profile.resumeStats;

  return (
    <section className="border-b border-divider">
      <div className="px-4 pb-4">
        <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
          {profile.about ||
            (isSquare
              ? entityKind === "square"
                ? "این میدان برای روایت‌کردن تجربه‌ها و اتفاق‌های محله فعال است."
                : `این ${ENTITY_KIND_LABELS[entityKind]} در میدان فعال است.`
              : "عضو میدان")}
        </p>

        {profile.skills.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="text-xs text-brand"
              >
                #{skill.replace(/^#/, "")}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-foreground-subtle">
          {profile.identity.subtitle ? (
            <span className="inline-flex items-center gap-1.5">
              <Pencil
                aria-hidden="true"
                className="h-4 w-4"
              />

              {profile.identity.subtitle}
            </span>
          ) : null}

          {profile.identity.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin
                aria-hidden="true"
                className="h-4 w-4"
              />

              {profile.identity.location}
            </span>
          ) : null}
        </div>
      </div>

      <Stats items={stats} />
    </section>
  );
}
