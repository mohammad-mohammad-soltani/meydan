import type { ContentBanner } from "../services/banners.service";

export function ContentBanners({ banners }: { banners: ContentBanner[] }) {
  const visible = banners.filter((banner) => banner.enabled && banner.image_url);
  if (!visible.length) return null;

  return (
    <section aria-label="بنرهای محتوا" dir="rtl" className="pt-3">
      <div className="flex snap-x snap-mandatory scroll-ps-3 gap-4 overflow-x-auto overscroll-x-contain px-3 pb-1 sm:scroll-ps-4 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visible.map((banner, index) => (
          <a
            key={banner.id}
            href={banner.href}
            aria-label={banner.title}
            className={`block aspect-[1.8/1] shrink-0 snap-start overflow-hidden rounded-[20px] bg-surface focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-brand ${visible.length === 1 ? "w-full" : "w-[90%]"}`}
          >
            {/* Fill the rounded banner frame even when an upload has a different aspect ratio. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={banner.image_url!} alt={banner.title} loading={index === 0 ? "eager" : "lazy"} className="block h-full w-full object-cover" />
          </a>
        ))}
      </div>
    </section>
  );
}
