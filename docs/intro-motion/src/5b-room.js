// ───────── Last scene: the end card turns out to be a screen; a woman at home signs up (PB0 →)
const PB0 = FIN_S + 4.4;
const SCR = { x: 800, y: 110, w: 960, h: 540 }, PC = [SCR.x + SCR.w / 2, SCR.y + SCR.h / 2];
const SC = mk(W, H), SCC = SC.getContext('2d');
const CAPTION = ['خانه‌ات هم یک میدان است؛', 'نقش خودت را همین‌جا بساز.'];
const FIELD_NAME = 'زهرا', FIELD_SQ = 'تهران · میدان آزادی';
const CHIPS = ['روایتگر', 'یاور کارها', 'دعوت‌کننده'];
let LEAVES = [];

function typed(s, p) { return s.slice(0, Math.floor(clamp(p) * s.length + 1e-6)); }

// ── the sign-up page shown on her screen (drawn at 1920×1080, scaled down by the room camera)
function cursorArrow(c, x, y) {
  c.save(); c.translate(x, y);
  c.fillStyle = '#fff'; c.strokeStyle = '#111'; c.lineWidth = 3; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 44); c.lineTo(11, 34); c.lineTo(20, 54); c.lineTo(29, 50); c.lineTo(20, 31); c.lineTo(34, 31); c.closePath(); c.fill(); c.stroke();
  c.restore();
}
function drawForm(c, tf) {
  c.fillStyle = '#090a0f'; c.fillRect(0, 0, W, H);
  const r = rng(12);
  for (let i = 0; i < 220; i++) { c.fillStyle = `rgba(242,196,109,${0.03 + r() * 0.05})`; c.fillRect(r() * W, r() * H, 2, 2); }
  glowDot(c, W / 2, 100, 700, [150, 40, 30], 0.3);
  const cx0 = 410, cy0 = 90, cw = 1100, ch = 900, R = cx0 + cw - 60;
  c.fillStyle = '#12141b'; c.beginPath(); c.roundRect(cx0, cy0, cw, ch, 44); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.1)'; c.lineWidth = 2; c.stroke();
  logoTile(c, R - 42, cy0 + 90, 84);
  txt(c, 'نقش من', R - 104, cy0 + 92, { size: 54, w: 900, align: 'right' });
  const cw2 = measure('ثبت‌نام', 28, 700) + 44;
  c.fillStyle = 'rgba(242,196,109,0.14)'; c.strokeStyle = 'rgba(242,196,109,0.5)'; c.lineWidth = 2;
  c.beginPath(); c.roundRect(cx0 + 60, cy0 + 70, cw2, 56, 28); c.fill(); c.stroke();
  txt(c, 'ثبت‌نام', cx0 + 60 + cw2 / 2, cy0 + 99, { size: 28, w: 700, color: C.goldHi });
  const done = inv(4.55, 5.1, tf);
  if (done <= 0) {
    txt(c, 'به نقش من خوش آمدید', R, cy0 + 205, { size: 62, w: 900, align: 'right' });
    txt(c, 'نقش خودت را بساز؛ از همین‌جا.', R, cy0 + 268, { size: 32, color: C.mute, align: 'right' });
    const field = (label, y, val, focus) => {
      txt(c, label, R, y, { size: 28, w: 600, color: '#c9ccd3', align: 'right' });
      c.fillStyle = '#0b0c11'; c.beginPath(); c.roundRect(cx0 + 60, y + 24, cw - 120, 84, 20); c.fill();
      c.strokeStyle = focus ? C.gold : 'rgba(255,255,255,0.12)'; c.lineWidth = focus ? 3 : 2; c.stroke();
      const caret = focus && Math.floor(tf * 2.2) % 2 === 0;
      txt(c, val, R - 28, y + 67, { size: 40, w: 600, align: 'right' });
      if (caret) { const tw = measure(val, 40, 600); c.fillStyle = C.gold; c.fillRect(R - 28 - tw - 8, y + 41, 3, 50); }
    };
    const f1 = tf > 0.4 && tf < 1.7, f2 = tf >= 1.7 && tf < 3.0;
    field('نام', cy0 + 345, typed(FIELD_NAME, inv(0.5, 1.4, tf)), f1);
    field('شهر و میدان', cy0 + 505, typed(FIELD_SQ, inv(1.8, 3.0, tf)), f2);
    txt(c, 'نقش من چیست؟', R, cy0 + 665, { size: 28, w: 600, color: '#c9ccd3', align: 'right' });
    let xr = R;
    CHIPS.forEach((s, i) => {
      const w = measure(s, 32, 700) + 64, on = tf > 3.55 && i === 0, pop = on ? E.back(inv(3.55, 3.85, tf)) : 0;
      c.save(); c.translate(xr - w / 2, cy0 + 725); c.scale(1 + 0.04 * Math.sin(Math.PI * clamp(pop)), 1 + 0.04 * Math.sin(Math.PI * clamp(pop)));
      c.fillStyle = on ? 'rgba(242,196,109,0.18)' : 'rgba(255,255,255,0.05)'; c.strokeStyle = on ? C.gold : 'rgba(255,255,255,0.14)'; c.lineWidth = on ? 3 : 2;
      c.beginPath(); c.roundRect(-w / 2, -34, w, 68, 34); c.fill(); c.stroke();
      txt(c, s, 0, 2, { size: 32, w: 700, color: on ? C.goldHi : '#d4d7de' });
      c.restore();
      xr -= w + 16;
    });
    const bx = cx0 + 60, by = cy0 + 790, bw = cw - 120, bh = 84, press = Math.sin(Math.PI * inv(4.35, 4.6, tf));
    c.save(); c.translate(bx + bw / 2, by + bh / 2); c.scale(1 - 0.015 * press, 1 - 0.03 * press); c.translate(-bx - bw / 2, -by - bh / 2);
    c.fillStyle = C.red; c.beginPath(); c.roundRect(bx, by, bw, bh, 22); c.fill();
    const rp = inv(4.4, 4.95, tf);
    if (rp > 0 && rp < 1) { c.save(); c.beginPath(); c.roundRect(bx, by, bw, bh, 22); c.clip(); c.fillStyle = `rgba(255,255,255,${0.35 * (1 - rp)})`; c.beginPath(); c.arc(bx + bw / 2, by + bh / 2, 30 + rp * 600, 0, Math.PI * 2); c.fill(); c.restore(); }
    txt(c, 'ثبت‌نام در نقش من', bx + bw / 2, by + bh / 2 + 3, { size: 38, w: 800 });
    c.restore();
    const path = [[0.0, [1240, 960]], [2.9, [1240, 960]], [3.5, [1330, 735 + cy0 - 90]], [3.62, [1330, 735 + cy0 - 90]], [4.3, [960, by + 60]], [4.7, [960, by + 60]]];
    let cur = path[0][1];
    for (let i = 1; i < path.length; i++) if (tf >= path[i - 1][0] && tf <= path[i][0]) { const u = E.io(inv(path[i - 1][0], path[i][0], tf)); cur = [lerp(path[i - 1][1][0], path[i][1][0], u), lerp(path[i - 1][1][1], path[i][1][1], u)]; }
    if (tf > path[path.length - 1][0]) cur = path[path.length - 1][1];
    if (tf > 2.9) cursorArrow(c, cur[0], cur[1]);
  }
  if (done > 0) {
    c.save(); c.globalAlpha = smooth(0, 1, done);
    const k = E.back(inv(4.55, 5.2, tf)), ccx = 960, ccy = cy0 + 390;
    glowDot(c, ccx, ccy, 360, [34, 197, 94], 0.35 * k);
    c.save(); c.translate(ccx, ccy); c.scale(k, k);
    c.fillStyle = '#16a34a'; c.beginPath(); c.arc(0, 0, 118, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 17; c.lineCap = 'round'; c.lineJoin = 'round';
    const f = E.out(inv(4.8, 5.4, tf));
    c.beginPath(); c.moveTo(-52, 4); c.lineTo(lerp(-52, -14, clamp(f * 2)), lerp(4, 44, clamp(f * 2)));
    if (f > 0.5) c.lineTo(lerp(-14, 56, (f - 0.5) * 2), lerp(44, -38, (f - 0.5) * 2));
    c.stroke();
    c.restore();
    txt(c, 'عضویت شما تأیید شد', 960, cy0 + 595, { size: 70, w: 900, alpha: smooth(5.0, 5.4, tf) });
    txt(c, 'خوش آمدی؛ از امروز، نقشِ تو روی این نقشه است.', 960, cy0 + 668, { size: 36, color: C.goldHi, alpha: smooth(5.2, 5.6, tf) });
    for (let i = 0; i < 7; i++) {
      const a = smooth(5.5 + i * 0.1, 5.8 + i * 0.1, tf), x = 960 + (i - 3) * 78;
      glowDot(c, x, cy0 + 770, 34, GOLD, 0.5 * a);
      figure(c, x, cy0 + 770, 56, i === 3 ? '#fff' : C.goldHi, a);
    }
    c.restore();
  }
  finish(c, tf, 0.35);
}

