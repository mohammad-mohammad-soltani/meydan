"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Save, Search } from "lucide-react";
import { AdminCheckbox, AdminField, fieldClass } from "./AdminField";
import { AdminNotice } from "./AdminNotice";
import { AdminPageHeader } from "./AdminPageHeader";
import { primaryButtonClass, secondaryButtonClass } from "./styles";
import { validateFeedSettings } from "../lib/feed-settings";
import { adminErrorMessage } from "../services/admin-api";
import { previewFeed, updateFeedSettings, type AdminFeedSettingsResponse } from "../services/feed.service";
import type { AdminFeedSettings, FeedPreview } from "../types";

type NumericField = Exclude<keyof AdminFeedSettings, "feedAlgorithmV2Enabled" | "freshnessBuckets">;
type Group = { title: string; fields: Array<{ key: NumericField; label: string; description: string }> };

const GROUPS: Group[] = [
  { title: "تعامل کاربران", fields: [
    { key: "likeWeight", label: "وزن پسند", description: "اثر پسندها در تعامل محتوا." },
    { key: "viewWeight", label: "وزن بازدید", description: "اثر بازدیدها؛ معمولاً کمترین وزن تعامل." },
    { key: "commentWeight", label: "وزن نظر", description: "اثر نظرها در تعامل محتوا." },
    { key: "shareWeight", label: "وزن بازنشر", description: "اثر اشتراک‌گذاری و بازنشر." },
    { key: "maxEngagementScore", label: "سقف امتیاز تعامل", description: "از غلبهٔ یک محتوای viral جلوگیری می‌کند." },
  ] },
  { title: "نقش کاربران", fields: [
    { key: "squareRoleMultiplier", label: "ضریب میدان", description: "برای روایتِ بازیگر میدان." },
    { key: "speakerRoleMultiplier", label: "ضریب سخنران", description: "بالاترین نقش اعمال می‌شود و نقش‌ها جمع نمی‌شوند." },
    { key: "officialRoleMultiplier", label: "ضریب رسمی", description: "بالاترین نقش اعمال می‌شود و نقش‌ها جمع نمی‌شوند." },
    { key: "followingMultiplier", label: "ضریب دنبال‌کردن", description: "فقط وقتی بیننده نویسنده را دنبال کرده باشد." },
  ] },
  { title: "محتوای ویژه", fields: [
    { key: "editorialMultiplier", label: "ضریب تحریریه", description: "برای روایت برگزیدهٔ تحریریه." },
    { key: "goodDeedMultiplier", label: "ضریب کار نیک", description: "برای روایت کار نیک." },
    { key: "maxTotalBoost", label: "سقف کل boost", description: "حاصل‌ضرب همهٔ boostهای مثبت را محدود می‌کند." },
  ] },
  { title: "موقعیت مکانی", fields: [
    { key: "sameCityMultiplier", label: "ضریب شهر یکسان", description: "به‌جای ضریب استان برای شهر یکسان اعمال می‌شود." },
    { key: "sameProvinceMultiplier", label: "ضریب استان یکسان", description: "تنها وقتی شهر یکسان نباشد اعمال می‌شود." },
  ] },
  { title: "تازگی محتوا", fields: [
    { key: "maxPostAgeHours", label: "حداکثر سن محتوا (ساعت)", description: "محتوای قدیمی‌تر وارد candidateها نمی‌شود." },
  ] },
  { title: "ایندکسینگ", fields: [] },
  { title: "Diversity", fields: [
    { key: "maxSameAuthorInTopN", label: "سقف نویسنده در Top N", description: "از تکرار یک نویسنده در ابتدای فید جلوگیری می‌کند." },
    { key: "diversityTopN", label: "اندازهٔ Diversity", description: "بازهٔ ابتدایی که قانون تنوع روی آن اعمال می‌شود." },
  ] },
  { title: "Candidate Generation", fields: [
    { key: "candidatePoolSize", label: "اندازهٔ candidate pool", description: "سقف نامزدهای hydrateشده قبل از ranking." },
  ] },
];

function cloneSettings(settings: AdminFeedSettings): AdminFeedSettings {
  return { ...settings, freshnessBuckets: settings.freshnessBuckets.map((bucket) => ({ ...bucket })) };
}

