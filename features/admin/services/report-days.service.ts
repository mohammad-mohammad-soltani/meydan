import { adminGetItem, adminPatch } from "./admin-api";

type ApiReportDay = { date: string; night_number: number; report_count: number; title?: string | null; subtitle?: string | null; description?: string | null; text_color?: string | null; background_color?: string | null };
export type AdminReportDay = { date: string; nightNumber: number; reportCount: number; title: string; subtitle: string; description: string; textColor: string; backgroundColor: string };
export type ReportDayInput = Pick<AdminReportDay, "title" | "subtitle" | "description" | "textColor" | "backgroundColor">;

function map(row: ApiReportDay): AdminReportDay { return { date: row.date, nightNumber: Number(row.night_number), reportCount: Number(row.report_count), title: String(row.title ?? ""), subtitle: String(row.subtitle ?? ""), description: String(row.description ?? ""), textColor: String(row.text_color ?? ""), backgroundColor: String(row.background_color ?? "") }; }
export async function getAdminReportDays(init?: RequestInit): Promise<AdminReportDay[]> { return (await adminGetItem<ApiReportDay[]>("/admin/report-days", init)).map(map); }
export async function updateReportDay(date: string, input: ReportDayInput): Promise<AdminReportDay> { return map(await adminPatch<ApiReportDay>(`/admin/report-days/${date}`, { title: input.title, subtitle: input.subtitle, description: input.description, text_color: input.textColor || null, background_color: input.backgroundColor || null })); }
