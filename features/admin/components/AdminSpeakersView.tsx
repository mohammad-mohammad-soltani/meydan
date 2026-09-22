"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Mic, Pencil, RefreshCw, Trash2, UserPlus, UserRoundPlus } from "lucide-react";
import { AdminDialog } from "./AdminDialog";
import { AdminSpeakerCategories } from "./AdminSpeakerCategories";
import { AdminErrorState, AdminTableSkeleton } from "./AdminStateViews";
import { AdminFilters, type AdminFilter } from "./AdminFilters";
import { AdminPagination } from "./AdminPagination";
import { AdminTable, type AdminColumn } from "./AdminTable";
import { AdminPageHeader } from "./AdminPageHeader";
import { VerifiedBadge } from "./AdminStatusBadge";
import { fa, secondaryButtonClass } from "./styles";
import {
  EMPTY_SPEAKER_FILTERS,
  adminErrorMessage,
  demoteSpeaker,
  getAdminSpeakers,
  getSpeakerCategories,
} from "../services/speakers.service";
import { getCities, getProvinces } from "../services/programs.service";
import type {
  AdminPage,
  GeoOption,
  Speaker,
  SpeakerCategory,
  SpeakerStatusFilters,
} from "../types";

/**
 * The speaker directory.
 *
 * `GET /admin/speakers` uses real server pagination, so every matching speaker
 * remains reachable. Phone numbers deliberately never appear in this list.
 */
