"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { uploadNarrativeFile } from "@/lib/meydan-upload";
import { AdminField } from "./AdminField";
import { adminErrorMessage } from "../services/admin-api";
import { secondaryButtonClass } from "./styles";

/**
 * Avatar / cover / logo picker.
 *
 * The only upload path in the project is `uploadNarrativeFile`, which chunks the
 * file through `/api/meydan`; the backend returns a media id that then travels
 * as `avatar_media_id`. There is no media library browser, so the current image
 * is shown when one exists and the id is also editable as a number for cases
 * where the admin already knows it.
 */
export function MediaPickerField({
  id,
  label,
  hint,
  error,
  purpose = "avatar",
  mediaId,
  currentUrl,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  purpose?: "avatar" | "cover" | "narrative";
  mediaId: number | null;
  currentUrl?: string | null;
  onChange: (mediaId: number | null) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  const pick = async (file: File) => {
    setBusy(true);
    setLocalError(null);
    setProgress(0);
    try {
      const uploaded = await uploadNarrativeFile(file, purpose, setProgress);
      onChange(uploaded);
    } catch (reason) {
      setLocalError(adminErrorMessage(reason, "بارگذاری فایل ممکن نشد."));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <AdminField label={label} htmlFor={id} hint={hint} error={error ?? localError}>
      <div className="flex items-center gap-3 rounded-control border border-border bg-surface p-2.5">
        <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-muted text-icon-muted">
          {currentUrl ? (
            <Image
              src={currentUrl}
              alt=""
              width={56}
              height={56}
              unoptimized={currentUrl.startsWith("http")}
              className="h-14 w-14 object-cover"
            />
          ) : (
            <ImagePlus aria-hidden="true" className="h-5 w-5" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <input
            ref={input}
            id={id}
            type="file"
            accept="image/*,video/*,audio/*"
            disabled={disabled || busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void pick(file);
            }}
            className="block w-full text-[11px] text-foreground-secondary file:me-2 file:rounded-control file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-[11px] file:font-black file:text-brand-foreground"
          />

          {busy ? (
            <p role="status" className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <LoaderCircle aria-hidden="true" className="h-3 w-3 animate-spin" />
              در حال بارگذاری… {Math.round(progress * 100)}٪
            </p>
          ) : mediaId ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              شناسه رسانه: {mediaId}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(null)}
                className="inline-flex items-center gap-1 rounded-pill border border-border px-2 py-0.5 text-[10px] font-black text-danger-foreground transition-colors hover:bg-danger-surface"
              >
                <Trash2 aria-hidden="true" className="h-3 w-3" />
                حذف تصویر
              </button>
            </p>
          ) : (
            <p className="mt-1.5 text-[10px] text-muted-foreground">فایلی انتخاب نشده است.</p>
          )}
        </div>
      </div>

      {/* A number input keeps a pre-known media id usable without an upload. */}
      <label className="mt-2 flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
        شناسه رسانه (اختیاری)
        <input
          type="number"
          min={0}
          inputMode="numeric"
          disabled={disabled || busy}
          value={mediaId ?? ""}
          onChange={(event) =>
            onChange(event.target.value === "" ? null : Number(event.target.value))
          }
          className="w-28 rounded-control border border-input-border bg-input px-2 py-1 text-[11px] text-foreground outline-none focus:border-ring"
        />
      </label>

      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => input.current?.click()}
        className={`${secondaryButtonClass} mt-2 min-h-8 py-1.5`}
      >
        انتخاب فایل
      </button>
    </AdminField>
  );
}
