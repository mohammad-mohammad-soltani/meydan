"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Route } from "next";
import { CheckCircle2, Clock, LoaderCircle, XCircle } from "lucide-react";
import { MeydanApiError, fieldErrorMessage } from "@/lib/meydan-api";
import {
  getMySpeakerApplication,
  submitSpeakerApplication,
  type SpeakerApplication,
} from "@/features/speakers/services/speaker-application.service";
import { PageShell, fieldClass } from "./PageShell";

type Fields = "fullName" | "city" | "category" | "topics" | "phone" | "link" | "about";
const API_FIELD: Record<string, Fields> = {
  full_name: "fullName", city: "city", category: "category", topics: "topics", phone: "phone", link: "link", about: "about",
};

/** «ثبت‌نام سخنران»: a signed-in user applies; an administrator approves or rejects. */
export function SpeakerSignupView({ categories }: { categories: Array<{ slug: string; name: string }> }) {
  const [application, setApplication] = useState<SpeakerApplication | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [values, setValues] = useState({ fullName: "", city: "", category: categories[0]?.slug ?? "", topics: "", phone: "", link: "", about: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Fields, string>>>({});
  const [reapply, setReapply] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMySpeakerApplication()
      .then((row) => { if (!cancelled) setApplication(row); })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  const set = (key: Fields, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      setApplication(await submitSpeakerApplication(values));
      setReapply(false);
    } catch (reason) {
      if (reason instanceof MeydanApiError) {
        setError(reason.message);
        const next: Partial<Record<Fields, string>> = {};
        for (const [key, code] of Object.entries(reason.fields ?? {})) {
          const field = API_FIELD[key];
          if (field) next[field] = fieldErrorMessage(code);
        }
        setFieldErrors(next);
        if (reason.fields?.user === "already_pending") void getMySpeakerApplication().then(setApplication).catch(() => undefined);
      } else {
        setError("ارسال درخواست ممکن نشد. دوباره تلاش کنید.");
      }
    } finally {
      setBusy(false);
    }
  };

  const showForm = loaded && (!application || (application.status === "rejected" && reapply));

  return (
    <PageShell title="ثبت‌نام سخنران" subtitle="درخواست حضور در فهرست سخنرانان" back="/speakers">
      {!loaded ? (
        <div className="grid place-items-center py-16 text-muted-foreground"><LoaderCircle aria-hidden="true" className="h-6 w-6 animate-spin" /></div>
      ) : application && !showForm ? (
        <StatusCard application={application} onReapply={() => setReapply(true)} />
      ) : (
        <form className="space-y-4 px-4 pt-4" onSubmit={submit} noValidate>
          <Field label="نام و نام خانوادگی" error={fieldErrors.fullName}><input required className={fieldClass} placeholder="مثلاً علی احمدی" autoComplete="name" value={values.fullName} onChange={(e) => set("fullName", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="شهر" error={fieldErrors.city}><input required className={fieldClass} placeholder="تهران" value={values.city} onChange={(e) => set("city", e.target.value)} /></Field>
            <Field label="حوزهٔ سخنرانی" error={fieldErrors.category}>
              <select required className={fieldClass} value={values.category} onChange={(e) => set("category", e.target.value)}>
                {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="موضوعات سخنرانی" error={fieldErrors.topics}><input required className={fieldClass} placeholder="مثلاً روایت‌گری، جهاد تبیین، خدمت‌رسانی" value={values.topics} onChange={(e) => set("topics", e.target.value)} /></Field>
          <Field label="شمارهٔ تماس" error={fieldErrors.phone}><input required dir="ltr" inputMode="tel" autoComplete="tel" className={`${fieldClass} text-left`} placeholder="09123456789" value={values.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="لینک نمونه سخنرانی یا رزومه" optional error={fieldErrors.link}><input dir="ltr" inputMode="url" className={`${fieldClass} text-left`} placeholder="https://" value={values.link} onChange={(e) => set("link", e.target.value)} /></Field>
          <Field label="دربارهٔ شما" optional error={fieldErrors.about}><textarea rows={4} maxLength={2000} className={`${fieldClass} py-3`} placeholder="سوابق، تجربه و توضیح کوتاه" value={values.about} onChange={(e) => set("about", e.target.value)} /></Field>
          {error ? <p role="alert" className="px-1 text-xs font-bold text-danger">{error}</p> : null}
          <button type="submit" disabled={busy || categories.length === 0} className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-pill bg-brand text-base font-black text-brand-foreground transition-opacity disabled:opacity-50">
            {busy ? <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" /> : null}
            ارسال درخواست
          </button>
          <p className="px-1 text-center text-[11px] leading-6 text-muted-foreground">اطلاعات شما فقط برای بررسی درخواست استفاده می‌شود.</p>
        </form>
      )}
    </PageShell>
  );
}

function Field({ label, optional, error, children }: { label: string; optional?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block px-1 text-xs text-muted-foreground">{label}{optional ? <> <em className="not-italic text-placeholder">(اختیاری)</em></> : null}</span>
      {children}
      {error ? <span role="alert" className="mt-1 block px-1 text-[11px] font-bold text-danger">{error}</span> : null}
    </label>
  );
}

function StatusCard({ application, onReapply }: { application: SpeakerApplication; onReapply: () => void }) {
  const config = {
    pending: { Icon: Clock, title: "درخواست شما در حال بررسی است", text: "پس از بررسی توسط مدیریت، نتیجه از طریق اعلان‌ها به شما اطلاع داده می‌شود." },
    approved: { Icon: CheckCircle2, title: "درخواست شما تأیید شد", text: "حساب شما اکنون در فهرست سخنرانان قرار دارد." },
    rejected: { Icon: XCircle, title: "درخواست شما تأیید نشد", text: application.adminNote || "می‌توانید اطلاعات را اصلاح کرده و دوباره درخواست دهید." },
  }[application.status];
  return (
    <div className="mx-4 mt-6 flex flex-col items-center gap-3 rounded-3xl border border-border bg-surface-muted px-5 py-8 text-center">
      <config.Icon aria-hidden="true" className="h-10 w-10 text-brand" />
      <h2 className="text-base font-black">{config.title}</h2>
      <p className="text-xs leading-6 text-muted-foreground">{config.text}</p>
      {application.status === "rejected" ? (
        <button type="button" onClick={onReapply} className="mt-2 min-h-[46px] rounded-pill bg-brand px-6 text-sm font-black text-brand-foreground">ارسال درخواست جدید</button>
      ) : (
        <Link href={"/speakers" as Route} className="mt-2 text-xs font-bold text-brand">بازگشت به فهرست سخنرانان</Link>
      )}
    </div>
  );
}
