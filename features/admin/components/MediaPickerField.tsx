"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2, Upload, FileCheck2 } from "lucide-react";
import { uploadNarrativeFile } from "@/lib/meydan-upload";
import { AdminField } from "./AdminField";
import { adminErrorMessage } from "../services/admin-api";

export function MediaPickerField({ id, label, hint, error, purpose = "avatar", mediaId, currentUrl, onChange, disabled = false }: {
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
  const uploading = useRef(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ id: number; name: string; preview: string | null } | null>(null);
  const imageOnly = purpose !== "narrative";
  const activeSelection = selected?.id === mediaId ? selected : null;
  const preview = activeSelection?.preview ?? (mediaId === null ? currentUrl : null);

  useEffect(() => () => { if (selected?.preview) URL.revokeObjectURL(selected.preview); }, [selected]);

  const pick = async (file: File) => {
    if (disabled || uploading.current) return;
    if (imageOnly && !file.type.startsWith("image/")) {
      setLocalError("برای این بخش یک فایل تصویری انتخاب کنید.");
      return;
    }
    uploading.current = true;
    setBusy(true);
    setLocalError(null);
    setProgress(0);
    try {
      const uploaded = await uploadNarrativeFile(file, purpose, setProgress);
      setSelected({ id: uploaded, name: file.name, preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null });
      onChange(uploaded);
    } catch (reason) {
      setLocalError(adminErrorMessage(reason, "بارگذاری فایل ممکن نشد."));
    } finally {
      uploading.current = false;
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <AdminField label={label} htmlFor={id} hint={hint} error={error ?? localError}>
      <div className="admin-media-drop" aria-busy={busy} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void pick(file); }}>
        <span className="admin-media-preview">
          {preview ? <Image src={preview} alt="پیش‌نمایش فایل انتخاب‌شده" width={72} height={72} unoptimized /> : mediaId ? <FileCheck2 size={27} aria-hidden="true" /> : <ImagePlus size={27} strokeWidth={1.5} aria-hidden="true" />}
        </span>
        <div className="admin-media-copy">
          <strong>{busy ? "در حال بارگذاری فایل…" : mediaId ? "فایل انتخاب شد" : preview ? "تصویر فعلی" : imageOnly ? "تصویر را اینجا رها کنید" : "فایل را اینجا رها کنید"}</strong>
          <p className="truncate">{activeSelection?.name ?? (imageOnly ? "یک تصویر واضح و باکیفیت انتخاب کنید." : "تصویر، ویدئو یا فایل صوتی انتخاب کنید.")}</p>
          <input ref={input} id={id} type="file" accept={imageOnly ? "image/*" : "image/*,video/*,audio/*"} disabled={disabled || busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void pick(file); }} className="sr-only" />
          <button type="button" disabled={disabled || busy} onClick={() => input.current?.click()} className="admin-media-upload">{busy ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : <Upload size={15} aria-hidden="true" />}{busy ? `${Math.round(progress * 100).toLocaleString("fa-IR")}٪` : mediaId || preview ? "انتخاب فایل جایگزین" : "انتخاب فایل"}</button>
          {busy && <progress className="admin-media-progress" value={progress} max={1} aria-label="پیشرفت بارگذاری فایل" />}
        </div>
      </div>
      {mediaId !== null && <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>رسانهٔ {mediaId.toLocaleString("fa-IR")} آماده است</span><button type="button" disabled={disabled || busy} onClick={() => { onChange(null); setSelected(null); }} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-danger-foreground hover:bg-danger-surface"><Trash2 size={14} aria-hidden="true" />لغو انتخاب</button></div>}
      <details className="admin-media-manual"><summary>استفاده از شناسهٔ رسانهٔ موجود</summary><label className="flex items-center gap-3 py-2">شناسه رسانه<input type="number" min={1} inputMode="numeric" disabled={disabled || busy} value={mediaId ?? ""} onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))} className="w-28 rounded-lg border border-input-border bg-input px-3 py-2 text-foreground" /></label></details>
    </AdminField>
  );
}
