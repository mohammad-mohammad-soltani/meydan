import { meydanApi } from "@/lib/meydan-api";
import type { ContentItem } from "../types";
import { toItem, type ApiContent } from "./content.service";

type ApiActor = {
  id: number | string;
  type?: string;
  display_name?: string;
  handle?: string;
  avatar_url?: string | null;
  verified?: boolean;
  location_label?: string;
};

type ApiProducerStat = { actor: ApiActor; audios: number };
type ApiSeries = { title: string; sessions: number; cover_url?: string | null; producer?: ApiActor | null; last_id: number };

type ApiAudioHub = {
  featured: ApiContent[];
  series: ApiSeries[];
  faces: ApiProducerStat[];
  squares: ApiProducerStat[];
  latest: ApiContent[];
};

export type HubProducer = { id: string; type: string; name: string; handle?: string; avatarUrl?: string; verified: boolean; place?: string; audios: number };
export type HubSeries = { title: string; sessions: number; coverUrl?: string; author?: string; lastId: number };
export type AudioHub = { featured: ContentItem[]; series: HubSeries[]; faces: HubProducer[]; squares: HubProducer[]; latest: ContentItem[] };

export type NoteCategory = { slug: string; name: string; count: number };
export type NotesHub = { categories: NoteCategory[]; featured: ContentItem[]; latest: ContentItem[] };

function producer(row: ApiProducerStat): HubProducer {
  return {
    id: String(row.actor.id),
    type: row.actor.type ?? "user",
    name: row.actor.display_name || "حساب",
    handle: row.actor.handle,
    avatarUrl: row.actor.avatar_url || undefined,
    verified: Boolean(row.actor.verified),
    place: row.actor.location_label || undefined,
    audios: row.audios,
  };
}

/** One read for the whole «آوا» tab; `q` swaps the shelves for matching audio. */
export async function getAudioHub(q = ""): Promise<AudioHub> {
  const query = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  const hub = await meydanApi<ApiAudioHub>(`/content/hub/audio${query}`);
  return {
    featured: (hub.featured ?? []).map(toItem),
    series: (hub.series ?? []).map((row) => ({
      title: row.title,
      sessions: row.sessions,
      coverUrl: row.cover_url || undefined,
      author: row.producer?.display_name,
      lastId: row.last_id,
    })),
    faces: (hub.faces ?? []).map(producer),
    squares: (hub.squares ?? []).map(producer),
    latest: (hub.latest ?? []).map(toItem),
  };
}

/** One read for the whole «یادداشت» tab. */
export async function getNotesHub(q = "", category = ""): Promise<NotesHub> {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (category) params.set("category", category);
  const suffix = params.size ? `?${params}` : "";
  const hub = await meydanApi<{ categories: NoteCategory[]; featured: ApiContent[]; latest: ApiContent[] }>(`/content/hub/notes${suffix}`);
  return { categories: hub.categories ?? [], featured: (hub.featured ?? []).map(toItem), latest: (hub.latest ?? []).map(toItem) };
}
