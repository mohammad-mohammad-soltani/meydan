/** Bookmark state is shared by the action bar and the share sheet through this window event. */
export const BOOKMARK_EVENT = "meydan:bookmark";

export type BookmarkDetail = { id: string; bookmarked: boolean };

export function announceBookmark(detail: BookmarkDetail): void {
  window.dispatchEvent(new CustomEvent<BookmarkDetail>(BOOKMARK_EVENT, { detail }));
}
