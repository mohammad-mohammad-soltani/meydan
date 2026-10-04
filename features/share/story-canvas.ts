/**
 * Draws a post as a shareable «عکس‌نوشت». The same function paints the
 * on-screen preview and the 1080px download, keeping their composition together.
 */

export type StoryFormat = "story" | "square";
export type StoryFontSize = "sm" | "md" | "lg" | "xl";
export type StoryTheme = {
  id: string;
  label: string;
  stops: [string, string, string];
  /** Light backgrounds need dark text. */
  dark: boolean;
  middleStop?: number;
};

export const STORY_THEMES: StoryTheme[] = [
  { id: "galaxy", label: "کهکشان شب", stops: ["#1a1a1a", "#1e1b4b", "#311042"], dark: true },
  { id: "sunset", label: "غروب آتشین", stops: ["#881337", "#b50d22", "#ea580c"], dark: true, middleStop: 45 },
  { id: "emerald", label: "زمردی", stops: ["#064e3b", "#047857", "#0d9488"], dark: true },
  { id: "black", label: "لوکس مشکی", stops: ["#0a0a0a", "#1a1a1a", "#222222"], dark: true },
  { id: "light", label: "روشن مینیمال", stops: ["#f8fafc", "#e2e8f0", "#cbd5e1"], dark: false },
];

export const STORY_SIZES: Record<StoryFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

/** A tweet's length: longer posts are cut and point the reader to the app. */
export const STORY_TEXT_LIMIT = 280;
export const STORY_MORE_LABEL = "... ادامه در نقش من";

export type StoryInput = {
  text: string;
  authorName: string;
  authorVerified: boolean;
  authorAvatar: HTMLImageElement | null;
  logo: HTMLImageElement | null;
  hashtag: string;
  link: string;
  format: StoryFormat;
  fontSize: StoryFontSize;
  theme: StoryTheme;
  fontFamily: string;
};

/** The text that fits the card, and whether it was cut. */
export function storyText(text: string): { text: string; truncated: boolean } {
  const clean = text.replace(/\s+\n/g, "\n").trim();
  if (clean.length <= STORY_TEXT_LIMIT) return { text: clean, truncated: false };
  const cut = clean.slice(0, STORY_TEXT_LIMIT);
  const space = cut.lastIndexOf(" ");
  return { text: (space > STORY_TEXT_LIMIT * 0.7 ? cut.slice(0, space) : cut).trim(), truncated: true };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Greedy right-to-left word wrap, keeping the author's own line breaks. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth || !line) line = next;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

function drawCircleImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  ctx.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
}

function drawTick(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = r * 0.28;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.45, cy + r * 0.02);
  ctx.lineTo(cx - r * 0.1, cy + r * 0.38);
  ctx.lineTo(cx + r * 0.5, cy - r * 0.35);
  ctx.stroke();
  ctx.restore();
}

