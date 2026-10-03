"use client";

import { Mic } from "lucide-react";
import { PageShell, SoonBadge, fieldClass } from "./PageShell";

/** «ثبت‌نام سخنران»: the application form for the speakers list; sending opens with the backend. */
export function SpeakerSignupView({ categories }: { categories: Array<{ slug: string; name: string }> }) {
  return (
    <PageShell title="ثبت‌نام سخنران" subtitle="درخواست حضور در فهرست سخنرانان" back="/speakers" soon>
      <form className="space-y-4 px-4 pt-4" onSubmit={(event) => event.preventDefault()}>
        <div className="grid h-24 place-items-center rounded-3xl bg-gradient-to-br from-violet-500 to-violet-900 text-white"><Mic aria-hidden="true" className="h-9 w-9" /></div>
        <label className="block"><span className="mb-1.5 block px-1 text-xs text-muted-foreground">نام و نام خانوادگی</span><input disabled className={fieldClass} placeholder="مثلاً علی احمدی" autoComplete="name" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="mb-1.5 block px-1 text-xs text-muted-foreground">شهر</span><input disabled className={fieldClass} placeholder="تهران" /></label>
          <label className="block">
            <span className="mb-1.5 block px-1 text-xs text-muted-foreground">حوزهٔ سخنرانی</span>
            <select disabled className={fieldClass}>{(categories.length ? categories : [{ slug: "", name: "انتخاب دسته" }]).map((category) => <option key={category.slug}>{category.name}</option>)}</select>
          </label>
        </div>
        <label className="block"><span className="mb-1.5 block px-1 text-xs text-muted-foreground">موضوعات سخنرانی</span><input disabled className={fieldClass} placeholder="مثلاً روایت‌گری، جهاد تبیین، خدمت‌رسانی" /></label>
        <label className="block"><span className="mb-1.5 block px-1 text-xs text-muted-foreground">شمارهٔ تماس</span><input disabled dir="ltr" inputMode="tel" className={`${fieldClass} text-left`} placeholder="09123456789" /></label>
        <label className="block"><span className="mb-1.5 block px-1 text-xs text-muted-foreground">لینک نمونه سخنرانی یا رزومه <em className="not-italic text-placeholder">(اختیاری)</em></span><input disabled dir="ltr" className={`${fieldClass} text-left`} placeholder="https://" /></label>
        <label className="block"><span className="mb-1.5 block px-1 text-xs text-muted-foreground">دربارهٔ شما <em className="not-italic text-placeholder">(اختیاری)</em></span><textarea disabled rows={4} className={`${fieldClass} py-3`} placeholder="سوابق، تجربه و توضیح کوتاه" /></label>
        <button type="submit" disabled className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-pill bg-brand text-base font-black text-brand-foreground opacity-50">ارسال درخواست <SoonBadge className="bg-white/25 !text-white" /></button>
        <p className="px-1 text-center text-[11px] leading-6 text-muted-foreground">اطلاعات شما فقط برای بررسی درخواست استفاده می‌شود.</p>
      </form>
    </PageShell>
  );
}
