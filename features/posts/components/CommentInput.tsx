"use client";

import { Send } from "lucide-react";
import {
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type CommentInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  avatarLabel?: string;
};

const MAX_HEIGHT = 132;

type Position = {
  left: number;
  width: number;
};

export function CommentInput({
  value,
  onChange,
  onSubmit,
}: CommentInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  /*
   * کامپوزر را دقیقاً به ستون اصلی پست متصل می‌کنیم.
   * نه به body
   * نه به عرض CommentsList
   */
  useLayoutEffect(() => {
    if (!mounted) return;

    const column = document.querySelector<HTMLElement>(
      "[data-post-column]",
    );

    if (!column) return;

    const updatePosition = () => {
      const rect = column.getBoundingClientRect();

      setPosition({
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();

    const observer = new ResizeObserver(updatePosition);

    observer.observe(column);

    window.addEventListener("resize", updatePosition);

    const viewport = window.visualViewport;

    viewport?.addEventListener("resize", updatePosition);
    viewport?.addEventListener("scroll", updatePosition);

    return () => {
      observer.disconnect();

      window.removeEventListener("resize", updatePosition);

      viewport?.removeEventListener("resize", updatePosition);
      viewport?.removeEventListener("scroll", updatePosition);
    };
  }, [mounted]);

  /*
   * Auto-grow شبیه X
   */
  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "0px";

    const height = Math.min(
      Math.max(textarea.scrollHeight, 40),
      MAX_HEIGHT,
    );

    textarea.style.height = `${height}px`;

    textarea.style.overflowY =
      textarea.scrollHeight > MAX_HEIGHT
        ? "auto"
        : "hidden";
  }, [value]);

  /*
   * ارتفاع واقعی کامپوزر را به کل صفحه اعلام می‌کنیم
   * تا آخرین کامنت هیچ‌وقت پشت آن نرود.
   */
  useLayoutEffect(() => {
    const composer = composerRef.current;

    if (!composer) return;

    const updateHeight = () => {
      document.documentElement.style.setProperty(
        "--comment-composer-height",
        `${composer.offsetHeight}px`,
      );
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(composer);

    return () => {
      observer.disconnect();

      document.documentElement.style.removeProperty(
        "--comment-composer-height",
      );
    };
  }, [mounted, position]);

  const submit = () => {
    if (!value.trim()) return;

    onSubmit();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    /*
     * مثل X:
     * Enter = خط جدید
     * Ctrl/Cmd + Enter = ارسال
     */
    if (
      event.key === "Enter" &&
      (event.ctrlKey || event.metaKey) &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submit();
    }
  };

  if (!mounted || !position) {
    return null;
  }

  return createPortal(
    <div
      ref={composerRef}
      style={{
        left: position.left,
        width: position.width,
      }}
      className="
        fixed
        bottom-0
        z-[70]

        border-t
        border-divider

        bg-background/95
        backdrop-blur-2xl

        supports-[backdrop-filter]:bg-background/85
      "
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="
          px-3
          pt-2
          pb-[max(8px,env(safe-area-inset-bottom))]
          sm:px-4
        "
      >
        <div
          className="
            group

            flex
            min-h-[48px]
            items-end
            gap-2

            rounded-[26px]

            border
            border-border

            bg-surface-muted

            p-[5px]

            transition-all
            duration-200

            focus-within:border-border-strong
            focus-within:bg-background
            focus-within:shadow-[0_0_0_1px_var(--color-border)]
          "
        >
          <textarea
            ref={textareaRef}
            value={value}
            rows={1}
            dir="rtl"
            aria-label="نوشتن پاسخ"
            placeholder="پاسخ خود را بنویسید..."
            onChange={(event) =>
              onChange(event.target.value)
            }
            onKeyDown={handleKeyDown}
            className="
              min-h-10
              max-h-[132px]
              flex-1
              resize-none

              overflow-y-hidden

              bg-transparent

              px-3
              py-[9px]

              text-[14px]
              leading-[22px]
              text-foreground

              outline-none

              placeholder:text-placeholder

              [scrollbar-gutter:stable]
              [scrollbar-width:thin]
            "
          />

          <button
            type="submit"
            disabled={!value.trim()}
            aria-label="ارسال پاسخ"
            className="
              mb-[1px]

              grid
              h-10
              w-10
              shrink-0
              place-items-center

              rounded-full

              bg-brand
              text-brand-foreground

              shadow-sm

              transition-all
              duration-150

              hover:brightness-110

              active:scale-[0.88]

              disabled:scale-100
              disabled:cursor-default
              disabled:opacity-30
              disabled:shadow-none
            "
          >
            <Send
              strokeWidth={2}
              className="h-[18px] w-[18px]"
            />
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}