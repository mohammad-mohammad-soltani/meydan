import { hueOf } from "@/lib/relative-fa";
import { ChIcon } from "@/features/chat/components/ChIcon";
import type { WorkGroup } from "../types";

/** Work avatar (reference `.ch-av`): uploaded photo, else the tinted circle with the group glyph. */
export function WorkIcon({ work, size = 52 }: { work: Pick<WorkGroup, "id" | "avatar_url" | "title">; size?: number }) {
  return (
    <span className="wg-ic ch-av" style={{ ["--h" as string]: hueOf(work.title || String(work.id)), width: size, height: size }}>
      {work.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={work.avatar_url} alt="" className="wg-img" loading="lazy" />
      ) : (
        <ChIcon name="usr" size={Math.round(size * 0.48)} />
      )}
    </span>
  );
}
