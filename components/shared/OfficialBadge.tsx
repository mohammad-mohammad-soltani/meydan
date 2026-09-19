import { BadgeCheck } from "lucide-react";

const sizes = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

/** Grey badge for accounts carrying the `meydan_official` role. */
export function OfficialBadge({
  official,
  size = "sm",
  className = "",
}: {
  official?: boolean;
  size?: keyof typeof sizes;
  className?: string;
}) {
  if (!official) return null;

  return (
    <span title="حساب رسمی" className="inline-flex shrink-0">
      <BadgeCheck
        aria-label="حساب رسمی"
        className={`${sizes[size]} shrink-0 fill-muted-foreground text-surface ${className}`}
      />
    </span>
  );
}
