import { meydanApi } from "@/lib/meydan-api";

type ApiReportDay = {
  date: string;
  night_number: number;
  report_count: number;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  text_color?: string | null;
  background_color?: string | null;
};

export type ReportDay = {
  date: string;
  nightNumber: number;
  reportCount: number;
  title: string;
  subtitle: string;
  description: string;
  textColor: string | null;
  backgroundColor: string | null;
};

export function mapReportDay(row: ApiReportDay): ReportDay {
  return {
    date: row.date,
    nightNumber: Number(row.night_number),
    reportCount: Number(row.report_count),
    title: String(row.title ?? ""),
    subtitle: String(row.subtitle ?? ""),
    description: String(row.description ?? ""),
    textColor: row.text_color ?? null,
    backgroundColor: row.background_color ?? null,
  };
}

export async function getReportDays(): Promise<ReportDay[]> {
  return (await meydanApi<ApiReportDay[]>("/report-days")).map(mapReportDay);
}

/** Night numbers are calendar days in Tehran, with 10 Esfand 1404 as night 1. */
export function currentReportNight(): number {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return Math.floor((Date.UTC(value("year"), value("month") - 1, value("day")) - Date.UTC(2026, 2, 1)) / 86_400_000) + 1;
}
