import assert from "node:assert/strict";
import test from "node:test";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadVideoSound() {
  return import(pathToFileURL(path.join(root, "lib/video-sound.ts")).href);
}

function installFakeWindow() {
  const previous = globalThis.window;
  const timers = new Map();
  let nextTimerId = 1;

  globalThis.window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  // Deterministic timers so the idle window can be advanced without waiting.
  globalThis.setTimeout = (fn) => {
    const id = nextTimerId++;
    timers.set(id, fn);
    return id;
  };
  globalThis.clearTimeout = (id) => timers.delete(id);
  globalThis.document = { querySelectorAll: () => [] };

  return {
    timers,
    fireAll() {
      const pending = [...timers.values()];
      timers.clear();
      for (const fn of pending) fn();
    },
    restore(previousTimeout, previousClear, previousDocument) {
      globalThis.window = previous;
      globalThis.setTimeout = previousTimeout;
      globalThis.clearTimeout = previousClear;
      globalThis.document = previousDocument;
    },
  };
}

function withFakeWindow(run) {
  const previousTimeout = globalThis.setTimeout;
  const previousClear = globalThis.clearTimeout;
  const previousDocument = globalThis.document;
  const browser = installFakeWindow();

  return Promise.resolve()
    .then(() => run(browser))
    .finally(() => browser.restore(previousTimeout, previousClear, previousDocument));
}

test("the handoff session is off until the reader starts a video", () =>
  withFakeWindow(async (browser) => {
    const { isVideoAutoplayActive, beginVideoAutoplay } = await loadVideoSound();

    assert.equal(isVideoAutoplayActive(), false, "nothing autoplays before a gesture");

    beginVideoAutoplay();
    assert.equal(isVideoAutoplayActive(), true);

    browser.fireAll();
  }));

test("pausing or muting by hand ends the session for good", () =>
  withFakeWindow(async (browser) => {
    const { isVideoAutoplayActive, beginVideoAutoplay, stopVideoAutoplay } =
      await loadVideoSound();

    beginVideoAutoplay();
    stopVideoAutoplay();
    assert.equal(isVideoAutoplayActive(), false, "an explicit stop wins over the chain");

    // Starting again is possible, but only from another gesture.
    beginVideoAutoplay();
    assert.equal(isVideoAutoplayActive(), true);
    stopVideoAutoplay();
    browser.fireAll();
  }));

test("the session expires on its own after the idle window", () =>
  withFakeWindow(async (browser) => {
    const { isVideoAutoplayActive, beginVideoAutoplay, VIDEO_AUTOPLAY_IDLE_MS } =
      await loadVideoSound();

    beginVideoAutoplay();
    assert.equal(isVideoAutoplayActive(), true);
    assert.ok(VIDEO_AUTOPLAY_IDLE_MS > 0, "the idle window must be a real duration");

    // No handoff happened within the window, so the chain lets itself go.
    browser.fireAll();
    assert.equal(isVideoAutoplayActive(), false, "an idle session must not run forever");
  }));

test("a handoff restarts the idle window instead of ending the session", () =>
  withFakeWindow(async (browser) => {
    const { isVideoAutoplayActive, beginVideoAutoplay, continueVideoAutoplay } =
      await loadVideoSound();

    beginVideoAutoplay();
    continueVideoAutoplay();
    assert.equal(isVideoAutoplayActive(), true, "passing play on keeps the chain alive");

    browser.fireAll();
  }));

test("continueVideoAutoplay cannot revive a stopped session", () =>
  withFakeWindow(async (browser) => {
    const { isVideoAutoplayActive, continueVideoAutoplay, stopVideoAutoplay } =
      await loadVideoSound();

    stopVideoAutoplay();
    continueVideoAutoplay();
    assert.equal(
      isVideoAutoplayActive(),
      false,
      "only a fresh gesture may start the chain, never a scroll event",
    );
    browser.fireAll();
  }));

test("subscribers see each transition exactly once", () =>
  withFakeWindow(async (browser) => {
    const { beginVideoAutoplay, onVideoAutoplayChange, stopVideoAutoplay, continueVideoAutoplay } =
      await loadVideoSound();

    const seen = [];
    const unsubscribe = onVideoAutoplayChange((active) => seen.push(active));

    beginVideoAutoplay();
    beginVideoAutoplay(); //  already active: no second "start"
    continueVideoAutoplay(); // still active: no transition
    stopVideoAutoplay();
    stopVideoAutoplay(); //  already stopped: no second "stop"
    unsubscribe();
    beginVideoAutoplay();

    assert.deepEqual(seen, [true, false]);
    browser.fireAll();
  }));
