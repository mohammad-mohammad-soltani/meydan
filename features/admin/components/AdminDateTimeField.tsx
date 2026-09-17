"use client";

import { PersianDatePicker, type PersianDateRange } from "@/components/shared/PersianDatePicker";
import { PersianTimePicker } from "@/components/shared/PersianTimePicker";
import { joinAdminDateTime, splitAdminDateTime } from "../lib/datetime";

/** Jalali date + Persian 24-hour clock, preserving the existing API value. */
export function AdminDateTimeField({
  label,
  value,
  onChange,
  defaultTime = "09:00",
  allow = "any",
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  defaultTime?: string;
  allow?: PersianDateRange;
  error?: string;
}) {
  const selected = splitAdminDateTime(value);
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-xs font-bold text-foreground-secondary">{label}</legend>
      <div className="grid min-w-0 gap-2 sm:grid-cols-2">
        <PersianDatePicker
          value={selected.date}
          allow={allow}
          ariaLabel={`تاریخ ${label}`}
          onChange={(date) => onChange(date ? joinAdminDateTime(date, selected.time || defaultTime) : "")}
        />
        {selected.date ? (
          <PersianTimePicker
            value={selected.time || defaultTime}
            ariaLabel={`ساعت ${label}`}
            onChange={(time) => onChange(joinAdminDateTime(selected.date, time))}
          />
        ) : (
          <span className="flex min-h-12 items-center rounded-control border border-dashed border-border px-3 text-xs text-muted-foreground">
            ابتدا تاریخ را انتخاب کنید
          </span>
        )}
      </div>
      {error ? <p role="alert" className="mt-1.5 text-xs text-danger-foreground">{error}</p> : null}
    </fieldset>
  );
}
