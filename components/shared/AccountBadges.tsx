import { BadgeCheck } from "lucide-react";
import { OfficialBadge } from "@/components/shared/OfficialBadge";
import { SpeakerBadge } from "@/components/shared/SpeakerBadge";

const sizes = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

const KIND_LABELS: Record<string, string> = {
  media: "رسانه تأییدشده",
  organization: "سازمان تأییدشده",
  collective: "مجموعه تأییدشده",
  square: "میدان تأییدشده",
};

export type AccountBadgeProps = {
  /** The blue account tick: squares, media, collectives, organizations and verified accounts. */
  verified?: boolean;
  speaker?: boolean;
  official?: boolean;
  /** Actor type / entity kind; only used for the tick's label. */
  kind?: string;
  size?: keyof typeof sizes;
  className?: string;
};

/**
 * Every tick an account carries, in one place. Any surface that shows a name
 * renders this so a ticked account is never shown without its tick: the blue
 * account tick, the red speaker tick and the grey official tick.
 */
export function AccountBadges({ verified, speaker, official, kind, size = "sm", className = "" }: AccountBadgeProps) {
  if (!verified && !speaker && !official) return null;

  const label = (kind && KIND_LABELS[kind]) || "حساب تأییدشده";

  return (
    <>
      {verified ? (
        <span title={label} className="inline-flex shrink-0">
          <BadgeCheck aria-label={label} className={`${sizes[size]} shrink-0 fill-verified text-on-solid ${className}`} />
        </span>
      ) : null}
      <SpeakerBadge verified={speaker} size={size} className={className} />
      <OfficialBadge official={official} size={size} className={className} />
    </>
  );
}
