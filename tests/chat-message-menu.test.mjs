import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  getMessageActionButtonClass,
  getMessageMenuPosition,
} from "../features/chat/message-menu.ts";

test("context menu stays next to the click while remaining inside the viewport", () => {
  assert.deepEqual(
    getMessageMenuPosition({
      x: 780,
      y: 590,
      viewportWidth: 800,
      viewportHeight: 600,
      menuWidth: 208,
      menuHeight: 280,
      margin: 8,
    }),
    { x: 584, y: 312 },
  );

  assert.deepEqual(
    getMessageMenuPosition({
      x: 120,
      y: 160,
      viewportWidth: 800,
      viewportHeight: 600,
      menuWidth: 208,
      menuHeight: 280,
      margin: 8,
    }),
    { x: 120, y: 160 },
  );
});

test("hover action button sits outside the message bubble", () => {
  const own = getMessageActionButtonClass(true);
  const peer = getMessageActionButtonClass(false);

  assert.match(own, /right-full/);
  assert.match(peer, /left-full/);
  assert.doesNotMatch(own, /\bleft-1\b|\bright-1\b/);
  assert.doesNotMatch(peer, /\bleft-1\b|\bright-1\b/);
});

test("message menu is portaled to document.body so transformed chat containers cannot clip it", async () => {
  const source = await readFile(
    new URL("../features/chat/components/MessageBubble.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /createPortal/);
  assert.match(source, /document\.body/);
});
