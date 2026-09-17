"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { AdminCheckbox, AdminField, fieldClass } from "./AdminField";
import { AdminDialog } from "./AdminDialog";
import { AdminFieldMessage } from "./AdminFieldMessage";
import { MediaPickerField } from "./MediaPickerField";
import { fa, primaryButtonClass, secondaryButtonClass } from "./styles";
import {
  adminErrorMessage,
  createCreator,
  deleteCreator,
  updateCreator,
} from "../services/creators.service";
import { getCities, getProvinces } from "../services/programs.service";
import { fieldErrorMessage } from "@/lib/meydan-api";
import {
  SOCIAL_PLATFORM_LABELS,
  SOCIAL_PLATFORMS,
  type Creator,
  type CreatorInput,
  type GeoOption,
  type SocialLink,
  type SocialPlatform,
} from "../types";

/**
 * The creator vocabulary. It mirrors `CreatorService::TYPE_LABELS`; the
 * backend also merges any extra terms registered in the taxonomy, so an unknown
 * slug that arrives on an existing creator is preserved as a chip rather than
 * dropped.
 */
const CREATOR_TYPES: Array<{ slug: string; label: string }> = [
  { slug: "speaker", label: "سخنران" },
  { slug: "reciter", label: "مداح" },
  { slug: "writer", label: "نویسنده" },
  { slug: "journalist", label: "خبرنگار" },
  { slug: "designer", label: "طراح" },
  { slug: "media_team", label: "تیم رسانه" },
  { slug: "institution", label: "نهاد" },
  { slug: "studio", label: "استودیو" },
  { slug: "other", label: "سایر" },
];

function toInput(creator?: Creator): CreatorInput {
  return {
    name: creator?.name ?? "",
    bio: creator?.bio ?? "",
    types: creator?.types ?? [],
    role: creator?.role ?? "",
    handle: creator?.handle ?? "",
    expertise: creator?.expertise ?? "",
    initials: creator?.initials ?? "",
    avatarMediaId: null,
    verified: creator?.verified ?? false,
    cities: creator?.cities ?? [],
    socialLinks: creator?.socialLinks ?? [],
  };
}

/**
 * Create/edit a content producer.
 *
 * Two backend details matter here: `types` is the `meydan_creator_type`
 * taxonomy (an unknown slug is silently dropped from the response, so the chips
 * only offer known terms) and a create requires a non-empty `name` — it is the
 * only hard 422 (`fields: { name: "required" }`).
 */
