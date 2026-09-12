import { BadgeCheck } from "lucide-react";

const sizes = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

/**
 * Red verified-speaker badge. Separate from the blue account badge so a
 * verified speaker is distinguishable from a verified account.
 */
export function SpeakerBadge({
  verified,
  size = "sm",
  className = "",
}: {
  verified?: boolean;
  size?: keyof typeof sizes;
  className?: string;
}) {
  if (!verified) return null;

  return (
    <span title="سخنران تأییدشده" className="inline-flex shrink-0">
      <BadgeCheck
        aria-label="سخنران تأییدشده"
        className={`${sizes[size]} shrink-0 fill-speaker text-on-solid ${className}`}
      />
    </span>
  );
}
