"use client";

import { AdminField, fieldClass } from "./AdminField";

/**
 * The two messaging channels an account can be reached on.
 *
 * The admin types a handle (e.g. `meydan_tehran`), not a URL. An empty string
 * clears that channel for the account.
 */
export function ChannelFields({
  idPrefix = "channels",
  eitaa,
  bale,
  onChange,
  errors,
  disabled = false,
}: {
  idPrefix?: string;
  eitaa: string;
  bale: string;
  onChange: (next: { eitaa: string; bale: string }) => void;
  errors?: Record<string, string | undefined>;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <AdminField
        label="کانال ایتا"
        htmlFor={`${idPrefix}-eitaa`}
        error={errors?.eitaa_channel}
        hint="فقط شناسه کانال؛ بدون آدرس کامل."
      >
        <input
          id={`${idPrefix}-eitaa`}
          value={eitaa}
          disabled={disabled}
          dir="ltr"
          placeholder="meydan_channel"
          onChange={(event) => onChange({ eitaa: event.target.value, bale })}
          className={`${fieldClass} text-left`}
        />
      </AdminField>

      <AdminField
        label="کانال بله"
        htmlFor={`${idPrefix}-bale`}
        error={errors?.bale_channel}
        hint="فقط شناسه کانال؛ بدون آدرس کامل."
      >
        <input
          id={`${idPrefix}-bale`}
          value={bale}
          disabled={disabled}
          dir="ltr"
          placeholder="meydan_channel"
          onChange={(event) => onChange({ eitaa, bale: event.target.value })}
          className={`${fieldClass} text-left`}
        />
      </AdminField>
    </div>
  );
}
