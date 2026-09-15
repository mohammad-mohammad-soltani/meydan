"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  ELLIPSIS,
  READ_MORE_LIMIT,
  needsReadMore,
  truncateAtWordBoundary,
} from "../read-more";

type ReadMoreTextProps = {
  body: string;
  /** Characters shown before the reveal. */
  limit?: number;
  className?: string;
  /** Extra classes for the collapsible wrapper (spacing differs per surface). */
  contentClassName?: string;
};

/**
 * A post body that folds after {@link READ_MORE_LIMIT} characters.
 *
 * The preview is cut at a word boundary and the rest is revealed in place —
 * the card never navigates away, so the reader keeps their position in the
 * timeline. The hidden part fades in behind a mask while the card expands, so
 * the reveal reads as one motion rather than a layout jump.
 *
 * Rendered inside an RTL page: `logical` properties keep the mask and the
 * gutter on the correct side without direction-specific classes.
 */
export function ReadMoreText({
  body,
  limit = READ_MORE_LIMIT,
  className = "",
  contentClassName = "",
}: ReadMoreTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const bodyId = useId();

  const collapsible = needsReadMore(body, limit);
  const preview = collapsible ? truncateAtWordBoundary(body, limit) : body;

  // The preview keeps its trailing ellipsis while folded and drops it once the
  // full text is on screen, so the expanded card has no stray punctuation.
  const previewText = isExpanded ? preview.slice(0, -ELLIPSIS.length) : preview;

  if (!collapsible) {
    return <p className={`whitespace-pre-wrap break-words ${className}`}>{body}</p>;
  }

  return (
    <div data-read-more className={contentClassName}>
      <p id={bodyId} className={`whitespace-pre-wrap break-words ${className}`}>
        <span className="whitespace-pre-wrap break-words">{previewText}</span>
        <span
          aria-hidden={isExpanded ? "true" : undefined}
          className={`read-more-reveal whitespace-pre-wrap break-words${
            isExpanded ? " read-more-reveal-open" : ""
          }`}
        >
          {body.slice(previewText.length)}
        </span>
      </p>

      <button
        type="button"
        onClick={(event) => {
          // The whole timeline card is wrapped in a link, so the toggle has to
          // claim the tap before navigation sees it.
          event.preventDefault();
          event.stopPropagation();
          setIsExpanded((value) => !value);
        }}
        aria-expanded={isExpanded}
        aria-controls={bodyId}
        className="read-more-toggle pointer-events-auto relative z-10 mt-1 inline-flex items-center gap-1 rounded-pill px-1.5 py-0.5 text-[13px] font-black text-brand outline-none transition-colors hover:bg-brand-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span>{isExpanded ? "خواندن کمتر" : "خواندن بیشتر"}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
    </div>
  );
}
