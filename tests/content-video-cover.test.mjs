import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadCover() {
  const file = path.join(root, "features/content/services/content-cover.ts");
  assert.ok(existsSync(file), "content cover mapping must exist");
  return import(pathToFileURL(file).href);
}

test("video content uses the backend-generated poster", async () => {
  const { contentCover } = await loadCover();

  assert.equal(
    contentCover(
      [{ id: 12, type: "video", url: "https://cdn.example/video.mp4", poster_url: "https://cdn.example/video.jpg" }],
      "video",
    ),
    "https://cdn.example/video.jpg",
  );
});

test("a video without a backend poster gets no substitute cover", async () => {
  const { contentCover } = await loadCover();

  assert.equal(
    contentCover([{ id: 12, type: "video", url: "https://cdn.example/video.mp4" }], "video"),
    undefined,
  );
});

test("the content service does not restore the generated video fallback", () => {
  const service = readFileSync(
    path.join(root, "features/content/services/content.service.ts"),
    "utf8",
  );

  assert.match(service, /coverImage: contentCover\(item\.attachments, item\.format\)/);
  assert.doesNotMatch(service, /enghelab-gathering\.png/);
});
