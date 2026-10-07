import { meydanApi, meydanApiPage, stripMarkdown } from "@/lib/meydan-api";
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
    // Actor ids come prefixed («usr_6», «sq_54»); the audio pages and APIs take the number.
    id: String(row.actor.id).replace(/\D/g, ""),
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
      title: stripMarkdown(row.title),
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

export type ProducerPage = { items: HubProducer[]; nextOffset: number | null };

/** A page of the people or squares that publish audio, busiest first. */
export async function getProducerPage(kind: "faces" | "squares", offset = 0): Promise<ProducerPage> {
  const page = await meydanApiPage<ApiProducerStat[]>(`/content/hub/producers?kind=${kind}&offset=${offset}`);
  const next = page.meta?.next_offset;
  return { items: (page.data ?? []).map(producer), nextOffset: typeof next === "number" ? next : null };
}

export type AudioListQuery = { featured?: boolean; series?: string; producer?: { type: string; id: number } };
export type AudioListPage = { items: ContentItem[]; nextCursor: string | null };

/** Audio content, newest first, narrowed by shelf, series or producer. */
export async function getAudioList(query: AudioListQuery = {}, cursor?: string | null): Promise<AudioListPage> {
  // One actor's recordings: audio content they produced plus audio in their own posts (paged by offset).
  if (query.producer) {
    const params = new URLSearchParams({ type: query.producer.type, id: String(query.producer.id), offset: cursor ?? "0" });
    const page = await meydanApiPage<ApiContent[]>(`/content/hub/producer?${params}`);
    const next = page.meta?.next_offset;
    return { items: (page.data ?? []).map(toItem), nextCursor: typeof next === "number" ? String(next) : null };
  }
  const params = new URLSearchParams({ format: "audio" });
  if (query.featured) params.set("featured", "1");
  if (query.series) params.set("series", query.series);
  if (cursor) params.set("cursor", cursor);
  const page = await meydanApiPage<ApiContent[]>(`/content?${params}`);
  return { items: (page.data ?? []).map(toItem), nextCursor: page.nextCursor };
}