export function AdminSpeakersView({ initial }: { initial: AdminPage<Speaker> }) {
  const [filters, setFilters] = useState<SpeakerStatusFilters>(EMPTY_SPEAKER_FILTERS);
  const [applied, setApplied] = useState<SpeakerStatusFilters>(EMPTY_SPEAKER_FILTERS);
  const [page, setPage] = useState(initial.page || 1);
  const [perPage, setPerPage] = useState(initial.perPage || 20);
  const [result, setResult] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<SpeakerCategory[]>([]);
  const [provinces, setProvinces] = useState<GeoOption[]>([]);
  const [cities, setCities] = useState<GeoOption[]>([]);
  const [speakerToDemote, setSpeakerToDemote] = useState<Speaker | null>(null);
  const [demoteBusy, setDemoteBusy] = useState(false);
  const [demoteError, setDemoteError] = useState<string | null>(null);
  const firstRender = useRef(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    void getSpeakerCategories()
      .then((items) => setCategories(items ?? []))
      .catch(() => setCategories([]));
    void getProvinces()
      .then((items) => setProvinces(items ?? []))
      .catch(() => setProvinces([]));
  }, []);

  /**
   * The city list follows the chosen province, exactly like the geo picker: a
   * city from another province would make the API filter return nothing.
   *
   * The fetch hangs off the change handler rather than an effect on
   * `provinceId`, so choosing a province cannot cascade an extra render before
   * the request even starts.
   */
  const selectProvince = (raw: string) => {
    const provinceId = raw ? Number(raw) : null;
    setFilters((current) => ({ ...current, provinceId, cityId: null }));
    if (!provinceId) {
      setCities([]);
      return;
    }
    void getCities(provinceId)
      .then((items) => setCities(items ?? []))
      .catch(() => setCities([]));
  };

  const load = useCallback(async (next: SpeakerStatusFilters, nextPage: number, nextPerPage: number) => {
    setLoading(true);
    setError(null);
    try {
      setResult(await getAdminSpeakers(next, nextPage, nextPerPage));
    } catch (reason) {
      setError(adminErrorMessage(reason, "دریافت فهرست سخنرانان ممکن نشد."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    void load(applied, page, perPage);
  }, [applied, load, page, perPage, reloadKey]);

  const applyFilters = () => {
    setPage(1);
    setApplied(filters);
    setReloadKey((current) => current + 1);
  };

  const resetFilters = () => {
    setFilters(EMPTY_SPEAKER_FILTERS);
    setApplied(EMPTY_SPEAKER_FILTERS);
    setPage(1);
    setReloadKey((current) => current + 1);
  };

  const demote = async () => {
    if (!speakerToDemote) return;
    setDemoteBusy(true);
    setDemoteError(null);
    try {
      await demoteSpeaker(String(speakerToDemote.userId));
      setSpeakerToDemote(null);
      await load(applied, page, perPage);
    } catch (reason) {
      setDemoteError(adminErrorMessage(reason, "حذف نقش سخنران ممکن نشد."));
    } finally {
      setDemoteBusy(false);
    }
  };

  const descriptors: AdminFilter[] = [
    {
      kind: "search",
      key: "q",
      label: "جست‌وجو",
      placeholder: "نام سخنران",
      value: filters.q,
      onChange: (value) => setFilters((current) => ({ ...current, q: value })),
    },
    {
      kind: "toggle",
      key: "verified",
      label: "تأیید",
      value: filters.verified,
      options: [
        { value: "", label: "همه" },
        { value: "true", label: "فقط تأییدشده" },
      ],
      onChange: (value) =>
        setFilters((current) => ({ ...current, verified: value as SpeakerStatusFilters["verified"] })),
    },
    {
      kind: "select",
      key: "category",
      label: "دسته‌بندی موضوعی",
      value: filters.speakerCategory,
      options: [
        { value: "", label: "همه دسته‌ها" },
        ...categories.map((category) => ({ value: category.slug, label: category.name })),
      ],
      onChange: (value) => setFilters((current) => ({ ...current, speakerCategory: value })),
    },
    {
      kind: "select",
      key: "province",
      label: "استان",
      value: filters.provinceId ? String(filters.provinceId) : "",
      options: [
        { value: "", label: "همه استان‌ها" },
        ...provinces.map((province) => ({ value: String(province.id), label: province.name })),
      ],
      onChange: selectProvince,
    },
    {
      kind: "select",
      key: "city",
      label: "شهر",
      value: filters.cityId ? String(filters.cityId) : "",
      disabled: !filters.provinceId,
      options: [
        { value: "", label: filters.provinceId ? "همه شهرها" : "ابتدا استان" },
        ...cities.map((city) => ({ value: String(city.id), label: city.name })),
      ],
      onChange: (value) =>
        setFilters((current) => ({ ...current, cityId: value ? Number(value) : null })),
    },
  ];

  const columns: Array<AdminColumn<Speaker>> = [
    {
      key: "name",
      header: "سخنران",
      // The card layout on narrow screens uses this as the row heading.
      primary: true,
      render: (speaker) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-muted text-[11px] font-black text-brand">
            {speaker.avatarUrl ? (
              // Plain img keeps the admin list free of the image optimizer for
              // the many avatar hosts the panel does not know about.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={speaker.avatarUrl} alt="" className="h-9 w-9 object-cover" />
            ) : (
              (speaker.name.trim().slice(0, 1) || "؟")
            )}
          </span>
          <span className="min-w-0">
            <Link
              href={`/admin/speakers/${speaker.userId}` as Route}
              className="block truncate text-xs font-black text-foreground hover:text-brand"
            >
              {speaker.name || `کاربر #${speaker.userId}`}
            </Link>
            <span className="mt-0.5 block w-[30vw] truncate text-[10px] text-muted-foreground">
              {speaker.expertise || speaker.bio || "—"}
            </span>
          </span>
        </div>
      ),
    },
    {
      key: "verified",
      header: "وضعیت",
      render: (speaker) => <VerifiedBadge verified={speaker.verified} />,
    },
    {
      key: "categories",
      header: "دسته‌ها",
      render: (speaker) =>
        speaker.categories.length ? (
          <span className="flex flex-wrap gap-1">
            {speaker.categories.map((slug) => (
              <span
                key={slug}
                className="rounded-pill border border-border bg-surface-muted px-2 py-0.5 text-[10px] text-foreground-secondary"
              >
                {categories.find((category) => category.slug === slug)?.name ?? slug}
              </span>
            ))}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">—</span>
        ),
    },
    {
      key: "id",
      header: "شناسه",
      render: (speaker) => (
        <span className="font-mono text-[10px] text-muted-foreground">#{speaker.userId}</span>
      ),
    },
    {
      key: "actions",
      header: "عملیات",
      className: "w-56 whitespace-nowrap",
      render: (speaker) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/speakers/${speaker.userId}` as Route}
            className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-control border border-border bg-surface px-3 text-[11px] font-black text-foreground transition-colors hover:bg-hover"
          >
            <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
            ویرایش
          </Link>
          <button
            type="button"
            onClick={() => {
              setDemoteError(null);
              setSpeakerToDemote(speaker);
            }}
            className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-control border border-danger-border bg-danger-surface px-3 text-[11px] font-black text-danger-foreground transition-colors hover:opacity-80"
          >
            <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
            حذف نقش
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title="سخنرانان"
        description="ارتقای حساب کاربری به سخنران، ویرایش پروفایل و حذف نقش سخنران."
        crumbs={[{ label: "سخنرانان" }]}
        actions={
          <>
            <button
              type="button"
              onClick={() => void load(applied, page, perPage)}
              className={secondaryButtonClass}
            >
              <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              بازخوانی
            </button>
            <div role="group" aria-label="افزودن سخنران" className="flex items-center rounded-control border border-border bg-surface-muted p-1">
              <Link
                href={"/admin/speakers/new" as Route}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-control px-3 text-[11px] font-black text-foreground transition-colors hover:bg-hover"
              >
                <UserPlus aria-hidden="true" className="h-4 w-4" />
                ارتقای کاربر
              </Link>
              <Link
                href={"/admin/speakers/new-account" as Route}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-control bg-brand px-3 text-[11px] font-black text-brand-foreground transition-colors hover:bg-brand-hover"
              >
                <UserRoundPlus aria-hidden="true" className="h-4 w-4" />
                افزودن سخنران
              </Link>
            </div>
          </>
        }
      />

      <AdminSpeakerCategories categories={categories} onChange={(items) => {
        setCategories(items);
        if (applied.speakerCategory && !items.some((item) => item.slug === applied.speakerCategory)) {
          setApplied((current) => ({ ...current, speakerCategory: "" }));
          setFilters((current) => ({ ...current, speakerCategory: "" }));
          setPage(1);
        } else {
          setReloadKey((current) => current + 1);
        }
      }} />

      <AdminFilters filters={descriptors} onSubmit={applyFilters} onReset={resetFilters} busy={loading} />

      {error ? (
        <AdminErrorState message={error} onRetry={() => void load(applied, page, perPage)} retrying={loading} />
      ) : loading ? (
        <AdminTableSkeleton rows={5} />
      ) : (
        <>
          <AdminTable
            columns={columns}
            rows={result.items}
            rowKey={(speaker) => speaker.userId}
            caption="فهرست سخنرانان"
            emptyTitle="سخنرانی با این فیلترها پیدا نشد."
            emptyDescription="فیلترها را تغییر دهید، یک حساب را ارتقا دهید یا سخنران جدید بسازید."
            emptyIcon={<Mic aria-hidden="true" className="h-5 w-5" />}
          />
          <AdminPagination
            page={result.page}
            pages={result.pages}
            total={result.total}
            perPage={result.perPage}
            busy={loading}
            onPageChange={setPage}
            onPerPageChange={(value) => {
              setPage(1);
              setPerPage(value);
            }}
          />
          <p className="px-3 pb-6 pt-2 text-[10px] text-muted-foreground sm:px-4">
            {fa(result.total)} سخنران در این فیلتر
          </p>
        </>
      )}

      {speakerToDemote ? (
        <AdminDialog
          title="حذف نقش سخنران"
          description={`نقش سخنران از «${speakerToDemote.name || `کاربر ${fa(speakerToDemote.userId)}`}» برداشته می‌شود. حساب کاربری و اطلاعات آن باقی می‌ماند و می‌توان آن را دوباره ارتقا داد.`}
          confirmLabel="حذف نقش"
          tone="danger"
          busy={demoteBusy}
          error={demoteError}
          onConfirm={() => void demote()}
          onClose={() => {
            if (!demoteBusy) setSpeakerToDemote(null);
          }}
        />
      ) : null}
    </div>
  );
}
