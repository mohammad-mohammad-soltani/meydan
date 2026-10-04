import type { ProfileStat } from "./types";

/** Zero is a known total; an omitted total must never become a page-length estimate. */
export function narrativeTotal(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

/** Stats are identified by their labels, regardless of backend order or omissions. */
export function upsertProfileStat(stats: ProfileStat[], incoming: ProfileStat): ProfileStat[] {
  const index = stats.findIndex((stat) => stat.label === incoming.label);
  if (index === -1) return [...stats, incoming];
  return stats.map((stat, position) => position === index ? { ...stat, ...incoming } : stat);
}

/** Each independent API count contributes only when explicitly known. */
export function availableProfileStats(narratives: unknown, reflections: unknown, format: (value: number) => string): ProfileStat[] {
  const stats: ProfileStat[] = [];
  const total = narrativeTotal(narratives);
  const reflectionTotal = narrativeTotal(reflections);
  if (total !== null) stats.push({ label: "روایت منتشرشده", value: format(total) });
  if (reflectionTotal !== null) stats.push({ label: "بازتاب رسانه‌ای", value: `${format(reflectionTotal)} روایت`, tone: "success" });
  return stats;
}
