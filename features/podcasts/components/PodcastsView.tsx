import { Headphones } from "lucide-react";

const episodes = [
  { id: "field-voice", title: "صدای میدان؛ گزارش شب دوازدهم", duration: "۱۸ دقیقه", description: "گفت‌وگو با هماهنگ‌کنندگان پایگاه‌های مردمی." },
  { id: "city-story", title: "روایت شهر؛ ابتکارهای کوچک محلی", duration: "۲۴ دقیقه", description: "مرور تجربه‌های موفق محله‌ها و میدان‌ها." },
];

export function PodcastsView() {
  return (
    <section className="space-y-4 bg-background p-4 text-foreground" aria-labelledby="podcasts-title">
      <header><h1 id="podcasts-title" className="text-base font-black text-foreground">رادیو میدان</h1><p className="mt-1 text-xs text-muted-foreground">گفت‌وگوها و روایت‌های صوتی منتخب.</p></header>
      <div className="space-y-3">{episodes.map((episode) => <article key={episode.id} className="rounded-card border border-border bg-card p-4 text-card-foreground shadow-xs"><div className="flex items-start gap-3"><span className="rounded-xl bg-brand-muted p-2 text-brand"><Headphones className="h-5 w-5" /></span><div><h2 className="text-sm font-bold text-foreground">{episode.title}</h2><p className="mt-1 text-xs leading-6 text-muted-foreground">{episode.description}</p><span className="mt-2 block text-[11px] font-bold text-brand">{episode.duration}</span></div></div></article>)}</div>
    </section>
  );
}
