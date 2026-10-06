"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRealtimeUserId } from "@/lib/realtime/config";
import { subscribeToUserChannel } from "@/lib/realtime/user-channel";
import { messagePage, oneMessage, workAction, workDetail } from "../services/works.service";
import { mergeMessages } from "../merge";
import { messageTitle, type WorkGroup, type WorkMessage } from "../types";

export type RoomView = "chat" | "board" | "members";

const isMessage = (v: unknown): v is WorkMessage =>
  !!v && typeof v === "object" && "kind" in v && "conversation_id" in v && "id" in v;

/**
 * State + server sync of one work room: paging, filters, realtime, optimistic
 * sends and message actions. The view components stay purely presentational.
 */
export function useWorkRoom(workId: string) {
  const [work, setWork] = useState<WorkGroup | null>(null);
  const [messages, setMessages] = useState<WorkMessage[]>([]);
  const [tasks, setTasks] = useState<WorkMessage[]>([]);
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [kind, setKind] = useState("");
  const [mine, setMine] = useState(false);
  const [view, setView] = useState<RoomView>("chat");
  const [viewerId, setViewerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  /** Read marker at the moment the room was opened — drives the "new messages" divider. */
  const [openedReadMarker, setOpenedReadMarker] = useState<number | null>(null);

  const scope = useRef(workId);
  const filter = useRef({ kind, mine });
  const messagesRef = useRef(messages);
  const lastMarked = useRef(0);
  const viewRef = useRef(view);

  // Mirror the latest state into refs for the async callbacks below (written after render, never during it).
  useEffect(() => {
    filter.current = { kind, mine };
    messagesRef.current = messages;
    viewRef.current = view;
  });

  // The room component is keyed by workId, so state starts fresh per work; this only scopes in-flight requests.
  useEffect(() => {
    scope.current = workId;
    lastMarked.current = 0;
    return () => {
      scope.current = "";
    };
  }, [workId]);

  const alive = useCallback((id: string) => scope.current === id, []);

  const refreshDetail = useCallback(async () => {
    const id = workId;
    try {
      const data = await workDetail(id);
      if (alive(id)) setWork(data);
      return data;
    } catch (e) {
      if (alive(id)) setError(e instanceof Error ? e.message : "دریافت اطلاعات کار انجام نشد");
      return null;
    }
  }, [workId, alive]);

  /** Newest page for the active filter; `replace` resets the list (filter change / first load). */
  const fetchLatest = useCallback(
    async (replace: boolean) => {
      const id = workId;
      const { kind: k, mine: m } = filter.current;
      const page = await messagePage(id, { kind: k, mine: m });
      if (!alive(id) || filter.current.kind !== k || filter.current.mine !== m) return;
      setMessages((cur) => (replace ? mergeMessages(cur.filter((x) => x.delivery), page.data) : mergeMessages(cur, page.data)));
      if (replace) setOlderCursor(page.nextCursor);
    },
    [workId, alive],
  );

  const fetchAfter = useCallback(async () => {
    const id = workId;
    for (let i = 0; i < 20; i++) {
      const { kind: k, mine: m } = filter.current;
      const last = messagesRef.current.filter((x) => !x.delivery).at(-1);
      if (!last) return fetchLatest(false);
      const page = await messagePage(id, { kind: k, mine: m, after: last.id });
      if (!alive(id)) return;
      if (!page.data.length) return;
      // Keep the ref current inside the loop so the next page continues from the newest id.
      messagesRef.current = mergeMessages(messagesRef.current, page.data);
      setMessages((cur) => mergeMessages(cur, page.data));
      if (!page.nextCursor) return;
    }
  }, [workId, alive, fetchLatest]);

  const loadTasks = useCallback(async () => {
    const id = workId;
    const all: WorkMessage[] = [];
    let before = "";
    for (let i = 0; i < 10; i++) {
      const page = await messagePage(id, { kind: "task", before, limit: 100 });
      all.unshift(...page.data);
      if (!page.nextCursor) break;
      before = page.nextCursor;
    }
    if (alive(id)) setTasks(all.filter((t) => !t.deleted_at));
  }, [workId, alive]);

  // First load + every filter/view change.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const detail = await refreshDetail();
        if (cancelled || !detail) return;
        setOpenedReadMarker((v) => v ?? Number(detail.viewer.last_read_message_id ?? 0));
        // Outsiders only get the invitation card; the room itself is served to members.
        const inside = detail.viewer.joined || detail.viewer.can_manage;
        if (!inside) setMessages([]);
        else if (view === "board") await loadTasks();
        else if (view === "chat") await fetchLatest(true);
        const uid = await getRealtimeUserId().catch(() => "");
        if (!cancelled) setViewerId(uid);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "دریافت انجام نشد");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workId, kind, mine, view]);

  // Realtime: ids only — fetch exactly what changed.
  useEffect(() => {
    let disposed = false;
    let off: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const settle = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void refreshDetail();
        if (viewRef.current === "board") void loadTasks().catch(() => undefined);
      }, 300);
    };
    const own = (p: unknown) => (p as { workId?: string } | null)?.workId === workId;
    const patch = async (p: unknown) => {
      if (!own(p)) return;
      const messageId = (p as { messageId?: string }).messageId;
      if (messageId) {
        try {
          const fresh = await oneMessage(messageId);
          setMessages((cur) => (cur.some((x) => x.id === fresh.id) ? mergeMessages(cur, [fresh]) : cur));
          setTasks((cur) => (cur.some((x) => x.id === fresh.id) ? cur.map((x) => (x.id === fresh.id ? fresh : x)) : cur));
        } catch {
          /* hidden from this viewer (private) — nothing to patch */
        }
      }
      settle();
    };
    subscribeToUserChannel(
      {
        "work:message:created": (p) => {
          if (!own(p)) return;
          void fetchAfter().catch(() => undefined);
          settle();
        },
        "work:message:updated": (p) => void patch(p),
        "work:message:deleted": (p) => void patch(p),
        "work:updated": (p) => {
          if (own(p)) settle();
        },
      },
      { onSubscribed: () => void Promise.all([refreshDetail(), fetchAfter()]).catch(() => undefined) },
    )
      .then((fn) => (disposed ? fn() : (off = fn)))
      .catch(() => undefined);
    // Safety net for missed socket events.
    const poll = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void refreshDetail();
      void fetchAfter().catch(() => undefined);
    }, 30000);
    return () => {
      disposed = true;
      off?.();
      clearTimeout(timer);
      clearInterval(poll);
    };
  }, [workId, refreshDetail, fetchAfter, loadTasks]);

  // Read marker (only when the whole room is on screen).
  const joined = !!work?.viewer.joined;
  useEffect(() => {
    if (!joined || view !== "chat" || kind || mine) return;
    const last = messages.filter((m) => !m.delivery).at(-1);
    const id = last ? Number(last.id) : 0;
    if (!id || id <= lastMarked.current) return;
    const t = setTimeout(() => {
      lastMarked.current = id;
      void workAction(`${workId}/read`, "PUT", { message_id: id }).catch(() => {
        lastMarked.current = 0;
      });
    }, 600);
    return () => clearTimeout(t);
  }, [messages, joined, view, kind, mine, workId]);

  const loadOlder = useCallback(async () => {
    if (!olderCursor) return;
    const id = workId;
    const { kind: k, mine: m } = filter.current;
    const page = await messagePage(id, { kind: k, mine: m, before: olderCursor });
    if (!alive(id)) return;
    setMessages((cur) => mergeMessages(cur, page.data));
    setOlderCursor(page.nextCursor);
  }, [olderCursor, workId, alive]);

  const upsert = useCallback((m: WorkMessage) => {
    setMessages((cur) => (cur.some((x) => x.id === m.id) ? mergeMessages(cur, [m]) : cur));
    setTasks((cur) => cur.map((x) => (x.id === m.id ? m : x)));
  }, []);

  /** Run a message action; the endpoint returns the fresh message which is merged in place. */
  const act = useCallback(
    async (path: string, method = "PUT", body?: unknown) => {
      setBusy(true);
      setError("");
      try {
        const result = await workAction<unknown>(path, method, body);
        if (isMessage(result)) upsert(result);
        else if (path.includes("/join") || method === "DELETE") await fetchLatest(false).catch(() => undefined);
        void refreshDetail();
        if (viewRef.current === "board") void loadTasks().catch(() => undefined);
        return result;
      } catch (e) {
        setError(e instanceof Error ? e.message : "عملیات انجام نشد");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [upsert, refreshDetail, fetchLatest, loadTasks],
  );

  /** Optimistic send; rejects so the composer can keep the draft and show the error. */
  const send = useCallback(
    async (body: Record<string, unknown>, replyTo: WorkMessage | null) => {
      const clientId = String(body.client_id ?? crypto.randomUUID());
      const meeting = body.meeting as { private_user_ids?: number[] } | undefined;
      const spec = (body.task ?? body.meeting ?? body.announcement ?? body.poll) as { title?: string } | undefined;
      const pending: WorkMessage = {
        id: "pending-" + clientId,
        client_id: clientId,
        conversation_id: workId,
        can_reply: false,
        delivery: "sending",
        pending_title: spec?.title,
        kind: body.kind as WorkMessage["kind"],
        sender: { id: viewerId, name: "شما", handle: "", avatar_url: null },
        body: String(body.body ?? ""),
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
        pinned: false,
        is_private: !!meeting?.private_user_ids?.length,
        reply_to: replyTo
          ? { id: replyTo.id, kind: replyTo.kind, title: messageTitle(replyTo), body: replyTo.body, sender_name: replyTo.sender?.name ?? "" }
          : null,
        reactions: [],
        mentions: [],
      };
      setMessages((cur) => mergeMessages(cur.filter((x) => x.client_id !== clientId), [pending]));
      try {
        const saved = await workAction<WorkMessage>(`${workId}/messages`, "POST", { ...body, client_id: clientId });
        setMessages((cur) => mergeMessages(cur.filter((x) => x.client_id !== clientId), [saved]));
        void refreshDetail();
        return saved;
      } catch (e) {
        setMessages((cur) => cur.filter((x) => x.client_id !== clientId));
        throw e;
      }
    },
    [workId, viewerId, refreshDetail],
  );

  /** Bring a message that is not on the loaded page into the list (jump targets). */
  const insertMessage = useCallback((m: WorkMessage) => setMessages((cur) => mergeMessages(cur, [m])), []);

  const resetFilter = useCallback(() => {
    setKind("");
    setMine(false);
  }, []);

  const firstUnreadId = useMemo(() => {
    if (openedReadMarker === null) return null;
    const m = messages.find((x) => !x.delivery && Number(x.id) > openedReadMarker && x.kind !== "system" && x.sender?.id !== viewerId);
    return m?.id ?? null;
  }, [messages, openedReadMarker, viewerId]);

  return {
    work,
    messages,
    tasks,
    kind,
    mine,
    view,
    viewerId,
    loading,
    error,
    busy,
    hasOlder: !!olderCursor,
    firstUnreadId,
    setKind,
    setMine,
    setView,
    setError,
    resetFilter,
    refreshDetail,
    loadOlder,
    act,
    send,
    upsert,
    insertMessage,
    reloadTasks: loadTasks,
  };
}
