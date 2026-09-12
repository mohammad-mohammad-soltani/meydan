"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Info,
  LoaderCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { PersianTimePicker, formatPersianTime } from "@/components/shared/PersianTimePicker";
import { createScheduleItem, deleteScheduleItem, reorderScheduleItems } from "../services/schedule.service";
import type { SquareScheduleItem } from "../types";

/**
 * Dedicated "سین برنامه" screen: add a programme with a Jalali time picker,
 * reorder it, and remove it. Previously this lived inside the profile edit form.
 */
export function ScheduleView({
  initialItems,
  squareName,
}: {
  initialItems: SquareScheduleItem[];
  squareName: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<SquareScheduleItem[]>(initialItems);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [pending, setPending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    };
  }, []);

  const flashNotice = (message: string) => {
    setNotice(message);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3200);
  };

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/profile");
  };

  const add = async () => {
    if (!title.trim() || !time || pending) return;
    setPending(true);
    setError("");
    try {
      const created = await createScheduleItem({ title: title.trim(), time });
      setItems((current) => [
        ...current,
        { id: String(created?.id ?? `temp-${Date.now()}`), title: title.trim(), time },
      ]);
      setTitle("");
      setTime("");
      flashNotice("برنامه به سین اضافه شد.");
    } catch {
      setError("ثبت برنامه انجام نشد. دوباره تلاش کنید.");
    } finally {
      setPending(false);
    }
  };

  const remove = async (id: string) => {
    const previous = items;
    setBusyId(id);
    setError("");
    setItems((current) => current.filter((item) => item.id !== id));
    try {
      await deleteScheduleItem(id);
    } catch {
      setItems(previous);
      setError("حذف برنامه انجام نشد. دوباره تلاش کنید.");
    } finally {
      setBusyId(null);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length || busyId) return;
    const previous = items;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(nextIndex, 0, moved);
    setItems(next);
    setBusyId(moved.id);
    setError("");
    try {
      await reorderScheduleItems(next.map((item) => item.id));
    } catch {
      setItems(previous);
      setError("ذخیره ترتیب انجام نشد. دوباره تلاش کنید.");
    } finally {
      setBusyId(null);
    }
  };

  const iconButtonClass =
    "grid h-9 w-9 place-items-center rounded-full text-foreground-secondary transition-colors hover:bg-hover hover:text-foreground disabled:opacity-30";

  return (
    <section className="ui-enter flex min-h-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 flex min-h-14 items-center gap-2 border-b border-border bg-surface-glass px-3 py-2 backdrop-blur-md">
        <button
          type="button"
          onClick={back}
          aria-label="بازگشت"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-icon-muted transition-colors hover:bg-hover hover:text-brand"
        >
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-black text-foreground">سین برنامه</h1>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{squareName}</p>
        </div>
        <span className="shrink-0 rounded-pill bg-brand-muted px-2.5 py-1 text-[10px] font-black text-brand">
          {items.length.toLocaleString("fa-IR")} برنامه
        </span>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 p-4 pb-24">
        <section
          aria-label="افزودن برنامه"
          className="rounded-card border border-border bg-card p-4 shadow-xs"
        >
          <h2 className="flex items-center gap-2 text-xs font-black text-foreground">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-muted text-brand">
              <Plus aria-hidden="true" className="h-4 w-4" />
            </span>
            افزودن برنامه تازه
          </h2>

          <div className="mt-4 space-y-3">
            <label className="block text-xs font-bold text-foreground-secondary">
              عنوان برنامه
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void add();
                  }
                }}
                maxLength={120}
                placeholder="مثلاً: سخنرانی، مداحی، حلقهٔ گفتگو…"
                aria-label="عنوان برنامه"
                className="mt-1.5 min-h-12 w-full rounded-control border border-input-border bg-input px-3 text-sm text-foreground outline-none transition-colors placeholder:text-placeholder hover:border-input-border-hover focus:border-ring focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>

            <div className="text-xs font-bold text-foreground-secondary">
              <span className="flex items-center gap-1.5">
                <Clock aria-hidden="true" className="h-3.5 w-3.5 text-icon-muted" />
                ساعت شروع
              </span>
              <div className="mt-1.5">
                <PersianTimePicker
                  value={time}
                  onChange={setTime}
                  ariaLabel="انتخاب ساعت برنامه"
                  placeholder="انتخاب ساعت برنامه"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => void add()}
              disabled={pending || !title.trim() || !time}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-brand px-4 text-xs font-black text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground"
            >
              {pending ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Plus aria-hidden="true" className="h-4 w-4" />}
              افزودن به سین برنامه
            </button>
          </div>

          {error ? (
            <p role="alert" className="mt-3 rounded-control bg-danger-surface px-3 py-2 text-xs font-bold text-danger-foreground">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" aria-live="polite" className="mt-3 flex items-center gap-1.5 rounded-control bg-success-surface px-3 py-2 text-xs font-bold text-success-foreground">
              <Check aria-hidden="true" className="h-3.5 w-3.5" />
              {notice}
            </p>
          ) : null}
        </section>

        <section aria-label="ترتیب برنامه‌ها" className="rounded-card border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-xs font-black text-foreground">
              <CalendarDays aria-hidden="true" className="h-4 w-4 text-brand" />
              ترتیب نمایش
            </h2>
            {items.length > 1 ? (
              <span className="text-[10px] text-muted-foreground">با فلش‌ها جابه‌جا کن</span>
            ) : null}
          </div>

          {items.length === 0 ? (
            <div className="mt-3 grid place-items-center rounded-card border border-dashed border-border-strong px-4 py-8 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-muted text-brand">
                <CalendarDays aria-hidden="true" className="h-5 w-5" />
              </span>
              <p className="mt-3 text-xs font-bold text-foreground">هنوز برنامه‌ای ثبت نشده</p>
              <p className="mt-1 max-w-xs text-[11px] leading-6 text-muted-foreground">
                اولین برنامه را از فرم بالا اضافه کن؛ همان ترتیب در نمایهٔ میدان نمایش داده می‌شود.
              </p>
            </div>
          ) : (
            <ol className="mt-3 space-y-2">
              {items.map((item, index) => (
                <li
                  key={item.id}
                  className={`flex items-center gap-2 rounded-card border px-3 py-2.5 transition-colors ${
                    item.highlighted ? "border-brand-border bg-brand-muted/60" : "border-border bg-surface hover:border-border-strong"
                  }`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-xs font-black tabular-nums text-foreground-secondary">
                    {(index + 1).toLocaleString("fa-IR")}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-foreground">{item.title}</p>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] tabular-nums text-muted-foreground">
                      <Clock aria-hidden="true" className="h-3 w-3" />
                      ساعت {formatPersianTime(item.time)}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      aria-label={`انتقال «${item.title}» به بالا`}
                      disabled={index === 0 || busyId !== null}
                      onClick={() => void move(index, -1)}
                      className={iconButtonClass}
                    >
                      <ArrowUp aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`انتقال «${item.title}» به پایین`}
                      disabled={index === items.length - 1 || busyId !== null}
                      onClick={() => void move(index, 1)}
                      className={iconButtonClass}
                    >
                      <ArrowDown aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`حذف ${item.title}`}
                      disabled={busyId !== null}
                      onClick={() => void remove(item.id)}
                      className="grid h-9 w-9 place-items-center rounded-full text-danger transition-colors hover:bg-danger-surface disabled:opacity-30"
                    >
                      {busyId === item.id ? (
                        <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <p className="flex items-start gap-1.5 px-1 text-[10px] leading-6 text-foreground-subtle">
          <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          این فهرست به همین ترتیب در نمایهٔ میدان به بازدیدکنندگان نشان داده می‌شود.
        </p>
      </main>
    </section>
  );
}
