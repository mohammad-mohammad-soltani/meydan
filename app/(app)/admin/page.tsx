import Link from "next/link";
import type { Route } from "next";
import {
  Bell,
  ArrowUpLeft,
  CircleCheck,
  Clock3,
  CircleX,
  PauseCircle,
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
    icon: ShortcutIcon;
    description: string;
  }> = [
    {
      href: "/admin/squares?status=pending_verification",
      label: "میدان در انتظار تأیید",
      value: countsByStatus.get("pending_verification") ?? null,
      tone: "warning",
      icon: MapPinned,
      description: "بررسی اطلاعات و تأیید میادین جدید",
    },
    {
      href: "/admin/speaker-requests?status=pending",
      label: "درخواست سخنرانی در انتظار",
      value: requests,
      tone: "info",
      icon: Mic,
      description: "رسیدگی به درخواست‌های ثبت‌شده",
    },
    {
      href: "/admin/speaker-invitations?status=pending",
      label: "دعوت‌نامه در انتظار",
      value: invitations,
      tone: "brand",
      icon: Megaphone,
      description: "پیگیری دعوت‌نامه‌های سخنرانی",
    },
  ];

  const availableCounts = STATUS_ORDER.map((status) =>
    countsByStatus.get(status),
  );
  const total = availableCounts.every((value) => typeof value === "number")
    ? availableCounts.reduce<number>((sum, value) => sum + (value ?? 0), 0)
    : null;
  const statusIcons = {
    pending_verification: Clock3,
    approved: CircleCheck,
    rejected: CircleX,
    suspended: PauseCircle,
  };
  const today = new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "full",
    timeZone: "Asia/Tehran",
  }).format(new Date());

  return (
    <div className="admin-dashboard">
      <AdminPageHeader
        title="نمای کلی"
        description="نبض میدان، در یک نگاه"
        actions={
          <span className="admin-date">
            <Clock3 size={15} aria-hidden="true" />
            {today}
          </span>
        }
      />
      <div className="admin-dashboard-body">
        <section className="admin-hero" aria-labelledby="admin-welcome">
          <div className="admin-hero-copy">
            <span className="admin-eyebrow">
              <span /> مرکز مدیریت میدان
            </span>
            <h2 id="admin-welcome">از اینجا، میدان را پیش ببرید.</h2>
            <p>
              میادین را سامان دهید، درخواست‌ها را بررسی کنید و جریان محتوا را
              زنده نگه دارید.
            </p>
            <div className="admin-hero-actions">
              <Link href="/admin/squares/new" className="admin-hero-primary">
                <Plus size={18} aria-hidden="true" />
                افزودن میدان
              </Link>
              <Link href="/admin/squares/map" className="admin-hero-secondary">
                مشاهده نقشه میادین
                <ArrowUpLeft size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="admin-hero-art" aria-hidden="true">
            <span className="admin-orbit admin-orbit-one" />
            <span className="admin-orbit admin-orbit-two" />
            <span className="admin-orbit-node node-one">
              <Mic size={22} />
            </span>
            <span className="admin-orbit-node node-two">
              <FolderKanban size={22} />
            </span>
            <span className="admin-orbit-node node-three">
              <Sparkles size={20} />
            </span>
            <span className="admin-orbit-center">
              <MapPinned size={48} strokeWidth={1.3} />
            </span>
          </div>
        </section>

        <section aria-labelledby="admin-stats-title">
          <div className="admin-section-heading">
            <div>
              <span className="admin-kicker">تصویر کلی</span>
              <h2 id="admin-stats-title">وضعیت میادین</h2>
            </div>
            <span className="admin-section-meta">
              {total === null
                ? "آمار قابل دریافت"
                : `${total.toLocaleString("fa-IR")} میدان در مجموع`}
            </span>
          </div>
          <ul className="admin-stats-grid">
            {SQUARE_STATUSES.map((status) => {
              const Icon = statusIcons[status];
              const value = countsByStatus.get(status);
              return (
                <li key={status}>
                  <Link
                    href={`/admin/squares?status=${status}` as Route}
                    className={`admin-stat-card admin-stat-${status}`}
                  >
                    <div className="admin-stat-top">
                      <span className="admin-stat-icon">
                        <Icon size={21} aria-hidden="true" />
                      </span>
                      <ChevronLeft size={16} aria-hidden="true" />
                    </div>
                    <strong className="admin-stat-value">
                      {value == null ? "—" : value.toLocaleString("fa-IR")}
                    </strong>
                    <span className="admin-stat-label">
                      {SQUARE_STATUS_LABELS[status]}
                    </span>
                    <span className="admin-stat-foot">
                      {value == null ? "شمارش در دسترس نیست" : "مشاهده میادین"}
                      <ArrowUpLeft size={14} aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="admin-queues-title">
          <div className="admin-section-heading">
            <div>
              <span className="admin-kicker">میز کار شما</span>
              <h2 id="admin-queues-title">نیازمند رسیدگی</h2>
            </div>
            <span className="admin-section-meta">در انتظار بررسی شما</span>
          </div>
          <ul className="admin-queue-grid">
            {queues.map((queue) => {
              const Icon = queue.icon;
              return (
                <li key={queue.href}>
                  <Link
                    href={queue.href as Route}
                    className={`admin-queue-card admin-queue-${queue.tone}`}
                  >
                    <div className="admin-queue-top">
                      <span className="admin-queue-icon">
                        <Icon size={21} aria-hidden="true" />
                      </span>
                      <strong>
                        {queue.value === null
                          ? "—"
                          : queue.value.toLocaleString("fa-IR")}
                      </strong>
                    </div>
                    <h3>{queue.label}</h3>
                    <p>{queue.description}</p>
                    <span className="admin-queue-footer">
                      {queue.value === null ? (
                        <>
                          <ShieldAlert size={14} aria-hidden="true" />
                          شمارش ممکن نشد؛ مشاهده فهرست
                        </>
                      ) : (
                        "مشاهده و بررسی"
                      )}
                      <ArrowUpLeft size={17} aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="admin-shortcuts-title">
          <div className="admin-section-heading">
            <div>
              <span className="admin-kicker">مسیرهای کوتاه‌تر</span>
              <h2 id="admin-shortcuts-title">دسترسی سریع</h2>
            </div>
          </div>
          <ul className="admin-shortcut-grid">
            {SHORTCUTS.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <li key={shortcut.href}>
                  <Link
                    href={shortcut.href as Route}
                    className="admin-shortcut"
                  >
                    <span className="admin-shortcut-icon">
                      <Icon size={21} aria-hidden="true" />
                    </span>
                    <span>
                      <strong>{shortcut.label}</strong>
                      <small>{shortcut.description}</small>
                    </span>
                    <ChevronLeft size={16} aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
        <aside className="admin-dashboard-note">
          <span>
            <Megaphone size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>یادآوری هنگام ساخت میدان</strong>
            <p>
              برای اطلاع‌رسانی به مالک، میدان را ابتدا با وضعیت «در انتظار
              تأیید» بسازید و سپس تأیید کنید. ساخت مستقیم میدان تأییدشده اعلانی
              ارسال نمی‌کند.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
