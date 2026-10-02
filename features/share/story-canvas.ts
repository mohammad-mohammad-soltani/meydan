/**
 * Draws a post as a shareable «عکس‌نوشت». The same function paints the
 * on-screen preview and the 1080px download, so what the user sees is exactly
 * what they get.
 */

export type StoryFormat = "story" | "square";
export type StoryFontSize = "sm" | "md" | "lg" | "xl";
export type StoryTheme = {
  id: string;
  label: string;
  stops: [string, string, string];
  /** Light backgrounds need dark text. */
  dark: boolean;
};

export const STORY_THEMES: StoryTheme[] = [
  { id: "galaxy", label: "کهکشان شب", stops: ["#1a1a1a", "#1e1b4b", "#311042"], dark: true },
  { id: "sunset", label: "غروب آتشین", stops: ["#881337", "#be123c", "#ea580c"], dark: true },
  { id: "emerald", label: "زمردی", stops: ["#064e3b", "#047857", "#0d9488"], dark: true },
  { id: "black", label: "لوکس مشکی", stops: ["#0a0a0a", "#1a1a1a", "#222222"], dark: true },
  { id: "light", label: "روشن مینیمال", stops: ["#f8fafc", "#e2e8f0", "#cbd5e1"], dark: false },
];

export const STORY_SIZES: Record<StoryFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

