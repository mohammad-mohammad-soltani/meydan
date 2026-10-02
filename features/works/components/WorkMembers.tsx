"use client";

import { useCallback, useEffect, useState } from "react";
import { memberPage, workAction } from "../services/works.service";
import type { WorkGroup, WorkMember, WorkUser } from "../types";
import { fa } from "../utils";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

/** Member list with workload bars (mock `membersHtml`). */
export function WorkMembers({
  work,
  viewerId,
  refresh,
  onAssign,
  onTag,
}: {
  work: WorkGroup;
  viewerId: string;
  refresh: () => Promise<unknown>;
  onAssign: (u: WorkUser) => void;
  onTag: (u: WorkUser) => void;
}) {
  const [members, setMembers] = useState<WorkMember[]>([]);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveLabel(userId: string) {
    setSaving(true);
    try {
      const r = await workAction<{ label: string | null }>(`${work.id}/members/${userId}/label`, "PUT", { label: draft });
      setMembers((v) => v.map((m) => (m.user.id === userId ? { ...m, label: r.label, user: { ...m.user, work_label: r.label } } : m)));
      setEditing(null);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ذخیره صفت انجام نشد");
    } finally {
      setSaving(false);
    }
  }

  const load = useCallback(
    async (after = "") => {
      try {
        const p = await memberPage(work.id, q, after);
        setMembers((v) => (after ? [...v, ...p.data] : p.data));
        setCursor(p.nextCursor);
        setError("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "دریافت اعضا انجام نشد");
      } finally {
        setLoading(false);
      }
    },
    [work.id, q],
  );

  useEffect(() => {
    const t = setTimeout(() => void load(), 200);
    return () => clearTimeout(t);
  }, [load]);

  const manager = !!work.viewer.can_manage;
  return (
    <div className="mlist">
      <label className="sp-search">
        <Icon name="search" size={16} />
        <input type="search" placeholder="جستجوی اعضا" aria-label="جستجوی اعضا" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      </label>
      <p className="hint" style={{ margin: "0 0 4px" }}>
        {fa(work.member_count)} عضو. بار کاری هر نفر از وظایف همین اتاق است.
      </p>
      {members.map((m) => {
        const open = m.open_tasks;
        const done = m.done_tasks;
        const o = Math.min(5, open);
        const d = Math.min(5, done, 5 - o);
        const me = m.user.id === viewerId;
        return (
          <div className="mrow" key={m.user.id}>
            <Avatar user={m.user} />
            <div style={{ minWidth: 0 }}>
              <b>{m.user.name}</b>
              {m.label ? <span className="u-label">{m.label}</span> : null}
              {m.role === "owner" ? <span className="role-b admin">مدیر</span> : m.role === "admin" ? <span className="role-b lead">ادمین</span> : null}
              <small dir="ltr" style={{ textAlign: "right" }}>
                {m.user.handle.startsWith("@") ? m.user.handle : "@" + m.user.handle}
              </small>
              {editing === m.user.id ? (
                <form
                  className="label-edit"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveLabel(m.user.id);
                  }}
                >
                  <input autoFocus value={draft} maxLength={40} placeholder="صفت؛ مثلاً خزانه‌دار" aria-label="صفت" onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setEditing(null)} />
                  <button className="qa go" disabled={saving}>
                    ذخیره
                  </button>
                  <button type="button" className="qa" onClick={() => setEditing(null)}>
                    انصراف
                  </button>
                </form>
              ) : null}
              <div className="load">
                {Array.from({ length: o }, (_, i) => (
                  <i className="f" key={"f" + i} />
                ))}
                {Array.from({ length: d }, (_, i) => (
                  <i className="d" key={"d" + i} />
                ))}
                {Array.from({ length: 5 - o - d }, (_, i) => (
                  <i key={"e" + i} />
                ))}
                <small style={{ display: "inline", marginInlineStart: 6 }}>
                  {fa(open)} باز · {fa(done)} انجام‌شده
                </small>
              </div>
            </div>
            <div className="mrow-acts">
              {manager && !me ? (
                <button type="button" className="qa go" style={{ ["--qc" as string]: "var(--ok)" }} onClick={() => onAssign(m.user)}>
                  واگذاری وظیفه
                </button>
              ) : null}
              {manager && !editing ? (
                <button
                  type="button"
                  className="qa"
                  onClick={() => {
                    setEditing(m.user.id);
                    setDraft(m.label ?? "");
                  }}
                >
                  {m.label ? "ویرایش صفت" : "+ صفت"}
                </button>
              ) : null}
              {(work.viewer.joined || manager) && !me ? (
                <button type="button" className="qa" onClick={() => onTag(m.user)}>
                  @ تگ
                </button>
              ) : null}
              {work.viewer.can_edit_info && m.role !== "owner" && !me ? (
                <button
                  type="button"
                  className="qa"
                  onClick={async () => {
                    try {
                      await workAction(`${work.id}/members/${m.user.id}/role`, "PUT", { role: m.role === "admin" ? "member" : "admin" });
                      await Promise.all([load(), refresh()]);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "تغییر نقش انجام نشد");
                    }
                  }}
                >
                  {m.role === "admin" ? "برداشتن ادمین" : "تعیین ادمین"}
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
      {!members.length && !loading && !error ? <p className="hint">عضوی پیدا نشد.</p> : null}
      {error ? (
        <p className="hint" role="alert">
          {error}
        </p>
      ) : null}
      {cursor ? (
        <button type="button" className="btn load-more" onClick={() => void load(cursor)}>
          اعضای بیشتر
        </button>
      ) : null}
    </div>
  );
}
