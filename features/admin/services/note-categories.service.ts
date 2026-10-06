import { adminDelete, adminGetItem, adminPatch, adminPost, segment } from "./admin-api";

/** A category notes can be filed under: a speaker category (read-only here) or one owned by the notes section. */
export type NoteCategoryOption = { slug: string; name: string; source: "speaker" | "note"; count: number };

export async function getNoteCategories(init?: RequestInit): Promise<NoteCategoryOption[]> {
  const rows = await adminGetItem<Array<Partial<NoteCategoryOption>>>("/admin/note-categories", init);
  return (rows ?? []).map((row) => ({
    slug: String(row.slug ?? ""),
    name: String(row.name ?? ""),
    source: row.source === "speaker" ? "speaker" : "note",
    count: Number(row.count ?? 0),
  }));
}

export async function createNoteCategory(name: string): Promise<NoteCategoryOption> {
  const row = await adminPost<Partial<NoteCategoryOption>>("/admin/note-categories", { name });
  return { slug: String(row.slug), name: String(row.name), source: "note", count: 0 };
}

export async function renameNoteCategory(slug: string, name: string): Promise<void> {
  await adminPatch(`/admin/note-categories/${segment(slug)}`, { name });
}

export async function deleteNoteCategory(slug: string): Promise<void> {
  await adminDelete(`/admin/note-categories/${segment(slug)}`);
}
