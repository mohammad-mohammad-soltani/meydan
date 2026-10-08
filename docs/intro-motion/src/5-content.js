// ───────── Scene 6 · content hub (50 – 56s) and Scene 7 · brand finale (56 – 60s)
const CC_W = 500, CC_H = 312;
const CCARDS = [
  { ic: 'mic', t: 'اعزام سخنران', x: 1250, y: 262 },
  { ic: 'phone', t: 'بیست‌کال', x: 710, y: 262 },
  { ic: 'mega', t: 'پویش', x: 170, y: 262 },
  { ic: 'note', t: 'یادداشت', x: 980, y: 612 },
  { ic: 'audio', t: 'آوا و نوا', x: 440, y: 612 },
];
CCARDS.forEach((cd, i) => { cd.at = 50.35 + i * 0.16; });
let WAVE = [];

function chip(c, s, xr, y, on) {
  const w = measure(s, 19, 600) + 28;
  c.save();
  c.fillStyle = on ? 'rgba(242,196,109,0.16)' : 'rgba(255,255,255,0.06)';
  c.strokeStyle = on ? 'rgba(242,196,109,0.5)' : 'rgba(255,255,255,0.08)'; c.lineWidth = 1.2;
  c.beginPath(); c.roundRect(xr - w, y - 17, w, 34, 17); c.fill(); c.stroke();
  c.restore();
  txt(c, s, xr - w / 2, y + 1, { size: 19, w: 600, color: on ? C.goldHi : '#c9ccd3' });
  return w;
}

