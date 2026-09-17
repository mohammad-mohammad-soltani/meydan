"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { AdminCheckbox, AdminField, fieldClass } from "./AdminField";
import { AdminDialog } from "./AdminDialog";
import { MediaPickerField } from "./MediaPickerField";
import { AdminDisclosureSection } from "./AdminDisclosureSection";
import { AdminFieldMessage } from "./AdminFieldMessage";
import { fa, primaryButtonClass, secondaryButtonClass } from "./styles";
import {
  adminErrorMessage,
  demoteSpeaker,
  promoteSpeaker,
  updateSpeaker,
} from "../services/speakers.service";
import { getCities, getProvinces } from "../services/programs.service";
import {
  SOCIAL_PLATFORM_LABELS,
  SOCIAL_PLATFORMS,
  type GeoOption,
  type LinkableUser,
  type SocialLink,
  type SocialPlatform,
  type Speaker,
  type SpeakerCategory,
  type SpeakerProfileInput,
} from "../types";
import { fieldErrorMessage } from "@/lib/meydan-api";

export type SpeakerFormErrors = { message: string | null; fields: Record<string, string> };

function reasonMessages(fields?: Record<string, string>): Record<string, string> {
  if (!fields) return {};
  return Object.fromEntries(
    Object.entries(fields).map(([key, reason]) => [key, fieldErrorMessage(reason)]),
  );
}

function readApiFields(reason: unknown): Record<string, string> | undefined {
  if (reason && typeof reason === "object" && "fields" in reason) {
    return (reason as { fields?: Record<string, string> }).fields;
  }
  return undefined;
}

/**
 * Promotion (`POST /admin/speakers`) and profile editing (`PATCH`) share this
 * form: the field set is identical, only `user_id` and the verb differ. The
 * promote mode starts from the picked account, edit mode from the existing
 * speaker.
 *
 * `user_id: not_eligible` is the interesting rejection — an administrator or a
 * square account can never be promoted, and the account picker only offers
 * `promotableUsers()` (never admins, squares or existing speakers).
 */
