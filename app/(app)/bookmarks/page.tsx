import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { Bookmark, ChevronLeft } from "lucide-react";
import { getBookmarkedContent } from "@/features/content/services/content.service";
import type { ContentItem } from "@/features/content/types";
import { loginHref } from "@/lib/auth-navigation";
import { accessTokenHeader, isAuthenticated } from "@/lib/meydan-session";

export const metadata: Metadata = { title: "نشان‌شده‌ها | نقش من" };
export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  if (!(await isAuthenticated())) redirect(loginHref("/bookmarks"));

  let items: ContentItem[] = [];
  let failed = false;
  try {
    items = await getBookmarkedContent({ headers: await accessTokenHeader() });
  } catch {
    failed = true;
  }

  return (
    <section className="min-h-full bg-background">
      <header className="sticky top-0 z-30 border-b border-divider bg-surface-glass px-4 py-3 backdrop-blur-md">
        <h1 className="text-sm font-black text-foreground">نشان‌شده‌ها</h1>
      </header>
      {failed ? (
        <p role="alert" className="p-6 text-center text-xs text-muted-foreground">دریافت نشان‌شده‌ها ممکن نشد. دوباره تلاش کنید.</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-border bg-surface-muted text-icon">
            <Bookmark aria-hidden="true" className="h-5 w-5" />
          </span>
          <p className="text-sm font-black text-foreground">هنوز چیزی نشان نکرده‌اید</p>
          <p className="text-xs text-muted-foreground">محتواهایی که در «بسته محتوا» نشان کنید اینجا می‌آیند.</p>
        </div>
      ) : (
        <ul className="divide-y divide-divider">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/content/${item.apiId}` as Route} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-hover">
                <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-muted">
                  {item.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote cover of any size
                    <img src={item.coverUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm font-black text-foreground">{item.title}</strong>
                  {item.subtitle ? <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.subtitle}</span> : null}
                </span>
                <ChevronLeft aria-hidden="true" className="h-4 w-4 shrink-0 text-icon-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
