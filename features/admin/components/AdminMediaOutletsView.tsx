"use client";

import { useCallback, useState } from "react";
import { Image as ImageIcon, Plus, RefreshCw } from "lucide-react";
import { AdminDialog } from "./AdminDialog";
import { AdminErrorState, AdminTableSkeleton } from "./AdminStateViews";
import { AdminField, fieldClass } from "./AdminField";
import { AdminFieldMessage } from "./AdminFieldMessage";
import { MediaPickerField } from "./MediaPickerField";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminTable, type AdminColumn } from "./AdminTable";
import { fa, primaryButtonClass, secondaryButtonClass } from "./styles";
import {
  OUTLET_LIST_LIMITATION,
  adminErrorMessage,
  createMediaOutlet,
  deleteMediaOutlet,
  getMediaOutlets,
  updateMediaOutlet,
} from "../services/creators.service";
import type { MediaOutlet } from "../types";

/**
 * Media outlets (رسانه‌ها) in one screen: the list, an inline create/edit form
 * and the delete confirmation.
 *
 * The list is capped at 100 published rows and is the same public list the
 * narrative reflection picker uses, which keeps outlet ids in sync between the
 * two screens. `website` is passed through `esc_url_raw`, so a value without a
 * scheme is stored as-is and will not open as a link — the hint says to include
 * `https://`.
 */
