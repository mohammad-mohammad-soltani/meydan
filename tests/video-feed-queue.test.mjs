import assert from "node:assert/strict";
import test from "node:test";
import {
  appendVideos,
  videosFromPosts,
  scanVideoPages,
  nextVideoIndex,
} from "../features/media/video-feed-queue.ts";

const post = (id, author = id, video = true) => ({
  id: String(id),
  author: { type: "user", id: author },
  squareName: `author ${author}`,
  body: "body",
  attachments: video
    ? [
        {
          id: String(id),
          icon: "video",
          label: "video",
          previewSrc: `/video-${id}.mp4`,
        },
      ]
    : [],
});
const entries = (...posts) => videosFromPosts(posts);

test("drops missing sources, duplicate attachment keys and duplicate files", () => {
  const seed = entries(post(1));
  const repeatedFile = entries(post(2))[0];
  repeatedFile.item.src = seed[0].item.src;
  assert.deepEqual(
    appendVideos(seed, [
      ...seed,
      repeatedFile,
      ...entries(post(3)),
      {
        ...repeatedFile,
        key: "empty",
        item: { ...repeatedFile.item, src: undefined },
      },
    ]).map((e) => e.key),
    ["1:1", "3:3"],
  );
});

test("diversifies authors without reordering committed history or losing candidates", () => {
  const seed = entries(post(1, 1));
  const queue = appendVideos(seed, entries(post(2, 1), post(3, 2), post(4, 2)));
  assert.deepEqual(
    queue.map((e) => e.postId),
    ["1", "3", "2", "4"],
  );
  assert.deepEqual(appendVideos(queue, entries(post(5, 3))).slice(0, 4), queue);
  assert.deepEqual(
    seed.map((e) => e.postId),
    ["1"],
  );
});

test("scans text-only pages and stops as soon as unseen videos arrive", async () => {
  const cursors = [];
  const result = await scanVideoPages(
    { cursor: null, exhausted: false, recovered: false },
    [],
    async (cursor) => {
      cursors.push(cursor);
      return cursor === null
        ? { posts: [post(1, 1, false)], nextCursor: "page2" }
        : { posts: [post(2)], nextCursor: null };
    },
  );
  assert.deepEqual(cursors, [null, "page2"]);
  assert.equal(result.queue.length, 1);
  assert.equal(result.state.exhausted, true);
});

test("scanning is bounded at five pages and remains resumable", async () => {
  let count = 0;
  const result = await scanVideoPages(
    { cursor: null, exhausted: false, recovered: false },
    [],
    async () => ({ posts: [], nextCursor: String(++count) }),
  );
  assert.equal(count, 5);
  assert.equal(result.state.cursor, "5");
  assert.equal(result.state.exhausted, false);
});

test("expired cursor recovers once, preserving history and deduplication", async () => {
  const cursors = [];
  const result = await scanVideoPages(
    { cursor: "expired", exhausted: false, recovered: false },
    entries(post(1)),
    async (cursor) => {
      cursors.push(cursor);
      if (cursor) throw { status: 410 };
      return { posts: [post(1), post(2)], nextCursor: "new" };
    },
  );
  assert.deepEqual(cursors, ["expired", null]);
  assert.equal(result.state.recovered, true);
  assert.deepEqual(
    result.queue.map((e) => e.postId),
    ["1", "2"],
  );
  await assert.rejects(
    scanVideoPages(result.state, result.queue, async () => {
      throw { status: 410 };
    }),
  );
});

test("network errors preserve queue and recovery cannot loop after retry", async () => {
  const seed = entries(post(1));
  const state = { cursor: "expired", exhausted: false, recovered: false };
  await assert.rejects(
    scanVideoPages(state, seed, async (cursor) => {
      throw { status: cursor ? 410 : 503 };
    }),
  );
  assert.equal(seed.length, 1);
  assert.equal(state.recovered, true);
  assert.equal(state.cursor, null);
});

test("one shared transition gate rejects duplicate ended/swipe and stale slide events", () => {
  assert.equal(nextVideoIndex(0, 1, 3, false), 1);
  assert.equal(nextVideoIndex(1, 1, 3, true), 1);
  assert.equal(nextVideoIndex(1, 1, 3, false, 0), 1);
  assert.equal(nextVideoIndex(1, -1, 3, false), 0);
  assert.equal(nextVideoIndex(0, -1, 3, false), 0);
  assert.equal(nextVideoIndex(2, 1, 3, false), 2);
});

test("viewer keeps every visual attachment and queues a post only once", () => {
  const mixed = post(8);
  mixed.attachments = [
    { id: 'photo', icon: 'image', label: 'photo', previewSrc: '/photo.jpg' },
    ...mixed.attachments,
    { id: 'second', icon: 'video', label: 'second', previewSrc: '/second.mp4' },
  ];
  const candidates = entries(mixed);
  assert.deepEqual(candidates[1].media?.map(item => item.id), ['photo', '8', 'second']);
  assert.equal(candidates[1].post, mixed);
  assert.equal(appendVideos([candidates[1]], candidates).length, 1);
});