function contentCard(c, cd, i, t) {
  const k = E.out(inv(cd.at, cd.at + 0.65, t));
  if (k <= 0) return;
  const x = cd.x, y = cd.y + (1 - k) * 40, w = CC_W, h = CC_H, R = x + w - 30, lt = t - cd.at;
  c.save();
  c.globalAlpha *= smooth(cd.at, cd.at + 0.4, t);
  c.translate(x + w / 2, y + h / 2); c.scale(lerp(0.94, 1, k), lerp(0.94, 1, k)); c.translate(-x - w / 2, -y - h / 2);
  const bg = c.createLinearGradient(0, y, 0, y + h);
  bg.addColorStop(0, '#14161d'); bg.addColorStop(1, '#0c0d12');
  c.fillStyle = bg; c.beginPath(); c.roundRect(x, y, w, h, 26); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.09)'; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = 'rgba(242,196,109,0.12)'; c.beginPath(); c.arc(R - 28, y + 58, 28, 0, Math.PI * 2); c.fill();
  icon(c, cd.ic, R - 28, y + 58, 28, C.gold, 2);
  txt(c, cd.t, R - 72, y + 58, { size: 32, w: 800, align: 'right' });
  if (i === 0) {
    const ax = R - 32, ay = y + 140;
    const ag = c.createLinearGradient(ax - 32, ay - 32, ax + 32, ay + 32);
    ag.addColorStop(0, '#3a3f4a'); ag.addColorStop(1, '#1a1d24');
    c.fillStyle = ag; c.beginPath(); c.arc(ax, ay, 32, 0, Math.PI * 2); c.fill();
    icon(c, 'user', ax, ay, 32, '#d6d9df', 1.8);
    txt(c, 'سخنران مهمان', ax - 48, ay - 14, { size: 25, w: 700, align: 'right' });
    txt(c, 'موضوع: نقش مردم در میدان', ax - 48, ay + 18, { size: 19, color: C.mute, align: 'right' });
    txt(c, 'پنجشنبه · ساعت ۱۸ · میدان انقلاب', R, y + 200, { size: 19, color: C.mute, align: 'right' });
    const bx = x + 30, by = y + 234, bw = w - 60, bh = 50;
    c.fillStyle = C.red; c.beginPath(); c.roundRect(bx, by, bw, bh, 14); c.fill();
    const tap = inv(52.3, 53.0, t);
    if (tap > 0 && tap < 1) {
      c.save(); c.beginPath(); c.roundRect(bx, by, bw, bh, 14); c.clip();
      c.fillStyle = `rgba(255,255,255,${0.35 * (1 - tap)})`; c.beginPath(); c.arc(bx + bw * 0.62, by + bh / 2, 20 + tap * 260, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    txt(c, t > 52.55 ? 'درخواست ثبت شد' : 'درخواست سخنران', bx + bw / 2, by + bh / 2 + 1, { size: 22, w: 700 });
  } else if (i === 1) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 5);
    glowDot(c, R - 8, y + 128, 20, [34, 197, 94], 0.5 * pulse + 0.2);
    c.fillStyle = C.green; c.beginPath(); c.arc(R - 8, y + 128, 7, 0, Math.PI * 2); c.fill();
    txt(c, 'در حال تماس', R - 26, y + 129, { size: 23, w: 700, color: '#4ade80', align: 'right' });
    const secs = 12 + Math.max(0, Math.floor(lt));
    txt(c, fa(`00:${String(secs).padStart(2, '0')}`), x + 30, y + 129, { size: 22, w: 600, color: '#c9ccd3', align: 'left', dir: 'ltr' });
    const cols = ['#3b82f6', '#a855f7', '#f59e0b', '#10b981', '#ef4444', '#64748b'];
    const speaking = Math.floor(t * 1.4) % 6;
    for (let j = 5; j >= 0; j--) {
      const cx = R - 26 - j * 40, cy = y + 192;
      c.fillStyle = '#0f1116'; c.beginPath(); c.arc(cx, cy, 28, 0, Math.PI * 2); c.fill();
      c.fillStyle = cols[j]; c.globalAlpha *= 0.85; c.beginPath(); c.arc(cx, cy, 25, 0, Math.PI * 2); c.fill(); c.globalAlpha /= 0.85;
      icon(c, 'user', cx, cy, 26, 'rgba(255,255,255,0.9)', 2);
      if (j === speaking) { c.strokeStyle = '#4ade80'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, 28, 0, Math.PI * 2); c.stroke(); }
    }
    txt(c, '+۱۴', R - 26 - 6 * 40 - 4, y + 193, { size: 21, w: 700, color: '#c9ccd3', align: 'right', dir: 'ltr' });
    txt(c, '۲۰ نفر · گفت‌وگوی گروهی', R, y + 262, { size: 19, color: C.mute, align: 'right' });
    c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.arc(x + 58, y + 262, 26, 0, Math.PI * 2); c.fill();
    icon(c, 'mic', x + 58, y + 262, 24, '#d6d9df', 2);
    c.fillStyle = C.red; c.beginPath(); c.arc(x + 122, y + 262, 26, 0, Math.PI * 2); c.fill();
    c.save(); c.translate(x + 122, y + 262); c.rotate(2.36); icon(c, 'phone', 0, 0, 22, '#fff', 2.2); c.restore();
  } else if (i === 2) {
    txt(c, 'پویش «پرچم من»', R, y + 122, { size: 25, w: 700, align: 'right' });
    txt(c, 'یک پیام، برای همه', R, y + 155, { size: 19, color: C.mute, align: 'right' });
    const pg = 0.72 * E.io(inv(cd.at + 0.4, cd.at + 2.2, t)), bw = w - 60;
    c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.roundRect(x + 30, y + 186, bw, 10, 5); c.fill();
    const g = c.createLinearGradient(R - bw * pg, 0, R, 0); g.addColorStop(0, '#f6d58e'); g.addColorStop(1, '#c8902f');
    if (pg > 0.01) { c.fillStyle = g; c.beginPath(); c.roundRect(R - bw * pg, y + 186, bw * pg, 10, 5); c.fill(); }
    const n = Math.round(12480 * pg / 0.72);
    txt(c, `${fa(n.toLocaleString('en-US').replace(/,/g, '٬'))} نفر مشارکت کرده‌اند`, R, y + 220, { size: 19, color: '#c9ccd3', align: 'right' });
    txt(c, `٪${fa(Math.round(pg * 100))}`, x + 30, y + 220, { size: 19, w: 700, color: C.gold, align: 'left' });
    c.strokeStyle = 'rgba(242,196,109,0.6)'; c.lineWidth = 1.6;
    c.beginPath(); c.roundRect(x + 30, y + 246, w - 60, 46, 14); c.stroke();
    icon(c, 'share', x + w / 2 + 92, y + 269, 20, C.gold, 2);
    txt(c, 'ارسال برای همه', x + w / 2 - 10, y + 270, { size: 21, w: 700, color: C.goldHi });
  } else if (i === 3) {
    let xr = R;
    ['تحلیلی', 'سیاسی', 'اجتماعی'].forEach((s, j) => { xr -= chip(c, s, xr, y + 118, j === 0) + 8; });
    txt(c, 'میدان، صدای مشترک ما', R, y + 172, { size: 28, w: 800, align: 'right' });
    txt(c, 'وقتی مردم کنار هم می‌ایستند، معادله‌ها تغییر می‌کند؛', R, y + 214, { size: 19, color: '#b8bcc6', align: 'right' });
    txt(c, 'این یادداشت از نقش حضور جمعی می‌گوید.', R, y + 246, { size: 19, color: '#b8bcc6', align: 'right' });
    txt(c, '۵ دقیقه مطالعه', R, y + 284, { size: 17, color: C.mute, align: 'right' });
  } else {
    let xr = R;
    ['سخنرانی', 'مداحی', 'نوا'].forEach((s, j) => { xr -= chip(c, s, xr, y + 118, j === 1) + 8; });
    const px = R - 30, py = y + 190;
    c.fillStyle = C.gold; c.beginPath(); c.arc(px, py, 30, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#14100a';
    c.beginPath(); c.roundRect(px - 9, py - 11, 6, 22, 2); c.roundRect(px + 3, py - 11, 6, 22, 2); c.fill();
    const prog = 0.32 + lt * 0.05, n = WAVE.length, x1 = R - 76, x0 = x + 30, step = (x1 - x0) / n;
    for (let j = 0; j < n; j++) {
      const bx = x1 - j * step, amp = WAVE[j] * (0.75 + 0.25 * Math.sin(t * 7 + j * 0.9));
      c.fillStyle = j / n < prog ? C.gold : 'rgba(255,255,255,0.18)';
      c.beginPath(); c.roundRect(bx - 2.5, py - amp * 26, 5, Math.max(4, amp * 52), 2.5); c.fill();
    }
    txt(c, 'نوای «ایران»', R, y + 252, { size: 22, w: 700, align: 'right' });
    txt(c, fa('01:' + String(24 + Math.floor(Math.max(0, lt))).padStart(2, '0')), R, y + 284, { size: 17, color: C.mute, align: 'right' });
    txt(c, fa('04:10'), x + 30, y + 284, { size: 17, color: C.mute, align: 'left' });
  }
  c.restore();
}

