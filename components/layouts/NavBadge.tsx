"use client";

import { useUnreadCounts } from "@/features/chat/providers/UnreadProvider";

/**
 * Red unread counter for a navigation item. Renders nothing when there is
 * nothing unread, so callers can mount it unconditionally.
 *
 * Digits are plain Latin on purpose: the global `ss02` font feature renders
 * every numeral in the app as Persian.
 */
export function NavBadge({ className = "", dot = false }: { className?: string; /** A plain dot instead of the count. */ dot?: boolean }) {
  const { total } = useUnreadCounts();
  if (total <= 0) return null;

  if (dot) {
    return <span aria-label={`${total} مورد خوانده‌نشده`} className={`h-2 w-2 rounded-full bg-emphasis ${className}`} />;
  }

  return (
    <span
      aria-label={`${total} مورد خوانده‌نشده`}
      className={`grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-black leading-5 text-on-solid shadow-xs ${className}`}
    >
      {total > 99 ? "+۹۹" : total}
    </span>
  );
}
