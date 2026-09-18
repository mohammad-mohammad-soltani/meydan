"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { LoaderCircle, Save } from "lucide-react";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminField, fieldClass } from "./AdminField";
import { MediaPickerField } from "./MediaPickerField";
import { AdminSuccessToast } from "./AdminSuccessToast";
import { primaryButtonClass, secondaryButtonClass } from "./styles";
import { adminErrorMessage } from "../services/admin-api";
import { createUser, updateUser, type AdminUser, type AdminUserRole, type UserInput } from "../services/users.service";
import { getCities, getProvinces } from "../services/programs.service";
import { fieldErrorMessage } from "@/lib/meydan-api";
import type { GeoOption } from "../types";

type SquareFields = { name: string; address: string; province_id: number; city_id: number; latitude: string; longitude: string };
const emptySquare: SquareFields = { name: "", address: "", province_id: 0, city_id: 0, latitude: "", longitude: "" };

export function AdminUserForm({ user, roles, created = false }: { user?: AdminUser; roles: AdminUserRole[]; created?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<UserInput>({
    full_name: user?.full_name ?? "", phone: user?.phone ?? "", email: user?.email ?? "",
    role: user?.role ?? "meydan_user", headline: user?.headline ?? "", about: user?.about ?? "",
    location_label: user?.location_label ?? "", province_id: user?.province_id ?? null,
    city_id: user?.city_id ?? null, avatar_media_id: user?.avatar_media_id ?? null,
    cover_media_id: user?.cover_media_id ?? null,
  });
  const [square, setSquare] = useState<SquareFields>(emptySquare);
  const [provinces, setProvinces] = useState<GeoOption[]>([]);
  const [cities, setCities] = useState<GeoOption[]>([]);
  const [squareCities, setSquareCities] = useState<GeoOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<number | null>(created ? 1 : null);
  const needsSquare = form.role === "meydan_square" && !user?.square_id;

  useEffect(() => { void getProvinces().then(setProvinces).catch(() => setProvinces([])); }, []);
  useEffect(() => { if (!form.province_id) return; let active = true; void getCities(form.province_id).then((rows) => { if (active) setCities(rows); }).catch(() => { if (active) setCities([]); }); return () => { active = false; }; }, [form.province_id]);
  useEffect(() => { if (!square.province_id) return; let active = true; void getCities(square.province_id).then((rows) => { if (active) setSquareCities(rows); }).catch(() => { if (active) setSquareCities([]); }); return () => { active = false; }; }, [square.province_id]);

  const set = <K extends keyof UserInput>(key: K, value: UserInput[K]) => setForm((current) => ({ ...current, [key]: value }));
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || uploadBusy) return;
    setBusy(true); setError(null); setFieldErrors({});
    try {
      const input: UserInput = { ...form };
      if (needsSquare) input.square = { name: square.name, address: square.address, province_id: square.province_id, city_id: square.city_id, latitude: Number(square.latitude), longitude: Number(square.longitude) };
      const saved = user ? await updateUser(user.id, input) : await createUser(input);
      if (user) { setToast(Date.now()); router.refresh(); }
      else router.push(`/admin/users/${saved.id}?created=1` as Route);
    } catch (reason) {
      setError(adminErrorMessage(reason));
      const fields = (reason as { fields?: Record<string, string> })?.fields;
      if (fields) setFieldErrors(Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fieldErrorMessage(value)])));
    } finally { setBusy(false); }
  };

  const textField = (key: "full_name" | "phone" | "email" | "headline" | "location_label", label: string, required = false) => <AdminField label={label} htmlFor={`user-${key}`} required={required} error={fieldErrors[key]}><input id={`user-${key}`} className={fieldClass} dir={key === "phone" || key === "email" ? "ltr" : undefined} type={key === "email" ? "email" : "text"} required={required} value={form[key] ?? ""} onChange={(event) => set(key, event.target.value)} /></AdminField>;
  const geoSelect = (kind: "user" | "square", field: "province_id" | "city_id", label: string, choices: GeoOption[], value: number | null, onChange: (id: number) => void) => <AdminField label={label} htmlFor={`${kind}-${field}`} error={fieldErrors[kind === "square" ? `square.${field}` : field]}><select id={`${kind}-${field}`} className={fieldClass} value={value ?? 0} onChange={(event) => onChange(Number(event.target.value))}><option value={0}>انتخاب کنید</option>{choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.name}</option>)}</select></AdminField>;

  return <div className="min-h-full bg-background">
    <AdminPageHeader title={user ? user.full_name : "افزودن کاربر"} description="اطلاعات حساب و نقش را ثبت کنید. ورود کاربران جدید با کد پیامکی انجام می‌شود." crumbs={[{ label: "کاربران", href: "/admin/users" }, { label: user ? "ویرایش کاربر" : "افزودن کاربر" }]} />
    <form onSubmit={(event) => void save(event)} className="mx-auto max-w-5xl space-y-5 px-4 py-6 lg:px-10">
      {error && <p role="alert" className="rounded-xl border border-danger-border bg-danger-surface p-4 text-sm text-danger-foreground">{error}</p>}
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-5 text-base font-black">اطلاعات حساب</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {textField("full_name", "نام کامل", true)}
          {textField("phone", "شماره موبایل ورود", true)}
          {textField("email", "ایمیل")}
          <AdminField label="نقش" htmlFor="user-role" error={fieldErrors.role} required><select id="user-role" className={fieldClass} value={form.role} onChange={(event) => set("role", event.target.value)}>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></AdminField>
          {textField("headline", "عنوان پروفایل")}
          {textField("location_label", "مکان")}
          {geoSelect("user", "province_id", "استان", provinces, form.province_id ?? null, (id) => { setCities([]); setForm((f) => ({ ...f, province_id: id || null, city_id: null })); })}
          {geoSelect("user", "city_id", "شهر", cities, form.city_id ?? null, (id) => set("city_id", id || null))}
        </div>
        <AdminField label="معرفی" htmlFor="user-about" error={fieldErrors.about} className="mt-4"><textarea id="user-about" rows={4} className={fieldClass} value={form.about ?? ""} onChange={(event) => set("about", event.target.value)} /></AdminField>
      </section>
      <section className="grid gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card md:grid-cols-2">
        <MediaPickerField id="user-avatar" label="تصویر پروفایل" mediaId={form.avatar_media_id ?? null} currentUrl={user?.avatar_url} onChange={(id) => set("avatar_media_id", id)} onBusyChange={setUploadBusy} error={fieldErrors.avatar_media_id} />
        <MediaPickerField id="user-cover" label="تصویر کاور" purpose="cover" mediaId={form.cover_media_id ?? null} currentUrl={user?.cover_url} onChange={(id) => set("cover_media_id", id)} onBusyChange={setUploadBusy} error={fieldErrors.cover_media_id} />
      </section>
      {needsSquare && <section className="rounded-2xl border border-border bg-surface p-5 shadow-card"><h2 className="mb-2 text-base font-black">اطلاعات میدان جدید</h2><p className="mb-5 text-xs text-muted-foreground">میدان با وضعیت «در انتظار تأیید» ساخته می‌شود.</p><div className="grid gap-4 md:grid-cols-2">
        <AdminField label="نام میدان" htmlFor="square-name" required error={fieldErrors["square.name"]}><input id="square-name" required className={fieldClass} value={square.name} onChange={(event) => setSquare((s) => ({ ...s, name: event.target.value }))} /></AdminField>
        <AdminField label="نشانی" htmlFor="square-address" required error={fieldErrors["square.address"]}><input id="square-address" required className={fieldClass} value={square.address} onChange={(event) => setSquare((s) => ({ ...s, address: event.target.value }))} /></AdminField>
        {geoSelect("square", "province_id", "استان میدان", provinces, square.province_id, (id) => { setSquareCities([]); setSquare((s) => ({ ...s, province_id: id, city_id: 0 })); })}
        {geoSelect("square", "city_id", "شهر میدان", squareCities, square.city_id, (id) => setSquare((s) => ({ ...s, city_id: id })))}
        {(["latitude", "longitude"] as const).map((key) => <AdminField key={key} label={key === "latitude" ? "عرض جغرافیایی" : "طول جغرافیایی"} htmlFor={`square-${key}`} required error={fieldErrors[`square.${key}`]}><input id={`square-${key}`} type="number" step="any" required className={fieldClass} value={square[key]} onChange={(event) => setSquare((s) => ({ ...s, [key]: event.target.value }))} /></AdminField>)}
      </div></section>}
      <div className="flex flex-wrap justify-end gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card"><Link href={"/admin/users" as Route} className={secondaryButtonClass}>بازگشت به فهرست</Link><button type="submit" disabled={busy || uploadBusy} className={primaryButtonClass}>{busy ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}{busy ? "در حال ذخیره…" : user ? "ذخیره تغییرات" : "ایجاد کاربر"}</button></div>
    </form>
    {toast ? <AdminSuccessToast key={toast} message={created && toast === 1 ? "کاربر با موفقیت ایجاد شد." : "تغییرات کاربر ذخیره شد."} /> : null}
  </div>;
}
