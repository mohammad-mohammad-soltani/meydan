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
 */
export function SpeakerBadge({
  verified,
  size = "sm",
  className = "",
  tone = "brand",
}: {
  verified?: boolean;
  size?: keyof typeof sizes;
  className?: string;
  /** "neutral" follows the foreground color, as in the speaker directory. */
  tone?: "brand" | "neutral";
}) {
  if (!verified) return null;

  const label = "سخنران تأییدشده";

  return (
    <span title={label} className="inline-flex shrink-0">
      <BadgeCheck
        aria-label={label}
        className={`${sizes[size]} shrink-0 ${tone === "neutral" ? "fill-foreground text-background" : "fill-brand text-brand-foreground"} ${className}`}
      />
    </span>
  );
}
