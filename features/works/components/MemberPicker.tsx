"use client";

import { useEffect, useState } from "react";
import { memberPage } from "../services/works.service";
import type { WorkMember, WorkUser } from "../types";
import { fa } from "../utils";
import { Avatar } from "./Avatar";

const ROLE_LABEL = { owner: " · مدیر", admin: " · ادمین", member: "" } as const;

/** Searchable member list: multi-select (assign / tag / audience) or single-pick (@mention). */
export function MemberList({
  workId,
  query,
  mode,
  selected = [],
  highlight = 0,
  onToggle,
  onItems,
}: {
  workId: string;
  /** Search text (the @ token for mentions, the search box for pickers). */
  query: string;
  mode: "multi" | "single";
  selected?: string[];
  highlight?: number;
  onToggle: (user: WorkUser) => void;
  /** Reports the visible list so the caller can drive keyboard navigation. */
  onItems?: (users: WorkUser[]) => void;
}) {
  const [items, setItems] = useState<WorkMember[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      memberPage(workId, query)
        .then((p) => {
          if (!alive) return;
          // Least-loaded first so the manager sees who has capacity.
          const sorted = [...p.data].sort((a, b) => a.open_tasks - b.open_tasks);
          setItems(sorted);
          setCursor(p.nextCursor);
          setError("");
          onItems?.(sorted.map((m) => m.user));
        })
        .catch(() => alive && setError("دریافت اعضا انجام نشد"))
        .finally(() => alive && setLoading(false));
    }, 150);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workId, query]);

  return (
    <div className="pk-l">
      {items.map((m, i) => {
        const sel = selected.includes(m.user.id);
        return (
          <button
            type="button"
            key={m.user.id}
            className={`pk-i ${sel ? "sel" : ""} ${mode === "single" && i === highlight ? "hl" : ""}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onToggle(m.user)}
          >
            <Avatar user={m.user} />
            <span>
              <b>
                {m.user.name}
                {m.label ? <span className="u-label">{m.label}</span> : null}
                {ROLE_LABEL[m.role]}
              </b>
              <small dir="ltr" style={{ display: "block", textAlign: "right" }}>
                {m.user.handle.startsWith("@") ? m.user.handle : "@" + m.user.handle} · {fa(m.open_tasks)} کار باز
              </small>
            </span>
            {mode === "multi" ? <span className="ck">{sel ? "✓" : ""}</span> : null}
          </button>
        );
      })}
      {!items.length && !loading && !error ? <p className="hint" style={{ padding: 10 }}>عضوی پیدا نشد.</p> : null}
      {error ? <p className="hint" role="alert" style={{ padding: 10 }}>{error}</p> : null}
      {cursor ? (
        <button
          type="button"
          className="pk-more"
          onClick={() =>
            memberPage(workId, query, cursor)
              .then((p) => {
                setItems((v) => [...v, ...p.data]);
                setCursor(p.nextCursor);
              })
              .catch(() => setError("دریافت اعضا انجام نشد"))
          }
        >
          اعضای بیشتر
        </button>
      ) : null}
    </div>
  );
}
