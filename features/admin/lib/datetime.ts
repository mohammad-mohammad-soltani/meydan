/**
 * The admin API stores Gregorian dates in three shapes: date-only, a WordPress
 * wall-clock datetime, and an ISO instant. The first two are *not* UTC instants;
 * treating them as such moves a calendar day at timezone boundaries.
 */
const TEHRAN = "Asia/Tehran";
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/i;
const jalaliUtc = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  timeZone: "UTC",
  year: "numeric",
  month: "long",
  day: "numeric",
});
const jalaliTehran = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  timeZone: TEHRAN,
  year: "numeric",
  month: "long",
  day: "numeric",
});
const tehranClock = new Intl.DateTimeFormat("fa-IR", {
  timeZone: TEHRAN,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const tehranGregorian = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
  timeZone: TEHRAN,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const persianTwoDigits = new Intl.NumberFormat("fa-IR", {
  useGrouping: false,
  minimumIntegerDigits: 2,
});

type Parsed = { date: Date; time: string; instant: boolean };

function parse(value?: string | null): Parsed | null {
  const match = DATE_PATTERN.exec(value?.trim() ?? "");
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4] ?? 0);
  const minute = Number(match[5] ?? 0);
  const second = Number(match[6] ?? 0);
  const calendar = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    calendar.getUTCFullYear() !== year ||
    calendar.getUTCMonth() + 1 !== month ||
    calendar.getUTCDate() !== day ||
    hour > 23 || minute > 59 || second > 59
  ) return null;

  const instant = Boolean(match[7]);
  const zoned = instant
    ? new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${String(second).padStart(2, "0")}${match[7]}`)
    : calendar;
  if (Number.isNaN(zoned.getTime())) return null;
  return { date: zoned, time: match[4] ? `${match[4]}:${match[5]}` : "", instant };
}

/** A short Jalali date for a list cell or detail row. */
export function formatAdminDate(value?: string | null): string {
  const parsed = parse(value);
  if (!parsed) return "—";
  return (parsed.instant ? jalaliTehran : jalaliUtc).format(parsed.date);
}

/** Jalali day plus a 24-hour Tehran clock where a time exists. */
export function formatAdminDateTime(value?: string | null): string {
  const parsed = parse(value);
  if (!parsed) return "—";
  const date = (parsed.instant ? jalaliTehran : jalaliUtc).format(parsed.date);
  if (!parsed.time) return date;
  const time = parsed.instant
    ? tehranClock.format(parsed.date)
    : `${persianTwoDigits.format(Number(parsed.time.slice(0, 2)))}:${persianTwoDigits.format(Number(parsed.time.slice(3, 5)))}`;
  return `${date}، ${time}`;
}

/** Values consumed by the existing Persian date/time pickers. */
export function splitAdminDateTime(value?: string | null): { date: string; time: string } {
  const parsed = parse(value);
  if (!parsed) return { date: "", time: "" };
  if (!parsed.instant) return { date: parsed.date.toISOString().slice(0, 10), time: parsed.time };
  const pieces = tehranGregorian.formatToParts(parsed.date);
  const part = (type: Intl.DateTimeFormatPartTypes) => pieces.find((item) => item.type === type)?.value ?? "";
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
  };
}

/** Keep the WordPress admin API's established naive `YYYY-MM-DD HH:mm` shape. */
export function joinAdminDateTime(date: string, time: string): string {
  if (!date) return "";
  return time ? `${date} ${time}` : date;
}
