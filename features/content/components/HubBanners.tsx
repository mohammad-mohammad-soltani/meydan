"use client";

import Link from "next/link";
import type { Route } from "next";
import { Clock } from "lucide-react";
import { useState } from "react";
import type { ContentBanner } from "../services/banners.service";

type Slide = { id: string; tag: string; title: string; hint: string; href?: string; image?: string; soon?: boolean; tone: string };

const DEFAULTS: Slide[] = [
  { id: "screening", tag: "ثبت‌نام اکران", title: "فیلم و مستند در میادین", hint: "برای ثبت‌نام اکران در میدان خود اقدام کنید", soon: true, tone: "from-[#484848] to-[#0e0e0e]" },
  { id: "nights", tag: "برنامهٔ شب‌ها", title: "محور محتوایی شب‌های تجمع", hint: "برنامهٔ هر شب، آمادهٔ استفاده", href: "/content/report-days", tone: "from-[#484848] to-[#0e0e0e]" },
  { id: "kit", tag: "بستهٔ تبلیغاتی", title: "پلاکارد، بنر و استوری", hint: "فایل‌های آمادهٔ چاپ و انتشار", soon: true, tone: "from-[#484848] to-[#0e0e0e]" },
];

/**
 * The banner carousel above the hub. Banners managed in the admin panel come
 * first; the reference's three announcement slides follow so the strip is never empty.
 */
export function HubBanners({ banners }: { banners: ContentBanner[] }) {
  const managed: Slide[] = banners
    .filter((banner) => banner.enabled && banner.image_url)
    .map((banner) => ({ id: banner.id, tag: "", title: banner.title, hint: "", href: banner.href, image: banner.image_url!, tone: "from-zinc-700 to-zinc-900" }));
  const slides = [...managed, ...DEFAULTS];
  const [index, setIndex] = useState(0);

  return (
    <section aria-label="بنرهای محتوا" className="pt-3">
      <div
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4"
        onScroll={(event) => {
          const node = event.currentTarget;
          const first = node.firstElementChild as HTMLElement | null;
          if (first) setIndex(Math.min(slides.length - 1, Math.round(Math.abs(node.scrollLeft) / (first.offsetWidth + 12))));
        }}
      >
        {slides.map((slide) => {
          const body = (
            <>
              {slide.tag ? <span className="absolute right-3.5 top-3.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold backdrop-blur">{slide.tag}</span> : null}
              {slide.soon ? (
                <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold backdrop-blur"><Clock aria-hidden="true" className="h-3 w-3" />به‌زودی</span>
              ) : null}
              {slide.title ? <b className="text-xl font-black leading-8">{slide.title}</b> : null}
              {slide.hint ? <small className="mt-0.5 text-xs text-white/80">{slide.hint}</small> : null}
            </>
          );
          const cls = `relative flex aspect-[1.9/1] w-[88%] max-w-[520px] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-3xl bg-gradient-to-br p-4 text-right text-white ${slide.tone}`;
          const style = slide.image ? { background: `linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.65)), url(${slide.image}) center/cover` } : undefined;
          return slide.href ? (
            <Link key={slide.id} href={slide.href as Route} className={cls} style={style} aria-label={slide.title}>{body}</Link>
          ) : (
            <div key={slide.id} aria-disabled={slide.soon || undefined} className={`${cls} ${slide.soon ? "cursor-default" : ""}`} style={style}>{body}</div>
          );
        })}
      </div>
      <div className="mt-2.5 flex justify-center gap-1.5" aria-hidden="true">
        {slides.map((slide, position) => <i key={slide.id} className={`h-1.5 rounded-full transition-all ${position === index ? "w-5 bg-foreground" : "w-1.5 bg-border-strong"}`} />)}
      </div>
    </section>
  );
}
