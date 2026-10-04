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

test("the mini player floats within the shell and keeps actual transport and seek", () => {
  const mini = source("features/audio/MiniPlayer.tsx");
  const css = source("features/audio/audio.module.css");
  assert.match(css, /position:absolute/);
  assert.match(css, /left:12px;right:12px;bottom:76px/);
  assert.match(css, /border-radius:22px/);
  assert.match(css, /min-width:1024px.*bottom:20px/);
  assert.match(mini, /<AudioProgressBar compact showTimes=\{false\}/);
  for (const transport of [/void previous\(\)/, /void next\(\)/, /void toggle\(\)/, /onClick=\{clear\}/, /setExpanded\(true\)/]) {
    assert.match(mini, transport);
  }
  assert.doesNotMatch(source("features/audio/AudioProvider.tsx"), /Math\.sin|LEVEL_BAR_COUNT/);
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