export function AdminCreatorForm({ creator }: { creator?: Creator }) {
  const router = useRouter();
  const mode = creator ? "edit" : "create";

  const [form, setForm] = useState<CreatorInput>(() => toInput(creator));
  const [provinces, setProvinces] = useState<GeoOption[]>([]);
  const [cities, setCities] = useState<GeoOption[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getProvinces()
      .then(async (items) => {
        if (!active) return;
        setProvinces(items ?? []);
        const groups = await Promise.all(
          (items ?? []).map((province) => getCities(province.id).catch(() => [])),
        );
        if (active) setCities(groups.flat());
      })
      .catch(() => {
        if (active) {
          setProvinces([]);
          setCities([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const patch = (next: Partial<CreatorInput>) => setForm((current) => ({ ...current, ...next }));

  const submit = async () => {
    setMessage(null);
    setFieldErrors({});
    if (!form.name.trim()) {
      setFieldErrors({ name: "نام الزامی است." });
      setMessage("چند فیلد نیاز به اصلاح دارد.");
      return;
    }

    setBusy(true);
    try {
      const saved =
        mode === "edit" && creator
          ? await updateCreator(String(creator.id), form)
          : await createCreator(form);
      router.push(`/admin/creators/${saved.id}` as Route);
      router.refresh();
    } catch (reason) {
      const fields =
        reason && typeof reason === "object" && "fields" in reason
          ? (reason as { fields?: Record<string, string> }).fields
          : undefined;
      setFieldErrors(
        Object.fromEntries(
          Object.entries(fields ?? {}).map(([key, value]) => [key, fieldErrorMessage(value)]),
        ),
      );
      setMessage(adminErrorMessage(reason, "ذخیره تولیدکننده ممکن نشد."));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    setDeleteError(null);
    try {
      await deleteCreator(String(creator?.id));
      router.push("/admin/creators" as Route);
      router.refresh();
    } catch (reason) {
      setDeleteError(adminErrorMessage(reason, "حذف تولیدکننده ممکن نشد."));
      setBusy(false);
    }
  };

  const updateLink = (index: number, next: Partial<SocialLink>) =>
    setForm((current) => ({
      ...current,
      socialLinks: current.socialLinks.map((link, position) =>
        position === index ? { ...link, ...next } : link,
      ),
    }));

  return (
    <>
      <form
        className="space-y-5 px-3 py-4 pb-24 sm:px-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <AdminFieldMessage message={message} fields={fieldErrors} />

        <section aria-label="پروفایل" className="space-y-3 rounded-card border border-border bg-surface p-3.5">
          <h2 className="text-xs font-black text-foreground-secondary">پروفایل تولیدکننده</h2>

          <AdminField label="نام" htmlFor="creator-name" required error={fieldErrors.name}>
            <input
              id="creator-name"
              value={form.name}
              onChange={(event) => patch({ name: event.target.value })}
              className={fieldClass}
            />
          </AdminField>

          <AdminField label="معرفی" htmlFor="creator-bio" error={fieldErrors.bio}>
            <textarea
              id="creator-bio"
              value={form.bio}
              rows={4}
              onChange={(event) => patch({ bio: event.target.value })}
              className={`${fieldClass} resize-none`}
            />
          </AdminField>

          <div className="grid gap-3 sm:grid-cols-2">
            <AdminField label="نقش" htmlFor="creator-role" error={fieldErrors.role}>
              <input
                id="creator-role"
                value={form.role}
                onChange={(event) => patch({ role: event.target.value })}
                className={fieldClass}
              />
            </AdminField>
            <AdminField label="شناسه کاربری" htmlFor="creator-handle" error={fieldErrors.handle}>
              <input
                id="creator-handle"
                value={form.handle}
                dir="ltr"
                onChange={(event) => patch({ handle: event.target.value })}
                className={`${fieldClass} text-left`}
              />
            </AdminField>
            <AdminField label="تخصص" htmlFor="creator-expertise">
              <input
                id="creator-expertise"
                value={form.expertise}
                onChange={(event) => patch({ expertise: event.target.value })}
                className={fieldClass}
              />
            </AdminField>
            <AdminField label="سرواژه" htmlFor="creator-initials">
              <input
                id="creator-initials"
                value={form.initials}
                onChange={(event) => patch({ initials: event.target.value })}
                className={fieldClass}
              />
            </AdminField>
          </div>

          <AdminCheckbox
            id="creator-verified"
            label="تأییدشده"
            description="نشان تأیید در فهرست عمومی تولیدکنندگان نمایش داده می‌شود."
            checked={form.verified}
            onChange={(verified) => patch({ verified })}
          />

          <MediaPickerField
            id="creator-avatar"
            label="تصویر تولیدکننده"
            mediaId={form.avatarMediaId}
            currentUrl={creator?.avatarUrl}
            onChange={(avatarMediaId) => patch({ avatarMediaId })}
          />
        </section>

        <section aria-label="نوع فعالیت" className="rounded-card border border-border bg-surface p-3.5">
          <h2 className="text-xs font-black text-foreground-secondary">نوع فعالیت</h2>
          <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
            اسلاگ‌های ناشناخته در سرور حذف می‌شوند؛ بنابراین فقط موارد شناخته‌شده پیشنهاد می‌شود.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              ...CREATOR_TYPES,
              ...form.types
                .filter((type) => !CREATOR_TYPES.some((known) => known.slug === type))
                .map((type) => ({ slug: type, label: `${type} (ناشناخته)` })),
            ].map((type) => {
              const active = form.types.includes(type.slug);
              return (
                <button
                  key={type.slug}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    patch({
                      types: active
                        ? form.types.filter((slug) => slug !== type.slug)
                        : [...form.types, type.slug],
                    })
                  }
                  className={`inline-flex min-h-8 items-center rounded-pill border px-3 text-[11px] font-black transition-colors ${
                    active
                      ? "border-brand-border bg-selected text-selected-foreground"
                      : "border-border bg-surface text-muted-foreground hover:bg-hover"
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </section>

        <section aria-label="شهرها" className="rounded-card border border-border bg-surface p-3.5">
          <h2 className="text-xs font-black text-foreground-secondary">شهرهای فعالیت</h2>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {fa(form.cities.length)} شهر انتخاب شده است.
          </p>
          <div className="mt-2 max-h-48 overflow-y-auto rounded-control border border-border p-2 no-scrollbar">
            {cities.length === 0 ? (
              <p className="py-3 text-center text-[11px] text-muted-foreground">
                شهرها در حال بارگذاری است…
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {cities.map((city) => {
                  const active = form.cities.includes(city.id);
                  return (
                    <button
                      key={city.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        patch({
                          cities: active
                            ? form.cities.filter((id) => id !== city.id)
                            : [...form.cities, city.id],
                        })
                      }
                      className={`inline-flex min-h-7 items-center rounded-pill border px-2 text-[10px] font-bold transition-colors ${
                        active
                          ? "border-brand-border bg-selected text-selected-foreground"
                          : "border-border bg-surface text-muted-foreground hover:bg-hover"
                      }`}
                    >
                      {city.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            استان‌های بارگذاری‌شده: {fa(provinces.length)}
          </p>
        </section>

        <section aria-label="شبکه‌های اجتماعی" className="space-y-3 rounded-card border border-border bg-surface p-3.5">
          <h2 className="text-xs font-black text-foreground-secondary">شبکه‌های اجتماعی</h2>
          {form.socialLinks.map((link, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[10rem_1fr_auto]">
              <select
                value={link.platform}
                aria-label={`پلتفرم لینک ${index + 1}`}
                onChange={(event) =>
                  updateLink(index, { platform: event.target.value as SocialPlatform })
                }
                className={fieldClass}
              >
                {SOCIAL_PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {SOCIAL_PLATFORM_LABELS[platform]}
                  </option>
                ))}
              </select>
              <input
                value={link.url}
                dir="ltr"
                aria-label={`نشانی لینک ${index + 1}`}
                onChange={(event) => updateLink(index, { url: event.target.value })}
                placeholder="https://"
                className={`${fieldClass} text-left`}
              />
              <button
                type="button"
                onClick={() =>
                  patch({ socialLinks: form.socialLinks.filter((_, position) => position !== index) })
                }
                aria-label={`حذف لینک ${index + 1}`}
                className="mt-1.5 grid h-9 w-9 place-items-center rounded-control border border-border text-danger-foreground transition-colors hover:bg-danger-surface"
              >
                <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patch({ socialLinks: [...form.socialLinks, { platform: "website", url: "" }] })
            }
            className={`${secondaryButtonClass} min-h-9`}
          >
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            افزودن لینک
          </button>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {busy ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="h-4 w-4" />
            )}
            {busy ? "در حال ذخیره…" : mode === "create" ? "ساخت تولیدکننده" : "ذخیره تغییرات"}
          </button>
          <Link href={"/admin/creators" as Route} className={secondaryButtonClass}>
            بازگشت به فهرست
          </Link>
          {mode === "edit" ? (
            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                setDeleteOpen(true);
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-control bg-danger px-4 text-xs font-black text-danger-foreground transition-colors hover:opacity-90"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              حذف تولیدکننده
            </button>
          ) : null}
        </div>
      </form>

      {deleteOpen ? (
        <AdminDialog
          title="حذف تولیدکننده"
          description={`«${creator?.name}» به زباله‌دان منتقل می‌شود. ارجاع‌های محتوا به این تولیدکننده پاک نمی‌شوند.`}
          confirmLabel="حذف کن"
          tone="danger"
          busy={busy}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onClose={() => setDeleteOpen(false)}
        />
      ) : null}
    </>
  );
}
