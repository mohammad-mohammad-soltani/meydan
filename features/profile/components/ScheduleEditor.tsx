"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  LoaderCircle,
  Plus,
  Trash2,
} from "lucide-react";
import type { SquareScheduleItem } from "../types";
import {
  createScheduleItem,
  deleteScheduleItem,
  reorderScheduleItems,
} from "../services/schedule.service";

export function ScheduleEditor({ initialItems }: { initialItems: SquareScheduleItem[] }) {
  const [items, setItems] = useState<SquareScheduleItem[]>(initialItems);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [pending, setPending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const add = async () => {
    if (!title.trim() || !time || pending) return;
    setPending(true);
    setError("");
    try {
      const created = await createScheduleItem({ title: title.trim(), time });
      const id = String(created?.id ?? `temp-${Date.now()}`);
      setItems((current) => [
        ...current,
        { id, title: title.trim(), time },
      ]);
      setTitle("");
      setTime("");
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

  return (
    <div>
      <span className="mb-1.5 flex items-center gap-1.5 px-1 text-xs text-foreground-subtle">
        <CalendarDays aria-hidden="true" className="h-4 w-4 text-brand" />
        سین برنامه — به ترتیب نمایش
      </span>
      <div className="rounded-control border border-input-border bg-input p-3">
        {items.length === 0 ? (
          <p className="py-2 text-center text-[11px] leading-6 text-muted-foreground">
            هنوز برنامه‌ای ثبت نشده؛ اولین برنامه را اضافه کنید.
          </p>
        ) : (
          <ol className="space-y-2">
            {items.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded-card border border-border bg-surface px-2.5 py-2"
              >
                <span
                  aria-hidden="true"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-muted text-[11px] font-black tabular-nums text-foreground-secondary"
                >
                  {(index + 1).toLocaleString("fa-IR")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
                    ساعت {item.time}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label="انتقال به بالا"
                    disabled={index === 0 || busyId !== null}
                    onClick={() => void move(index, -1)}
                    className="grid h-9 w-9 place-items-center rounded-full text-foreground-secondary transition-colors hover:bg-hover hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="انتقال به پایین"
                    disabled={index === items.length - 1 || busyId !== null}
                    onClick={() => void move(index, 1)}
                    className="grid h-9 w-9 place-items-center rounded-full text-foreground-secondary transition-colors hover:bg-hover hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`حذف ${item.title}`}
                    disabled={busyId !== null}
                    onClick={() => void remove(item.id)}
                    className="grid h-9 w-9 place-items-center rounded-full text-danger transition-colors hover:bg-danger-surface disabled:opacity-30"
                  >
                    {busyId === item.id ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-3 space-y-2 border-t border-divider pt-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="عنوان برنامه جدید"
            aria-label="عنوان برنامه جدید"
            className="min-h-12 w-full rounded-control border border-input-border bg-surface px-3 text-sm text-foreground outline-none placeholder:text-foreground-subtle focus:border-ring"
          />
          <div className="flex gap-2">
            <input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              aria-label="ساعت برنامه جدید"
              className="min-h-12 flex-1 rounded-control border border-input-border bg-surface px-3 text-sm text-foreground tabular-nums outline-none focus:border-ring"
            />
            <button
              type="button"
              onClick={() => void add()}
              disabled={pending || !title.trim() || !time}
              className="inline-flex min-h-12 items-center gap-1.5 rounded-control bg-brand px-4 text-xs font-black text-brand-foreground transition-colors hover:bg-brand-hover disabled:bg-disabled disabled:text-disabled-foreground"
            >
              {pending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              افزودن
            </button>
          </div>
        </div>
        {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
      </div>
    </div>
  );
}
