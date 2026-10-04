"use client";

import { useEffect } from "react";

/** Hues the reference cycles through for letter avatars. */
const HUES = [350, 12, 32, 46, 95, 150, 172, 195, 220, 255, 285, 320];
const LETTERS = /^\p{L}{1,2}$/u;

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

/** The name an avatar belongs to, so one person keeps one colour everywhere. */
function seedFor(el: HTMLElement) {
  const labelled = el.closest("[aria-label]")?.getAttribute("aria-label");
  const own = el.textContent ?? "";
  if (labelled) return labelled + own;
  return (el.parentElement?.textContent ?? "").replace(/\s+/g, " ").slice(0, 30) + own;
}

function paint(el: HTMLElement) {
  el.dataset.pc = "1";
  const hue = HUES[hash(seedFor(el)) % HUES.length];
  const style = el.style;
  style.setProperty("background", `hsl(${hue} 88% 82%)`, "important");
  style.setProperty("background-image", "none", "important");
  style.setProperty("color", `hsl(${hue} 50% 27%)`, "important");
  style.setProperty("border-color", "transparent", "important");
}

function scan() {
  for (const el of document.querySelectorAll<HTMLElement>("div:not([data-pc]),span:not([data-pc]),b:not([data-pc])")) {
    if (el.children.length) continue;
    const text = el.textContent?.trim() ?? "";
    if (!text || text.length > 2 || !LETTERS.test(text)) continue;
    const box = el.getBoundingClientRect();
    if (box.width < 22 || box.width > 130 || Math.abs(box.width - box.height) > 6) continue;
    if (parseFloat(getComputedStyle(el).borderTopLeftRadius) < box.width * 0.4) {
      el.dataset.pc = "0";
      continue;
    }
    paint(el);
  }
}

/**
 * Gives every letter-only avatar (people without a photo) a soft colour taken
 * from their name, the same way the reference does, so it never changes.
 */
export function AvatarTone() {
  useEffect(() => {
    let frame = 0;
    const queue = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        scan();
      });
    };
    queue();
    const observer = new MutationObserver(queue);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
