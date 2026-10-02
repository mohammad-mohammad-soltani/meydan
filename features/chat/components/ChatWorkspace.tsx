"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { WorkRoom } from "@/features/works/components/WorkRoom";
import { useChat } from "../hooks/useChat";
import { ChatSidebar, type Selected } from "./ChatSidebar";
import { ConversationView } from "./ConversationView";

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

function parse(pathname: string): Selected {
  const work = pathname.match(/^\/chat\/work\/(\d+)/)?.[1];
  if (work) return { kind: "work", id: work };
  const direct = pathname.match(/^\/chat\/([^/]+)/)?.[1];
  // `/chat/<id>/info` is the contact page and renders on its own.
  if (direct && direct !== "work") return { kind: "direct", id: direct };
  return null;
}

/**
 * Two-pane chat: one list (direct chats + work groups) on the right, the open room on the left.
 * Below 820px a single pane shows at a time (`room-open` swaps list ↔ room).
 */
export function ChatWorkspace({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const chat = useChat();
  const desktop = useDesktop();
  const selected = parse(pathname);
  const isInfo = /^\/chat\/[^/]+\/info/.test(pathname) && !pathname.startsWith("/chat/work/");

  // The contact-info page keeps its own full-page layout.
  if (isInfo) return <>{children}</>;

  return (
    <div className="works-feature works-fill">
      <div className={`works ${selected ? "room-open" : ""}`}>
        <ChatSidebar chat={chat} selected={selected} />
        {selected?.kind === "work" ? (
          <WorkRoom key={`w${selected.id}`} workId={selected.id} />
        ) : selected?.kind === "direct" ? (
          <div className="w-room tw-scope">
            <ConversationView key={`d${selected.id}`} conversationId={selected.id} conversation={null} messages={[]} embedded />
          </div>
        ) : desktop ? (
          <div className="w-room">
            <div className="w-empty">یک گفتگو را برای مشاهده انتخاب کنید</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
