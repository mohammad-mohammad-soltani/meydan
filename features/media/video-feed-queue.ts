import type { FeedPost } from "../feed/types";
import type { MediaItem } from "./types";

export type VideoFeedEntry = {
  key: string;
  postId: string;
  authorKey: string;
  author: string;
  body: string;
  item: MediaItem;
  post?: FeedPost;
  media?: MediaItem[];
};

export function videosFromPosts(posts: FeedPost[]): VideoFeedEntry[] {
  return posts.flatMap((post) =>
    post.attachments
      .filter((item) => item.icon === "video" && Boolean(item.previewSrc))
      .map((item) => ({
        post,
        media: post.attachments.filter((attachment) =>
          (attachment.icon === "image" || attachment.icon === "video") && attachment.previewSrc,
        ).map((attachment): MediaItem => ({
          id: attachment.id, kind: attachment.icon === "video" ? "video" : "image",
          src: attachment.previewSrc, poster: attachment.posterSrc, title: attachment.label,
          width: attachment.width, height: attachment.height,
        })),
        key: `${post.id}:${item.id}`,
        postId: post.id,
        authorKey: `${post.author.type}:${post.author.id}`,
        author: post.squareName,
        body: post.body,
        item: {
          id: item.id,
          kind: "video" as const,
          src: item.previewSrc,
          poster: item.posterSrc,
          title: item.label,
          width: item.width,
          height: item.height,
        },
      })),
  );
}

/** Append only: committed history is never reordered by later pages. */
export function appendVideos(
  queue: VideoFeedEntry[],
  candidates: VideoFeedEntry[],
): VideoFeedEntry[] {
  const posts = new Set(queue.map((entry) => entry.postId));
  const keys = new Set(queue.map((entry) => entry.key));
  const sources = new Set(queue.map((entry) => entry.item.src));
  const pending = candidates.filter((entry) => {
    if (!entry.item.src || posts.has(entry.postId) || keys.has(entry.key) || sources.has(entry.item.src))
      return false;
    posts.add(entry.postId);
    keys.add(entry.key);
    sources.add(entry.item.src);
    return true;
  });
  const result = [...queue];
  while (pending.length) {
    const previous = result.at(-1)?.authorKey;
    const different = pending.findIndex(
      (entry) => entry.authorKey !== previous,
    );
    result.push(...pending.splice(Math.max(0, different), 1));
  }
  return result;
}

export type VideoPage = { posts: FeedPost[]; nextCursor: string | null };
export type VideoPageState = {
  cursor: string | null;
  exhausted: boolean;
  recovered: boolean;
};

/** Bounded scanning prevents an all-text timeline from becoming a request loop. */
export async function scanVideoPages(
  initial: VideoPageState,
  known: VideoFeedEntry[],
  fetchPage: (cursor: string | null) => Promise<VideoPage>,
): Promise<{ state: VideoPageState; queue: VideoFeedEntry[] }> {
  let state = { ...initial };
  let queue = known;
  for (let pageIndex = 0; pageIndex < 5 && !state.exhausted; pageIndex++) {
    let page: VideoPage;
    try {
      page = await fetchPage(state.cursor);
    } catch (error) {
      if (
        state.cursor &&
        !state.recovered &&
        (error as { status?: number }).status === 410
      ) {
        state = { ...state, cursor: null, recovered: true };
        // Persist recovery even if the next request fails.
        Object.assign(initial, state);
        continue;
      }
      throw error;
    }
    state = {
      ...state,
      cursor: page.nextCursor,
      exhausted: page.nextCursor === null,
    };
    const next = appendVideos(queue, videosFromPosts(page.posts));
    if (next.length > queue.length) return { state, queue: next };
    queue = next;
  }
  return { state, queue };
}

/** All input sources share this gate, including ended events from stale slides. */
export function nextVideoIndex(
  current: number,
  direction: number,
  length: number,
  locked: boolean,
  origin = current,
): number {
  if (locked || origin !== current) return current;
  return Math.max(0, Math.min(length - 1, current + Math.sign(direction)));
}