export function AdminSpeakerForm({
  mode,
  speaker,
  users = [],
}: {
  mode: "create" | "edit";
  speaker?: Speaker;
  /** Only used in create mode: the eligible accounts from the backend. */
  users?: LinkableUser[];
}) {
  const router = useRouter();

  const [userId, setUserId] = useState<number | null>(speaker?.userId ?? null);
  const [name, setName] = useState(speaker?.name ?? "");
  const [bio, setBio] = useState(speaker?.bio ?? "");
  const [role, setRole] = useState(speaker?.role ?? "");
  const [handle, setHandle] = useState(speaker?.handle ?? "");
  const [expertise, setExpertise] = useState(speaker?.expertise ?? "");
  const [initials, setInitials] = useState(speaker?.initials ?? "");
  const [verified, setVerified] = useState(speaker?.verified ?? false);
  const [avatarMediaId, setAvatarMediaId] = useState<number | null>(null);
  const [cityIds, setCityIds] = useState<number[]>(speaker?.cities ?? []);
  const [categories, setCategories] = useState<string[]>(speaker?.categories ?? []);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(speaker?.socialLinks ?? []);

  // Cities are grouped by province so the picker can label them; the province
  // list itself is reference data the API returns in one call.
  const [citiesByProvince, setCitiesByProvince] = useState<GeoOption[][]>([]);
  const [cities, setCities] = useState<GeoOption[]>([]);
  const [referenceLoaded, setReferenceLoaded] = useState(false);

  const [errors, setErrors] = useState<SpeakerFormErrors>({ message: null, fields: {} });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDemote, setConfirmDemote] = useState(false);
  const [demoteError, setDemoteError] = useState<string | null>(null);

  const [categoriesList, setCategoriesList] = useState<SpeakerCategory[]>([]);

  // Lazy loads: the edit page always needs the vocabulary; the create page
  // merely prefers it, so the lists arrive on first interaction.
  const ensureReferenceData = () => {
    if (referenceLoaded) return;
    setReferenceLoaded(true);
    void import("../services/speakers.service")
      .then((module) => module.getSpeakerCategories())
      .then((items) => setCategoriesList(items ?? []))
      .catch(() => setCategoriesList([]));
    void getProvinces()
      .then((items) =>
        Promise.all((items ?? []).map((province) => getCities(province.id).catch(() => []))),
      )
      .then((groups) => {
        setCitiesByProvince(groups);
        setCities(groups.flat());
      })
      .catch(() => {
        setCitiesByProvince([]);
        setCities([]);
      });
  };

  const input: SpeakerProfileInput = {
    name,
    bio,
    role,
    handle,
    expertise,
    initials,
    avatarMediaId,
    verified,
    cities: cityIds,
    categories,
    socialLinks,
  };

  const submit = async () => {
    setErrors({ message: null, fields: {} });

    const local: Record<string, string> = {};
    if (!name.trim()) local.name = "required";
    if (mode === "create" && !userId) local.user_id = "invalid";
    if (Object.keys(local).length > 0) {
      setErrors({ message: "چند فیلد نیاز به اصلاح دارد.", fields: local });
      return;
    }

    setBusy(true);
    try {
      if (mode === "create" && userId) {
        const created = await promoteSpeaker({ userId, ...input });
        router.push(`/admin/speakers/${created.userId}` as Route);
        router.refresh();
      } else {
        await updateSpeaker(String(speaker?.userId), input);
        setSaved(true);
        router.refresh();
      }
    } catch (reason) {
      setErrors({
        message: adminErrorMessage(reason, "ذخیره پروفایل سخنران ممکن نشد."),
        fields: reasonMessages(readApiFields(reason)),
      });
    } finally {
      setBusy(false);
    }
  };

  const demote = async () => {
    setDemoteError(null);
    setBusy(true);
    try {
      await demoteSpeaker(String(speaker?.userId));
      router.push("/admin/speakers" as Route);
      router.refresh();
    } catch (reason) {
      setDemoteError(adminErrorMessage(reason, "حذف نقش سخنران ممکن نشد."));
      setBusy(false);
    }
  };

  const addLink = () =>
    setSocialLinks((current) => [...current, { platform: "website", url: "" }]);

  const updateLink = (index: number, patch: Partial<SocialLink>) =>
    setSocialLinks((current) =>
      current.map((link, position) => (position === index ? { ...link, ...patch } : link)),
    );

  return (
    <>
      <form
        className="admin-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="admin-form-notice"><AdminFieldMessage message={saved ? "پروفایل سخنران ذخیره شد." : errors.message} fields={errors.fields} /></div>

        {mode === "create" ? (
          <section aria-label="انتخاب حساب" className="admin-form-card admin-form-side">
            <h2>حساب کاربری</h2>
            <AdminField
              label="حساب کاربری"
              htmlFor="speaker-user"
              required
              error={errors.fields.user_id}
              hint="فقط حساب‌های واجد شرایط فهرست می‌شوند؛ حساب مدیرکل و حساب میدان قابل ارتقا نیستند."
            >
              <select
                id="speaker-user"
                value={userId ?? ""}
                onChange={(event) => {
                  const next = event.target.value ? Number(event.target.value) : null;
                  setUserId(next);
                  const picked = users.find((user) => user.id === next);
                  if (picked && !name) setName(picked.name);
                }}
                className={fieldClass}
              >
                <option value="">
                  {users.length ? "انتخاب کاربر" : "کاربر واجد شرایطی پیدا نشد"}
                </option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} (#{user.id})
                  </option>
                ))}
              </select>
            </AdminField>
          </section>
        ) : null}

        <section aria-label="پروفایل" className={`admin-form-card ${mode === "create" ? "admin-form-main" : "admin-form-wide"} space-y-4`}>
          <h2>هویت و معرفی سخنران</h2>

          <AdminField label="نام" htmlFor="speaker-name" required error={errors.fields.name}>
            <input
              id="speaker-name"
              value={name}
              onFocus={ensureReferenceData}
              onChange={(event) => setName(event.target.value)}
              className={fieldClass}
            />
          </AdminField>

          <AdminField label="معرفی" htmlFor="speaker-bio" error={errors.fields.bio}>
            <textarea
              id="speaker-bio"
              value={bio}
              rows={4}
              onChange={(event) => setBio(event.target.value)}
              className={`${fieldClass} resize-none`}
            />
          </AdminField>

          <div className="admin-field-grid">
            <AdminField label="سمت" htmlFor="speaker-role">
              <input
                id="speaker-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className={fieldClass}
              />
            </AdminField>
            <AdminField label="شناسه کاربری (handle)" htmlFor="speaker-handle">
              <input
                id="speaker-handle"
                value={handle}
                dir="ltr"
                onChange={(event) => setHandle(event.target.value)}
                className={`${fieldClass} text-left`}
              />
            </AdminField>
            <AdminField label="تخصص" htmlFor="speaker-expertise">
              <input
                id="speaker-expertise"
                value={expertise}
                onChange={(event) => setExpertise(event.target.value)}
                className={fieldClass}
              />
            </AdminField>
            <AdminField label="سرواژه (initials)" htmlFor="speaker-initials">
              <input
                id="speaker-initials"
                value={initials}
                onChange={(event) => setInitials(event.target.value)}
                className={fieldClass}
              />
            </AdminField>
          </div>

        </section>

        <section aria-label="دسته‌بندی موضوعی" className="admin-form-card admin-form-half">
          <h2>دسته‌بندی موضوعی</h2>
          <p className="mt-1 text-[10px] text-muted-foreground">
            فقط اسلاگ‌های شناخته‌شده ذخیره می‌شوند؛ مقدار ناشناخته در سرور حذف می‌شود.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {categoriesList.map((category) => {
              const active = categories.includes(category.slug);
              return (
                <button
                  key={category.slug}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setCategories((current) =>
                      active
                        ? current.filter((slug) => slug !== category.slug)
                        : [...current, category.slug],
                    )
                  }
                  className={`inline-flex min-h-8 items-center rounded-pill border px-3 text-[11px] font-black transition-colors ${
                    active
                      ? "border-brand-border bg-selected text-selected-foreground"
                      : "border-border bg-surface text-muted-foreground hover:bg-hover"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
            {categoriesList.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                برای بارگذاری دسته‌ها، روی فیلد نام کلیک کنید.
              </p>
            ) : null}
          </div>
        </section>

        <section aria-label="شهرها" className="admin-form-card admin-form-half">
          <h2>شهرهای فعالیت</h2>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {fa(cityIds.length)} شهر انتخاب شده است
            {citiesByProvince.length ? ` از ${fa(citiesByProvince.length)} استان` : ""}.
          </p>
          <div className="mt-2 max-h-48 overflow-y-auto rounded-control border border-border p-2 no-scrollbar">
            {cities.length === 0 ? (
              <p className="py-3 text-center text-[11px] text-muted-foreground">
                برای بارگذاری شهرها، روی فیلد نام کلیک کنید.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {cities.map((city) => {
                  const active = cityIds.includes(city.id);
                  return (
                    <button
                      key={city.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setCityIds((current) =>
                          active ? current.filter((id) => id !== city.id) : [...current, city.id],
                        )
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
        </section>

        <AdminDisclosureSection title="شبکه‌های اجتماعی" className="admin-form-half">
          {socialLinks.map((link, index) => (
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
                  setSocialLinks((current) => current.filter((_, position) => position !== index))
                }
                aria-label={`حذف لینک ${index + 1}`}
                className="mt-1.5 grid h-9 w-9 place-items-center rounded-control border border-border text-danger-foreground transition-colors hover:bg-danger-surface"
              >
                <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addLink} className={`${secondaryButtonClass} min-h-9`}>
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            افزودن لینک
          </button>
        </AdminDisclosureSection>

        <AdminDisclosureSection title="تصویر و نشان تأیید" className="admin-form-half" hasError={Boolean(errors.fields.avatar_media_id)}>
          <div className="space-y-4">
            <MediaPickerField id="speaker-avatar" label="تصویر سخنران" hint="اگر فایلی انتخاب نکنید، تصویر فعلی تغییر نمی‌کند." mediaId={avatarMediaId} currentUrl={speaker?.avatarUrl} onChange={setAvatarMediaId} />
            <AdminCheckbox id="speaker-verified" label="دارای نشان تأیید" description="نشان تأیید در نمایه عمومی سخنران نمایش داده می‌شود." checked={verified} onChange={setVerified} />
          </div>
        </AdminDisclosureSection>

        <div className="admin-form-actions">
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {busy ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="h-4 w-4" />
            )}
            {busy ? "در حال ذخیره…" : mode === "create" ? "ارتقا به سخنران" : "ذخیره تغییرات"}
          </button>
          <Link href={"/admin/speakers" as Route} className={secondaryButtonClass}>
            بازگشت به فهرست
          </Link>
          {mode === "edit" ? (
            <button
              type="button"
              onClick={() => {
                setDemoteError(null);
                setConfirmDemote(true);
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-control bg-danger px-4 text-xs font-black text-danger-foreground transition-colors hover:opacity-90"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              حذف نقش سخنران
            </button>
          ) : null}
        </div>
      </form>

      {confirmDemote ? (
        <AdminDialog
          title="حذف نقش سخنران"
          description="نقش سخنران از حساب گرفته می‌شود. حساب کاربری و پروفایل باقی می‌ماند و می‌توان بعداً دوباره ارتقا داد."
          confirmLabel="حذف نقش"
          tone="danger"
          busy={busy}
          error={demoteError}
          onConfirm={() => void demote()}
          onClose={() => setConfirmDemote(false)}
        />
      ) : null}
    </>
  );
}
