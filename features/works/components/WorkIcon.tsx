import type { WorkGroup } from "../types";
import { workColor, workIcon } from "../utils";
import { Icon } from "./Icon";

/** Work avatar (mock `.wg-ic`): uploaded photo, else a coloured tile with a stable icon. */
export function WorkIcon({ work, size = 44 }: { work: Pick<WorkGroup, "id" | "avatar_url" | "title">; size?: number }) {
  return (
    <span className="wg-ic" style={{ background: work.avatar_url ? "var(--surface-2)" : workColor(work.id), width: size, height: size, borderRadius: size > 44 ? 18 : size < 44 ? 12 : 14 }}>
      {work.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={work.avatar_url} alt="" className="wg-img" loading="lazy" />
      ) : (
        <Icon name={workIcon(work.id)} size={Math.round(size * 0.48)} />
      )}
    </span>
  );
}
