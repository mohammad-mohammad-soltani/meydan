import type { FeedPost } from "../feed/types";

export const MEDIA_POST_UPDATE = "meydan:media-post-update";
export type MediaPostUpdate = {
  id: string;
  stats: FeedPost["stats"];
  viewerState: { liked: boolean; reposted: boolean };
};
export function publishMediaPost(update: MediaPostUpdate) {
  window.dispatchEvent(new CustomEvent(MEDIA_POST_UPDATE, { detail: update }));
}
