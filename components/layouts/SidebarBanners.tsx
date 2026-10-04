import Link from "next/link";
import { Clock } from "lucide-react";

const base =
  "relative flex h-[50px] w-full items-center justify-between gap-2 overflow-hidden rounded-2xl px-3.5 text-xs text-white transition-transform";

/**
 * The two call-to-action banners above the trends panel. «ثبت‌نام اکران» has no
 * flow behind it yet, so it shows a «به‌زودی» badge and goes nowhere.
 */
export function SidebarBanners() {
  return (
    <div className="space-y-4">
      <div
        aria-disabled="true"
        className={`${base} cursor-default bg-[linear-gradient(90deg,rgba(0,0,0,.72),rgba(0,0,0,.2)),linear-gradient(135deg,#e4152e,#f5525f)]`}
      >
        <b className="font-extrabold">اکران فیلم و مستند در میادین</b>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm">
          <Clock aria-hidden="true" className="h-3 w-3" />
          به‌زودی
        </span>
      </div>
      <Link
        href="/speakers"
        className={`${base} bg-[linear-gradient(90deg,rgba(0,0,0,.72),rgba(0,0,0,.2)),linear-gradient(135deg,#27272a,#52525b)] active:scale-[0.98]`}
      >
        <b className="font-extrabold">اعزام سخنران</b>
        <small className="text-[10.5px] text-white/85">ثبت درخواست</small>
      </Link>
    </div>
  );
}
