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
export function AccountBadges({ verified, speaker, official, kind, size = "sm", className = "", variant = "plain" }: AccountBadgeProps & { variant?: "plain" | "reel" }) {
  if (!verified && !speaker && !official) return null;

  const label = (kind && KIND_LABELS[kind]) || "حساب تأییدشده";

  return (
    <>
      {verified ? (
        <span title={label} className="inline-flex shrink-0">
          {variant === "reel" ? (
            // The reels' blue rosette tick, as in the reference.
            <svg viewBox="0 0 24 24" aria-label={label} role="img" className={`${sizes[size]} shrink-0 ${className}`}>
              <path fill="#3b9cff" d="M12 2l2.4 1.9 3-.2 1.2 2.8 2.7 1.4-.6 3 1.3 2.7-2 2.2-.2 3-3 .8-1.8 2.4L12 20.8l-2.9 1.2-1.8-2.4-3-.8-.2-3-2-2.2 1.3-2.7-.6-3 2.7-1.4 1.2-2.8 3 .2z" />
              <path d="m8.5 12 2.5 2.5 4.5-5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            // The reference's tick everywhere else: a filled circle in the text colour with the check cut out.
            <svg viewBox="0 0 24 24" aria-label={label} role="img" className={`${sizes[size]} shrink-0 fill-current text-foreground ${className}`}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          )}
        </span>
      ) : null}
      <SpeakerBadge verified={speaker} size={size} className={className} />
      <OfficialBadge official={official} size={size} className={className} />
    </>
  );
}
