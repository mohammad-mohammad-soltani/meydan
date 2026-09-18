"use client";

import { AdminEditor } from "./AdminEditor";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { AdminCheckbox, AdminField, fieldClass } from "./AdminField";
import { AdminDialog } from "./AdminDialog";
import { MediaPickerField } from "./MediaPickerField";
import { AdminDisclosureSection } from "./AdminDisclosureSection";
import { AdminFieldMessage } from "./AdminFieldMessage";
import { AdminSuccessToast } from "./AdminSuccessToast";
import { ChannelFields } from "./ChannelFields";
import { dangerButtonClass, fa, primaryButtonClass, secondaryButtonClass } from "./styles";
import {
  adminErrorMessage,
  createSpeakerAccount,
  demoteSpeaker,
  getSpeakerCategories,
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
import { foldDigits } from "../lib/normalize";

export type SpeakerFormErrors = { message: string | null; fields: Record<string, string> };

type CityGroup = { province: GeoOption; cities: GeoOption[] };
type ReferenceStatus = "loading" | "ready" | "error";

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
 * Promotion only attaches the speaker role to an existing account. For direct
 * creation, identity belongs to the newly created account while this form still
 * owns the speaker-only metadata.
 */
export function AdminSpeakerForm({
  mode,
  speaker,
  users = [],
}: {
  mode: "create" | "edit" | "new-account";
  speaker?: Speaker;
  /** Only used in create mode: eligible accounts from the backend. */
  users?: LinkableUser[];
}) {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(speaker?.userId ?? null);
  const [userQuery, setUserQuery] = useState("");
  const [accountFullName, setAccountFullName] = useState("");
  const [accountPhone, setAccountPhone] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountAbout, setAccountAbout] = useState("");
  const [accountProvinceId, setAccountProvinceId] = useState<number | null>(null);
  const [accountCityId, setAccountCityId] = useState<number | null>(null);
  const [verified, setVerified] = useState(speaker?.verified ?? false);
  const [avatarMediaId, setAvatarMediaId] = useState<number | null>(null);
  const [cityIds, setCityIds] = useState<number[]>(speaker?.cities ?? []);
  const [cityQuery, setCityQuery] = useState("");
  const [categories, setCategories] = useState<string[]>(speaker?.categories ?? []);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(speaker?.socialLinks ?? []);
  const [channels, setChannels] = useState({
    eitaa: speaker?.eitaaChannel ?? "",
    bale: speaker?.baleChannel ?? "",
  });
  const [citiesByProvince, setCitiesByProvince] = useState<CityGroup[]>([]);
  const [citiesStatus, setCitiesStatus] = useState<ReferenceStatus>("loading");
  const [categoriesList, setCategoriesList] = useState<SpeakerCategory[]>([]);
  const [categoriesStatus, setCategoriesStatus] = useState<ReferenceStatus>("loading");
  const [errors, setErrors] = useState<SpeakerFormErrors>({ message: null, fields: {} });
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);
  const [confirmDemote, setConfirmDemote] = useState(false);
  const [demoteError, setDemoteError] = useState<string | null>(null);

  // These are reference choices, not values entered by the administrator. Load
  // them with the form so empty cards never depend on an unrelated field focus.
  useEffect(() => {
    let cancelled = false;

    void getSpeakerCategories()
      .then((items) => {
        if (!cancelled) {
          setCategoriesList(items ?? []);
          setCategoriesStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setCategoriesStatus("error");
      });

    void getProvinces()
      .then((provinces) =>
        Promise.all(
          (provinces ?? []).map(async (province) => ({
            province,
            cities: await getCities(province.id).catch(() => []),
          })),
        ),
      )
      .then((groups) => {
        if (!cancelled) {
          setCitiesByProvince(groups);
          setCitiesStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setCitiesStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedUser = users.find((user) => user.id === userId) ?? null;
  const candidateUsers = useMemo(() => {
    const query = foldDigits(userQuery).trim().toLowerCase();
    if (!query) return [];
    return users
      .filter((user) => user.name.toLowerCase().includes(query) || foldDigits(user.id).includes(query))
      .slice(0, 8);
  }, [userQuery, users]);
  const visibleCityGroups = useMemo(() => {
    const query = cityQuery.trim().toLowerCase();
    if (!query) return citiesByProvince;
    return citiesByProvince
      .map((group) => ({
        ...group,
        cities: group.cities.filter((city) => city.name.toLowerCase().includes(query)),
      }))
      .filter((group) => group.cities.length > 0);
  }, [citiesByProvince, cityQuery]);
  const accountCities = useMemo(
    () => citiesByProvince.find((group) => group.province.id === accountProvinceId)?.cities ?? [],
    [accountProvinceId, citiesByProvince],
  );

  const input: SpeakerProfileInput = {
    avatarMediaId,
    verified,
    cities: cityIds,
    categories,
    socialLinks,
    eitaaChannel: channels.eitaa,
    baleChannel: channels.bale,
  };

  const submit = async () => {
    if (busy || uploadBusy) return;
    setSaved(null);
    setErrors({ message: null, fields: {} });
    if (mode === "create" && !userId) {
      setErrors({ message: "حساب کاربری سخنران را انتخاب کنید.", fields: { user_id: "invalid" } });
      return;
    }
    if (mode === "new-account") {
      const fields: Record<string, string> = {};
      if (!accountFullName.trim()) fields.full_name = "required";
      if (!accountPhone.trim()) fields.phone = "required";
      if (accountCityId && !accountProvinceId) fields.city_id = "invalid";
      if (Object.keys(fields).length) {
        setErrors({ message: "اطلاعات حساب را کامل کنید.", fields });
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === "create" && userId) {
        const created = await promoteSpeaker({ userId, ...input });
        router.push(`/admin/speakers/${created.userId}` as Route);
        router.refresh();
      } else if (mode === "new-account") {
        const created = await createSpeakerAccount({
          ...input,
          fullName: accountFullName,
          phone: accountPhone,
          email: accountEmail,
          provinceId: accountProvinceId,
          cityId: accountCityId,
          about: accountAbout,
        });
        router.push(`/admin/speakers/${created.userId}` as Route);
        router.refresh();
      } else {
        await updateSpeaker(String(speaker?.userId), input);
        setSaved(Date.now());
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
      <AdminEditor
        className="admin-speaker-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="admin-form-notice">
          <AdminFieldMessage
            message={errors.message}
            fields={errors.fields}
          />
        </div>

        {mode === "create" ? (
          <section aria-label="انتخاب حساب" className="admin-form-card admin-form-wide admin-speaker-account">
            <h2>حساب کاربری</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">
              نام، معرفی، شناسه و تصویر پایه از همین حساب خوانده می‌شود و در فرم سخنران تغییر نمی‌کند.
            </p>
            <AdminField
              label="جست‌وجوی کاربر"
              htmlFor="speaker-user-search"
              required
              error={errors.fields.user_id}
              hint="نام یا شناسهٔ کاربر را وارد کنید. فقط حساب‌های واجد شرایط نمایش داده می‌شوند."
            >
              <input
                id="speaker-user-search"
                type="search"
                value={userQuery}
                onChange={(event) => {
                  setUserQuery(event.target.value);
                  if (userId !== null) setUserId(null);
                }}
                placeholder="مثلاً محمد یا ۱۲۳"
                autoComplete="off"
                className={fieldClass}
              />
            </AdminField>
            {userQuery.trim() && !selectedUser ? (
              <div
                aria-label="نتایج جست‌وجوی کاربران"
                className="mt-2 overflow-hidden rounded-control border border-border bg-surface"
              >
                {candidateUsers.length ? (
                  <ul className="divide-y divide-border">
                    {candidateUsers.map((user) => (
                      <li key={user.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setUserId(user.id);
                            setUserQuery(user.name);
                            setErrors((current) => ({
                              ...current,
                              fields: { ...current.fields, user_id: "" },
                            }));
                          }}
                          className="flex min-h-11 w-full items-center justify-between gap-4 px-3 text-right text-xs font-bold transition-colors hover:bg-hover focus-visible:bg-hover"
                        >
                          <span>{user.name}</span>
                          <span className="shrink-0 text-[11px] font-normal text-muted-foreground">
                            شناسه {fa(user.id)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 py-3 text-xs text-muted-foreground">کاربر واجد شرایطی پیدا نشد.</p>
                )}
              </div>
            ) : null}
            {selectedUser ? (
              <p className="mt-3 rounded-control bg-selected px-3 py-2 text-xs font-bold text-selected-foreground" role="status">
                {selectedUser.name} با شناسهٔ {fa(selectedUser.id)} برای ارتقا انتخاب شد.
              </p>
            ) : null}
          </section>
        ) : mode === "new-account" ? (
          <section aria-label="اطلاعات حساب" className="admin-form-card admin-form-wide admin-speaker-account">
            <h2>اطلاعات حساب</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">
              این اطلاعات به حساب کاربر تعلق دارد؛ پس از ساخت، نقش سخنران نیز برای همان حساب ثبت می‌شود.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-12">
              <div className="xl:col-span-6">
                <AdminField label="نام کامل" htmlFor="speaker-account-full-name" required error={errors.fields.full_name}>
                  <input
                    id="speaker-account-full-name"
                    value={accountFullName}
                    onChange={(event) => setAccountFullName(event.target.value)}
                    autoComplete="name"
                    className={fieldClass}
                  />
                </AdminField>
              </div>
              <div className="xl:col-span-6">
                <AdminField label="شماره موبایل" htmlFor="speaker-account-phone" required error={errors.fields.phone} hint="شماره باید یکتا باشد؛ ورود بعدی کاربر با پیامک است.">
                  <input
                    id="speaker-account-phone"
                    type="tel"
                    dir="ltr"
                    inputMode="tel"
                    value={accountPhone}
                    onChange={(event) => setAccountPhone(event.target.value)}
                    autoComplete="tel"
                    placeholder="0912…"
                    className={`${fieldClass} text-left`}
                  />
                </AdminField>
              </div>
              <div className="xl:col-span-6">
                <AdminField label="ایمیل" htmlFor="speaker-account-email" error={errors.fields.email} hint="اختیاری؛ در صورت ورود باید یکتا باشد.">
                  <input
                    id="speaker-account-email"
                    type="email"
                    dir="ltr"
                    value={accountEmail}
                    onChange={(event) => setAccountEmail(event.target.value)}
                    autoComplete="email"
                    className={`${fieldClass} text-left`}
                  />
                </AdminField>
              </div>
              <div className="xl:col-span-3">
                <AdminField label="استان" htmlFor="speaker-account-province" error={errors.fields.province_id}>
                  <select
                    id="speaker-account-province"
                    value={accountProvinceId ?? ""}
                    onChange={(event) => {
                      setAccountProvinceId(event.target.value ? Number(event.target.value) : null);
                      setAccountCityId(null);
                    }}
                    className={fieldClass}
                  >
                    <option value="">انتخاب نشده</option>
                    {citiesByProvince.map((group) => (
                      <option key={group.province.id} value={group.province.id}>{group.province.name}</option>
                    ))}
                  </select>
                </AdminField>
              </div>
              <div className="xl:col-span-3">
                <AdminField label="شهر" htmlFor="speaker-account-city" error={errors.fields.city_id} hint={!accountProvinceId ? "ابتدا استان را انتخاب کنید." : undefined}>
                  <select
                    id="speaker-account-city"
                    disabled={!accountProvinceId}
                    value={accountCityId ?? ""}
                    onChange={(event) => setAccountCityId(event.target.value ? Number(event.target.value) : null)}
                    className={fieldClass}
                  >
                    <option value="">انتخاب نشده</option>
                    {accountCities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
                  </select>
                </AdminField>
              </div>
              <div className="xl:col-span-8">
                <AdminField label="معرفی" htmlFor="speaker-account-about" error={errors.fields.about}>
                  <textarea
                    id="speaker-account-about"
                    rows={4}
                    value={accountAbout}
                    onChange={(event) => setAccountAbout(event.target.value)}
                    className={fieldClass}
                  />
                </AdminField>
              </div>
              <div className="xl:col-span-4">
                <MediaPickerField
                  id="speaker-account-avatar"
                  label="تصویر حساب"
                  hint="اختیاری؛ همین تصویر برای نمایه سخنران هم استفاده می‌شود."
                  mediaId={avatarMediaId}
                  onChange={setAvatarMediaId}
                  error={errors.fields.avatar_media_id}
                />
              </div>
            </div>
          </section>
        ) : (
          <section aria-label="حساب سخنران" className="admin-form-card admin-form-wide admin-speaker-account">
            <h2>حساب سخنران</h2>
            <p className="mt-1 text-sm font-black">{speaker?.name || "سخنران"}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              نام، معرفی و شناسه از نمایهٔ خود کاربر خوانده می‌شود؛ اینجا فقط تنظیمات اختصاصی سخنران را تغییر می‌دهید.
            </p>
          </section>
        )}

        <section aria-label="دسته‌بندی موضوعی" className="admin-form-card admin-speaker-category" aria-busy={categoriesStatus === "loading"}>
          <h2>دسته‌بندی موضوعی</h2>
          <p className="mt-1 text-[10px] text-muted-foreground">
            موضوع‌هایی را انتخاب کنید که سخنران در آن‌ها تخصص دارد.
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
            {categoriesStatus === "loading" ? (
              <p className="text-[11px] text-muted-foreground">دسته‌ها در حال دریافت‌اند…</p>
            ) : null}
            {categoriesStatus === "error" ? (
              <p className="text-[11px] text-danger-foreground">دریافت دسته‌ها ممکن نشد؛ صفحه را دوباره بارگذاری کنید.</p>
            ) : null}
            {categoriesStatus === "ready" && categoriesList.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">دسته‌ای در سامانه تعریف نشده است.</p>
            ) : null}
          </div>
        </section>

        <section aria-label="شهرها" className="admin-form-card admin-speaker-city" aria-busy={citiesStatus === "loading"}>
          <h2>شهرهای فعالیت</h2>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {fa(cityIds.length)} شهر انتخاب شده است
            {citiesByProvince.length ? ` از ${fa(citiesByProvince.length)} استان` : ""}.
          </p>
          <label className="mt-3 block text-[11px] font-bold text-foreground" htmlFor="speaker-city-search">
            جست‌وجوی شهر
          </label>
          <input
            id="speaker-city-search"
            type="search"
            value={cityQuery}
            onChange={(event) => setCityQuery(event.target.value)}
            placeholder="نام شهر"
            className={`${fieldClass} mt-1`}
          />
          <div className="mt-2 max-h-64 space-y-3 overflow-y-auto rounded-control border border-border p-2 no-scrollbar">
            {citiesStatus === "loading" ? (
              <p className="py-3 text-center text-[11px] text-muted-foreground">شهرها در حال دریافت‌اند…</p>
            ) : null}
            {citiesStatus === "error" ? (
              <p className="py-3 text-center text-[11px] text-danger-foreground">دریافت شهرها ممکن نشد؛ صفحه را دوباره بارگذاری کنید.</p>
            ) : null}
            {citiesStatus === "ready" && visibleCityGroups.length === 0 ? (
              <p className="py-3 text-center text-[11px] text-muted-foreground">شهری با این نام پیدا نشد.</p>
            ) : null}
            {visibleCityGroups.map((group) => (
              <section key={group.province.id} aria-label={`شهرهای ${group.province.name}`}>
                <h3 className="mb-1 text-[11px] font-black text-foreground">{group.province.name}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {group.cities.map((city) => {
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
              </section>
            ))}
          </div>
        </section>

        <AdminDisclosureSection title="شبکه‌های اجتماعی" className="admin-speaker-social">
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

        <AdminDisclosureSection
          title="کانال‌های بله و ایتا"
          className="admin-speaker-channels"
          defaultOpen={Boolean(channels.eitaa || channels.bale)}
          hasError={Boolean(errors.fields.eitaa_channel || errors.fields.bale_channel)}
        >
          <ChannelFields
            idPrefix="speaker-channels"
            eitaa={channels.eitaa}
            bale={channels.bale}
            onChange={setChannels}
            errors={{
              eitaa_channel: errors.fields.eitaa_channel,
              bale_channel: errors.fields.bale_channel,
            }}
          />
        </AdminDisclosureSection>

        <AdminDisclosureSection
          title="تصویر و نشان تأیید"
          className="admin-speaker-verification"
          defaultOpen={mode !== "edit" || Boolean(speaker?.avatarUrl)}
          hasError={Boolean(errors.fields.avatar_media_id)}
        >
          <div className="space-y-4">
            <MediaPickerField id="speaker-avatar" label="تصویر سخنران" hint="اگر فایلی انتخاب نکنید، تصویر فعلی تغییر نمی‌کند." mediaId={avatarMediaId} currentUrl={speaker?.avatarUrl} onChange={setAvatarMediaId} onBusyChange={setUploadBusy} error={errors.fields.avatar_media_id} />
            <AdminCheckbox id="speaker-verified" label="دارای نشان تأیید" description="نشان تأیید در نمایه عمومی سخنران نمایش داده می‌شود." checked={verified} onChange={setVerified} />
          </div>
        </AdminDisclosureSection>

        <div className="admin-form-actions">
          <button type="submit" disabled={busy || uploadBusy} className={primaryButtonClass}>
            {busy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Save aria-hidden="true" className="h-4 w-4" />}
            {busy ? "در حال ذخیره…" : mode === "create" ? "ارتقا به سخنران" : mode === "new-account" ? "ساخت سخنران" : "ذخیره تغییرات"}
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
              className={dangerButtonClass}
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              حذف نقش سخنران
            </button>
          ) : null}
        </div>
      </AdminEditor>

      {saved ? <AdminSuccessToast key={saved} message="پروفایل سخنران ذخیره شد." /> : null}

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