function buildRoom() {
  const r = rng(404);
  LEAVES = Array.from({ length: 11 }, (_, i) => ({ a: -1.2 + (i / 10) * 2.4 + (r() - 0.5) * 0.2, l: 120 + r() * 120, w: 22 + r() * 14, ph: r() * 6.28 }));
}

function roomBackdrop(c, t8) {
  const wall = c.createLinearGradient(0, -200, 0, 760);
  wall.addColorStop(0, '#171019'); wall.addColorStop(0.55, '#2a1a1d'); wall.addColorStop(1, '#3a2420');
  c.fillStyle = wall; c.fillRect(-800, -800, 3500, 1560);
  c.fillStyle = 'rgba(255,225,190,0.04)';
  for (let x = -800; x < 2700; x += 90) c.fillRect(x, -800, 3, 1560);
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(-800, 690, 3500, 28);
  // window with a dusk sky and curtains
  const wx = 70, wy = 100, ww = 300, wh = 460;
  const sky = c.createLinearGradient(0, wy, 0, wy + wh);
  sky.addColorStop(0, '#2c1b4d'); sky.addColorStop(0.5, '#b04a3c'); sky.addColorStop(1, '#f2a65c');
  c.fillStyle = sky; c.fillRect(wx, wy, ww, wh);
  c.fillStyle = '#1a1220';
  let bx = wx;
  const br = rng(7);
  while (bx < wx + ww) { const w2 = 20 + br() * 36, h2 = 40 + br() * 90; c.fillRect(bx, wy + wh - h2, w2, h2); bx += w2 + 2; }
  c.fillRect(wx + 214, wy + wh - 250, 5, 250); c.beginPath(); c.ellipse(wx + 216, wy + wh - 200, 15, 6, 0, 0, Math.PI * 2); c.fill();
  glowDot(c, wx + 90, wy + wh - 40, 200, [255, 190, 120], 0.55);
  c.strokeStyle = '#120b0e'; c.lineWidth = 16; c.strokeRect(wx, wy, ww, wh);
  c.lineWidth = 8; c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.moveTo(wx, wy + wh * 0.55); c.lineTo(wx + ww, wy + wh * 0.55); c.stroke();
  c.fillStyle = '#120b0e'; c.fillRect(wx - 26, wy + wh, ww + 52, 18);
  for (const [cx1, flip] of [[wx - 34, 1], [wx + ww + 34, -1]]) {
    const cg = c.createLinearGradient(cx1 - 70, 0, cx1 + 70, 0);
    cg.addColorStop(0, '#5a4024'); cg.addColorStop(0.5, '#8a6a3a'); cg.addColorStop(1, '#5a4024');
    c.fillStyle = cg; c.beginPath(); c.moveTo(cx1 - 62, wy - 26); c.lineTo(cx1 + 62, wy - 26); c.lineTo(cx1 + 74 * flip, wy + wh + 30); c.lineTo(cx1 - 74 * flip, wy + wh + 30); c.closePath(); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.22)';
    for (let k = -3; k <= 3; k++) c.fillRect(cx1 + k * 17 - 3, wy - 26, 6, wh + 56);
  }
  c.fillStyle = '#0f090c'; c.fillRect(wx - 110, wy - 36, ww + 220, 12);
  // a child's drawing of the flag on the wall
  c.save(); c.translate(560, 190); c.rotate(-0.06);
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(8, 8, 176, 224);
  c.fillStyle = '#f1e9d8'; c.fillRect(0, 0, 176, 224);
  c.drawImage(FLAG, 24, 40, 128, 73);
  c.strokeStyle = '#4a3a2a'; c.lineWidth = 4; c.beginPath(); c.moveTo(22, 36); c.lineTo(22, 190); c.stroke();
  c.fillStyle = '#f2b43c'; c.beginPath(); c.arc(132, 164, 18, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#d9a030'; c.lineWidth = 3; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; c.beginPath(); c.moveTo(132 + Math.cos(a) * 24, 164 + Math.sin(a) * 24); c.lineTo(132 + Math.cos(a) * 34, 164 + Math.sin(a) * 34); c.stroke(); }
  c.fillStyle = '#e8513f'; c.fillRect(70, 150, 6, 6);
  c.restore();
  // light spilling from the window and from the screen
  c.save(); c.globalCompositeOperation = 'lighter';
  const wg = c.createRadialGradient(240, 320, 0, 240, 320, 900); wg.addColorStop(0, 'rgba(255,150,80,0.26)'); wg.addColorStop(1, 'rgba(255,150,80,0)');
  c.fillStyle = wg; c.fillRect(-800, -800, 3500, 2000);
  const sg = c.createRadialGradient(PC[0], PC[1], 0, PC[0], PC[1], 950); sg.addColorStop(0, 'rgba(190,215,255,0.34)'); sg.addColorStop(1, 'rgba(190,215,255,0)');
  c.fillStyle = sg; c.fillRect(-800, -800, 3500, 2000);
  c.restore();
}

