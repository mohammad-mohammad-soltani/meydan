"use client";

import { PhoneCall } from "lucide-react";
import { useState } from "react";
import { PageShell, SoonBadge } from "./PageShell";

const PROVINCES = ["آذربایجان شرقی", "آذربایجان غربی", "اردبیل", "اصفهان", "البرز", "ایلام", "بوشهر", "تهران", "چهارمحال و بختیاری", "خراسان جنوبی", "خراسان رضوی", "خراسان شمالی", "خوزستان", "زنجان", "سمنان", "سیستان و بلوچستان", "فارس", "قزوین", "قم", "کردستان", "کرمان", "کرمانشاه", "کهگیلویه و بویراحمد", "گلستان", "گیلان", "لرستان", "مازندران", "مرکزی", "هرمزگان", "همدان", "یزد"];

/**
 * «بیست‌کال»: one random number of someone of your own gender, ideally from your
 * province, to call and tell about the campaign. The screen is final; numbers and
 * the call log come with the backend.
 */
export function BistCallView() {
  const [province, setProvince] = useState("");
  const [gender, setGender] = useState<"m" | "f">("m");
  const [sameProvince, setSameProvince] = useState(true);

  return (
    <PageShell title="بیست‌کال" subtitle="یک شمارهٔ تصادفی، همیشه هم‌جنس خودت" back="/content" soon>
      <div className="space-y-5 px-4 pt-4">

        <fieldset className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-surface-muted p-1">
          <legend className="sr-only">جنسیت</legend>
          {([["m", "آقا"], ["f", "خانم"]] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={gender === value} onClick={() => setGender(value)} className={`rounded-xl py-3 text-sm font-black transition-colors ${gender === value ? "bg-foreground text-background" : "text-muted-foreground"}`}>{label}</button>
          ))}
        </fieldset>

        <label className="block">
          <span className="mb-1.5 block px-1 text-xs text-muted-foreground">استان من</span>
          <select value={province} onChange={(event) => setProvince(event.target.value)} className="min-h-12 w-full rounded-2xl border border-input-border bg-input px-4 text-sm text-foreground">
            <option value="">انتخاب استان</option>
            {PROVINCES.map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 text-sm">
          <input type="checkbox" checked={sameProvince} onChange={(event) => setSameProvince(event.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
          فقط هم‌استانی
        </label>

        <button type="button" disabled className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-pill bg-brand text-base font-black text-brand-foreground opacity-50">
          <PhoneCall aria-hidden="true" className="h-5 w-5" />
          دریافت شماره
          <SoonBadge className="bg-white/25 !text-white" />
        </button>

        <div className="rounded-2xl border border-dashed border-border-strong p-4 text-xs leading-7 text-muted-foreground">
          پس از تماس، نتیجه را ثبت می‌کنید: «تماس گرفتم»، «تماس نگرفتم» یا «شماره دیگری بده». اگر سه شماره پشت‌سرهم بدون تماس بماند، تا ۵ ساعت شمارهٔ جدید داده نمی‌شود.
        </div>
      </div>
    </PageShell>
  );
}
