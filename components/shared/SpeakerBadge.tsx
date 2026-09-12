import { BadgeCheck } from "lucide-react";

const sizes = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

/**
 * Brand-red speaker badge, separate from the blue account badge so a verified
 * speaker stays distinguishable from a verified account. The fill reads
 * `--brand` so it always matches the site's brand red in every theme.
 *
 * `always` is for curated speaker rows where the row itself proves the actor is
 * a speaker even when the API did not flag it as verified; the accessible label
 * then only claims the speaker role and drops the verification claim.
 */
export function SpeakerBadge({
  verified,
  always = false,
  size = "sm",
  className = "",
}: {
  verified?: boolean;
  always?: boolean;
  size?: keyof typeof sizes;
  className?: string;
}) {
  if (!verified && !always) return null;

  const label = verified ? "سخنران تأییدشده" : "سخنران";

  return (
    <span title={label} className="inline-flex shrink-0">
      <BadgeCheck
        aria-label={label}
        className={`${sizes[size]} shrink-0 fill-brand text-brand-foreground ${className}`}
      />
    </span>
  );
}