function roomDesk(c, t8, typing) {
  const dg = c.createLinearGradient(0, 712, 0, 1100);
  dg.addColorStop(0, '#5a3824'); dg.addColorStop(1, '#2a180f');
  c.fillStyle = dg; c.fillRect(-800, 712, 3500, 700);
  c.fillStyle = 'rgba(255,220,180,0.16)'; c.fillRect(-800, 712, 3500, 3);
  const gr = rng(21);
  for (let i = 0; i < 70; i++) { c.strokeStyle = `rgba(0,0,0,${0.06 + gr() * 0.08})`; c.lineWidth = 1 + gr() * 2; const y = 720 + gr() * 360; c.beginPath(); c.moveTo(-400, y); c.bezierCurveTo(400, y + gr() * 8 - 4, 1400, y + gr() * 10 - 5, 2400, y + gr() * 8 - 4); c.stroke(); }
  c.save(); c.globalCompositeOperation = 'lighter';
  const dl = c.createRadialGradient(PC[0], 760, 0, PC[0], 760, 760); dl.addColorStop(0, 'rgba(190,215,255,0.22)'); dl.addColorStop(1, 'rgba(190,215,255,0)');
  c.save(); c.translate(0, 760); c.scale(1, 0.35); c.translate(0, -760); c.fillStyle = dl; c.fillRect(-800, 400, 3500, 700); c.restore();
  c.restore();
}

