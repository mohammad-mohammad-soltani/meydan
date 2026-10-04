"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";
import type { ContentBanner } from "../services/banners.service";

type Slide = { id: string; tag: string; title: string; hint: string; href?: string; image?: string; tone: string };

/**
 * The banner carousel uses only published, admin-managed images and links.
 */
export function HubBanners({ banners }: { banners: ContentBanner[] }) {
  const managed: Slide[] = banners
    .filter((banner) => banner.enabled && banner.image_url)
    .map((banner) => ({ id: banner.id, tag: "", title: banner.title, hint: "", href: banner.href, image: banner.image_url!, tone: "from-zinc-700 to-zinc-900" }));
  const slides = managed;
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const current = useRef(0);
  const touched = useRef(false);
  const count = slides.length;

  useEffect(() => {
    current.current = index;
  }, [index]);

  // Like the reference: move to the next banner every 5.2 s, and stop for good once the reader touches the strip.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || count < 2) return;
    const stop = () => { touched.current = true; };
    const events = ["pointerdown", "touchstart", "wheel"] as const;
    for (const name of events) track.addEventListener(name, stop, { passive: true });
    const timer = window.setInterval(() => {
      if (touched.current || document.hidden) return;
      const first = track.firstElementChild as HTMLElement | null;
      if (!first) return;
      const next = (current.current + 1) % count;
      track.scrollTo({ left: -next * (first.offsetWidth + 12), behavior: "smooth" });
    }, 5200);
    return () => {
      window.clearInterval(timer);
      for (const name of events) track.removeEventListener(name, stop);
    };
  }, [count]);

  if (!slides.length) return null;

  return (
    <section aria-label="بنرهای محتوا" className="reference-hub-banners">
      <div
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-[18px]"
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
              {slide.title ? <b className="text-xl font-black leading-8">{slide.title}</b> : null}
              {slide.hint ? <small className="mt-0.5 text-xs text-white/80">{slide.hint}</small> : null}
            </>
          );
          const cls = `relative flex aspect-video w-[86%] lg:w-[70%] shrink-0 snap-center flex-col justify-end overflow-hidden rounded-[18px] bg-gradient-to-br p-5 text-right text-white ${slide.tone}`;
          const style = slide.image ? { background: `linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.65)), url(${slide.image}) center/cover` } : undefined;
          return slide.href ? (
            <Link key={slide.id} href={slide.href as Route} className={cls} style={style} aria-label={slide.title}>{body}</Link>
          ) : (
            <div key={slide.id} className={cls} style={style}>{body}</div>
          );
        })}
      </div>
      <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
        {slides.map((slide, position) => <i key={slide.id} className={`h-1.5 rounded-full transition-all ${position === index ? "w-[18px] bg-foreground" : "w-1.5 bg-border-strong"}`} />)}
      </div>
    </section>
  );
}
