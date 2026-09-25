import assert from "node:assert/strict";
import test from "node:test";

import { contentAudioSource } from "../features/content/services/content-audio.ts";

test("content audio uses the attachment object-storage URL directly", () => {
  const s3Url =
    "https://naghshman-media.s3.ir-thr-at1.arvanstorage.ir/production/users/42/voice.mp3";

  assert.equal(
    contentAudioSource(901, [
      { id: 901, type: "audio", url: s3Url },
    ]),
    s3Url,
  );
});

test("content audio falls back to an audio attachment when the primary is a cover", () => {
  const s3Url =
    "https://naghshman-media.s3.ir-thr-at1.arvanstorage.ir/production/users/42/voice.ogg";

  assert.equal(
    contentAudioSource(900, [
      { id: 900, type: "image", url: "https://cdn.example.test/cover.jpg" },
      { id: 901, type: "audio", url: s3Url },
    ]),
    s3Url,
  );
});

test("content audio does not manufacture a proxy URL for missing media", () => {
  assert.equal(contentAudioSource(901, [{ id: 901, type: "audio" }]), undefined);
});
