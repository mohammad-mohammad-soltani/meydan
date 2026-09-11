import assert from "node:assert/strict";
import test from "node:test";
import { filterPodcastItems } from "../features/podcasts/search.ts";

const items = [
  {
    id: "anthem-1",
    apiId: 1,
    category: "audio",
    status: "ready",
    title: "سرود مقاومت",
    subtitle: "اجرای جمعی میدان انقلاب",
    description: "نسخه مناسب پخش در تجمع",
    author: "گروه هم‌آهنگ",
    media: { kind: "audio", audioSrc: "/a.mp3" },
  },
  {
    id: "anthem-2",
    apiId: 2,
    category: "audio",
    status: "ready",
    title: "نوای شهر",
    subtitle: "ویژه شب جمعه",
    description: "اثر صوتی دوم",
    author: "حامد",
    media: { kind: "audio", audioSrc: "/b.mp3" },
  },
  {
    id: "talk-1",
    apiId: 3,
    category: "talks",
    status: "ready",
    title: "سخنرانی مقاومت",
    subtitle: "متن",
    description: "نباید در صفحه صوتی دیده شود",
    media: { kind: "document" },
  },
];

test("podcast page shows all audio items when search is empty", () => {
  assert.deepEqual(filterPodcastItems(items, "").map((item) => item.id), ["anthem-1", "anthem-2"]);
});

test("podcast search matches title, subtitle, description and author", () => {
  assert.deepEqual(filterPodcastItems(items, "مقاومت").map((item) => item.id), ["anthem-1"]);
  assert.deepEqual(filterPodcastItems(items, "شب جمعه").map((item) => item.id), ["anthem-2"]);
  assert.deepEqual(filterPodcastItems(items, "حامد").map((item) => item.id), ["anthem-2"]);
});
