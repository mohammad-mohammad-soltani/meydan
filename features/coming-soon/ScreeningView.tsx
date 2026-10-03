"use client";

import { Clapperboard } from "lucide-react";
import { PageShell, SoonBadge, fieldClass } from "./PageShell";

/** «ثبت‌نام اکران فیلم و مستند در میدان»: the request form; sending opens with the backend. */
export function ScreeningView() {
  return (
    <PageShell title="ثبت‌نام اکران" subtitle="فیلم و مستند در میادین" back="/content" soon>
      <form className="space-y-4 px-4 pt-4" onSubmit={(event) => event.preventDefault()}>
        <div className="grid h-24 place-items-center rounded-3xl bg-gradient-to-br from-rose-600 to-rose-900 text-white"><Clapperboard aria-hidden="true" className="h-9 w-9" /></div>
        <label className="block"><span className="mb-1.5 block px-1 text-xs text-muted-foreground">نام میدان</span><input disabled className={fieldClass} placeholder="مثلاً میدان جنت‌آباد" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="mb-1.5 block px-1 text-xs text-muted-foreground">استان</span><select disabled className={fieldClass}><option>انتخاب استان</option></select></label>
          <label className="block"><span className="mb-1.5 block px-1 text-xs text-muted-foreground">شهر</span><select disabled className={fieldClass}><option>انتخاب شهر</option></select></label>
        </div>
        <label className="block"><span className="mb-1.5 block px-1 text-xs text-muted-foreground">فیلم یا مستند</span><select disabled className={fieldClass}><option>انتخاب از فهرست</option></select></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="mb-1.5 block px-1 text-xs text-muted-foreground">تاریخ پیشنهادی</span><input disabled className={fieldClass} placeholder="مثلاً ۱۲ مهر" /></label>
          <label className="block"><span className="mb-1.5 block px-1 text-xs text-muted-foreground">تعداد حاضران</span><input disabled inputMode="numeric" className={fieldClass} placeholder="۱۰۰" /></label>
        </div>
        <label className="block"><span className="mb-1.5 block px-1 text-xs text-muted-foreground">شمارهٔ مسئول</span><input disabled dir="ltr" inputMode="tel" className={`${fieldClass} text-left`} placeholder="09123456789" /></label>
        <label className="block"><span className="mb-1.5 block px-1 text-xs text-muted-foreground">توضیحات</span><textarea disabled rows={4} className={`${fieldClass} py-3`} placeholder="امکانات مکان اکران، ساعت و هر نکتهٔ دیگر" /></label>
        <button type="submit" disabled className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-pill bg-brand text-base font-black text-brand-foreground opacity-50">ثبت درخواست اکران <SoonBadge className="bg-white/25 !text-white" /></button>
      </form>
    </PageShell>
  );
}
