"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { LoaderCircle, RefreshCw, Users } from "lucide-react";
import { AdminDialog } from "./AdminDialog";
import { AdminErrorState, AdminTableSkeleton } from "./AdminStateViews";
import { AdminField, fieldClass } from "./AdminField";
import { AdminFieldMessage } from "./AdminFieldMessage";
import { AdminListCapNotice } from "./AdminPagination";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminTable, type AdminColumn } from "./AdminTable";
import { fa, secondaryButtonClass } from "./styles";
import {
  PARTICIPANT_LIST_CAP,
  adminErrorMessage,
  getParticipants,
  updateParticipant,
} from "../services/programs.service";
import type { InitiativeMember, Program } from "../types";

/**
 * The member rows of one initiative.
 *
 * The controller exposes a whitelist of exactly two writable columns — `status`
 * and `joined_at` — so this is the whole editable surface of a membership; the
 * participant type, user id and guest id are read-only. The list is `LIMIT 100`
 * with no pagination, which the cap notice states.
 */
export function AdminParticipantsView({
  initiative,
  initial,
}: {
  initiative: Program;
  initial: InitiativeMember[];
}) {
  const [rows, setRows] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [editing, setEditing] = useState<InitiativeMember | null>(null);
  const [status, setStatus] = useState("");
  const [joinedAt, setJoinedAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await getParticipants(String(initiative.id)));
    } catch (reason) {
      setError(adminErrorMessage(reason, "دریافت فهرست شرکت‌کنندگان ممکن نشد."));
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (member: InitiativeMember) => {
    setFormError(null);
    setFieldErrors({});
    setStatus(member.status);
    setJoinedAt(member.joinedAt?.slice(0, 10) ?? "");
    setEditing(member);
  };

  const submit = async () => {
    if (!editing) return;
    setBusy(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const updated = await updateParticipant(String(initiative.id), editing.id, {
        status,
        joinedAt: joinedAt ? `${joinedAt} 00:00:00` : "",
      });
      setRows((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      setEditing(null);
      setNotice(`عضویت #${updated.id} ذخیره شد.`);
      void load();
    } catch (reason) {
      setFormError(adminErrorMessage(reason, "ذخیره عضویت ممکن نشد."));
    } finally {
      setBusy(false);
    }
  };

  const columns: Array<AdminColumn<InitiativeMember>> = [
    {
      key: "member",
      header: "عضو",
      // The card layout on narrow screens uses this as the row heading.
      primary: true,
      render: (member) => (
        <div className="min-w-0">
          <span className="block text-xs font-black text-foreground">
            {member.userId
              ? `کاربر #${member.userId}`
              : member.guestId
                ? `مهمان #${member.guestId}`
                : `عضو #${member.id}`}
          </span>
          <span className="mt-0.5 block text-[10px] text-muted-foreground">
            {member.memberType || "نوع نامشخص"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (member) => (
        <span className="rounded-pill border border-border bg-surface-muted px-2 py-0.5 text-[10px] font-black text-foreground-secondary">
          {member.status || "—"}
        </span>
      ),
    },
    {
      key: "joined",
      header: "زمان عضویت",
      render: (member) => (
        <span className="font-mono text-[10px] text-foreground-secondary" dir="ltr">
          {member.joinedAt || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (member) => (
        <button
          type="button"
          onClick={() => openEditor(member)}
          className="rounded-control border border-border px-2.5 py-1 text-[10px] font-black text-foreground-secondary transition-colors hover:bg-hover"
        >
          ویرایش
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title={`شرکت‌کنندگان «${initiative.title}»`}
        description="ویرایش وضعیت عضویت و تاریخ پیوستن."
        crumbs={[
          { label: "ابتکارها", href: "/admin/initiatives" },
          { label: initiative.title || `#${initiative.id}`, href: `/admin/initiatives/${initiative.id}` },
          { label: "شرکت‌کنندگان" },
        ]}
        limitation="این فهرست صفحه‌بندی ندارد و حداکثر ۱۰۰ عضو را برمی‌گرداند."
        actions={
          <>
            <button type="button" onClick={() => void load()} className={secondaryButtonClass}>
              <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              بازخوانی
            </button>
            <Link
              href={`/admin/initiatives/${initiative.id}` as Route}
              className={secondaryButtonClass}
            >
              صفحه ابتکار
            </Link>
          </>
        }
      />

      <div className="px-3 pt-3 sm:px-4">
        {notice ? <AdminFieldMessage message={notice} tone="success" /> : null}
      </div>

      {error ? (
        <AdminErrorState message={error} onRetry={() => void load()} retrying={loading} />
      ) : loading ? (
        <AdminTableSkeleton rows={5} />
      ) : (
        <>
          <AdminTable
            columns={columns}
            rows={rows}
            rowKey={(member) => member.id}
            caption="فهرست شرکت‌کنندگان"
            emptyTitle="هنوز کسی به این ابتکار نپیوسته است."
            emptyDescription="با فعال بودن «اجازه عضویت مهمان»، عضویت‌ها از سمت اپ ثبت می‌شوند."
            emptyIcon={<Users aria-hidden="true" className="h-5 w-5" />}
          />
          <AdminListCapNotice shown={rows.length} cap={PARTICIPANT_LIST_CAP} />
          <p className="px-3 pb-6 pt-2 text-[10px] text-muted-foreground sm:px-4">
            مجموع {fa(initiative.participantCount)} عضو ثبت‌شده · {fa(rows.length)} ردیف در این صفحه
          </p>
        </>
      )}

      {editing ? (
        <AdminDialog
          title={`ویرایش عضویت #${editing.id}`}
          description="فقط وضعیت و تاریخ پیوستن قابل تغییر است؛ نوع عضو و شناسه کاربر از سمت سرور تعیین می‌شود."
          confirmLabel="ذخیره"
          busy={busy}
          error={formError}
          onConfirm={() => void submit()}
          onClose={() => setEditing(null)}
        >
          <div className="space-y-3">
            <AdminFieldMessage message={formError} fields={fieldErrors} />
            <AdminField
              label="وضعیت"
              htmlFor="member-status"
              hint="مقدار آزاد است؛ سرور آن را همان‌طور که هست ذخیره می‌کند."
            >
              <input
                id="member-status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className={fieldClass}
              />
            </AdminField>
            <AdminField
              label="تاریخ پیوستن"
              htmlFor="member-joined"
              hint="میلادی، قالب YYYY-MM-DD. ساعت روی ۰۰:۰۰ تنظیم می‌شود."
            >
              <input
                id="member-joined"
                value={joinedAt}
                dir="ltr"
                placeholder="2026-09-17"
                onChange={(event) => setJoinedAt(event.target.value)}
                className={`${fieldClass} text-left`}
              />
            </AdminField>
            {busy ? (
              <p role="status" className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                در حال ذخیره…
              </p>
            ) : null}
          </div>
        </AdminDialog>
      ) : null}
    </div>
  );
}
