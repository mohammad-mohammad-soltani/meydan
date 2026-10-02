import type { SVGProps } from "react";

/** Icon paths taken one-to-one from the approved design reference. */
const PATHS = {
  task: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>',
  meeting: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  announcement: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 9a3 3 0 0 1 0 6M18 6a7 7 0 0 1 0 12"/>',
  text: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"/>',
  poll: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 4a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6"/>',
  pin: '<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  reply: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v5"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  pinned: '<path d="M12 17v5M9 3h6l-1 6 3 3H7l3-3z"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  scroll: '<path d="M8 3h11v14a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2h11v2a3 3 0 0 0 3 3"/><path d="M8 3a3 3 0 0 0-3 3v9"/>',
  flag: '<path d="M4 21V4h11l-1.5 4L15 12H4"/>',
  broom: '<path d="M14 4 20 10M4 20l7-7M9 11l4 4-3 5-6-6z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  back: '<path d="m9 6 6 6-6 6"/>',
  send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"/>',
  board: '<rect x="3" y="3" width="18" height="18" rx="3.5"/><path d="M8 7.5v7"/><path d="M12 7.5v3.5"/><path d="M16 7.5v9"/>',
  at: '<circle cx="12" cy="12" r="4"/><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  clip: '<path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 8v.01M11 12h1v5h1"/>',
  more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, weight = 1.8, ...rest }: { name: IconName; size?: number; weight?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={weight}
      aria-hidden="true"
      {...rest}
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  );
}

/** Task status glyph (dashed / half / check / double-check). */
export function StatusIcon({ status, size = 16 }: { status: "todo" | "doing" | "done" | "ok"; size?: number }) {
  if (status === "todo")
    return (
      <svg className="st" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6.2" fill="none" stroke="var(--faint)" strokeWidth="1.8" strokeDasharray="3 2.2" />
      </svg>
    );
  if (status === "doing")
    return (
      <svg className="st" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6.2" fill="none" stroke="var(--s2)" strokeWidth="1.8" />
        <path d="M8 3.6a4.4 4.4 0 0 1 0 8.8z" fill="var(--s2)" />
      </svg>
    );
  if (status === "done")
    return (
      <svg className="st" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="var(--ok)" />
        <path d="m5 8.2 2 2 4-4.2" stroke="#fff" strokeWidth="1.8" fill="none" />
      </svg>
    );
  return (
    <svg className="st" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="var(--ok)" />
      <path d="m3.6 8.2 1.8 1.8 3.6-3.8M7.6 9.6l.6.6 3.6-3.8" stroke="#fff" strokeWidth="1.6" fill="none" />
    </svg>
  );
}
