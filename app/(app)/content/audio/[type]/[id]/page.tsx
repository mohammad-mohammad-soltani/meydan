import Link from "next/link";
import type { Route } from "next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AudioListView } from "@/features/content/components/AudioListView";
import { getAudioList } from "@/features/content/services/hub.service";
import { meydanApi } from "@/lib/meydan-api";
import { actorKindOf, publicProfileHref } from "@/lib/profile-route";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "صوت‌ها | نقش من" };

type Params = Promise<{ type: string; id: string }>;
type ApiProfile = { display_name?: string; name?: string; handle?: string; location_label?: string };

/** Every recording of one speaker or square. */
export default async function ProducerAudioPage({ params }: { params: Params }) {
  const { type, id } = await params;
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0 || !/^[a-z]+$/.test(type)) notFound();

  const [page, profile] = await Promise.all([
    getAudioList({ producer: { type, id: numeric } }).catch(() => ({ items: [], nextCursor: null })),
    meydanApi<ApiProfile>(`/profiles/by-id/${type}/${numeric}`).catch(() => null),
  ]);
  const name = profile?.display_name || profile?.name || page.items[0]?.author || "صوت‌ها";

  return (
    <AudioListView
      title={name}
      subtitle="صوت‌های منتشرشده"
      query={{ producer: { type, id: numeric } }}
      initialItems={page.items}
      initialCursor={page.nextCursor}
      action={<Link href={publicProfileHref(actorKindOf(type), numeric, profile?.handle) as Route} className="shrink-0 rounded-pill border border-border bg-surface-muted px-3.5 py-2 text-[11px] font-black">نمایه</Link>}
    />
  );
}
