import { Headphones } from "lucide-react";

const episodes = [
  { id: "field-voice", title: "صدای میدان؛ گزارش شب دوازدهم", duration: "۱۸ دقیقه", description: "گفت‌وگو با هماهنگ‌کنندگان پایگاه‌های مردمی." },
  { id: "city-story", title: "روایت شهر؛ ابتکارهای کوچک محلی", duration: "۲۴ دقیقه", description: "مرور تجربه‌های موفق محله‌ها و میدان‌ها." },
];

export function PodcastsView() {
  return <section className="space-y-4 bg-white p-4 dark:bg-[#070a0f]" aria-labelledby="podcasts-title"><header><h1 id="podcasts-title" className="text-base font-black text-slate-950 dark:text-white">رادیو میدان</h1><p className="mt-1 text-xs text-slate-500">گفت‌وگوها و روایت‌های صوتی منتخب.</p></header><div className="space-y-3">{episodes.map((episode) => <article key={episode.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex items-start gap-3"><span className="rounded-xl bg-brand-red/10 p-2 text-brand-red"><Headphones className="h-5 w-5" /></span><div><h2 className="text-sm font-bold text-slate-900 dark:text-white">{episode.title}</h2><p className="mt-1 text-xs leading-6 text-slate-500">{episode.description}</p><span className="mt-2 block text-[11px] font-bold text-brand-red">{episode.duration}</span></div></div></article>)}</div></section>;
}
