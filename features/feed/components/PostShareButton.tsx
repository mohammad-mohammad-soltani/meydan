"use client";

import { Share2 } from "lucide-react";

type PostShareButtonProps = {
  onShare: () => void;
  /** `sm` fits the timeline header, `md` the post page header. */
  size?: "sm" | "md";
};

/** The share control in a post's top-left corner. */
export function PostShareButton({ onShare, size = "sm" }: PostShareButtonProps) {
  const box = size === "md" ? "h-9 w-9" : "h-7 w-7";
  const icon = size === "md" ? "h-[18px] w-[18px]" : "h-4 w-4";

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onShare();
      }}
      aria-label="اشتراک‌گذاری روایت"
      className={`pointer-events-auto relative z-10 grid shrink-0 place-items-center rounded-full text-icon-muted transition-colors hover:bg-info-surface hover:text-info ${box}`}
    >
      <Share2 aria-hidden="true" className={icon} />
    </button>
  );
}
