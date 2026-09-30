import Link from "next/link";
import { ShieldAlert } from "lucide-react";

/**
 * The 403 screen for a signed-in viewer who is not an administrator.
 *
 * It deliberately lives in the admin feature rather than as a route: the panel
 * gate renders it in place, so no `/admin/**` URL is ever renderable by a
 * non-administrator and there is nothing to deep-link past.
 */
export function AdminForbidden({ role }: { role?: string }) {
  return (
    <section className="grid min-h-full place-items-center px-4 py-16 text-center">
      <div className="w-full max-w-md rounded-panel border border-border bg-card p-6 shadow-card">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-danger-surface text-danger">
          <ShieldAlert aria-hidden="true" className="h-6 w-6" />
        </span>
        <p className="mt-4 text-3xl font-black text-danger">۴۰۳</p>
        <h1 className="mt-2 text-base font-black text-foreground">به این بخش دسترسی ندارید</h1>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          پنل مدیریت فقط برای حساب‌های مدیرکل (administrator) باز است.
          {role ? ` نقش فعلی شما: ${role}.` : ""}
        </p>
        <Link
          href="/home"
          className="mt-5 inline-flex rounded-control bg-brand px-4 py-2.5 text-xs font-black text-brand-foreground transition-colors hover:bg-brand-hover"
        >
          بازگشت به خانه
        </Link>
      </div>
    </section>
  );
}

/**
 * A network/API failure while resolving the role. The panel must fail closed —
 * a non-administrator can never reach the children — but it must also be
 * retryable, so it is an error screen rather than a silent 403.
 */
export function AdminGateError({ message }: { message: string }) {
  return (
    <section className="grid min-h-full place-items-center px-4 py-16 text-center">
      <div className="w-full max-w-md rounded-panel border border-border bg-card p-6 shadow-card">
        <h1 className="text-base font-black text-foreground">بررسی دسترسی ممکن نشد</h1>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">{message}</p>
        <p className="mt-3 text-[11px] leading-6 text-foreground-subtle">
          تا زمانی که نقش شما تأیید نشود، محتوای پنل نمایش داده نمی‌شود.
        </p>
        <Link
          href="/admin"
          className="mt-5 inline-flex rounded-control bg-brand px-4 py-2.5 text-xs font-black text-brand-foreground transition-colors hover:bg-brand-hover"
        >
          تلاش دوباره
        </Link>
      </div>
    </section>
  );
}
