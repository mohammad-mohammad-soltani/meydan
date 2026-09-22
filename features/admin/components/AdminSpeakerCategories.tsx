"use client";

import { useState } from "react";
import { AdminDialog } from "./AdminDialog";
import { adminErrorMessage, createSpeakerCategory, deleteSpeakerCategory, renameSpeakerCategory } from "../services/speakers.service";
import type { SpeakerCategory } from "../types";

export function AdminSpeakerCategories({ categories, onChange }: { categories: SpeakerCategory[]; onChange: (items: SpeakerCategory[]) => void }) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<SpeakerCategory | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const add = async () => {
    if (!name.trim() || busy) return;
    setBusy(true); setError("");
    try { const item = await createSpeakerCategory(name.trim()); onChange([...categories, item]); setName(""); }
    catch (reason) { setError(adminErrorMessage(reason)); }
    finally { setBusy(false); }
  };
  const save = async (slug: string) => {
    if (!editName.trim() || busy) return;
    setBusy(true); setError("");
    try { const item = await renameSpeakerCategory(slug, editName.trim()); onChange(categories.map((current) => current.slug === slug ? item : current)); setEditing(null); }
    catch (reason) { setError(adminErrorMessage(reason)); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!deleting || busy) return;
    setBusy(true); setError("");
    try { await deleteSpeakerCategory(deleting.slug); onChange(categories.filter((item) => item.slug !== deleting.slug)); setDeleting(null); }
    catch (reason) { setError(adminErrorMessage(reason)); }
    finally { setBusy(false); }
  };
  return <section className="mx-3 mb-5 rounded-card border border-border bg-surface p-4 sm:mx-4" aria-label="مدیریت دسته‌بندی سخنرانان">
    <h2 className="mb-3 text-sm font-black">دسته‌بندی‌های سخنرانان</h2>
    <form onSubmit={(event) => { event.preventDefault(); void add(); }} className="mb-3 flex gap-2">
      <input aria-label="نام دسته‌بندی جدید" value={name} onChange={(event) => setName(event.target.value)} placeholder="نام دسته‌بندی جدید" className="min-w-0 flex-1 rounded-control border border-border bg-input px-3 py-2 text-xs" />
      <button type="submit" disabled={busy || !name.trim()} className="rounded-control bg-brand px-3 py-2 text-xs font-bold text-brand-foreground disabled:opacity-50">افزودن</button>
    </form>
    <ul className="space-y-2">{categories.map((item) => <li key={item.slug} className="flex flex-wrap items-center gap-2 border-t border-divider pt-2 text-xs">
      {editing === item.slug ? <form onSubmit={(event) => { event.preventDefault(); void save(item.slug); }} className="flex flex-1 gap-2"><input aria-label={`نام ${item.name}`} value={editName} onChange={(event) => setEditName(event.target.value)} className="min-w-0 flex-1 rounded-control border border-border bg-input px-2 py-1" /><button type="submit" disabled={busy || !editName.trim()} className="font-bold text-brand">ذخیره</button><button type="button" onClick={() => setEditing(null)}>انصراف</button></form> : <><span className="flex-1 font-bold">{item.name}</span><span dir="ltr" className="text-muted-foreground">{item.slug}</span><button type="button" onClick={() => { setEditing(item.slug); setEditName(item.name); }} className="text-brand">ویرایش</button><button type="button" onClick={() => setDeleting(item)} className="text-danger-foreground">حذف</button></>}
    </li>)}</ul>
    {error ? <p role="alert" className="mt-3 text-xs text-danger-foreground">{error}</p> : null}
    {deleting ? <AdminDialog title="حذف دسته‌بندی" description={`«${deleting.name}» از فهرست و تمام حساب‌هایی که این دسته را دارند حذف می‌شود.`} confirmLabel="حذف دسته‌بندی" tone="danger" busy={busy} error={error} onConfirm={() => void remove()} onClose={() => { setDeleting(null); setError(""); }} /> : null}
  </section>;
}