export function AdminMediaOutletsView({ initial }: { initial: MediaOutlet[] }) {
  const [rows, setRows] = useState(initial);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<MediaOutlet | "new" | null>(null);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [bale, setBale] = useState("");
  const [eitaa, setEitaa] = useState("");
  const [avatarMediaId, setAvatarMediaId] = useState<number | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<MediaOutlet | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async (nextQuery: string) => {
    setLoading(true);
    setError(null);
    try {
      setRows(await getMediaOutlets(nextQuery));
    } catch (reason) {
      setError(adminErrorMessage(reason, "دریافت فهرست رسانه‌ها ممکن نشد."));
    } finally {
      setLoading(false);
    }
  }, []);

  const openEditor = (outlet: MediaOutlet | "new") => {
    setFormMessage(null);
    setFieldErrors({});
    setAvatarMediaId(null);
    if (outlet === "new") {
      setName("");
      setWebsite("");
      setBale("");
      setEitaa("");
    } else {
      setName(outlet.name);
      setWebsite(outlet.website);
      setBale(outlet.bale);
      setEitaa(outlet.eitaa);
    }
    setEditing(outlet);
  };

  const submit = async () => {
    setFormMessage(null);
    setFieldErrors({});
    if (!name.trim()) {
      setFieldErrors({ name: "نام الزامی است." });
      setFormMessage("نام رسانه را وارد کنید.");
      return;
    }

    setBusy(true);
    const payload = { name, website, bale, eitaa, avatarMediaId };
    try {
      if (editing === "new") await createMediaOutlet(payload);
      else if (editing) await updateMediaOutlet(String(editing.id), payload);
      setEditing(null);
      await load(query);
    } catch (reason) {
      setFormMessage(adminErrorMessage(reason, "ذخیره رسانه ممکن نشد."));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    setDeleteError(null);
    try {
      await deleteMediaOutlet(String(pendingDelete.id));
      setPendingDelete(null);
      await load(query);
    } catch (reason) {
      setDeleteError(adminErrorMessage(reason, "حذف رسانه ممکن نشد."));
    } finally {
      setBusy(false);
    }
  };

  const columns: Array<AdminColumn<MediaOutlet>> = [
    {
      key: "name",
      header: "رسانه",
      // The card layout on narrow screens uses this as the row heading.
      primary: true,
      render: (outlet) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-muted text-icon-muted">
            {outlet.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={outlet.avatarUrl} alt="" className="h-9 w-9 object-cover" />
            ) : (
              <ImageIcon aria-hidden="true" className="h-4 w-4" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-black text-foreground">{outlet.name}</span>
            <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">
              #{outlet.id}
            </span>
          </span>
        </div>
      ),
    },
    {
      key: "links",
      header: "پیوندها",
      render: (outlet) => (
        <div className="flex flex-col gap-0.5 text-[10px] text-foreground-secondary">
          {outlet.website ? (
            <a
              href={outlet.website}
              target="_blank"
              rel="noreferrer"
              dir="ltr"
              className="truncate text-left text-link hover:text-link-hover"
            >
              {outlet.website}
            </a>
          ) : null}
          {outlet.bale ? <span dir="ltr">بله: {outlet.bale}</span> : null}
          {outlet.eitaa ? <span dir="ltr">ایتا: {outlet.eitaa}</span> : null}
          {!outlet.website && !outlet.bale && !outlet.eitaa ? <span>—</span> : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (outlet) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => openEditor(outlet)}
            className="rounded-control border border-border px-2.5 py-1 text-[10px] font-black text-foreground-secondary transition-colors hover:bg-hover"
          >
            ویرایش
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setPendingDelete(outlet);
            }}
            className="rounded-control border border-danger-border px-2.5 py-1 text-[10px] font-black text-danger-foreground transition-colors hover:bg-danger-surface"
          >
            حذف
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title="رسانه‌ها"
        description="رسانه‌های خبری که بازتاب روایت‌ها به آن‌ها نسبت داده می‌شود."
        crumbs={[{ label: "رسانه‌ها" }]}
        limitation={OUTLET_LIST_LIMITATION}
        actions={
          <>
            <button type="button" onClick={() => void load(query)} className={secondaryButtonClass}>
              <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              بازخوانی
            </button>
            <button type="button" onClick={() => openEditor("new")} className={primaryButtonClass}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              رسانه تازه
            </button>
          </>
        }
      />

      <form
        className="border-b border-divider bg-surface px-3 py-3 sm:px-4"
        onSubmit={(event) => {
          event.preventDefault();
          void load(query);
        }}
      >
        <label className="block max-w-sm">
          <span className="mb-1 block text-[10px] font-black text-muted-foreground">جست‌وجو</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="نام رسانه"
            className={fieldClass}
          />
        </label>
        <button type="submit" disabled={loading} className={`${secondaryButtonClass} mt-2 min-h-9`}>
          اعمال
        </button>
      </form>

      {error ? (
        <AdminErrorState message={error} onRetry={() => void load(query)} retrying={loading} />
      ) : loading ? (
        <AdminTableSkeleton rows={4} />
      ) : (
        <>
          <AdminTable
            columns={columns}
            rows={rows}
            rowKey={(outlet) => outlet.id}
            caption="فهرست رسانه‌ها"
            emptyTitle="رسانه‌ای پیدا نشد."
            emptyDescription="جست‌وجو را پاک کنید یا یک رسانه تازه بسازید."
            emptyIcon={<ImageIcon aria-hidden="true" className="h-5 w-5" />}
          />
          <p className="px-3 pb-6 pt-2 text-[10px] text-muted-foreground sm:px-4">
            {fa(rows.length)} رسانه · حداکثر ۱۰۰ ردیف
          </p>
        </>
      )}

      {editing ? (
        <AdminDialog
          title={editing === "new" ? "رسانه تازه" : `ویرایش «${editing.name}»`}
          description="برای پیوندها، آدرس کامل با https:// را وارد کنید تا در گزارش‌ها قابل کلیک باشد."
          confirmLabel={editing === "new" ? "ساخت رسانه" : "ذخیره تغییرات"}
          busy={busy}
          onConfirm={() => void submit()}
          onClose={() => setEditing(null)}
        >
          <div className="space-y-3">
            <AdminFieldMessage message={formMessage} fields={fieldErrors} />
            <AdminField label="نام" htmlFor="outlet-name" required error={fieldErrors.name}>
              <input
                id="outlet-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={fieldClass}
              />
            </AdminField>
            <AdminField label="وب‌سایت" htmlFor="outlet-website">
              <input
                id="outlet-website"
                value={website}
                dir="ltr"
                placeholder="https://"
                onChange={(event) => setWebsite(event.target.value)}
                className={`${fieldClass} text-left`}
              />
            </AdminField>
            <AdminField label="کانال بله" htmlFor="outlet-bale">
              <input
                id="outlet-bale"
                value={bale}
                dir="ltr"
                onChange={(event) => setBale(event.target.value)}
                className={`${fieldClass} text-left`}
              />
            </AdminField>
            <AdminField label="کانال ایتا" htmlFor="outlet-eitaa">
              <input
                id="outlet-eitaa"
                value={eitaa}
                dir="ltr"
                onChange={(event) => setEitaa(event.target.value)}
                className={`${fieldClass} text-left`}
              />
            </AdminField>
            <MediaPickerField
              id="outlet-avatar"
              label="نشان رسانه"
              mediaId={avatarMediaId}
              currentUrl={editing === "new" ? null : editing.avatarUrl}
              onChange={setAvatarMediaId}
            />
          </div>
        </AdminDialog>
      ) : null}

      {pendingDelete ? (
        <AdminDialog
          title="حذف رسانه"
          description={`«${pendingDelete.name}» به زباله‌دان منتقل می‌شود. بازتاب‌های ثبت‌شده با این رسانه حفظ می‌شوند.`}
          confirmLabel="حذف کن"
          tone="danger"
          busy={busy}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onClose={() => setPendingDelete(null)}
        />
      ) : null}
    </div>
  );
}
