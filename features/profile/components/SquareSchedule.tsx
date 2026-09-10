"use client";

import Link from "next/link";
import type { Route } from "next";
import { CalendarDays, Clock } from "lucide-react";
import type { SquareScheduleItem } from "../types";

export function SquareSchedule({
  items,
  canManage = false,
}: {
  items: SquareScheduleItem[];
  canManage?: boolean;
}) {
  return (
    <section aria-label="سین برنامه میدان" className="border-b border-divider px-4 py-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-1.5 text-sm font-black text-foreground">
          <CalendarDays aria-hidden="true" className="h-4 w-4 text-brand" />
          سین برنامه
        </h2>
        {canManage ? (
          <Link
            href={"/profile/edit" as Route}
            className="text-[11px] font-bold text-brand hover:underline"
          >
            مدیریت برنامه‌ها
          </Link>
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="mt-3 rounded-card border border-dashed border-border bg-surface-muted px-3 py-4 text-center text-[11px] leading-6 text-muted-foreground">
          {canManage
            ? "هنوز برنامه‌ای ثبت نشده؛ از بخش ویرایش پروفایل اولین برنامه را اضافه کنید."
            : "هنوز برنامه‌ای برای این میدان اعلام نشده است."}
        </p>
      ) : (
        <ol className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              className={`flex items-center gap-3 rounded-card border px-3 py-2.5 ${
                item.highlighted
                  ? "border-brand-border bg-brand-muted"
                  : "border-border bg-card"
              }`}
            >
              <span
                aria-hidden="true"
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-black tabular-nums ${
                  item.highlighted
                    ? "bg-brand text-brand-foreground"
                    : "bg-surface-muted text-foreground-secondary"
                }`}
              >
                {(index + 1).toLocaleString("fa-IR")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black text-foreground">{item.title}</p>
                <span className="inline-flex items-center gap-1 text-[10px] tabular-nums text-muted-foreground">
                  <Clock aria-hidden="true" className="h-3 w-3" />
                  ساعت {item.time}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
