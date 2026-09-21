"use client";

import { useState } from "react";
import { MediaPickerField } from "./MediaPickerField";
import { AdminField, fieldClass } from "./AdminField";
import { adminErrorMessage, updateContentPoster, type ContentPoster } from "../services/content.service";

export function AdminContentPoster({ initial }: { initial: ContentPoster }) {
  const [poster, setPoster] = useState(initial);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    setMessage("");
    try {
      const next = await updateContentPoster(poster);
      setPoster(next);
      setMessage("پوستر صفحه محتوا ذخیره شد.");
    } catch (error) {
      setMessage(adminErrorMessage(error, "ذخیره پوستر ممکن نشد."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="m-3 rounded-card border border-border bg-surface p-4 sm:m-4" aria-label="پوستر صفحه محتوا">
      <h2 className="text-sm font-black">پوستر صفحه محتوا</h2>
      <p className="mt-1 text-xs text-muted-foreground">این تصویر و پیوند در بالای صفحه محتوا نمایش داده می‌شوند.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <MediaPickerField id="content-poster-image" label="تصویر پوستر" purpose="cover" mediaId={poster.mediaId} currentUrl={poster.mediaId ? poster.imageUrl : null} onChange={(mediaId) => setPoster((current) => ({ ...current, mediaId, imageUrl: mediaId === current.mediaId ? current.imageUrl : null }))} />
        <AdminField label="لینک پوستر" htmlFor="content-poster-link" hint="مسیر داخلی مانند /content/123 یا لینک https">
          <input id="content-poster-link" value={poster.href} onChange={(event) => setPoster((current) => ({ ...current, href: event.target.value }))} className={fieldClass} dir="ltr" />
        </AdminField>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="button" disabled={busy} onClick={() => void save()} className="rounded-control bg-brand px-4 py-2 text-xs font-black text-brand-foreground disabled:opacity-50">{busy ? "در حال ذخیره…" : "ذخیره پوستر"}</button>
        {message ? <span role="status" className="text-xs">{message}</span> : null}
      </div>
    </section>
  );
}
