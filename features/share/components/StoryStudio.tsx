"use client";

import { AlertCircle, Download, FileImage, LoaderCircle, RectangleVertical, Share2, Square, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  STORY_MORE_LABEL,
  STORY_TEXT_LIMIT,
  STORY_THEMES,
  drawStory,
  loadImage,
  storyText,
  type StoryFontSize,
  type StoryFormat,
} from "../story-canvas";
import type { SharePost } from "../types";

const FONT_SIZES: Array<{ id: StoryFontSize; label: string }> = [
  { id: "sm", label: "کوچک" },
  { id: "md", label: "متوسط" },
  { id: "lg", label: "بزرگ" },
  { id: "xl", label: "خیلی بزرگ" },
];

/** Same-origin copy of a remote image, so the canvas stays exportable. */
function sameOrigin(src: string | undefined, width: number): string | undefined {
  if (!src) return undefined;
  if (src.startsWith("/")) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=90`;
}

/**
 * «استودیو ساخت عکس‌نوشت»: the post on a branded card, as a 9:16 story or a
 * 1:1 square, with the reference design's font sizes and five themes. The
 * text is the post's own, and the author's tick is their real one.
 */
export function StoryStudio({ post, onClose, onShared }: { post: SharePost; onClose: () => void; onShared: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<StoryFormat>("story");
  const [fontSize, setFontSize] = useState<StoryFontSize>("md");
  const [themeId, setThemeId] = useState(STORY_THEMES[0].id);
  const [assets, setAssets] = useState<{ avatar: HTMLImageElement | null; logo: HTMLImageElement | null; family: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const text = [post.title, post.body].filter(Boolean).join("\n");
  const { truncated } = storyText(text);
  const theme = STORY_THEMES.find((item) => item.id === themeId) ?? STORY_THEMES[0];
  const link = `${typeof window === "undefined" ? "naghshman.ir" : window.location.host}/posts/${post.id}`;

  // Fonts and images are loaded once; every option change only repaints.
  useEffect(() => {
    let active = true;
    const family = getComputedStyle(document.body).fontFamily;
    void Promise.all([
      loadImage(sameOrigin(post.authorAvatar, 256)),
      loadImage("/images/logo/meydan-mark.svg"),
      document.fonts.load(`700 56px ${family}`, text.slice(0, 200)).catch(() => []),
      document.fonts.load(`900 40px ${family}`, "نقش من").catch(() => []),
    ]).then(([avatar, logo]) => {
      if (active) setAssets({ avatar, logo, family });
    });
    return () => {
      active = false;
    };
  }, [post.authorAvatar, text]);

  useEffect(() => {
    if (!assets || !canvasRef.current) return;
    drawStory(canvasRef.current, {
      text,
      authorName: post.authorName,
      authorVerified: Boolean(post.authorVerified),
      authorAvatar: assets.avatar,
      logo: assets.logo,
      hashtag: "#روایت_ایران",
      link,
      format,
      fontSize,
      theme,
      fontFamily: assets.family,
    });
  }, [assets, text, post.authorName, post.authorVerified, link, format, fontSize, theme]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const exportBlob = () =>
    new Promise<Blob>((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) return reject(new Error("no canvas"));
      try {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("empty"))), "image/png");
      } catch (reason) {
        reject(reason);
      }
    });

  const fileName = `naghshman-${post.id}-${format}.png`;

  const download = async () => {
    setBusy(true);
    setError("");
    try {
      const blob = await exportBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      onShared();
    } catch {
      setError("ساخت تصویر ممکن نشد. دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  };

  const canShareFile = typeof navigator !== "undefined" && typeof navigator.canShare === "function";
  const shareImage = async () => {
    setBusy(true);
    setError("");
    try {
      const file = new File([await exportBlob()], fileName, { type: "image/png" });
      if (!navigator.canShare?.({ files: [file] })) throw new Error("unsupported");
      await navigator.share({ files: [file], title: post.title ?? post.authorName });
      onShared();
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === "AbortError")) await download();
    } finally {
      setBusy(false);
    }
  };

  const previewWidth = format === "story" ? 310 : 330;

  return (
    <div role="dialog" aria-modal="true" aria-label="استودیو ساخت عکس‌نوشت" className="fixed inset-0 z-[260] flex flex-col overflow-y-auto bg-background/95 backdrop-blur-xl">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-divider bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-surface-muted text-foreground">
            <FileImage aria-hidden="true" className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-black leading-5 text-foreground">استودیو ساخت عکس‌نوشت (Story Maker)</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={onClose} aria-label="بستن" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface-muted text-foreground hover:bg-hover">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
          <button type="button" disabled={busy || !assets} onClick={() => void download()} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-emphasis px-4 text-xs font-black text-emphasis-foreground disabled:opacity-50">
            {busy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Download aria-hidden="true" className="h-4 w-4" />}
            دانلود عکس ({format === "story" ? "۹:۱۶ استوری" : "۱:۱ مربع"})
          </button>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-4xl gap-6 px-4 py-6 md:grid-cols-2 md:items-start">
        <div className="flex flex-col items-center">
          <canvas
            ref={canvasRef}
            aria-label="پیش‌نمایش عکس‌نوشت"
            className="h-auto rounded-[32px] shadow-dialog"
            style={{ width: previewWidth, aspectRatio: format === "story" ? "9 / 16" : "1 / 1" }}
          />
          {!assets ? <LoaderCircle aria-label="در حال آماده‌سازی" className="mt-3 h-5 w-5 animate-spin text-muted-foreground" /> : null}
          {truncated ? (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 py-1.5 text-[11px] font-semibold text-foreground">
              <AlertCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              حجم مطلب بیش از یک توییت ({STORY_TEXT_LIMIT.toLocaleString("fa-IR")} کاراکتر) است: همراه با «{STORY_MORE_LABEL}» کوتاه شد.
            </p>
          ) : null}
          {error ? <p role="alert" className="mt-2 text-xs font-bold text-danger">{error}</p> : null}
          {canShareFile ? (
            <button type="button" disabled={busy || !assets} onClick={() => void shareImage()} className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border bg-surface-muted px-4 text-xs font-black text-foreground disabled:opacity-50">
              <Share2 aria-hidden="true" className="h-4 w-4" />
              اشتراک مستقیم تصویر
            </button>
          ) : null}
        </div>

        <div className="space-y-5 rounded-3xl border border-border bg-surface p-4">
          <section>
            <h3 className="mb-2 text-xs font-black text-foreground">۱. انتخاب اندازه و کادر عکس‌نوشت:</h3>
            <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-surface-muted p-1">
              {([["story", "استوری (۹:۱۶)", RectangleVertical], ["square", "مربع (۱:۱)", Square]] as const).map(([id, label, Icon]) => (
                <button key={id} type="button" aria-pressed={format === id} onClick={() => setFormat(id)} className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black transition ${format === id ? "bg-emphasis text-emphasis-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3 className="mb-2 text-xs font-black text-foreground">۲. انتخاب اندازه قلم (سایز فونت):</h3>
            <div className="grid grid-cols-4 gap-1 rounded-2xl border border-border bg-surface-muted p-1">
              {FONT_SIZES.map((size) => (
                <button key={size.id} type="button" aria-pressed={fontSize === size.id} onClick={() => setFontSize(size.id)} className={`rounded-xl py-2.5 text-xs font-black transition ${fontSize === size.id ? "bg-emphasis text-emphasis-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {size.label}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3 className="mb-2 text-xs font-black text-foreground">۳. انتخاب رنگ و قالب:</h3>
            <div className="grid grid-cols-5 gap-2">
              {STORY_THEMES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  aria-label={item.label}
                  aria-pressed={themeId === item.id}
                  onClick={() => setThemeId(item.id)}
                  className={`h-12 rounded-2xl border-2 transition ${themeId === item.id ? "border-emphasis" : "border-transparent"}`}
                  style={{ backgroundImage: `linear-gradient(135deg, ${item.stops[0]} 0%, ${item.stops[1]} 50%, ${item.stops[2]} 100%)` }}
                />
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-surface-muted p-3 text-xs">
            <p className="text-muted-foreground">
              نویسنده: <strong className="text-foreground">{post.authorName}</strong>
              {post.authorVerified ? " · تیک تأیید دارد" : ""}
            </p>
            <p className="mt-2 leading-6 text-muted-foreground">متن دقیقاً برگرفته از روایت اصلی است و با بالاترین کیفیت ۱۰۸۰px دانلود می‌شود.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
