import assert from "node:assert/strict";
import test from "node:test";
import { contentVideo } from "../features/content/services/content-video.ts";
import { videoAspectRatio } from "../features/media/media-utils.ts";

test("content video keeps the primary attachment dimensions before playback", () => {
  const video = contentVideo(42, 8, [
    { id: 7, type: "video", width: 1920, height: 1080 },
    { id: 8, type: "video", width: 608, height: 1080 },
  ]);

  assert.deepEqual(video, {
    src: "/api/content/42/media/8",
    width: 608,
    height: 1080,
  });
  assert.equal(videoAspectRatio(video.width, video.height), 608 / 1080);
});

test("content video falls back to the first video and handles missing dimensions", () => {
  assert.deepEqual(contentVideo(42, 99, [
    { id: 4, type: "image", width: 800, height: 600 },
    { id: 5, type: "video", width: null, height: null },
  ]), {
    src: "/api/content/42/media/5",
    width: undefined,
    height: undefined,
  });
  assert.equal(contentVideo(42, 99, [{ id: 4, type: "image" }]), undefined);
  assert.equal(videoAspectRatio(undefined, undefined), 16 / 9);
});

test("video player uses the full portrait ratio without distorting invalid dimensions", () => {
  assert.equal(videoAspectRatio(1080, 1920), 9 / 16);
  assert.equal(videoAspectRatio(1920, 1080), 16 / 9);
  assert.equal(videoAspectRatio(0, 1080), 16 / 9);
  assert.equal(videoAspectRatio(Number.NaN, 1080), 16 / 9);
});
