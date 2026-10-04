"use client";

import styles from "../reference.module.css";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ChevronDown } from "lucide-react";
import { MarkdownText } from "@/components/shared/MarkdownText";
import {
  READ_MORE_LIMIT,
  needsReadMore,
  readMoreDuration,
  truncateAtWordBoundary,
} from "../read-more";

type ReadMoreTextProps = {
  body: string;
  /** Characters shown before the reveal. */
  limit?: number;
  /** Timeline preview follows the reference’s three visible lines at every width. */
  lines?: number;
  className?: string;
  /** Extra classes for the collapsible wrapper (spacing differs per surface). */
  contentClassName?: string;
};

/** Feathered bottom edge while the height moves, so new lines fade in as they are uncovered. */
const REVEAL_MASK = "linear-gradient(to bottom, #000 calc(100% - 2.5rem), transparent)";
const REVEAL_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Runs a height animation on `element` with the feathered mask, cleaning up after itself. */
function animateHeight(element: HTMLElement, from: number, to: number, onDone?: () => void): Animation {
  element.style.overflow = "hidden";
  element.style.maskImage = REVEAL_MASK;
  element.style.webkitMaskImage = REVEAL_MASK;
  const animation = element.animate(
    [{ height: `${from}px` }, { height: `${to}px` }],
    { duration: readMoreDuration(Math.abs(to - from)), easing: REVEAL_EASING },
  );
  const cleanUp = () => {
    element.style.overflow = "";
    element.style.maskImage = "";
    element.style.webkitMaskImage = "";
  };
  animation.onfinish = () => {
    // `onDone` commits synchronously, so the mask comes off the final layout
    // without a frame of the old content at its natural height.
    onDone?.();
    cleanUp();
  };
  animation.oncancel = cleanUp;
  return animation;
}

/**
 * A post body that folds after {@link READ_MORE_LIMIT} characters.
 *
 * The preview is cut at a word boundary and the full text is revealed in place —
 * the card never navigates away, so the reader keeps their position in the
 * timeline. Opening grows the text down to its last line in one quick motion
 * with a soft fading edge; closing runs the same motion back up.
 *
 * Rendered inside an RTL page: `logical` properties keep the gutter on the
 * correct side without direction-specific classes.
 */
export function ReadMoreText({
  body,
  limit = READ_MORE_LIMIT,
  lines,
  className = "",
  contentClassName = "",
}: ReadMoreTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lineOverflow, setLineOverflow] = useState(false);
  const bodyId = useId();
  const bodyRef = useRef<HTMLDivElement>(null);
  /** Height of the folded preview, captured right before unfolding. */
  const collapsedHeight = useRef(0);
  const animation = useRef<Animation | null>(null);

  const collapsible = lines ? lineOverflow : needsReadMore(body, limit);
  const preview = !lines && collapsible ? truncateAtWordBoundary(body, limit) : body;

  useLayoutEffect(() => {
    const element = bodyRef.current;
    if (!lines || !element || isExpanded) return;
    const measure = () => setLineOverflow(element.scrollHeight > element.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [body, lines, isExpanded]);

  // The full text is already in the DOM here, so its real height is known
  // before the browser paints the jump.
  useLayoutEffect(() => {
    const element = bodyRef.current;
    if (!isExpanded || !element || !collapsedHeight.current || prefersReducedMotion()) return;
    animation.current?.cancel();
    animation.current = animateHeight(element, collapsedHeight.current, element.offsetHeight);
  }, [isExpanded]);

  useLayoutEffect(() => () => animation.current?.cancel(), []);

  if (!collapsible && !lines) {
    return <MarkdownText body={body} className={className} />;
  }

  const toggle = () => {
    const element = bodyRef.current;
    if (!isExpanded) {
      collapsedHeight.current = element?.offsetHeight ?? 0;
      setIsExpanded((value) => !value);
      return;
    }
    // Fold the full text back up first, then swap in the preview.
    if (!element || !collapsedHeight.current || prefersReducedMotion()) {
      setIsExpanded((value) => !value);
      return;
    }
    animation.current?.cancel();
    animation.current = animateHeight(element, element.offsetHeight, collapsedHeight.current, () => {
      flushSync(() => setIsExpanded(false));
    });
  };

  return (
    <div data-read-more className={contentClassName}>
      <div ref={bodyRef} id={bodyId} className={`${className} ${lines && !isExpanded ? styles.lineClamp : ""}`} style={lines && !isExpanded ? { WebkitLineClamp: lines } : undefined}>
        <span className="whitespace-pre-wrap wrap-break-word">
          <MarkdownText body={isExpanded ? body : preview} />
        </span>
      </div>

      {collapsible ? <button
        type="button"
        onClick={(event) => {
          // The whole timeline card is wrapped in a link, so the toggle has to
          // claim the tap before navigation sees it.
          event.preventDefault();
          event.stopPropagation();
          toggle();
        }}
        aria-label={isExpanded ? "خواندن کمتر" : "خواندن بیشتر"}
        aria-expanded={isExpanded}
        aria-controls={bodyId}
        className={`${styles.readMore} read-more-toggle pointer-events-auto relative z-10 mt-1 inline-flex items-center gap-1 rounded-pill py-0.5 text-xs font-bold text-foreground outline-none transition-colors hover:text-foreground-secondary focus-visible:ring-2 focus-visible:ring-ring`}
      >
        <span>{isExpanded ? "بستن متن" : "خواندن بیشتر"}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button> : null}
    </div>
  );
}
