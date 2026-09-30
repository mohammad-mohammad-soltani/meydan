import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("one audio engine drives every audio surface", () => {
  const audioFiles = ["features/audio/AudioProvider.tsx", "features/audio/MiniPlayer.tsx", "features/audio/AudioProgressBar.tsx"];
  for (const file of audioFiles) assert.ok(existsSync(path.join(root, file)), `${file} must exist`);

  // The single hidden <audio> element lives in the provider and nowhere else.
  const provider = source("features/audio/AudioProvider.tsx");
  assert.match(provider, /<audio ref=\{audioRef\}/);
  assert.doesNotMatch(source("features/audio/MiniPlayer.tsx"), /<audio/);
  assert.doesNotMatch(source("features/media/components/MediaAudioCard.tsx"), /<audio/);
  assert.match(source("features/podcasts/components/PodcastsView.tsx"), /useAudio/);
});

test("the full-screen player keeps the immersive controls", () => {
  const sheet = source("features/audio/NowPlayingSheet.tsx");
  for (const capability of [
    /useAudio\(\)/,
    /queue\.map/,
    /SKIP_SECONDS = 15/,
    /seekBy\(-SKIP_SECONDS\)/,
    /seekBy\(SKIP_SECONDS\)/,
    /void previous\(\)/,
    /void next\(\)/,
    /role="dialog"/,
    /aria-modal="true"/,
    /event\.key === "Escape"/,
    /createPortal/,
    /document\.body\.style\.overflow = "hidden"/,
  ]) {
    assert.match(sheet, capability, `sheet must implement ${capability}`);
  }

  const mini = source("features/audio/MiniPlayer.tsx");
  assert.match(mini, /<NowPlayingSheet/);
  assert.match(mini, /setExpanded\(true\)/);
});

test("the mini player stays legible on a phone", () => {
  const mini = source("features/audio/MiniPlayer.tsx");

  // Phones get tighter padding, a smaller cover and a compact transport.
  assert.match(mini, /px-2\.5 py-2[\s\S]*?sm:px-3 sm:py-2\.5/);
  assert.match(mini, /h-10 w-10 shrink-0[\s\S]*?sm:h-11 sm:w-11/);
  assert.match(mini, /h-8 w-8 place-items-center rounded-full[\s\S]*?sm:h-9 sm:w-9/);
  assert.match(mini, /h-10 w-10 place-items-center rounded-full bg-brand[\s\S]*?sm:h-11 sm:w-11/);

  // The artwork already opens the full-screen sheet, so the extra chevron is
  // desktop-only instead of stealing width from the title.
  assert.match(mini, /hidden h-9 w-9 place-items-center[\s\S]*?sm:grid/);

  // Title and the time/artist line each stay on one line.
  assert.match(mini, /block truncate text-\[13px\][\s\S]*?sm:text-\[12px\]/);
  assert.match(mini, /shrink-0 whitespace-nowrap tabular-nums/);
  assert.match(mini, /min-w-0 truncate" dir="rtl"/);
});


test("delegates playback to the native app audio session without changing browser playback", () => {
  const provider = source("features/audio/audio-runtime.ts") + source("features/audio/AudioProvider.tsx");

  assert.match(provider, /nativeAudioV1/);
  assert.match(provider, /type: "native-audio-load"/);
  assert.match(provider, /type: "native-audio-play"/);
  assert.match(provider, /type: "native-audio-pause"/);
  assert.match(provider, /type: "native-audio-seek"/);
  assert.match(provider, /naghshman:native-audio-state/);
  assert.match(provider, /nativeAudioBridgeAvailable\(\)[\s\S]*navigator\.mediaSession\.metadata = null/);

  // The browser fallback remains intact for normal web visitors and old APKs.
  assert.match(provider, /<audio ref=\{audioRef\}/);
  assert.match(provider, /await audio\.play\(\)/);
});
