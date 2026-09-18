"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { MarkdownText } from "@/components/shared/MarkdownText";
import {
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
 * The preview is cut at a word boundary and the full text is revealed in place —
 * the card never navigates away, so the reader keeps their position in the
 * timeline.
 *
 * Rendered inside an RTL page: `logical` properties keep the gutter on the
 * correct side without direction-specific classes.
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

  if (!collapsible) {
    return <MarkdownText body={body} className={className} />;
  }

  return (
    <div data-read-more className={contentClassName}>
      <div id={bodyId} className={className}>
        <span
          className={`whitespace-pre-wrap break-words ${
            isExpanded ? "read-more-reveal-open" : ""
          }`}
        >
          <MarkdownText body={isExpanded ? body : preview} />
        </span>
      </div>

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