const FONT_PX: Record<StoryFormat, Record<StoryFontSize, number>> = {
  story: { sm: 46, md: 56, lg: 66, xl: 78 },
  square: { sm: 36, md: 42, lg: 50, xl: 58 },
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
  ctx.fillStyle = "#3b82f6";
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
  const { width: W, height: H } = STORY_SIZES[input.format];
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const square = input.format === "square";
  const pad = square ? 72 : 84;
  const fg = input.theme.dark ? "#ffffff" : "#0f172a";
  const muted = input.theme.dark ? "rgba(255,255,255,0.72)" : "rgba(15,23,42,0.62)";
  const font = (weight: number, px: number) => `${weight} ${px}px ${input.fontFamily}`;

  // Background: the theme gradient at 135° plus the two soft glows of the reference.
  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, input.theme.stops[0]);
  gradient.addColorStop(0.5, input.theme.stops[1]);
  gradient.addColorStop(1, input.theme.stops[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.filter = "blur(120px)";
  ctx.fillStyle = "rgba(244,63,94,0.22)";
  ctx.beginPath();
  ctx.arc(W - 40, 40, 300, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(14,165,233,0.2)";
  ctx.beginPath();
  ctx.arc(60, H - 60, 340, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.direction = "rtl";
  ctx.textBaseline = "middle";

  // Top row: brand on the right, hashtag pill on the left.
  const topY = pad + 40;
  const tile = 84;
  ctx.fillStyle = "rgba(225,29,72,0.92)";
  roundRect(ctx, W - pad - tile, topY - tile / 2, tile, tile, 26);
  ctx.fill();
  if (input.logo) ctx.drawImage(input.logo, W - pad - tile + 14, topY - tile / 2 + 14, tile - 28, tile - 28);
  ctx.fillStyle = fg;
  ctx.font = font(900, 40);
  ctx.textAlign = "right";
  ctx.fillText("نقش من", W - pad - tile - 22, topY + 2);

  ctx.font = font(500, 30);
  const tagWidth = ctx.measureText(input.hashtag).width + 52;
  ctx.fillStyle = input.theme.dark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)";
  roundRect(ctx, pad, topY - 30, tagWidth, 60, 30);
  ctx.fill();
  ctx.fillStyle = muted;
  ctx.textAlign = "center";
  ctx.fillText(input.hashtag, pad + tagWidth / 2, topY + 2);

  // Bottom row: author on the right, scan glyph on the left, above a hairline.
  const avatarR = 54;
  const bottomY = H - pad - avatarR;
  ctx.strokeStyle = input.theme.dark ? "rgba(255,255,255,0.15)" : "rgba(15,23,42,0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, bottomY - avatarR - 40);
  ctx.lineTo(W - pad, bottomY - avatarR - 40);
  ctx.stroke();

  const avatarX = W - pad - avatarR;
  if (input.authorAvatar) {
    drawCircleImage(ctx, input.authorAvatar, avatarX, bottomY, avatarR);
  } else {
    ctx.fillStyle = input.theme.dark ? "#f5f5f7" : "#0f172a";
    ctx.beginPath();
    ctx.arc(avatarX, bottomY, avatarR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = input.theme.dark ? "#0b0b0b" : "#ffffff";
    ctx.font = font(900, 44);
    ctx.textAlign = "center";
    ctx.fillText(input.authorName.trim().charAt(0) || "؟", avatarX, bottomY + 2);
  }
  const nameRight = W - pad - avatarR * 2 - 26;
  ctx.textAlign = "right";
  ctx.fillStyle = fg;
  ctx.font = font(800, 38);
  const name = input.authorName.length > 28 ? `${input.authorName.slice(0, 27)}…` : input.authorName;
  ctx.fillText(name, nameRight, bottomY - 22);
  if (input.authorVerified) {
    const nameWidth = ctx.measureText(name).width;
    drawTick(ctx, nameRight - nameWidth - 30, bottomY - 22, 17);
  }
  ctx.direction = "ltr";
  ctx.textAlign = "right";
  ctx.fillStyle = muted;
  // The first family is the Persian-digit face; a URL keeps Latin digits.
  ctx.font = `500 28px ${input.fontFamily.split(",").slice(1).join(",") || input.fontFamily}`;
  ctx.fillText(input.link, nameRight, bottomY + 26);
  ctx.direction = "rtl";
  const glyph = 96;
  ctx.fillStyle = input.theme.dark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.06)";
  roundRect(ctx, pad, bottomY - glyph / 2, glyph, glyph, 26);
  ctx.fill();
  drawScanGlyph(ctx, pad + 18, bottomY - glyph / 2 + 18, glyph - 36, fg);

  // Middle: the quote mark and the post text, vertically centred in the free band.
  const { text, truncated } = storyText(input.text);
  const px = FONT_PX[input.format][input.fontSize];
  const lineHeight = Math.round(px * 1.62);
  ctx.font = font(700, px);
  const maxWidth = W - pad * 2;
  const bandTop = topY + 70;
  const bandBottom = bottomY - avatarR - 70;
  const quoteSize = square ? 90 : 120;
  const maxLines = Math.max(1, Math.floor((bandBottom - bandTop - quoteSize - (truncated ? lineHeight : 0)) / lineHeight));
  let lines = wrap(ctx, text, maxWidth);
  let cut = truncated;
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    cut = true;
  }
  const blockHeight = quoteSize + lines.length * lineHeight + (cut ? lineHeight + 10 : 0);
  let y = bandTop + Math.max(0, (bandBottom - bandTop - blockHeight) / 2);

  ctx.fillStyle = input.theme.dark ? "rgba(244,63,94,0.55)" : "rgba(225,29,72,0.5)";
  ctx.font = `900 ${quoteSize * 1.6}px Georgia, serif`;
  ctx.textAlign = "right";
  ctx.fillText("”", W - pad, y + quoteSize * 0.55);
  y += quoteSize;

  ctx.font = font(700, px);
  ctx.fillStyle = fg;
  for (const line of lines) {
    ctx.fillText(line, W - pad, y + lineHeight / 2);
    y += lineHeight;
  }

  if (cut) {
    ctx.font = font(800, Math.round(px * 0.82));
    const label = STORY_MORE_LABEL;
    const labelWidth = ctx.measureText(label).width + 36;
    const labelHeight = Math.round(px * 1.25);
    ctx.fillStyle = input.theme.dark ? "rgba(24,24,24,0.85)" : "rgba(15,23,42,0.9)";
    roundRect(ctx, W - pad - labelWidth, y + 6, labelWidth, labelHeight, 12);
    ctx.fill();
    ctx.fillStyle = "#f5f5f7";
    ctx.textAlign = "center";
    ctx.fillText(label, W - pad - labelWidth / 2, y + 6 + labelHeight / 2 + 2);
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
