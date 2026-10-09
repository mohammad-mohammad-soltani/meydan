'use strict';
const W = 1920, H = 1080;
// Section starts on the global clock. The feature line runs LINE_END - 37.9s; the hub and the end card follow it.
const S1_EXTRA = 1.6; // seconds added to the opening scene for the four-frame moment; every later scene is shifted by it
const LINE_END = 53.8, HUB_S = LINE_END - 0.3, HUB_FADE = HUB_S + 12.0, S8 = HUB_FADE, SEQ_LEN = 17.6, DUR = S8 + SEQ_LEN + S1_EXTRA;
const GEO = JSON.parse(document.getElementById('geo-data').textContent);
const LOGO = new Path2D(document.getElementById('logo-d').textContent.trim());
const FONT = "Vazirmatn, Tahoma, sans-serif";
let FONT_OVERRIDE = null;
const UIF = "IRANSansX, Vazirmatn, Tahoma, sans-serif";
const C = {
  bg: '#05060a', gold: '#f2c46d', goldHi: '#ffe3a3', goldSoft: '#e8cf98', red: '#dc2626', redHi: '#ef4444',
  ink: '#f5f5f7', mute: '#9aa0ab', card: '#0f1116', line: 'rgba(255,255,255,0.08)', green: '#22c55e',
};
const GOLD = [242, 196, 109], GOLDHI = [255, 227, 163], WARM = [255, 214, 160], REDC = [220, 38, 38];

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const smooth = (a, b, x) => { const t = inv(a, b, x); return t * t * (3 - 2 * t); };
const E = {
  io: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  sine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  expo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const FA = '۰۱۲۳۴۵۶۷۸۹';
const fa = s => String(s).replace(/[0-9]/g, d => FA[d]);
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

const TX = mk(2200, 420), TXC = TX.getContext('2d');
function txt(c, s, x, y, o = {}) {
  const a = o.alpha == null ? 1 : clamp(o.alpha);
  if (a <= 0.003) return;
  // Faded Persian text with glow shows seams at letter joins; fade it as one bitmap instead.
  if (a < 0.995 && c !== TXC && (o.glow || (o.size || 32) >= 44)) {
    TXC.clearRect(0, 0, 2200, 420);
    const ax = o.align === 'right' ? 2100 : o.align === 'left' ? 100 : 1100;
    txt(TXC, s, ax, 210, { ...o, alpha: 1 });
    c.save(); c.globalAlpha *= a; c.drawImage(TX, x - ax, y - 210); c.restore();
    return;
  }
  c.save();
  c.font = `${o.w || 400} ${o.size || 32}px ${o.f || FONT_OVERRIDE || FONT}`;
  c.fillStyle = o.color || C.ink;
  c.textAlign = o.align || 'center';
  c.textBaseline = o.base || 'middle';
  c.direction = o.dir || 'rtl';
  if (o.alpha != null) c.globalAlpha *= clamp(o.alpha);
  if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = o.blur || 24; }
  c.fillText(s, x, y);
  c.restore();
}
const MCTX = mk(4, 4).getContext('2d');
function measure(s, size, w, f) { MCTX.font = `${w || 400} ${size}px ${f || FONT_OVERRIDE || FONT}`; MCTX.direction = 'rtl'; return MCTX.measureText(s).width; }
function wrap(s, size, w, maxW, f) {
  const words = s.split(' '), lines = [];
  let cur = '';
  for (const wd of words) {
    const test = cur ? cur + ' ' + wd : wd;
    if (measure(test, size, w, f) > maxW && cur) { lines.push(cur); cur = wd; } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

// Lucide icon geometry (ISC), 24×24 grid
const circ = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const IC = {
  mic: ['M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z', 'M19 10v2a7 7 0 0 1-14 0v-2', 'M12 19v3'],
  phone: ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z', 'M14.05 2a9 9 0 0 1 8 7.94', 'M14.05 6A5 5 0 0 1 18 10'],
  mega: ['m3 11 18-5v12L3 14v-3z', 'M11.6 16.8a3 3 0 1 1-5.8-1.6'],
  note: ['M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4', 'M2 6h4', 'M2 10h4', 'M2 14h4', 'M2 18h4', 'M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z'],
  audio: ['M2 10v3', 'M6 6v11', 'M10 3v18', 'M14 8v7', 'M18 5v13', 'M22 10v3'],
  heart: ['M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'],
  repeat: ['m2 9 3-3 3 3', 'M13 18H7a2 2 0 0 1-2-2V6', 'm22 15-3 3-3-3', 'M11 6h6a2 2 0 0 1 2 2v10'],
  msg: ['M7.9 20A9 9 0 1 0 4 16.1L2 22Z'],
  badge: ['M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z', 'm9 12 2 2 4-4'],
  user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', circ(12, 7, 4)],
  share: [circ(18, 5, 3), circ(6, 12, 3), circ(18, 19, 3), 'M8.59 13.51l6.83 3.98', 'M15.41 6.51l-6.82 3.98'],
  news: ['M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2', 'M18 14h-8', 'M15 18h-5', 'M10 6h8v4h-8V6Z'],
  palette: [circ(13.5, 6.5, 0.6), circ(17.5, 10.5, 0.6), circ(8.5, 7.5, 0.6), circ(6.5, 12.5, 0.6), 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z'],
  steth: ['M11 2v2', 'M5 2v2', 'M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1', 'M8 15a6 6 0 0 0 12 0v-3', circ(20, 10, 2)],
  hammer: ['m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9', 'm18 15 4-4', 'm21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5'],
  book: ['M12 7v14', 'M16 12h2', 'M16 8h2', 'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z', 'M6 12h2', 'M6 8h2'],
  help: ['M11 12h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 14', 'm7 18 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9', 'm2 13 6 6'],
  tv: ['M4 7h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z', 'm17 2-5 5-5-5'],
  pin: ['M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0', circ(12, 10, 3)],
  chats: ['M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z', 'M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1'],
  film: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M7 3v18', 'M3 7.5h4', 'M3 12h18', 'M3 16.5h4', 'M17 3v18', 'M17 7.5h4', 'M17 16.5h4'],
  quote: ['M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z', 'M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z'],
  send: ['M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z', 'm21.854 2.147-10.94 10.939'],
  play: ['M6 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L7.5 3.64A1 1 0 0 0 6 4.5z'],
  uround: ['M20 21a8 8 0 0 0-16 0', circ(12, 8, 5)],
  uroundS: ['M18 21a8 8 0 0 0-16 0', circ(10, 8, 5), 'M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3'],
  check: ['M20 6 9 17l-5-5'],
  chevd: ['m6 9 6 6 6-6'],
  arrowL: ['m12 19-7-7 7-7', 'M19 12H5'],
  shield: ['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z', 'm9 12 2 2 4-4'],
  chatMore: ['M7.9 20A9 9 0 1 0 4 16.1L2 22Z', 'M8 12h.01', 'M12 12h.01', 'M16 12h.01'],
  sparkle: ['M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z', 'M20 3v4', 'M22 5h-4', 'M4 17v2', 'M5 18H3'],
  at: [circ(12, 12, 4), 'M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8'],
  brief: ['M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16', 'M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z'],
};
const IP = {};
for (const k in IC) IP[k] = IC[k].map(d => new Path2D(d));
function icon(c, name, x, y, size, color, lw = 2) {
  c.save();
  c.translate(x - size / 2, y - size / 2);
  c.scale(size / 24, size / 24);
  c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = color;
  for (const p of IP[name]) c.stroke(p);
  c.restore();
}

function mark(c, x, y, size, color) {
  c.save();
  c.translate(x, y);
  const s = size / 536;
  c.scale(s, s);
  c.translate(-265.5, -268);
  c.fillStyle = color;
  c.fill(LOGO, 'evenodd');
  c.restore();
}
function logoTile(c, x, y, size) {
  c.save();
  c.fillStyle = C.red;
  c.beginPath(); c.roundRect(x - size / 2, y - size / 2, size, size, size * 0.226); c.fill();
  mark(c, x, y, size * 0.62, '#fff');
  c.restore();
}

function glowLine(c, build, alpha = 1, width = 2, col = GOLD, core = GOLDHI) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round'; c.lineJoin = 'round';
  build();
  for (const [w, a, cc] of [[width * 7, 0.05, col], [width * 2.8, 0.16, col], [width, 0.95, core]]) {
    c.globalAlpha = clamp(alpha * a); c.lineWidth = w; c.strokeStyle = rgba(cc, 1); c.stroke();
  }
  c.restore();
}
function glowDot(c, x, y, r, col = GOLD, alpha = 1) {
  if (alpha <= 0.002) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, clamp(alpha)));
  g.addColorStop(0.35, rgba(col, clamp(alpha) * 0.35));
  g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g;
  c.fillRect(x - r, y - r, 2 * r, 2 * r);
  c.restore();
}
// A small person glyph: the visual unit of a «نقش»
function figure(c, x, y, s, color, alpha) {
  if (alpha <= 0.01) return;
  c.save();
  c.globalAlpha *= clamp(alpha);
  c.fillStyle = color;
  c.beginPath(); c.arc(x, y - s * 0.3, s * 0.17, 0, Math.PI * 2); c.fill();
  c.beginPath();
  c.moveTo(x - s * 0.3, y + s * 0.4);
  c.quadraticCurveTo(x - s * 0.3, y - s * 0.07, x, y - s * 0.08);
  c.quadraticCurveTo(x + s * 0.3, y - s * 0.07, x + s * 0.3, y + s * 0.4);
  c.closePath(); c.fill();
  c.restore();
}

let GRAIN = [];
function buildGrain() {
  GRAIN = [0, 1, 2, 3].map(i => {
    const g = mk(256, 256), gc = g.getContext('2d'), d = gc.createImageData(256, 256), r = rng(99 + i);
    for (let k = 0; k < d.data.length; k += 4) { const v = r() * 255; d.data[k] = d.data[k + 1] = d.data[k + 2] = v; d.data[k + 3] = 255; }
    gc.putImageData(d, 0, 0);
    return g;
  });
}
function finish(c, t, vig = 0.6) {
  const g = c.createRadialGradient(W / 2, H / 2, H * 0.38, W / 2, H / 2, H * 1.0);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${vig})`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save();
  c.globalAlpha = 0.05; c.globalCompositeOperation = 'overlay';
  c.fillStyle = c.createPattern(GRAIN[((Math.floor(t * 24) % 4) + 4) % 4], 'repeat');
  c.fillRect(0, 0, W, H);
  c.restore();
}
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
let FLAG;