function drawContent(c, t, cardsA = 1) {
  c.fillStyle = '#06070a'; c.fillRect(0, 0, W, H);
  c.save();
  const r = rng(9);
  for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(242,196,109,${0.04 + r() * 0.05})`; c.fillRect(r() * W, r() * H, 1.6, 1.6); }
  c.restore();
  glowDot(c, W / 2, 150, 520, [120, 40, 30], 0.35);
  const ha = smooth(49.9, 50.5, t) * cardsA;
  txt(c, 'بخش محتوا', W / 2, 118 + (1 - ha) * 10, { size: 26, w: 700, color: C.gold, alpha: ha });
  txt(c, 'همه‌ی محتوا، یک‌جا', W / 2, 176 + (1 - ha) * 10, { size: 54, w: 900, alpha: ha });
  c.save(); c.globalAlpha = cardsA;
  CCARDS.forEach((cd, i) => contentCard(c, cd, i, t));
  c.restore();
  finish(c, t, 0.5);
}

// ── finale
let PARTS = [], IRAN_PTS = [], FCITIES = [];
const IR_K = 33, IR_CX = 960, IR_CY = 360;
const irXY = ([lon, lat]) => [IR_CX + (lon - 53.6) * IR_K * Math.cos(32.4 * Math.PI / 180), IR_CY - (lat - 32.4) * IR_K];

function buildFinale() {
  const main = IRAN_RINGS.reduce((a, b) => (b.length > a.length ? b : a));
  const pts = main.map(irXY);
  let total = 0;
  const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); total += d; }
  const N = 380;
  for (let k = 0; k < N; k++) {
    let d = (k / N) * total, i = 0;
    while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
    const f = seg[i] ? d / seg[i] : 0;
    IRAN_PTS.push([lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]);
  }
  const r = rng(55);
  PARTS = IRAN_PTS.map((tp, i) => {
    const cd = CCARDS[(r() * CCARDS.length) | 0];
    return { sx: cd.x + r() * CC_W, sy: cd.y + r() * CC_H, tx: tp[0], ty: tp[1], d: r() * 0.55, sw: (r() - 0.5) * 520, r: 1.4 + r() * 1.4, ph: r() * 6.28 };
  });
  FCITIES = CITIES.filter(cy => cy.big).map((cy, i) => ({ p: irXY(cy.ll), d: i * 0.12 }));
  const rw = rng(8);
  WAVE = Array.from({ length: 46 }, (_, j) => 0.25 + 0.75 * Math.abs(Math.sin(j * 0.55) * 0.6 + (rw() - 0.5) * 0.7));
}

function drawFinale(c, t) {
  const pT0 = 55.5;
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const p of PARTS) {
    const u = E.io(inv(pT0 + p.d, pT0 + p.d + 1.5, t));
    if (u <= 0) continue;
    const mx = (p.sx + p.tx) / 2 + p.sw, my = (p.sy + p.ty) / 2 - 120;
    const at = s => [(1 - s) * (1 - s) * p.sx + 2 * (1 - s) * s * mx + s * s * p.tx, (1 - s) * (1 - s) * p.sy + 2 * (1 - s) * s * my + s * s * p.ty];
    const [x, y] = at(u);
    const tw = u >= 1 ? 0.65 + 0.35 * Math.sin(t * 3 + p.ph) : 1;
    if (u < 1) {
      const [x2, y2] = at(Math.max(0, u - 0.035));
      c.strokeStyle = rgba(GOLD, 0.32); c.lineWidth = p.r * 0.8; c.beginPath(); c.moveTo(x2, y2); c.lineTo(x, y); c.stroke();
    }
    c.fillStyle = rgba(GOLDHI, 0.9 * tw);
    c.beginPath(); c.arc(x, y, p.r, 0, Math.PI * 2); c.fill();
  }
  c.restore();
  const ol = smooth(56.9, 57.8, t);
  if (ol > 0) {
    glowLine(c, () => { c.beginPath(); IRAN_PTS.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); }, ol * 0.55, 1.2);
    const tc = irXY([51.389, 35.689]);
    FCITIES.forEach((fc, i) => {
      if (i === 0) return;
      const f = E.io(inv(57.0 + fc.d, 57.7 + fc.d, t));
      if (f <= 0) return;
      glowLine(c, () => { c.beginPath(); arcPartial(c, tc, fc.p, (i % 2 ? 1 : -1) * 0.12, f); }, 0.5, 1);
    });
    FCITIES.forEach(fc => {
      const a = smooth(57.1 + fc.d, 57.4 + fc.d, t);
      const fig = Math.sin(Math.PI * inv(57.2 + fc.d, 58.4 + fc.d, t));
      glowDot(c, fc.p[0], fc.p[1], 22, GOLD, a * 0.6);
      c.save(); c.globalAlpha = a * (1 - fig); c.fillStyle = C.goldHi; c.beginPath(); c.arc(fc.p[0], fc.p[1], 4, 0, Math.PI * 2); c.fill(); c.restore();
      figure(c, fc.p[0], fc.p[1] - 6, 26, C.goldHi, a * fig);
    });
  }
  const la = E.back(inv(56.5, 57.2, t)), lo = smooth(56.5, 56.8, t);
  if (lo > 0) {
    glowDot(c, IR_CX, IR_CY + 8, 260, REDC, 0.45 * lo);
    c.save(); c.globalAlpha = lo;
    c.translate(IR_CX, IR_CY + 8); c.scale(lerp(0.6, 1, la), lerp(0.6, 1, la));
    c.shadowColor = 'rgba(220,38,38,0.6)'; c.shadowBlur = 50;
    logoTile(c, 0, 0, 150);
    c.restore();
    const sh = inv(58.3, 59.0, t);
    if (sh > 0 && sh < 1) {
      c.save(); c.beginPath(); c.roundRect(IR_CX - 75, IR_CY - 67, 150, 150, 34); c.clip();
      const sx = lerp(IR_CX - 160, IR_CX + 160, sh);
      const g = c.createLinearGradient(sx - 40, 0, sx + 40, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(IR_CX - 80, IR_CY - 70, 160, 160); c.restore();
    }
  }
  const na = smooth(57.1, 57.7, t);
  if (na > 0) txt(c, 'نقش من', W / 2, 760 + (1 - E.out(inv(57.1, 57.8, t))) * 26, { size: 124, w: 900, alpha: na, glow: 'rgba(242,196,109,0.35)', blur: 40 });
  const sa = smooth(57.75, 58.35, t);
  if (sa > 0) {
    txt(c, 'یک نقشه، هزاران نقش', W / 2, 872 + (1 - E.out(inv(57.75, 58.45, t))) * 18, { size: 46, w: 500, color: C.goldHi, alpha: sa });
    const lw = 360 * E.out(inv(58.0, 58.9, t));
    c.save(); c.globalAlpha = sa; c.fillStyle = rgba(GOLD, 0.8); c.fillRect(W / 2 - lw / 2, 918, lw, 2); c.restore();
  }
  const ua = smooth(58.6, 59.2, t);
  if (ua > 0) txt(c, 'naghshman.ir', W / 2, 990, { size: 24, w: 500, color: C.mute, alpha: ua, dir: 'ltr' });
}
