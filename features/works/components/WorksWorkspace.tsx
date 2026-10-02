"use client";

import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { WorkRoom } from "./WorkRoom";
import { WorksList } from "./WorksList";

const DESKTOP = "(min-width: 821px)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(DESKTOP);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useDesktop = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP).matches,
    () => false,
  );

/**
 * Two-pane layout of the reference design: works list on the right, the open room on the left.
 * Below 820px only one pane shows at a time (`room-open` swaps list ↔ room).
 */
export function WorksWorkspace({ children }: { children: ReactNode }) {
  void children; // routes only carry the selected id; the panes render themselves
  const pathname = usePathname();
  const selected = pathname.match(/^\/works\/(\d+)/)?.[1];
  const desktop = useDesktop();
  const [firstId, setFirstId] = useState<string>();
  const roomId = selected ?? (desktop ? firstId : undefined);
  return (
    <div className="works-feature works-fill">
      <div className={`works ${selected ? "room-open" : ""}`}>
        <WorksList selectedId={roomId} onFirst={setFirstId} />
        {roomId ? (
          <WorkRoom key={roomId} workId={roomId} />
        ) : (
          <div className="w-room">
            <div className="w-empty">یک کار را برای مشاهده گفتگو انتخاب کنید</div>
          </div>
        )}
      </div>
    </div>
  );
}
