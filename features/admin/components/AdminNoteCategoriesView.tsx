"use client";

import { useState } from "react";
import { AdminDialog } from "./AdminDialog";
import { AdminPageHeader } from "./AdminPageHeader";
import { adminErrorMessage } from "../services/content.service";
import {
  createNoteCategory,
  deleteNoteCategory,
  renameNoteCategory,
  type NoteCategoryOption,
} from "../services/note-categories.service";

const input = "min-w-0 flex-1 rounded-control border border-border bg-input px-3 py-2 text-xs";

/**
 * Categories for notes («یادداشت»). A note is filed under a speaker category or one of these; the speaker ones are
 * shown for reference and are managed with the speakers.
 */
export function AdminNoteCategoriesView({ initial }: { initial: NoteCategoryOption[] }) {
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<NoteCategoryOption | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const own = items.filter((item) => item.source === "note");
  const speaker = items.filter((item) => item.source === "speaker");

  const run = async (job: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await job();
    } catch (reason) {
      setError(adminErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AdminPageHeader title="دسته‌بندی یادداشت‌ها" description="دسته‌هایی که یادداشت‌ها هنگام انتشار در آن‌ها قرار می‌گیرند؛ دسته‌های سخنرانان هم به‌طور خودکار قابل انتخاب‌اند." />
      <section className="mx-3 mb-5 rounded-card border border-border bg-surface p-4 sm:mx-4" aria-label="دسته‌بندی‌های اختصاصی یادداشت">
        <h2 className="mb-3 text-sm font-black">دسته‌بندی‌های اختصاصی یادداشت</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            void run(async () => {
              const created = await createNoteCategory(name.trim());
              setItems((current) => [...current, created]);
              setName("");
            });
          }}
          className="mb-3 flex gap-2"
        >
          <input aria-label="نام دسته‌بندی جدید" value={name} maxLength={60} onChange={(event) => setName(event.target.value)} placeholder="نام دسته‌بندی جدید" className={input} />
          <button type="submit" disabled={busy || !name.trim()} className="rounded-control bg-brand px-3 py-2 text-xs font-bold text-brand-foreground disabled:opacity-50">افزودن</button>
        </form>
        {own.length ? (
          <ul className="space-y-2">
            {own.map((item) => (
              <li key={item.slug} className="flex flex-wrap items-center gap-2 border-t border-divider pt-2 text-xs">
                {editing === item.slug ? (
                  <form
                    className="flex flex-1 gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!editName.trim()) return;
                      void run(async () => {
                        await renameNoteCategory(item.slug, editName.trim());
                        setItems((current) => current.map((entry) => (entry.slug === item.slug ? { ...entry, name: editName.trim() } : entry)));
                        setEditing(null);
                      });
                    }}
                  >
                    <input aria-label={`نام ${item.name}`} value={editName} maxLength={60} onChange={(event) => setEditName(event.target.value)} className="min-w-0 flex-1 rounded-control border border-border bg-input px-2 py-1" />
                    <button type="submit" disabled={busy || !editName.trim()} className="font-bold text-brand">ذخیره</button>
                    <button type="button" onClick={() => setEditing(null)}>انصراف</button>
                  </form>
                ) : (
                  <>
                    <span className="flex-1 font-bold">{item.name}</span>
                    <span className="text-muted-foreground">{item.count.toLocaleString("fa-IR")} یادداشت</span>
                    <button type="button" onClick={() => { setEditing(item.slug); setEditName(item.name); }} className="text-brand">ویرایش</button>
                    <button type="button" onClick={() => setDeleting(item)} className="text-danger-foreground">حذف</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-control border border-dashed border-border px-3 py-4 text-center text-[11px] text-muted-foreground">هنوز دسته‌بندی اختصاصی‌ای ساخته نشده است.</p>
        )}
        {error ? <p role="alert" className="mt-3 text-xs text-danger-foreground">{error}</p> : null}
      </section>

      <section className="mx-3 mb-5 rounded-card border border-border bg-surface p-4 sm:mx-4" aria-label="دسته‌بندی‌های سخنرانان">
        <h2 className="mb-1 text-sm font-black">دسته‌بندی‌های سخنرانان</h2>
        <p className="mb-3 text-[11px] leading-5 text-muted-foreground">این‌ها در بخش سخنرانان مدیریت می‌شوند و هنگام انتشار یادداشت هم قابل انتخاب‌اند. اگر دسته‌ای انتخاب نشود و ناشر سخنران باشد، یادداشت در دستهٔ خودِ او قرار می‌گیرد.</p>
        <ul className="flex flex-wrap gap-2">
          {speaker.map((item) => (
            <li key={item.slug} className="rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-foreground-secondary">
              {item.name} <span className="text-muted-foreground">· {item.count.toLocaleString("fa-IR")}</span>
            </li>
          ))}
        </ul>
      </section>

      {deleting ? (
        <AdminDialog
          title="حذف دسته‌بندی"
          description={`«${deleting.name}» حذف می‌شود و یادداشت‌های آن بدون دسته می‌مانند.`}
          confirmLabel="حذف دسته‌بندی"
          tone="danger"
          busy={busy}
          error={error}
          onConfirm={() =>
            void run(async () => {
              await deleteNoteCategory(deleting.slug);
              setItems((current) => current.filter((entry) => entry.slug !== deleting.slug));
              setDeleting(null);
            })
          }
          onClose={() => { setDeleting(null); setError(""); }}
        />
      ) : null}
    </>
  );
}
