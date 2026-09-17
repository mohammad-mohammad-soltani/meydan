import Link from "next/link";
import type { Route } from "next";
import {
  Bell,
  ChevronLeft,
  FolderKanban,
  Image,
  MapPinned,
  Megaphone,
  Mic,
  PencilLine,
  Plus,
  ShieldAlert,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import {
  SQUARE_STATUSES,
  SQUARE_STATUS_LABELS,
  type SquareStatus,
} from "@/features/admin/types";
import { countSquares } from "@/features/admin/services/admin-server";
import {
  getSpeakerInvitations,
  getSpeakerRequests,
} from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const dynamic = "force-dynamic";

const STATUS_ORDER: SquareStatus[] = [
  "pending_verification",
  "approved",
  "rejected",
  "suspended",
];

/** The sections that make up the panel, for the "go somewhere" grid. */
type ShortcutIcon = typeof MapPinned;

const SHORTCUTS: Array<{
  href: string;
  label: string;
  description: string;
  icon: ShortcutIcon;
}> = [
  {
    href: "/admin/squares",
    label: "میادین",
    description: "فهرست، تأیید و ویرایش میادین",
    icon: MapPinned,
  },
  {
    href: "/admin/speakers",
    label: "سخنرانان",
    description: "ارتقا و ویرایش سخنران‌ها",
    icon: Mic,
  },
  {
    href: "/admin/content",
    label: "بسته محتوا",
    description: "ساخت و حذف محتوا",
    icon: FolderKanban,
  },
  {
    href: "/admin/creators",
    label: "تولیدکنندگان",
    description: "مدیریت تولیدکنندگان محتوا",
    icon: Sparkles,
  },
  {
    href: "/admin/media-outlets",
    label: "رسانه‌ها",
    description: "مدیریت رسانه‌های خبری",
    icon: Image,
  },
  {
    href: "/admin/narratives",
    label: "کارگاه روایت",
    description: "سردبیری و تبدیل به محتوا",
    icon: PencilLine,
  },
  {
    href: "/admin/initiatives",
    label: "ابتکارها",
    description: "ابتکارها و اعضای آن‌ها",
    icon: UserCheck,
  },
  {
    href: "/admin/notifications",
    label: "اعلان گروهی",
    description: "ارسال اعلان به مخاطبان",
    icon: Bell,
  },
];

/**
 * Dashboard.
 *
 * Every block is an independent read, and all of them run through
 * `Promise.allSettled`: one failing counter must not blank the whole page, so a
 * rejected read renders `—` in its card and the rest still load. Nothing here
 * throws, which is why the page has no error state of its own.
 */
export default async function AdminDashboardPage() {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  const [counts, requests, invitations] = await Promise.all([
    Promise.allSettled(STATUS_ORDER.map((status) => countSquares(status))),
    getSpeakerRequests({ status: "pending" })
      .then((result) => result.items.length)
      .catch(() => null),
    getSpeakerInvitations({ status: "pending" })
      .then((result) => result.items.length)
      .catch(() => null),
  ]);

  const countsByStatus = new Map<SquareStatus, number | null>();
  STATUS_ORDER.forEach((status, index) => {
    const result = counts[index];
    countsByStatus.set(
      status,
      result.status === "fulfilled" ? result.value : null,
    );
  });

  const queues: Array<{
    href: string;
    label: string;
    value: number | null;
    tone: string;
  }> = [
    {
      href: "/admin/squares?status=pending_verification",
      label: "میدان در انتظار تأیید",
      value: countsByStatus.get("pending_verification") ?? null,
      tone: "border-warning-border bg-warning-surface",
    },
    {
      href: "/admin/speaker-requests?status=pending",
      label: "درخواست سخنرانی در انتظار",
      value: requests,
      tone: "border-info-border bg-info-surface",
    },
    {
      href: "/admin/speaker-invitations?status=pending",
      label: "دعوت‌نامه در انتظار",
      value: invitations,
      tone: "border-info-border bg-info-surface",
    },
  ];

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title="پنل مدیریت میدان"
        description="وضعیت کلی میادین و صف‌های بررسی. سرخط این پنل «افزودن میدان» است."
        actions={
          <Link
            href={"/admin/squares/new" as Route}
            className="inline-flex min-h-10 items-center gap-2 rounded-control bg-brand px-4 text-xs font-black text-brand-foreground transition-colors hover:bg-brand-hover"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            افزودن میدان
          </Link>
        }
      />

      <section
        aria-label="صف‌های بررسی"
        className="border-b border-divider px-4 py-6 sm:px-6 lg:px-10"
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black text-brand">مرکز عملیات</p>
            <h2 className="mt-1 text-lg font-black text-foreground">
              نیازمند اقدام
            </h2>
          </div>
          <span className="text-[11px] text-muted-foreground">
            صف‌های بررسی امروز
          </span>
        </div>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {queues.map((queue) => (
            <li key={queue.href}>
              <Link
                href={queue.href as Route}
                className={`flex min-h-24 items-center justify-between gap-3 rounded-2xl border px-4 py-4 transition-all hover:-translate-y-0.5 hover:shadow-card ${queue.tone}`}
              >
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold text-foreground-secondary">
                    {queue.label}
                  </span>
                  <span className="mt-1 block text-xl font-black text-foreground">
                    {queue.value === null
                      ? "—"
                      : queue.value.toLocaleString("fa-IR")}
                  </span>
                  {queue.value === null ? (
                    <span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <ShieldAlert aria-hidden="true" className="h-3 w-3" />
                      شمارش ممکن نشد
                    </span>
                  ) : null}
                </span>
                <ChevronLeft
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-icon-muted"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="وضعیت میادین"
        className="border-b border-divider px-4 py-6 sm:px-6 lg:px-10"
      >
        <h2 className="text-lg font-black text-foreground">
          نمایش وضعیت میادین
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {SQUARE_STATUSES.map((status) => (
            <li
              key={status}
              className="rounded-2xl border border-border bg-surface-elevated px-4 py-4 shadow-sm"
            >
              <span className="block text-[11px] text-muted-foreground">
                {SQUARE_STATUS_LABELS[status]}
              </span>
              <span className="mt-1 block text-lg font-black text-foreground">
                {(() => {
                  const value = countsByStatus.get(status);
                  return value === null || value === undefined
                    ? "—"
                    : value.toLocaleString("fa-IR");
                })()}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="بخش‌های پنل" className="px-4 py-6 sm:px-6 lg:px-10">
        <h2 className="text-lg font-black text-foreground">دسترسی سریع</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SHORTCUTS.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <li key={shortcut.href}>
                <Link
                  href={shortcut.href as Route}
                  className="flex min-h-20 items-center gap-3 rounded-2xl border border-border bg-surface-elevated px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-brand-border hover:shadow-card"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-muted text-brand">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-black text-foreground">
                      {shortcut.label}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                      {shortcut.description}
                    </span>
                  </span>
                  <ChevronLeft
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-icon-muted"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="یادآوری‌ها" className="px-3 pb-6 sm:px-4">
        <div className="rounded-card border border-warning-border bg-warning-surface px-3.5 py-3 text-[11px] leading-6 text-warning-foreground">
          <p className="flex items-center gap-1.5 font-black">
            <Megaphone aria-hidden="true" className="h-3.5 w-3.5" />
            نکته
          </p>
          <p className="mt-1">
            ساخت میدان با وضعیت «تأییدشده» هیچ اعلانی برای مالک ارسال نمی‌کند؛
            اگر می‌خواهید مالک مطلع شود، ابتدا با وضعیت «در انتظار تأیید» بسازید
            و سپس از صفحه میدان تأیید کنید.
          </p>
        </div>
      </section>
    </div>
  );
}
