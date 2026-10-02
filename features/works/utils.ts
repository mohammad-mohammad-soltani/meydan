import type { WorkMessage, WorkUser } from "./types";

export const fa = (n: number | string) => Number(n).toLocaleString("fa-IR");

/** Deterministic palette pick so a person / work always keeps its colour. */
const hash = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);

const AVATAR_COLORS = ["#7c3aed", "#0891b2", "#16a34a", "#ca8a04", "#db2777", "#475569", "#ea580c", "#0d9488"];
export const avatarColor = (id: string) => AVATAR_COLORS[hash(id) % AVATAR_COLORS.length];

const NAME_COLORS = ["#e0574f", "#3f9a4a", "#c58a00", "#2f80c9", "#8b5cf6", "#d0457f", "#1f9a9c", "#d9733a"];
export const nameColor = (id: string) => NAME_COLORS[hash(id) % NAME_COLORS.length];

const WORK_COLORS = ["#d97706", "#be123c", "#e23434", "#0d9488", "#4f46e5", "#0891b2", "#7c3aed", "#16a34a"];
const WORK_ICONS = ["bolt", "scroll", "flag", "broom", "task", "users"] as const;
export const workColor = (id: string) => WORK_COLORS[hash(id) % WORK_COLORS.length];
export const workIcon = (id: string) => WORK_ICONS[hash(id) % WORK_ICONS.length];

export const initial = (name: string) => [...(name.trim() || "؟")][0];
export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

export function timeLabel(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
}

/** "امروز" / "دیروز" / "۱۲ مهر" — used for list rows and day separators. */
export function dayLabel(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(new Date()) - startOf(d)) / 86400000);
  if (diff === 0) return "امروز";
  if (diff === 1) return "دیروز";
  return d.toLocaleDateString("fa-IR", { day: "numeric", month: "long" });
}

/** Time for today's items, the day label otherwise (list rows). */
export function listTime(iso: string | null | undefined): string {
  return dayLabel(iso) === "امروز" ? timeLabel(iso) : dayLabel(iso);
}

export function dateTimeLabel(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${dayLabel(iso)} ${timeLabel(iso)}`;
}

export const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString();

/** Handle without the leading "@". */
export const bareHandle = (u: WorkUser) => u.handle.replace(/^@/, "");

/** Short plain-text preview of a message (quotes, list rows, pin bar). */
export function previewText(m: Pick<WorkMessage, "kind" | "task" | "meeting" | "announcement" | "poll" | "body">, max = 70): string {
  const raw = (m.task?.title ?? m.meeting?.title ?? m.announcement?.title ?? m.poll?.question ?? m.body ?? "").replace(/\s+/g, " ");
  return raw.length > max ? raw.slice(0, max) + "…" : raw;
}

export const STATUS_LABEL = { todo: "باز", doing: "در حال انجام", done: "انجام شد", ok: "تأیید شد" } as const;