/** A scan-code glyph like the reference's corner badge. */
function drawScanGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const unit = size / 7;
  ctx.save();
  ctx.fillStyle = color;
  const finder = (fx: number, fy: number) => {
    roundRect(ctx, fx, fy, unit * 2.6, unit * 2.6, unit * 0.6);
    ctx.lineWidth = unit * 0.55;
    ctx.strokeStyle = color;
    ctx.stroke();
  };
  finder(x, y);
  finder(x + size - unit * 2.6, y);
  finder(x, y + size - unit * 2.6);
  for (const [dx, dy] of [[4.4, 4.4], [5.6, 4.4], [4.4, 5.6], [5.6, 5.6]]) {
    roundRect(ctx, x + unit * dx, y + unit * dy, unit, unit, unit * 0.2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawStory(canvas: HTMLCanvasElement, input: StoryInput): void {
  const { width, height } = STORY_SIZES[input.format];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");

  // Reference preview geometry; render at export resolution with the same composition.
  const square = input.format === "square";
  const W = square ? 340 : 310;
  const H = square ? 340 : 510;
  const pad = square ? 20 : 24;
  const fg = input.theme.dark ? "#ffffff" : "#111827";
  const muted = input.theme.dark ? "rgba(255,255,255,.7)" : "rgba(17,24,39,.7)";
  const font = (weight: number, px: number) => `${weight} ${px}px ${input.fontFamily}`;
  ctx.scale(width / W, height / H);
  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, input.theme.stops[0]);
  gradient.addColorStop((input.theme.middleStop ?? 50) / 100, input.theme.stops[1]);
  gradient.addColorStop(1, input.theme.stops[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.filter = "blur(64px)";
  ctx.fillStyle = "rgba(240,36,58,.2)";
  ctx.beginPath(); ctx.arc(W - 40, 40, 88, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(14,165,233,.2)";
  ctx.beginPath(); ctx.arc(56, H - 40, 104, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.direction = "rtl";
  ctx.textBaseline = "middle";

  const topY = pad + 14;
  ctx.fillStyle = "rgba(225,29,72,.9)";
  roundRect(ctx, W - pad - 28, pad, 28, 28, 12); ctx.fill();
  if (input.logo) ctx.drawImage(input.logo, W - pad - 21, pad + 7, 14, 14);
  ctx.font = font(900, 12); ctx.fillStyle = fg; ctx.textAlign = "right";
  ctx.fillText("نقش من", W - pad - 36, topY);
  const tag = square ? `${input.hashtag} (۱:۱)` : input.hashtag;
  ctx.font = font(400, 10);
  const tagW = ctx.measureText(tag).width + 20;
  ctx.fillStyle = "rgba(255,255,255,.1)";
  roundRect(ctx, pad, topY - 10, tagW, 20, 10); ctx.fill();
  ctx.fillStyle = muted; ctx.textAlign = "center";
  ctx.fillText(tag, pad + tagW / 2, topY);

  const avatarR = square ? 16 : 18;
  const bottomY = H - pad - avatarR;
  const footerTop = bottomY - avatarR - (square ? 10 : 16);
  ctx.strokeStyle = "rgba(255,255,255,.15)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, footerTop); ctx.lineTo(W - pad, footerTop); ctx.stroke();
  const avatarX = W - pad - avatarR;
  if (input.authorAvatar) drawCircleImage(ctx, input.authorAvatar, avatarX, bottomY, avatarR);
  else {
    ctx.fillStyle = "rgba(225,29,72,.8)";
    ctx.beginPath(); ctx.arc(avatarX, bottomY, avatarR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = font(700, 12); ctx.textAlign = "center";
    ctx.fillText(input.authorName.trim().charAt(0) || "؟", avatarX, bottomY);
  }
  const nameRight = W - pad - avatarR * 2 - 8;
  ctx.fillStyle = fg; ctx.font = font(700, 12); ctx.textAlign = "right";
  const name = input.authorName.length > 25 ? `${input.authorName.slice(0, 24)}…` : input.authorName;
  ctx.fillText(name, nameRight, bottomY - 7, W - pad * 2 - avatarR * 2 - 50);
  if (input.authorVerified) drawTick(ctx, nameRight - Math.min(ctx.measureText(name).width, W - pad * 2 - avatarR * 2 - 50) - 9, bottomY - 7, 6);
  ctx.direction = "ltr"; ctx.font = font(400, 10); ctx.fillStyle = muted;
  ctx.fillText(input.link, nameRight, bottomY + 10, W - pad * 2 - avatarR * 2 - 50);
  ctx.direction = "rtl";
  const glyph = square ? 32 : 36;
  ctx.fillStyle = "rgba(255,255,255,.1)";
  roundRect(ctx, pad, bottomY - glyph / 2, glyph, glyph, 12); ctx.fill();
  drawScanGlyph(ctx, pad + 5, bottomY - glyph / 2 + 5, glyph - 10, fg);

  const { text, truncated } = storyText(input.text);
  const px = (square ? { sm: 11, md: 12, lg: 14, xl: 16 } : { sm: 12, md: 14, lg: 16, xl: 18 })[input.fontSize];
  const lineHeight = px * 1.625;
  ctx.font = font(700, px);
  const availableWidth = W - pad * 2;
  const quoteSize = square ? 24 : 32;
  const gap = square ? 6 : 12;
  const bandTop = pad + 44;
  const bandBottom = footerTop - 16;
  const capacity = Math.max(1, Math.floor((bandBottom - bandTop - quoteSize - gap - (truncated ? lineHeight + 6 : 0)) / lineHeight));
  const maxLines = square ? Math.min(capacity, { sm: 5, md: 4, lg: 4, xl: 3 }[input.fontSize]) : capacity;
  let lines = wrap(ctx, text, availableWidth);
  const cut = truncated || lines.length > maxLines;
  lines = lines.slice(0, maxLines);
  if (cut && !truncated && lines.length) lines[lines.length - 1] = lines[lines.length - 1].replace(/\s+\S*$/, "") + "…";
  const blockHeight = quoteSize + gap + lines.length * lineHeight + (truncated ? lineHeight + 6 : 0);
  let y = bandTop + Math.max(0, (bandBottom - bandTop - blockHeight) / 2);
  ctx.save();
  ctx.translate(W - pad - quoteSize, y); ctx.scale(quoteSize / 24, quoteSize / 24);
  ctx.fillStyle = "rgba(240,36,58,.5)";
  ctx.fill(new Path2D("M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"));
  ctx.restore();
  y += quoteSize + gap;
  ctx.fillStyle = fg; ctx.textAlign = "right"; ctx.font = font(700, px);
  for (const line of lines) { ctx.fillText(line, W - pad, y + lineHeight / 2); y += lineHeight; }
  if (truncated) {
    ctx.font = font(800, px);
    const labelWidth = Math.min(availableWidth, ctx.measureText(STORY_MORE_LABEL).width + 12);
    ctx.fillStyle = "rgba(240,36,58,.1)";
    roundRect(ctx, W - pad - labelWidth, y + 3, labelWidth, lineHeight + 4, 4); ctx.fill();
    ctx.strokeStyle = "rgba(240,36,58,.2)"; ctx.stroke();
    ctx.fillStyle = "#fb7185"; ctx.textAlign = "center";
    ctx.fillText(STORY_MORE_LABEL, W - pad - labelWidth / 2, y + 5 + lineHeight / 2);
  }
}

/** Loads an image for canvas use; `null` when it cannot be read (no CORS, 404…). */
export function loadImage(src: string | undefined): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}
