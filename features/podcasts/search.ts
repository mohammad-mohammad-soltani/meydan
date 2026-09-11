import type { ContentItem } from "../content/types";

function normalizeSearchValue(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("fa-IR")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ");
}

export function filterPodcastItems(items: ContentItem[], query: string): ContentItem[] {
  const audioItems = items.filter(
    (item) => item.category === "audio" || item.media.kind === "audio",
  );
  const needle = normalizeSearchValue(query);

  if (!needle) return audioItems;

  return audioItems.filter((item) =>
    [item.title, item.subtitle, item.description, item.author || ""]
      .map(normalizeSearchValue)
      .some((value) => value.includes(needle)),
  );
}
