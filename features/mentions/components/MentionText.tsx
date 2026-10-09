import Link from "next/link";
import type { Route } from "next";
import { isPublicProfilePath } from "@/lib/profile-route";
import { mentionHref, splitMentions } from "../mentions";

/**
 * Plain text with every `@handle` in red, linking to that account's profile.
 * Pass `interactive={false}` inside something that is already a link.
 */
export function MentionText({ text, interactive = true }: { text: string; interactive?: boolean }) {
  return (
    <>
      {splitMentions(text, (handle) => isPublicProfilePath(`/${handle}`)).map((part, index) =>
        part.handle ? (
          interactive ? (
            <Link
              key={index}
              href={mentionHref(part.handle) as Route}
              onClick={(event) => event.stopPropagation()}
              className="font-bold text-danger hover:underline"
            >
              {part.text}
            </Link>
          ) : (
            <span key={index} className="font-bold text-danger">{part.text}</span>
          )
        ) : (
          part.text
        ),
      )}
    </>
  );
}