function valueText(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function maxForField(field: NumericField): number {
  if (field === "maxPostAgeHours") return 168;
  if (field === "candidatePoolSize") return 1000;
  if (field === "maxSameAuthorInTopN" || field === "diversityTopN") return 100;
  return 100;
}

export function AdminFeedSettingsView({ initial }: { initial: AdminFeedSettingsResponse }) {
  const [current, setCurrent] = useState(() => cloneSettings(initial.settings));
  const [draft, setDraft] = useState(() => cloneSettings(initial.settings));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [previewUserId, setPreviewUserId] = useState("");
  const [preview, setPreview] = useState<FeedPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const errors = useMemo(() => validateFeedSettings(draft), [draft]);
  const canSave = Object.keys(errors).length === 0 && !saving;

  const setNumber = (key: NumericField, value: string) => {
    setDraft((state) => ({ ...state, [key]: Number(value) }));
  };

  const persist = async (next: AdminFeedSettings, success: string) => {
    const nextErrors = validateFeedSettings(next);
    if (Object.keys(nextErrors).length) {
      setDraft(next);
      setMessage({ tone: "error", text: "ابتدا خطاهای فرم را برطرف کنید." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const saved = await updateFeedSettings(next);
      setCurrent(cloneSettings(saved.settings));
      setDraft(cloneSettings(saved.settings));
      setMessage({ tone: "success", text: success });
    } catch (reason) {
      setMessage({ tone: "error", text: adminErrorMessage(reason, "ذخیرهٔ تنظیمات فید ممکن نشد.") });
    } finally {
      setSaving(false);
    }
  };

  const resetGroup = (group: Group) => {
    setDraft((state) => {
      const next = cloneSettings(state);
      for (const field of group.fields) next[field.key] = initial.defaults[field.key];
      if (group.title === "تازگی محتوا") next.freshnessBuckets = initial.defaults.freshnessBuckets.map((bucket) => ({ ...bucket }));
      return next;
    });
  };

  const requestPreview = async () => {
    const userId = Number(previewUserId);
    if (!Number.isInteger(userId) || userId < 1) {
      setMessage({ tone: "error", text: "شناسهٔ کاربر برای Preview معتبر نیست." });
      return;
    }
    setPreviewing(true);
    setMessage(null);
    try {
      setPreview(await previewFeed(userId));
    } catch (reason) {
      setMessage({ tone: "error", text: adminErrorMessage(reason, "پیش‌نمایش فید ممکن نشد.") });
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title="فید"
        description="تنظیمات Feed V2 در سرور اعمال می‌شوند؛ خاموش‌کردن الگوریتم، فوراً ساخت snapshotهای جدید را به V1 برمی‌گرداند."
        crumbs={[{ label: "فید" }]}
        actions={
          <>
            <button type="button" className={secondaryButtonClass} disabled={saving} onClick={() => void persist(cloneSettings(initial.defaults), "همهٔ تنظیمات به پیش‌فرض بازگشت.")}> 
              <RefreshCw aria-hidden="true" className={`h-4 w-4 ${saving ? "animate-spin" : ""}`} /> بازنشانی همه
            </button>
            <button type="button" className={primaryButtonClass} disabled={!canSave} onClick={() => void persist(draft, "تنظیمات فید ذخیره شد.")}> 
              <Save aria-hidden="true" className="h-4 w-4" /> ذخیره
            </button>
          </>
        }
      />

      <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6 lg:px-10">
        {message ? <AdminNotice tone={message.tone} message={message.text} onDismiss={() => setMessage(null)} /> : null}
        <AdminCheckbox
          id="feed-v2-enabled"
          label="فعال‌سازی Feed V2"
          description="فقط برای snapshot تازهٔ For You است؛ cursorهای موجود و TimelineSession را تغییر نمی‌دهد."
          checked={draft.feedAlgorithmV2Enabled}
          disabled={saving}
          onChange={(checked) => setDraft((state) => ({ ...state, feedAlgorithmV2Enabled: checked }))}
        />

        {GROUPS.map((group) => (
          <section key={group.title} className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="text-sm font-black text-foreground">{group.title}</h2></div>
              <button type="button" className={secondaryButtonClass} disabled={saving} onClick={() => resetGroup(group)}>بازنشانی این بخش</button>
            </div>
            {group.fields.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.fields.map((field) => (
                  <AdminField key={field.key} label={field.label} htmlFor={`feed-${field.key}`} hint={`${field.description} مقدار فعلی: ${valueText(current[field.key])} · پیش‌فرض: ${valueText(initial.defaults[field.key])}`} error={errors[field.key]}>
                    <input id={`feed-${field.key}`} type="number" min="0" max={maxForField(field.key)} step="0.01" className={fieldClass} value={Number.isFinite(draft[field.key]) ? draft[field.key] : ""} disabled={saving} onChange={(event) => setNumber(field.key, event.target.value)} />
                  </AdminField>
                ))}
              </div>
            ) : null}
            {group.title === "تازگی محتوا" ? (
              <div className="mt-4 overflow-x-auto">
                <p className="mb-2 text-xs text-muted-foreground">بازه‌های پیوستهٔ [min,max)؛ مرزها ۶، ۱۲، ۲۴، ۴۸ و ۷۲ ساعت هستند.</p>
                <table className="w-full min-w-[34rem] text-right text-xs"><thead><tr className="border-b border-divider text-muted-foreground"><th className="p-2">از ساعت</th><th className="p-2">تا ساعت</th><th className="p-2">ضریب</th></tr></thead><tbody>{draft.freshnessBuckets.map((bucket, index) => <tr key={index} className="border-b border-divider"><td className="p-2"><input className={fieldClass} type="number" value={bucket.minHours} onChange={(event) => setDraft((state) => ({ ...state, freshnessBuckets: state.freshnessBuckets.map((item, row) => row === index ? { ...item, minHours: Number(event.target.value) } : item) }))} /></td><td className="p-2"><input className={fieldClass} type="number" value={bucket.maxHours} onChange={(event) => setDraft((state) => ({ ...state, freshnessBuckets: state.freshnessBuckets.map((item, row) => row === index ? { ...item, maxHours: Number(event.target.value) } : item) }))} /></td><td className="p-2"><input className={fieldClass} type="number" min="0" max="100" step="0.01" value={bucket.multiplier} onChange={(event) => setDraft((state) => ({ ...state, freshnessBuckets: state.freshnessBuckets.map((item, row) => row === index ? { ...item, multiplier: Number(event.target.value) } : item) }))} /></td></tr>)}</tbody></table>
                {errors.freshnessBuckets ? <p className="mt-2 text-xs text-danger-foreground">{errors.freshnessBuckets}</p> : null}
              </div>
            ) : null}
          </section>
        ))}

        <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-black text-foreground">Preview / Explainability</h2>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">این درخواست فقط Preview ادمین است و timeline، view، served-history یا analytics را تغییر نمی‌دهد.</p>
          <div className="mt-4 flex flex-wrap gap-2"><input aria-label="شناسه کاربر Preview" className={`${fieldClass} w-48`} type="number" min="1" value={previewUserId} onChange={(event) => setPreviewUserId(event.target.value)} placeholder="شناسهٔ کاربر" /><button type="button" className={primaryButtonClass} disabled={previewing} onClick={() => void requestPreview()}><Search aria-hidden="true" className={`h-4 w-4 ${previewing ? "animate-spin" : ""}`} /> اجرای Preview</button></div>
          {preview ? <div className="mt-4 overflow-x-auto"><p className="mb-2 text-xs text-muted-foreground">نسخه: {preview.algorithmVersion}</p><table className="w-full min-w-[48rem] text-right text-xs"><thead><tr className="border-b border-divider text-muted-foreground"><th className="p-2">رتبه</th><th className="p-2">روایت</th><th className="p-2">منبع‌ها</th><th className="p-2">امتیاز</th><th className="p-2">پایه</th><th className="p-2">تازگی</th><th className="p-2">نقش</th><th className="p-2">مکان</th><th className="p-2">دنبال‌کردن</th></tr></thead><tbody>{preview.items.map((item) => <tr key={item.narrativeId} className="border-b border-divider"><td className="p-2">{item.rank}</td><td className="p-2">{item.narrativeId}</td><td className="p-2">{item.sourceNames.join("، ")}</td><td className="p-2">{valueText(item.score)}</td><td className="p-2">{valueText(item.baseScore)}</td><td className="p-2">{valueText(item.freshnessMultiplier)}</td><td className="p-2">{valueText(item.roleMultiplier)}</td><td className="p-2">{valueText(item.locationMultiplier)}</td><td className="p-2">{valueText(item.followingMultiplier)}</td></tr>)}</tbody></table></div> : null}
        </section>
      </div>
    </div>
  );
}
