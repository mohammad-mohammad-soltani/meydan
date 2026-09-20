import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

async function loadVideoSound() {
  const file = path.join(root, "lib/video-sound.ts");
  assert.ok(existsSync(file), "lib/video-sound.ts must exist");
  return import(pathToFileURL(file).href);
}

/**
 * A minimal browser stand-in so the shared mute preference can be exercised
 * for real: localStorage, a change event and a document with <video> elements.
 */
function installFakeBrowser({ storedMuted } = {}) {
  const videos = Array.from({ length: 3 }, () => ({ muted: false }));
  const dispatched = [];
  const previous = { window: globalThis.window, document: globalThis.document };

  const store = new Map();
  if (storedMuted !== undefined) store.set("meydan-video-muted", storedMuted);

  globalThis.window = {
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
    },
    dispatchEvent: (event) => {
      dispatched.push(event);
      return true;
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  globalThis.document = {
    querySelectorAll: (selector) => (selector === "video" ? videos : []),
  };

  return {
    videos,
    dispatched,
    store,
    restore() {
      globalThis.window = previous.window;
      globalThis.document = previous.document;
    },
  };
}

test("sound preference persists and broadcasts to every video on the page", async () => {
  const { setVideoMuted, readStoredVideoMuted, VIDEO_MUTED_STORAGE_KEY } = await loadVideoSound();
  const browser = installFakeBrowser();

  try {
    assert.equal(readStoredVideoMuted(), false, "videos start unmuted by default");

    assert.equal(setVideoMuted(true), true);
    assert.equal(readStoredVideoMuted(), true);
    assert.equal(browser.store.get(VIDEO_MUTED_STORAGE_KEY), "true");
    assert.deepEqual(
      browser.videos.map((video) => video.muted),
      [true, true, true],
      "muting reaches every mounted player, not just the one that was tapped",
    );

    assert.equal(setVideoMuted(false), false);
    assert.equal(readStoredVideoMuted(), false);
    assert.deepEqual(browser.videos.map((video) => video.muted), [false, false, false]);
  } finally {
    browser.restore();
  }
});

test("a player mounting later adopts the stored preference", async () => {
  const { setVideoMuted, readStoredVideoMuted } = await loadVideoSound();
  const browser = installFakeBrowser();
  browser.restore();

  const reopened = installFakeBrowser();
  try {
    setVideoMuted(true);
    assert.equal(reopened.store.get("meydan-video-muted"), "true");

    // A page loaded after the choice was made still reports muted.
    assert.equal(readStoredVideoMuted(), true);
  } finally {
    reopened.restore();
  }
});

test("subscribers are notified once per change", async () => {
  const { setVideoMuted, onVideoMutedChange } = await loadVideoSound();
  const browser = installFakeBrowser();

  try {
    const seen = [];
    const unsubscribe = onVideoMutedChange((muted) => seen.push(muted));

    setVideoMuted(true);
    setVideoMuted(true);
    unsubscribe();
    setVideoMuted(false);

    assert.deepEqual(seen, [true, true], "unsubscribed listeners stop receiving updates");
  } finally {
    browser.restore();
  }
});

test("toggling flips the persisted preference rather than a local flag", async () => {
  const { toggleVideoMuted, readStoredVideoMuted, setVideoMuted } = await loadVideoSound();
  const browser = installFakeBrowser();

  try {
    assert.equal(toggleVideoMuted(), true);
    assert.equal(readStoredVideoMuted(), true);
    assert.equal(toggleVideoMuted(), false);

    setVideoMuted(true);
    assert.equal(toggleVideoMuted(), false, "toggle reads the stored value, not a stale one");
  } finally {
    browser.restore();
  }
});

test("the video player pauses itself when it leaves the viewport", () => {
  const player = source("features/media/components/VideoPlayer.tsx");

  // The guard is an IntersectionObserver on the player frame.
  assert.match(player, /new IntersectionObserver\(/);
  assert.match(player, /observer\.observe\(wrapper\)/);
  assert.match(player, /observer\.disconnect\(\)/);

  // It pauses on exit and never resumes on re-entry: a deliberate pause must
  // not be undone by scrolling back to the card.
  assert.match(player, /entry\.intersectionRatio >= VISIBLE_PLAYBACK_THRESHOLD/);
  assert.match(player, /video\.pause\(\)/);

  // Re-entering the viewport resumes only under a live handoff session; a
  // deliberate pause must never be undone by scrolling back to the card.
  const observer = player.slice(player.indexOf("new IntersectionObserver"));
  const resume = observer.indexOf("video.play()");
  assert.ok(resume > 0, "the observer may resume a video, but only via the handoff");
  assert.ok(
    observer.lastIndexOf("isVideoAutoplayActive()", resume) > 0,
    "resuming must be gated on the handoff session being live",
  );

  // A visible-share threshold exists and is a real fraction.
  assert.match(player, /VISIBLE_PLAYBACK_THRESHOLD = 0\.5/);
  assert.match(player, /threshold: \[0, VISIBLE_PLAYBACK_THRESHOLD\]/);
});

test("picture-in-picture and fullscreen playback survive leaving the viewport", () => {
  const player = source("features/media/components/VideoPlayer.tsx");

  assert.match(player, /document\.pictureInPictureElement === video/);
  assert.match(player, /document\.fullscreenElement === wrapper/);
  assert.match(player, /isDetachedFromPage/);
});

test("every player shares one mute preference", () => {
  const player = source("features/media/components/VideoPlayer.tsx");

  // Mute reads and writes the shared store instead of local component state.
  assert.match(player, /subscribeToVideoMuted/);
  assert.match(player, /videoMutedSnapshot/);
  assert.match(player, /setVideoMuted\(!readStoredVideoMuted\(\)\)/);

  // A local muted effect and a handler that overwrites the shared value would
  // both fight the store, so neither may come back.
  assert.doesNotMatch(player, /useState\(false\)[\s\S]{0,40}isMuted/);
  assert.doesNotMatch(player, /setIsMuted/);
  assert.doesNotMatch(player, /onVolumeChange/);

  // The element is still synced from the preference.
  assert.match(player, /video\.muted = isMuted/);
});

test("immersive video feed moves each viewport slide, not the shared track", () => {
  const viewer = source("features/media/components/VideoFeedViewer.tsx");
  const css = source("app/globals.css");

  // Each slide is pinned to the viewport and translated relative to the active
  // index. This keeps the visual slide in sync with the active player's audio.
  assert.match(viewer, /video-feed-slide absolute inset-0 h-full w-full/);
  assert.match(viewer, /translateY\(\$\{\(slide - index\) \* 100\}%\)/);
  assert.doesNotMatch(viewer, /translateY\(-\$\{index \* 100\}%\)/);
  assert.match(css, /\.video-feed-slide\s*\{[\s\S]*?transition:\s*transform/);
});

test("the video player remains the single player for every surface", () => {
  for (const file of [
    "features/media/components/MediaGallery.tsx",
    "features/media/components/MediaLightbox.tsx",
    "features/content/components/ContentDetailView.tsx",
  ]) {
    assert.match(source(file), /VideoPlayer/, `${file} must use the shared player`);
  }
});

test("a video entering the viewport claims the handoff and passes it on", () => {
  const player = source("features/media/components/VideoPlayer.tsx");

  // Its own play() is the gesture that starts a session.
  assert.match(player, /beginVideoAutoplay\(\)/);
  // Leaving the viewport while holding the handoff keeps the chain alive.
  assert.match(player, /if \(handedOff\) continueVideoAutoplay\(\)/);
  // A manual pause or mute ends the chain.
  assert.match(player.slice(player.indexOf("const toggleMute")), /stopVideoAutoplay\(\)/);

  // Entering the viewport plays, but only under the session's conditions.
  assert.match(player, /!isVideoAutoplayActive\(\) \|\| !video\.paused/);
  assert.match(player, /isNearestVisiblePlayer\(\)/);
  assert.match(player, /void video\.play\(\)\.catch\(/);
});

test("only one video is ever audible at a time", () => {
  const player = source("features/media/components/VideoPlayer.tsx");
  const sound = source("lib/video-sound.ts");

  // Players register themselves so they can see their siblings.
  assert.match(player, /registerPlayer\(wrapper, video, handlePlay\)/);
  assert.match(player, /data-video-player/);
  assert.match(sound, /export function listPlayers/);

  // A rival that was commanded to play stands down before it is audible.
  assert.match(player, /const holder = handoffHolders\.get\(other\)/);
  assert.match(player, /if \(!holder\) continue;/);
  assert.match(player, /other\.pause\(\)/);

  // A handoff is distinguished from a play the reader started by hand.
  assert.match(player, /handoffHolders\.set\(video, setHasHandoff\)/);
  assert.match(sound, /handoffHolders/);
});

test("the picture-in-picture and fullscreen exemptions survive the handoff", () => {
  const player = source("features/media/components/VideoPlayer.tsx");
  const observer = player.slice(player.indexOf("new IntersectionObserver"));

  // The detached check runs before both the pause and the claim, so a floating
  // player neither stops nor has playback stolen while it is out of the flow.
  assert.match(
    observer,
    /const video = videoRef\.current;\s*\n\s*if \(!video \|\| isDetachedFromPage\(\)\) continue;/,
  );
});