function roomMonitor(c, t8) {
  c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.ellipse(PC[0] + 10, 742, 190, 24, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#16171c'; c.fillRect(PC[0] - 34, 650, 68, 84);
  c.fillStyle = '#1d1e25'; c.beginPath(); c.ellipse(PC[0], 734, 170, 20, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#0a0a0d'; c.beginPath(); c.roundRect(SCR.x - 22, SCR.y - 22, SCR.w + 44, SCR.h + 58, 20); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 2; c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(PC[0], SCR.y + SCR.h + 24, 4, 0, Math.PI * 2); c.fill();
}

function roomProps(c, t8) {
  // keyboard
  c.save();
  c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.roundRect(930, 790, 620, 78, 10); c.fill();
  const kg = c.createLinearGradient(0, 760, 0, 840); kg.addColorStop(0, '#2a2c34'); kg.addColorStop(1, '#14151a');
  c.fillStyle = kg; c.beginPath(); c.roundRect(920, 760, 620, 78, 10); c.fill();
  c.fillStyle = 'rgba(190,215,255,0.16)';
  for (let row = 0; row < 4; row++) for (let k = 0; k < 17; k++) c.fillRect(934 + k * 35.5, 770 + row * 15.5, 29, 10);
  c.restore();
  // mouse
  c.fillStyle = '#1b1c22'; c.beginPath(); c.ellipse(1640, 800, 24, 34, 0.1, 0, Math.PI * 2); c.fill();
  // tea in a small glass with a saucer
  const tx = 1730, ty = 786;
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(tx + 8, ty + 14, 50, 12, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#e6d8c2'; c.beginPath(); c.ellipse(tx, ty + 8, 46, 11, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.18)';
  c.beginPath(); c.moveTo(tx - 20, ty - 58); c.quadraticCurveTo(tx - 12, ty - 26, tx - 17, ty + 4); c.lineTo(tx + 17, ty + 4); c.quadraticCurveTo(tx + 12, ty - 26, tx + 20, ty - 58); c.closePath(); c.fill();
  const tg = c.createLinearGradient(0, ty - 46, 0, ty + 4); tg.addColorStop(0, '#d98a2b'); tg.addColorStop(1, '#8a3d12');
  c.fillStyle = tg; c.beginPath(); c.moveTo(tx - 18, ty - 44); c.quadraticCurveTo(tx - 11, ty - 22, tx - 15, ty + 2); c.lineTo(tx + 15, ty + 2); c.quadraticCurveTo(tx + 11, ty - 22, tx + 18, ty - 44); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(tx - 20, ty - 58); c.quadraticCurveTo(tx - 12, ty - 26, tx - 17, ty + 4); c.stroke();
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) {
    const p = (t8 * 0.35 + k / 3) % 1;
    c.strokeStyle = `rgba(255,235,210,${0.28 * Math.sin(Math.PI * p)})`; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(tx + (k - 1) * 8, ty - 64);
    for (let s = 1; s <= 8; s++) c.lineTo(tx + (k - 1) * 8 + Math.sin(p * 6 + s * 0.9 + k) * 9, ty - 64 - s * 11 * (0.4 + p));
    c.stroke();
  }
  c.restore();
  // plant
  const px = 1860, py = 706;
  c.fillStyle = '#3a2418'; c.beginPath(); c.moveTo(px - 46, py - 70); c.lineTo(px + 46, py - 70); c.lineTo(px + 34, py + 20); c.lineTo(px - 34, py + 20); c.closePath(); c.fill();
  c.fillStyle = '#4b2f20'; c.fillRect(px - 50, py - 78, 100, 14);
  for (const l of LEAVES) {
    const sw = Math.sin(t8 * 0.9 + l.ph) * 0.03;
    c.save(); c.translate(px, py - 76); c.rotate(l.a + sw);
    const lg = c.createLinearGradient(0, 0, 0, -l.l); lg.addColorStop(0, '#16301f'); lg.addColorStop(1, '#2f6a3c');
    c.fillStyle = lg; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(l.w, -l.l * 0.5, 0, -l.l); c.quadraticCurveTo(-l.w, -l.l * 0.5, 0, 0); c.fill();
    c.restore();
  }
}

function womanShape(c, t8, bob, flat) {
  const fill = flat || '#0f080d';
  c.fillStyle = c.strokeStyle = fill;
  c.beginPath();
  c.moveTo(170, 1130); c.bezierCurveTo(170, 950, 215, 840, 310, 790); c.bezierCurveTo(380, 756, 450, 742, 497, 708);
  c.lineTo(503, 612); c.lineTo(590, 612); c.lineTo(596, 706); c.bezierCurveTo(650, 742, 740, 752, 800, 785);
  c.bezierCurveTo(880, 830, 905, 950, 905, 1130); c.closePath(); c.fill();
  let sg = flat;
  if (!flat) { sg = c.createLinearGradient(430, 0, 680, 0); sg.addColorStop(0, '#170b12'); sg.addColorStop(0.7, '#2a1521'); sg.addColorStop(1, '#43283a'); }
  c.fillStyle = sg;
  c.beginPath();
  c.moveTo(545, 420);
  c.bezierCurveTo(612, 420, 636, 478, 632, 532);
  c.bezierCurveTo(640, 536, 646, 546, 640, 556);
  c.bezierCurveTo(634, 562, 630, 566, 630, 574);
  c.bezierCurveTo(634, 640, 664, 690, 712, 738);
  c.lineTo(400, 742);
  c.bezierCurveTo(430, 692, 458, 634, 460, 572);
  c.bezierCurveTo(446, 500, 478, 420, 545, 420);
  c.closePath(); c.fill();
  c.fillStyle = c.strokeStyle = fill;
  c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 56;
  c.beginPath(); c.moveTo(790, 806); c.quadraticCurveTo(850, 930, 985, 838 + bob); c.stroke();
  c.beginPath(); c.ellipse(1018, 826 + bob, 46, 23, -0.14, 0, Math.PI * 2); c.fill();
  c.lineWidth = 12; c.beginPath(); c.moveTo(1040, 818 + bob); c.lineTo(1074, 812 + bob); c.moveTo(1034, 830 + bob); c.lineTo(1070, 830 + bob); c.stroke();
}

function woman(c, t8) {
  const typing = t8 > 3.0 && t8 < 7.0;
  const bob = typing ? Math.sin(t8 * 17) * 3 + Math.sin(t8 * 7.3) * 2 : 0;
  const br = Math.sin(t8 * 1.5) * 2;
  c.save(); c.translate(0, br);
  c.save(); c.translate(4, -3); womanShape(c, t8, bob, 'rgba(190,215,255,0.85)'); c.restore();
  c.save(); c.translate(-4, -2); c.globalAlpha = 0.5; womanShape(c, t8, bob, 'rgba(255,150,90,0.9)'); c.restore();
  womanShape(c, t8, bob, null);
  c.restore();
}

function drawS8(c, t) {
  const t8 = t - PB0;
  const loc = t - FIN_S + 55.5;
  SCC.save();
  if (t8 < 2.6) {
    drawContent(SCC, t - HUB_S, 0); drawFinale(SCC, loc);
    if (t8 > 2.35) { SCC.save(); SCC.globalAlpha = smooth(2.35, 2.6, t8); drawForm(SCC, t8 - 2.5); SCC.restore(); }
  } else drawForm(SCC, t8 - 2.5);
  SCC.restore();
  const zi = E.io(inv(0, 2.3, t8)), drift = inv(2.3, 9.6, t8);
  const Z = Math.exp(lerp(Math.log(2), 0, zi)) * (1 + 0.02 * drift), cx = lerp(W / 2, PC[0], zi) + 8 * drift, cy = lerp(H / 2, PC[1], zi) - 4 * drift;
  c.save();
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  c.translate(cx, cy); c.scale(Z, Z); c.translate(-PC[0], -PC[1]);
  roomBackdrop(c, t8);
  roomDesk(c, t8);
  roomMonitor(c, t8);
  c.save(); c.beginPath(); c.roundRect(SCR.x, SCR.y, SCR.w, SCR.h, 6); c.clip();
  c.imageSmoothingQuality = 'high'; c.drawImage(SC, SCR.x, SCR.y, SCR.w, SCR.h);
  c.restore();
  c.save(); c.globalCompositeOperation = 'lighter';
  const rg = c.createLinearGradient(SCR.x, SCR.y, SCR.x + SCR.w, SCR.y + SCR.h); rg.addColorStop(0, 'rgba(255,255,255,0.06)'); rg.addColorStop(0.45, 'rgba(255,255,255,0)'); rg.addColorStop(1, 'rgba(255,255,255,0.02)');
  c.fillStyle = rg; c.fillRect(SCR.x, SCR.y, SCR.w, SCR.h); c.restore();
  roomProps(c, t8);
  woman(c, t8);
  c.restore();
  const ca = smooth(3.2, 3.9, t8) * (1 - smooth(9.0, 9.6, t8));
  if (ca > 0) {
    const g = c.createLinearGradient(0, H - 330, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${0.62 * ca})`);
    c.fillStyle = g; c.fillRect(0, H - 330, W, 330);
    CAPTION.forEach((ln, i) => {
      const a = smooth(3.2 + i * 0.6, 3.9 + i * 0.6, t8) * (1 - smooth(9.0, 9.6, t8));
      txt(c, ln, W - 110, H - 150 + i * 72 + (1 - E.out(inv(3.2 + i * 0.6, 4.1 + i * 0.6, t8))) * 18, { size: i ? 50 : 54, w: i ? 600 : 900, align: 'right', color: i ? C.goldHi : '#fff', alpha: a, glow: 'rgba(0,0,0,0.7)', blur: 20 });
    });
    c.save(); c.globalAlpha = ca; c.fillStyle = C.gold;
    const lw = 130 * E.out(inv(4.0, 4.9, t8)); c.fillRect(W - 110 - lw, H - 150 + 118, lw, 3); c.restore();
    txt(c, 'naghshman.ir', 110, H - 52, { size: 24, w: 500, color: 'rgba(255,255,255,0.65)', align: 'left', dir: 'ltr', alpha: smooth(5.6, 6.2, t8) * (1 - smooth(9.0, 9.6, t8)) });
  }
  finish(c, t8, 0.5);
  const fo = smooth(8.9, 9.6, t8);
  if (fo > 0) { c.fillStyle = `rgba(0,0,0,${fo})`; c.fillRect(0, 0, W, H); }
}
