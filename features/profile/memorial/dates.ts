/** Persian-digit and day/month/year helpers for the memorial page. */
export const faDigits = (value: string) => value.replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
/** Label of the end-of-life date. */
export const DEATH_LABEL = "شهادت";

/** «۲۶/۵/۱۴۰۴» → «۲۶ مرداد ۱۴۰۴»; anything that isn't a plain day/month/year is shown as written. */
export function longDate(value: string): string {
  const latin = value.trim().replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
  const match = /^(\d{1,4})[/\-.](\d{1,2})[/\-.](\d{1,4})$/.exec(latin);
  if (!match) return faDigits(value.trim());
  const [a, b, c] = match.slice(1).map(Number);
  const [year, month, day] = a > 31 ? [a, b, c] : [c, b, a];
  if (month < 1 || month > 12 || day < 1 || day > 31) return faDigits(value.trim());
  return `${faDigits(String(day))} ${MONTHS[month - 1]} ${faDigits(String(year))}`;
}
