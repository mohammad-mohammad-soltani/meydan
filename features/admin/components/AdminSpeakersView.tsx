"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Mic, RefreshCw, UserPlus } from "lucide-react";
import { AdminErrorState, AdminTableSkeleton } from "./AdminStateViews";
import { AdminFilters, type AdminFilter } from "./AdminFilters";
import { AdminListCapNotice } from "./AdminPagination";
import { AdminTable, type AdminColumn } from "./AdminTable";
import { AdminPageHeader } from "./AdminPageHeader";
import { VerifiedBadge } from "./AdminStatusBadge";
import { fa, secondaryButtonClass } from "./styles";
import {
  EMPTY_SPEAKER_FILTERS,
  adminErrorMessage,
  getAdminSpeakers,
  getSpeakerCategories,
} from "../services/speakers.service";
import { getCities, getProvinces } from "../services/programs.service";
import type {
  AdminListResult,
  GeoOption,
  Speaker,
  SpeakerCategory,
  SpeakerStatusFilters,
} from "../types";

/**
 * The speaker directory.
 *
 * `GET /admin/speakers` is capped at 50 rows with no pagination
 * (`SpeakerController::query` uses `number => 50`), so the view labels the
 * ceiling instead of rendering fake page controls. `phone` never appears here:
 * the admin schema omits it entirely (`phone_visible: false`).
 */
export function AdminSpeakersView({ initial }: { initial: AdminListResult<Speaker> }) {
  const [filters, setFilters] = useState<SpeakerStatusFilters>(EMPTY_SPEAKER_FILTERS);
  const [applied, setApplied] = useState<SpeakerStatusFilters>(EMPTY_SPEAKER_FILTERS);
  const [result, setResult] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<SpeakerCategory[]>([]);
  const [provinces, setProvinces] = useState<GeoOption[]>([]);
  const [cities, setCities] = useState<GeoOption[]>([]);

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

  const load = useCallback(async (next: SpeakerStatusFilters) => {
    setLoading(true);
    setError(null);
    try {
      setResult(await getAdminSpeakers(next));
    } catch (reason) {
      setError(adminErrorMessage(reason, "دریافت فهرست سخنرانان ممکن نشد."));
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = () => {
    setApplied(filters);
    void load(filters);
  };

  const resetFilters = () => {
    setFilters(EMPTY_SPEAKER_FILTERS);
    setApplied(EMPTY_SPEAKER_FILTERS);
    void load(EMPTY_SPEAKER_FILTERS);
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
            <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
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
  ];

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title="سخنرانان"
        description="ارتقای حساب کاربری به سخنران، ویرایش پروفایل و حذف نقش سخنران."
        crumbs={[{ label: "سخنرانان" }]}
        limitation="این فهرست صفحه‌بندی ندارد و حداکثر ۵۰ سخنران را برمی‌گرداند."
        actions={
          <>
            <button
              type="button"
              onClick={() => void load(applied)}
              className={secondaryButtonClass}
            >
              <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              بازخوانی
            </button>
            <Link
              href={"/admin/speakers/new" as Route}
              className="inline-flex min-h-10 items-center gap-2 rounded-control bg-brand px-4 text-xs font-black text-brand-foreground transition-colors hover:bg-brand-hover"
            >
              <UserPlus aria-hidden="true" className="h-4 w-4" />
              ارتقای کاربر
            </Link>
          </>
        }
      />

      <AdminFilters filters={descriptors} onSubmit={applyFilters} onReset={resetFilters} busy={loading} />

      {error ? (
        <AdminErrorState message={error} onRetry={() => void load(applied)} retrying={loading} />
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
            emptyDescription="فیلترها را تغییر دهید یا یک حساب را ارتقا دهید."
            emptyIcon={<Mic aria-hidden="true" className="h-5 w-5" />}
          />
          <AdminListCapNotice shown={result.items.length} cap={result.cap ?? 50} />
          <p className="px-3 pb-6 pt-2 text-[10px] text-muted-foreground sm:px-4">
            {fa(result.items.length)} سخنران نمایش داده شد
          </p>
        </>
      )}
    </div>
  );
}
