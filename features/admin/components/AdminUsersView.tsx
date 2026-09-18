"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Pencil, UserPlus, UserRound } from "lucide-react";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminFilters, type AdminFilter } from "./AdminFilters";
import { AdminTable, type AdminColumn } from "./AdminTable";
import { AdminPagination } from "./AdminPagination";
import { AdminDialog } from "./AdminDialog";
import { AdminErrorState, AdminTableSkeleton } from "./AdminStateViews";
import { AdminSuccessToast } from "./AdminSuccessToast";
import { primaryButtonClass, secondaryButtonClass } from "./styles";
import { adminErrorMessage } from "../services/admin-api";
import { EMPTY_USER_FILTERS, getUsers, setUserDisabled, type AdminUser, type AdminUserRole, type UserFilters } from "../services/users.service";
import type { AdminPage } from "../types";

export function AdminUsersView({ initial, roles }: { initial: AdminPage<AdminUser>; roles: AdminUserRole[] }) {
  const [filters, setFilters] = useState<UserFilters>(EMPTY_USER_FILTERS);
  const [applied, setApplied] = useState<UserFilters>(EMPTY_USER_FILTERS);
  const [page, setPage] = useState(initial.page);
  const [perPage, setPerPage] = useState(initial.perPage);
  const [result, setResult] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const [revision, setRevision] = useState(0);
  const first = useRef(true);

  const load = useCallback(async (next: UserFilters, nextPage: number, nextPerPage: number) => {
    setLoading(true);
    setError(null);
    try { setResult(await getUsers(next, nextPage, nextPerPage)); }
    catch (reason) { setError(adminErrorMessage(reason, "دریافت کاربران ممکن نشد.")); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    void load(applied, page, perPage);
  }, [applied, page, perPage, revision, load]);

  const submitStatus = async () => {
    if (!target) return;
    setBusy(true);
    setActionError(null);
    try {
      await setUserDisabled(target.id, !target.disabled);
      setToast({ id: Date.now(), message: target.disabled ? "حساب دوباره فعال شد." : "حساب غیرفعال شد." });
      setTarget(null);
      await load(applied, page, perPage);
    } catch (reason) { setActionError(adminErrorMessage(reason)); }
    finally { setBusy(false); }
  };

  const descriptors: AdminFilter[] = [
    { kind: "search", key: "q", label: "جست‌وجوی نام، شماره یا ایمیل", value: filters.q, onChange: (q) => setFilters((f) => ({ ...f, q })) },
    { kind: "select", key: "role", label: "نقش", value: filters.role, options: [{ value: "", label: "همه نقش‌ها" }, ...roles], onChange: (role) => setFilters((f) => ({ ...f, role })) },
    { kind: "select", key: "status", label: "وضعیت", value: filters.status, options: [{ value: "", label: "همه" }, { value: "active", label: "فعال" }, { value: "disabled", label: "غیرفعال" }], onChange: (status) => setFilters((f) => ({ ...f, status })) },
  ];
  const columns: AdminColumn<AdminUser>[] = [
    { key: "name", header: "کاربر", primary: true, render: (user) => <span className="flex items-center gap-2"><span className={`grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-surface-muted ${user.disabled ? "grayscale opacity-60" : ""}`}>{user.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : <UserRound size={18} />}</span><span className="min-w-0"><strong className="block truncate">{user.full_name}</strong><small className="text-muted-foreground">#{user.id.toLocaleString("fa-IR")}</small></span></span> },
    { key: "phone", header: "شماره", render: (user) => <span dir="ltr">{user.phone || "—"}</span> },
    { key: "role", header: "نقش", render: (user) => roles.find((r) => r.value === user.role)?.label ?? user.role },
    { key: "status", header: "وضعیت", render: (user) => <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.disabled ? "border border-danger-border bg-danger-surface text-danger-foreground" : "bg-success-surface text-success"}`}>{user.disabled ? "غیرفعال" : "فعال"}</span> },
    { key: "actions", header: "عملیات", render: (user) => <span className="flex flex-wrap gap-2"><Link href={`/admin/users/${user.id}` as Route} className={secondaryButtonClass} aria-label={`ویرایش ${user.full_name}`}><Pencil size={15} />ویرایش</Link><button type="button" className={secondaryButtonClass} onClick={(event) => { event.stopPropagation(); setActionError(null); setTarget(user); }}>{user.disabled ? "فعال‌سازی" : "غیرفعال‌سازی"}</button></span> },
  ];

  return <div className="min-h-full bg-background">
    <AdminPageHeader title="کاربران" description="مدیریت حساب‌های سایت و پنل" crumbs={[{ label: "کاربران" }]} actions={<Link href={"/admin/users/new" as Route} className={primaryButtonClass}><UserPlus size={17} />افزودن کاربر</Link>} />
    <AdminFilters filters={descriptors} busy={loading} onSubmit={() => { setPage(1); setApplied({ ...filters }); setRevision((n) => n + 1); }} onReset={() => { setFilters(EMPTY_USER_FILTERS); setApplied(EMPTY_USER_FILTERS); setPage(1); setRevision((n) => n + 1); }} />
    <section className="mx-auto max-w-7xl px-4 py-6 lg:px-10">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        {error ? <AdminErrorState message={error} onRetry={() => void load(applied, page, perPage)} /> : loading ? <AdminTableSkeleton rows={6} /> : <AdminTable columns={columns} rows={result.items} rowKey={(user) => user.id} rowClassName={(user) => user.disabled ? "bg-danger-surface/40 border-r-2 border-danger-border" : ""} emptyTitle="کاربری با این مشخصات پیدا نشد." emptyIcon={<UserRound />} />}
        <AdminPagination page={page} pages={result.pages} total={result.total} perPage={perPage} busy={loading} onPageChange={setPage} onPerPageChange={(size) => { setPage(1); setPerPage(size); }} />
      </div>
    </section>
    {toast ? <AdminSuccessToast key={toast.id} message={toast.message} /> : null}
    {target ? <AdminDialog title={target.disabled ? "فعال‌سازی حساب" : "غیرفعال‌سازی حساب"} description={target.disabled ? `حساب ${target.full_name} دوباره اجازه ورود و نمایش عمومی خواهد داشت.` : `نشست‌های ${target.full_name} قطع می‌شود و پروفایل و محتوای عمومی‌اش تا فعال‌سازی دوباره پنهان می‌ماند.`} confirmLabel={target.disabled ? "فعال‌سازی" : "غیرفعال‌سازی"} tone={target.disabled ? "default" : "danger"} busy={busy} error={actionError} onClose={() => setTarget(null)} onConfirm={() => void submitStatus()} /> : null}
  </div>;
}
