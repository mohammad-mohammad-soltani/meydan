const fa = new Intl.NumberFormat("fa-IR");

/** «۵ دقیقه پیش» / «۳ ساعت پیش» / «۲ روز پیش» for an ISO date. */
export function relativeFa(value?: string | null): string {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return "";
  const minutes = Math.max(1, Math.round((Date.now() - then) / 60000));
  if (minutes < 60) return `${fa.format(minutes)} دقیقه پیش`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${fa.format(hours)} ساعت پیش`;
  return `${fa.format(Math.round(hours / 24))} روز پیش`;
}

/** A stable 0‥359 hue for a name, so a tile without a cover keeps its colour. */
export function hueOf(text: string): number {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  return hash % 360;
}
