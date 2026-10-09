"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Waypoints } from "lucide-react";
import type { MemorialTimelineItem } from "../types";
import { longDate } from "./dates";

/** Events shown before «مشاهده همه»; the second one fades out under the button. */
const PREVIEW_COUNT = 2;

/**
 * «گاه‌شمار حیات علمی و تجربیات»: the memorial's life events down a vertical
 * rail, newest dot filled. Collapsed it previews the first two events fading
 * into the button; expanded it unfolds to every event.
 */
export function MemorialTimeline({ events }: { events: MemorialTimelineItem[] }) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLOListElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const collapsible = events.length > PREVIEW_COUNT;

  // Height is measured so the fold animates instead of snapping.
  useLayoutEffect(() => {
    const list = bodyRef.current;
    if (!list || !collapsible) return;
    const items = Array.from(list.children) as HTMLElement[];
    const preview = items[PREVIEW_COUNT - 1];
    setHeight(open ? list.scrollHeight : preview.offsetTop + preview.offsetHeight);
  }, [open, collapsible, events]);

  if (!events.length) return null;

  return (
    <section className="memorial-section mm-timeline" aria-labelledby="memorial-timeline">
      <div className="mm-timeline-card">
        <header className="mm-timeline-head">
          <h2 id="memorial-timeline"><Waypoints aria-hidden="true" />گاه‌شمار حیات علمی و تجربیات (Timeline)</h2>
          <span>مراتب و تحولات</span>
        </header>

        <div className="mm-timeline-fold" data-open={open} data-collapsible={collapsible} style={collapsible ? { maxHeight: height } : undefined}>
          <ol ref={bodyRef} className="mm-timeline-list">
            {events.map((event, index) => (
              <li key={event.id} data-first={index === 0}>
                <div className="mm-timeline-line">
                  <h3>{event.title}</h3>
                  {event.date ? <time>{longDate(event.date)}</time> : null}
                </div>
                {event.place ? <p className="mm-timeline-place">{event.place}</p> : null}
                {event.description ? <p className="mm-timeline-text">{event.description}</p> : null}
                {event.photoUrl ? <figure><Image src={event.photoUrl} alt={event.title} fill sizes="(max-width: 640px) 80vw, 480px" /></figure> : null}
              </li>
            ))}
          </ol>
        </div>

        {collapsible ? (
          <button type="button" className="mm-timeline-toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            {open ? "بستن گاه‌شمار و نمایش خلاصه" : "مشاهده همه سوابق و مدارج علمی"}
            {open ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
          </button>
        ) : null}
      </div>
    </section>
  );
}
