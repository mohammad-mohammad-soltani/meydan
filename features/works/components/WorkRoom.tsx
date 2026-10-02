"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { oneMessage } from "../services/works.service";
import { useWorkRoom } from "../hooks/useWorkRoom";
import type { WorkKind, WorkMessage } from "../types";
import { dayLabel, fa, sameDay } from "../utils";
import { Icon } from "./Icon";
import { MessageRow } from "./MessageRow";
import { SystemLine } from "./bubbles/SystemLine";
import { WorkBoard } from "./WorkBoard";
import { WorkComposer, type ComposerHandle } from "./WorkComposer";
import { WorkIcon } from "./WorkIcon";
import { WorkInfo } from "./WorkInfo";
import { WorkMembers } from "./WorkMembers";
import { RoomContext, type RoomCtx } from "./roomContext";

const FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "me", label: "مربوط به من" },
  { id: "task", label: "وظایف" },
  { id: "meeting", label: "جلسات" },
  { id: "announcement", label: "اعلان‌ها" },
  { id: "poll", label: "نظرسنجی" },
  { id: "text", label: "پیام‌ها" },
];

const ROLE_LABEL = { owner: "مدیر", admin: "ادمین", member: "عضو" } as const;

export function WorkRoom({ workId }: { workId: string }) {
  const room = useWorkRoom(workId);
  const { work, messages, tasks, kind, mine, view, viewerId, loading, error, busy, hasOlder, firstUnreadId } = room;
  const [reply, setReply] = useState<WorkMessage | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<Set<string>>(() => new Set());
  const [info, setInfo] = useState(false);
  const composer = useRef<ComposerHandle>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const initialDone = useRef(false);
  const [jumpReq, setJumpReq] = useState<{ id: string; n: number } | null>(null);
  const handledJump = useRef(0);
  const prevLast = useRef<string | undefined>(undefined);

  const manager = !!work?.viewer.can_manage;
  const member = !!work?.viewer.joined || manager;
  const filtered = !!kind || mine;

  const flash = useCallback((id: string) => {
    const el = document.getElementById(`work-message-${id}`);
    if (!el) return false;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
    return true;
  }, []);

  const jump = useCallback(
    async (id: string) => {
      if (view !== "chat") room.setView("chat");
      if (flash(id)) return;
      // Not rendered yet (other page / filter / tab): load it, then scroll once it is in the DOM.
      setJumpReq({ id, n: Date.now() });
      if (filtered) room.resetFilter();
      try {
        const m = await oneMessage(id);
        if (m.conversation_id === workId) room.insertMessage(m);
      } catch (e) {
        room.setError(e instanceof Error ? e.message : "پیام پیدا نشد");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view, filtered, workId, flash],
  );

  // Scroll management: stick to the bottom for new messages (when already there or own), keep place for history.
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (view !== "chat" || !el || !messages.length) return;
    if (jumpReq && handledJump.current !== jumpReq.n && flash(jumpReq.id)) {
      handledJump.current = jumpReq.n;
      prevLast.current = messages.at(-1)?.id;
      return;
    }
    if (!initialDone.current) {
      initialDone.current = true;
      const target = new URLSearchParams(window.location.search).get("m");
      if (target) queueMicrotask(() => void jump(target));
      else el.scrollTop = el.scrollHeight;
    } else {
      const last = messages.at(-1);
      if (last && last.id !== prevLast.current && (nearBottom.current || last.delivery || last.sender?.id === viewerId)) el.scrollTop = el.scrollHeight;
    }
    prevLast.current = messages.at(-1)?.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, view, jumpReq]);

  useEffect(() => {
    initialDone.current = false;
  }, [kind, mine, view]);

  const guard = useCallback(() => {
    if (member) return true;
    room.setError("اول با «من پای‌کارم» به این کار بپیوندید.");
    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member]);

  const toggleDetails = useCallback(
    (id: string) =>
      setDetailsOpen((s) => {
        const n = new Set(s);
        if (!n.delete(id)) n.add(id);
        return n;
      }),
    [],
  );

  const ctx = useMemo<RoomCtx | null>(
    () =>
      work
        ? { work, viewerId, manager, member, act: room.act, guard, reply: setReply, jump: (id) => void jump(id), detailsOpen, toggleDetails }
        : null,
    [work, viewerId, manager, member, room.act, guard, jump, detailsOpen, toggleDetails],
  );

  if (!work || !ctx) {
    return (
      <div className="w-room">
        <div className="w-empty">
          {error ? (
            <div>
              <p role="alert">{error}</p>
              <Link className="btn" href="/works">
                بازگشت به کارها
              </Link>
            </div>
          ) : (
            <span className="spin" aria-label="در حال دریافت" />
          )}
        </div>
      </div>
    );
  }

  const counts = work.counts ?? {};
  const items = messages;
  // Runs of "joined"/"left" service lines (big groups) collapse into a single line.
  const blocks: { m: WorkMessage; group?: WorkMessage[] }[] = [];
  for (const m of items) {
    const action = m.kind === "system" ? m.system?.action : undefined;
    const last = blocks.at(-1);
    if ((action === "joined" || action === "left") && last?.m.kind === "system" && last.m.system?.action === action && sameDay(last.m.created_at, m.created_at)) {
      last.group = [...(last.group ?? [last.m]), m];
    } else blocks.push({ m });
  }
  const roleLabel = work.viewer.role ? ROLE_LABEL[work.viewer.role] : manager ? "مدیر سایت" : "عضو نیستید";
  const stats = work.stats;
  const pinned = work.pinned;

  return (
    <RoomContext.Provider value={ctx}>
      <div className="w-room">
        <div className="r-head">
          <Link href="/works" className="icon-btn r-back" aria-label="بازگشت به کارها">
            <Icon name="back" size={20} weight={2} />
          </Link>
          <WorkIcon work={work} size={40} />
          <button type="button" className="r-title" onClick={() => setInfo(true)} aria-label="اطلاعات کار">
            <b>{work.title}</b>
            <small>
              {fa(work.member_count)} عضو · <Icon name="lock" size={11} /> اعضا فقط پاسخ می‌دهند
            </small>
          </button>
          <div className="r-views" role="tablist">
            {(
              [
                ["chat", "گفتگو", "chat"],
                ["board", "بورد", "board"],
                ["members", "اعضا", "users"],
              ] as const
            ).map(([v, label, icon]) => (
              <button key={v} type="button" role="tab" aria-selected={view === v} className={view === v ? "on" : ""} onClick={() => room.setView(v)}>
                <Icon name={icon} size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="r-role">
          نقش شما: <span className={`role-b ${work.viewer.role === "owner" ? "admin" : work.viewer.role === "admin" ? "lead" : ""}`} style={work.viewer.role === "member" || !work.viewer.role ? { background: "var(--surface)", color: "var(--muted)" } : undefined}>{roleLabel}</span>
        </div>

        {view === "board" ? (
          <div className="r-sum">
            <button className="tile" onClick={() => { room.setView("chat"); room.setKind("task"); room.setMine(false); }}>
              <b className="num">{fa(stats?.open_tasks ?? 0)}</b>
              <small>وظیفه باز · {fa(stats?.done_tasks ?? 0)} انجام‌شده</small>
            </button>
            <button className="tile me" onClick={() => { room.setView("chat"); room.setKind(""); room.setMine(true); }}>
              <b className="num">{fa(stats?.my_tasks ?? 0)}</b>
              <small>با شما یا شما را تگ کرده‌اند</small>
            </button>
            <button className="tile warn" onClick={() => { room.setView("chat"); room.setKind("task"); room.setMine(false); }}>
              <b className="num">{fa(stats?.late_tasks ?? 0)}</b>
              <small>دیرکرد</small>
            </button>
            <button className="tile" onClick={() => { room.setView("chat"); room.setKind("meeting"); room.setMine(false); }}>
              <b className="num">{fa(counts.meeting ?? 0)}</b>
              <small>جلسه</small>
            </button>
          </div>
        ) : null}

        {view === "chat" && pinned ? (
          <button type="button" className="r-pin" onClick={() => void jump(pinned.id)}>
            <Icon name="pinned" size={15} />
            <b>سنجاق‌شده:</b>
            <span>{pinned.announcement?.title ?? pinned.body}</span>
          </button>
        ) : null}

        {view === "chat" ? (
          <div className="r-filt">
            {FILTERS.map((f) => {
              const on = f.id === "all" ? !kind && !mine : f.id === "me" ? mine && !kind : kind === f.id;
              const n = f.id === "all" ? counts.all : f.id === "me" ? undefined : counts[f.id];
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`chip ${on ? "on" : ""}`}
                  aria-pressed={on}
                  onClick={() => {
                    room.setKind(f.id === "all" || f.id === "me" ? "" : f.id);
                    room.setMine(f.id === "me");
                  }}
                >
                  {f.label} {n !== undefined ? <span className="num">{fa(n)}</span> : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {error ? (
          <div className="r-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => room.setError("")} aria-label="بستن">
              ×
            </button>
          </div>
        ) : null}

        {view === "chat" ? (
          <div
            className="r-body chat"
            ref={bodyRef}
            aria-busy={busy}
            onScroll={(e) => {
              const el = e.currentTarget;
              nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
            }}
          >
            <div className="stream">
              {hasOlder ? (
                <button
                  type="button"
                  className="load-more"
                  onClick={async () => {
                    const el = bodyRef.current;
                    const h = el?.scrollHeight ?? 0;
                    const top = el?.scrollTop ?? 0;
                    await room.loadOlder().catch((e) => room.setError(e instanceof Error ? e.message : "دریافت انجام نشد"));
                    requestAnimationFrame(() => {
                      if (el) el.scrollTop = top + (el.scrollHeight - h);
                    });
                  }}
                >
                  پیام‌های قبلی
                </button>
              ) : null}
              {blocks.map((b, i) => {
                const m = b.m;
                const prev = blocks[i - 1]?.m;
                const next = blocks[i + 1]?.m;
                const newDay = !prev || !sameDay(prev.created_at, m.created_at);
                const pills = (
                  <>
                    {newDay ? <div className="date-pill">{dayLabel(m.created_at)}</div> : null}
                    {m.id === firstUnreadId && !filtered ? <div className="date-pill new">پیام‌های تازه</div> : null}
                  </>
                );
                if (m.kind === "system")
                  return (
                    <Fragment key={m.id}>
                      {pills}
                      <SystemLine m={m} group={b.group} onJump={(id) => void jump(id)} />
                    </Fragment>
                  );
                const group = (a?: WorkMessage) => !!a && a.kind !== "system" && a.sender?.id === m.sender?.id && sameDay(a.created_at, m.created_at);
                return (
                  <Fragment key={m.id}>
                    {pills}
                    <MessageRow m={m} cont={group(prev)} last={!group(next)} />
                  </Fragment>
                );
              })}
              {!items.length ? (
                <div className="w-empty">
                  {loading ? <span className="spin" aria-label="در حال دریافت" /> : filtered ? "در این دسته پیامی نیست." : "هنوز پیامی در این کار نیست."}
                </div>
              ) : null}
            </div>
          </div>
        ) : view === "board" ? (
          <div className="r-body">
            <WorkBoard tasks={tasks} loading={loading} onOpen={(id) => void jump(id)} />
          </div>
        ) : (
          <div className="r-body">
            <WorkMembers
              work={work}
              viewerId={viewerId}
              refresh={room.refreshDetail}
              onAssign={(u) => {
                room.setView("chat");
                setReply(null);
                // The composer mounts with the chat view; apply the seed once it exists.
                requestAnimationFrame(() => requestAnimationFrame(() => composer.current?.apply({ kind: "task" as Exclude<WorkKind, "text">, assignee: u })));
              }}
              onTag={(u) => {
                if (!(manager || reply)) {
                  room.setError("اول روی «پاسخ» کنار یک پیام بزنید، بعد تگ کنید.");
                  return;
                }
                room.setView("chat");
                requestAnimationFrame(() => requestAnimationFrame(() => composer.current?.apply({ mention: u })));
              }}
            />
          </div>
        )}

        {view === "chat" ? (
          <WorkComposer
            ref={composer}
            work={work}
            reply={reply}
            cancelReply={() => setReply(null)}
            send={room.send}
            onJoin={() => void room.act(`${work.id}/join`)}
            busy={busy}
          />
        ) : null}
      </div>
      {info ? <WorkInfo work={work} refresh={room.refreshDetail} close={() => setInfo(false)} onLeft={() => setReply(null)} /> : null}
    </RoomContext.Provider>
  );
}
