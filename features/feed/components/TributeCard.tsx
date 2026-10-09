import Link from "next/link";
import type { Route } from "next";
import { Flame } from "lucide-react";
import { AccountBadges } from "@/components/shared/AccountBadges";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { cleanHandle } from "@/lib/profile-route";
import type { TributeTarget } from "../types";

/**
 * The card a «ادای احترام» post carries: who is being honoured. The composer
 * shows it as a fixed part of the post (it cannot be removed there), and the
 * same card travels with the post into the timeline and onto the author's
 * profile. `preview` drops the link, since the composer is not a place to
 * leave from.
 */
export function TributeCard({ tribute, preview = false, className = "" }: { tribute: TributeTarget; preview?: boolean; className?: string }) {
  const frame = `block w-full overflow-hidden rounded-2xl border border-border bg-surface text-right ${className}`;

  if (tribute.unavailable) {
    return <div dir="rtl" className={`${frame} px-3.5 py-3 text-xs text-muted-foreground`}>این یادبود دیگر در دسترس نیست.</div>;
  }

  const href = cleanHandle(tribute.handle) ? `/${cleanHandle(tribute.handle)}` : `/users/memorial/${tribute.memorialId}`;
  const content = (
    <>
      <span className="flex items-center gap-2 border-b border-divider bg-surface-elevated/90 px-3.5 py-2.5 text-[11px] font-bold text-foreground">
        <Flame aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-brand" />
        ادای احترام
      </span>
      <span className="flex items-center gap-3 px-3.5 py-3">
        {tribute.avatarUrl ? (
          <OptimizedAvatar src={tribute.avatarUrl} kind="memorial" alt="" width={56} className="h-14 w-14 shrink-0 object-cover" />
        ) : (
          <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-surface-muted text-lg font-black text-foreground">{tribute.name.slice(0, 1)}</span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5">
            <strong className="truncate text-sm font-black text-foreground">{tribute.name}</strong>
            <AccountBadges kind="memorial" size="sm" />
          </span>
          {tribute.position ? <span className="mt-0.5 block truncate text-xs text-muted-foreground">{tribute.position}</span> : null}
          {tribute.handle ? <span className="latin-digits mt-0.5 block truncate text-[11px] text-muted-foreground" dir="ltr">@{tribute.handle}</span> : null}
        </span>
      </span>
    </>
  );

  if (preview) return <div dir="rtl" className={frame}>{content}</div>;
  return <Link href={href as Route} dir="rtl" className={`${frame} transition-colors hover:bg-hover`}>{content}</Link>;
}
