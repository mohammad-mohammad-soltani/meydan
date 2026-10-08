// ───────── Scene 1 · at 4.0s the frame splits in four; four people sign up at the same moment
// right to left: 1 professor · 2 the flag-bearer (the existing phone close-up) · 3 seminary student · 4 university student
const SPLIT_T0 = 4.0, MERGE_T0 = 8.6, PANEL_W = 480;
const splitK = t => E.io(inv(SPLIT_T0, SPLIT_T0 + 0.55, t)) * (1 - E.io(inv(MERGE_T0, MERGE_T0 + 0.6, t)));

function sil(c, rims, fn, body) {
  for (const [dx, dy, col] of rims) { c.save(); c.translate(dx, dy); c.fillStyle = c.strokeStyle = col; fn(c, true); c.restore(); }
  c.save(); c.fillStyle = c.strokeStyle = body; fn(c, false); c.restore();
}

function mention(c, cx, y, ic, l1, l2, a) {
  if (a <= 0.01) return;
  const w = 420, h = 116, up = (1 - E.out(clamp(a))) * 42;
  c.save(); c.globalAlpha = clamp(a); c.translate(cx, y + up);
  c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 26; c.shadowOffsetY = 10;
  c.fillStyle = 'rgba(14,14,20,0.93)'; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 30); c.fill();
  c.shadowColor = 'transparent';
  c.strokeStyle = 'rgba(242,196,109,0.42)'; c.lineWidth = 1.5; c.stroke();
  const xr = w / 2;
  c.fillStyle = 'rgba(242,196,109,0.16)'; c.beginPath(); c.arc(xr - 46, 0, 30, 0, Math.PI * 2); c.fill();
  icon(c, ic, xr - 46, 0, 32, C.goldHi, 2);
  txt(c, l1, xr - 92, -17, { size: 31, w: 800, align: 'right' });
  txt(c, l2, xr - 92, 24, { size: 22, w: 500, color: C.goldSoft, align: 'right' });
  c.restore();
}

function okBadge(c, x, y, p) {
  if (p <= 0) return;
  const k = E.back(clamp(p));
  glowDot(c, x, y, 120, [34, 197, 94], 0.5 * clamp(p));
  c.save(); c.translate(x, y); c.scale(k, k);
  c.fillStyle = '#16a34a'; c.beginPath(); c.arc(0, 0, 30, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#fff'; c.lineWidth = 6; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-12, 1); c.lineTo(-3, 11); c.lineTo(14, -9); c.stroke();
  c.restore();
}

function books(c, x0, x1, y0, y1, seed, dim) {
  const r = rng(seed), cols = ['#5a3a2e', '#2f4358', '#6b5a34', '#3d2f4a', '#7a3b32', '#2c4a40', '#8a7a5a', '#43352a'];
  const rows = Math.ceil((y1 - y0) / 170);
  for (let row = 0; row < rows; row++) {
    const yb = y0 + row * 170 + 140; let x = x0;
    while (x < x1) {
      const w = 12 + r() * 20, h = 92 + r() * 46, lean = r() < 0.06;
      c.save(); c.translate(x, yb); if (lean) c.rotate(-0.18);
      c.globalAlpha = dim; c.fillStyle = cols[(r() * cols.length) | 0]; c.fillRect(0, -h, w, h);
      c.fillStyle = 'rgba(255,230,190,0.2)'; c.fillRect(2, -h + 9, w - 4, 3);
      c.restore();
      x += w + 1.5;
    }
    c.fillStyle = '#20130b'; c.fillRect(x0, yb, x1 - x0, 14);
  }
}

// ── panel 1 · the professor writes, stops for a moment, then signs up on his phone
function panelProf(c, s) {
  const bg = c.createLinearGradient(0, 0, 0, 1080); bg.addColorStop(0, '#1b130e'); bg.addColorStop(0.7, '#33241a'); bg.addColorStop(1, '#150e0a');
  c.fillStyle = bg; c.fillRect(0, 0, 480, 1080);
  books(c, -6, 486, 30, 720, 71, 0.95);
  c.fillStyle = '#e8dcc2'; c.fillRect(300, 150, 120, 84); c.strokeStyle = '#6b4a22'; c.lineWidth = 7; c.strokeRect(300, 150, 120, 84);
  c.fillStyle = 'rgba(80,60,40,0.55)'; for (let i = 0; i < 5; i++) c.fillRect(316, 168 + i * 11, 88 - (i % 2) * 22, 3);
  // desk lamp
  c.strokeStyle = '#0d0805'; c.lineWidth = 9; c.lineCap = 'round';
  c.beginPath(); c.moveTo(66, 826); c.lineTo(80, 700); c.lineTo(150, 626); c.stroke();
  c.fillStyle = '#2a1a10'; c.beginPath(); c.moveTo(118, 604); c.lineTo(186, 646); c.lineTo(214, 612); c.lineTo(140, 578); c.closePath(); c.fill();
  c.save(); c.globalCompositeOperation = 'lighter';
  const lg = c.createRadialGradient(188, 700, 0, 188, 700, 440); lg.addColorStop(0, 'rgba(255,190,110,0.5)'); lg.addColorStop(1, 'rgba(255,170,90,0)');
  c.fillStyle = lg; c.fillRect(0, 0, 480, 1080); c.restore();
  const dg = c.createLinearGradient(0, 800, 0, 1080); dg.addColorStop(0, '#4b3121'); dg.addColorStop(1, '#22150b');
  c.fillStyle = dg; c.fillRect(0, 806, 480, 280); c.fillStyle = 'rgba(255,220,170,0.2)'; c.fillRect(0, 806, 480, 3);
  // paper, filling with handwriting
  c.fillStyle = '#eadfc6'; c.beginPath(); c.moveTo(96, 880); c.lineTo(372, 868); c.lineTo(392, 1008); c.lineTo(80, 1022); c.closePath(); c.fill();
  const wp = clamp(s / 1.5);
  c.strokeStyle = 'rgba(40,30,20,0.75)'; c.lineWidth = 3; c.lineCap = 'round';
  for (let i = 0; i < 4; i++) { const len = clamp(wp * 4 - i) * 210; if (len > 1) { c.beginPath(); c.moveTo(340, 902 + i * 26 - i); c.lineTo(340 - len, 903 + i * 26 - i); c.stroke(); } }
  // professor (faces left)
  const lift = smooth(1.5, 1.8, s) * (1 - smooth(2.05, 2.4, s)), mv = smooth(2.1, 2.55, s), headDy = -9 * smooth(1.5, 1.9, s) * (1 - mv);
  const wx = 250 - clamp(wp) * 70 + Math.sin(s * 9) * 14, wy = 928 + Math.sin(s * 19) * 3 - 54 * lift;
  const hx = lerp(wx, 346, mv), hy = lerp(wy, 960 + (s > 2.6 ? Math.sin(s * 13) * 3 : 0), mv);
  const on = smooth(2.2, 2.6, s);
  c.save(); c.translate(346, 968); c.rotate(-0.22);
  c.fillStyle = '#0b0b10'; c.beginPath(); c.roundRect(-34, -62, 68, 124, 12); c.fill();
  c.fillStyle = on > 0.02 ? `rgb(${40 + 190 * on | 0},${46 + 190 * on | 0},${60 + 180 * on | 0})` : '#14151b'; c.beginPath(); c.roundRect(-29, -57, 58, 114, 8); c.fill();
  if (on > 0.3) { c.fillStyle = `rgba(30,30,40,${on})`; for (let i = 0; i < 4; i++) c.fillRect(-20, -36 + i * 24, 40 - (i % 2) * 14, 8); c.fillStyle = `rgba(220,38,38,${on})`; c.fillRect(-20, 44, 40, 9); }
  c.restore();
  glowDot(c, 346, 955, 150, [200, 225, 255], 0.45 * on);
  const pose = (cc, flat) => {
    cc.beginPath(); cc.moveTo(560, 1130); cc.bezierCurveTo(560, 990, 535, 880, 480, 826); cc.bezierCurveTo(445, 792, 428, 760, 428, 714);
    cc.lineTo(352, 714); cc.bezierCurveTo(300, 720, 262, 774, 252, 862); cc.bezierCurveTo(244, 960, 250, 1050, 262, 1130); cc.closePath(); cc.fill();
    cc.beginPath(); cc.ellipse(374, 598 + headDy, 60, 72, 0.06, 0, Math.PI * 2); cc.fill();
    cc.beginPath(); cc.ellipse(314, 612 + headDy, 11, 9, 0, 0, Math.PI * 2); cc.fill();
    cc.lineCap = 'round'; cc.lineJoin = 'round'; cc.lineWidth = 50;
    cc.beginPath(); cc.moveTo(456, 810); cc.quadraticCurveTo(396, 940, hx + 18, hy - 4); cc.stroke();
    cc.beginPath(); cc.ellipse(hx, hy, 34, 21, 0.2, 0, Math.PI * 2); cc.fill();
    if (!flat) {
      cc.fillStyle = '#8f8a82'; cc.beginPath(); cc.moveTo(338, 640 + headDy); cc.quadraticCurveTo(352, 694 + headDy, 392, 684 + headDy); cc.quadraticCurveTo(424, 664 + headDy, 428, 622 + headDy); cc.quadraticCurveTo(404, 662 + headDy, 372, 656 + headDy); cc.quadraticCurveTo(350, 650 + headDy, 338, 640 + headDy); cc.closePath(); cc.fill();
      cc.strokeStyle = '#8a857c'; cc.lineWidth = 10; cc.lineCap = 'round'; cc.beginPath(); cc.arc(378, 600 + headDy, 63, Math.PI * 1.08, Math.PI * 1.9); cc.stroke();
      cc.strokeStyle = '#d8d2c4'; cc.lineWidth = 2.5; cc.beginPath(); cc.roundRect(324, 594 + headDy, 28, 19, 6); cc.moveTo(356, 598 + headDy); cc.lineTo(428, 590 + headDy); cc.stroke();
      if (mv < 0.5) { cc.strokeStyle = '#d8d2c4'; cc.lineWidth = 5; cc.beginPath(); cc.moveTo(hx - 6, hy + 4); cc.lineTo(hx - 36, hy + 36); cc.stroke(); }
    }
  };
  sil(c, [[-3, -2, 'rgba(255,170,100,0.95)'], [3, -2, 'rgba(200,225,255,0.5)']], pose, '#0f0a0c');
  const g = c.createLinearGradient(0, 0, 0, 1080); g.addColorStop(0, 'rgba(0,0,0,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0.3)'); c.fillStyle = g; c.fillRect(0, 0, 480, 1080);
  okBadge(c, 150, 800, inv(3.0, 3.4, s));
  mention(c, 240, 130, 'note', 'من استادم؛', 'دانشم را برای ایران می‌دهم', smooth(2.2, 2.8, s));
}

// ── panel 3 · a seminary student signs up inside the hawza
function panelHawza(c, s) {
  const bg = c.createLinearGradient(0, 0, 0, 1080); bg.addColorStop(0, '#0b1424'); bg.addColorStop(0.6, '#1d2f4a'); bg.addColorStop(1, '#2b2433');
  c.fillStyle = bg; c.fillRect(0, 0, 480, 1080);
  const arch = new Path2D('M 60,860 L 60,430 C 60,290 190,200 240,70 C 290,200 420,290 420,430 L 420,860 Z');
  c.save(); c.clip(arch);
  c.fillStyle = '#12344f'; c.fillRect(0, 0, 480, 900);
  const pal = ['#1b5a7a', '#2a8fa0', '#c9a24b', '#0f2f48', '#2a6f95'], hr = rng(33);
  for (let gy = 0; gy < 28; gy++) for (let gx = -1; gx < 15; gx++) {
    const x = gx * 34 + (gy % 2) * 17, y = gy * 34, col = pal[(hr() * pal.length) | 0];
    c.fillStyle = col; c.globalAlpha = 0.92; c.beginPath(); c.moveTo(x, y - 15); c.lineTo(x + 15, y); c.lineTo(x, y + 15); c.lineTo(x - 15, y); c.closePath(); c.fill();
  }
  c.globalAlpha = 1;
  c.fillStyle = 'rgba(6,14,26,0.62)'; c.beginPath(); c.moveTo(110, 860); c.lineTo(110, 452); c.bezierCurveTo(110, 352, 205, 282, 240, 200); c.bezierCurveTo(275, 282, 370, 352, 370, 452); c.lineTo(370, 860); c.closePath(); c.fill();
  c.globalCompositeOperation = 'lighter'; const ig = c.createRadialGradient(240, 680, 0, 240, 680, 360); ig.addColorStop(0, 'rgba(255,190,110,0.55)'); ig.addColorStop(1, 'rgba(255,170,90,0)'); c.fillStyle = ig; c.fillRect(0, 0, 480, 900);
  c.restore();
  c.strokeStyle = 'rgba(242,196,109,0.75)'; c.lineWidth = 5; c.stroke(arch);
  for (const lx of [34, 446]) { c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 2; c.beginPath(); c.moveTo(lx, 0); c.lineTo(lx, 250); c.stroke(); glowDot(c, lx, 270, 70, [255, 190, 110], 0.7); c.fillStyle = '#ffd89a'; c.beginPath(); c.arc(lx, 270, 12, 0, Math.PI * 2); c.fill(); }
  const cg = c.createLinearGradient(0, 850, 0, 1080); cg.addColorStop(0, '#7a2229'); cg.addColorStop(1, '#3f0f16'); c.fillStyle = cg; c.fillRect(0, 856, 480, 230);
  c.strokeStyle = 'rgba(242,196,109,0.6)'; c.lineWidth = 3; c.strokeRect(14, 874, 452, 196);
  c.strokeStyle = 'rgba(242,196,109,0.35)'; c.beginPath(); c.ellipse(240, 972, 190, 64, 0, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.ellipse(240, 972, 120, 36, 0, 0, Math.PI * 2); c.stroke();
  // book stand with an open book
  c.strokeStyle = '#2a1a10'; c.lineWidth = 10; c.lineCap = 'round';
  c.beginPath(); c.moveTo(26, 1016); c.lineTo(112, 900); c.moveTo(112, 1016); c.lineTo(26, 900); c.stroke();
  c.fillStyle = '#e8dcc0'; c.beginPath(); c.moveTo(14, 884); c.lineTo(66, 870); c.lineTo(66, 926); c.lineTo(14, 940); c.closePath(); c.fill(); c.beginPath(); c.moveTo(66, 870); c.lineTo(122, 884); c.lineTo(122, 940); c.lineTo(66, 926); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(60,40,20,0.55)'; c.lineWidth = 2; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(22, 894 + i * 9); c.lineTo(60, 885 + i * 9); c.moveTo(72, 885 + i * 9); c.lineTo(112, 894 + i * 9); c.stroke(); }
  // the seminarian
  const phoneOn = smooth(0.7, 1.1, s), tap = s > 1.3 ? Math.sin(s * 14) * 3 : 0, hx = lerp(-12, 0, smooth(0.5, 1.0, s));
  const pose = (cc, flat) => {
    cc.beginPath(); cc.moveTo(66, 1110); cc.bezierCurveTo(66, 950, 130, 850, 190, 812); cc.lineTo(200, 744); cc.lineTo(282, 744); cc.lineTo(292, 812); cc.bezierCurveTo(352, 850, 414, 950, 414, 1110); cc.closePath(); cc.fill();
    cc.beginPath(); cc.ellipse(240 + hx, 652, 52, 62, 0, 0, Math.PI * 2); cc.fill();
    cc.lineCap = 'round'; cc.lineJoin = 'round'; cc.lineWidth = 42;
    cc.beginPath(); cc.moveTo(176, 836); cc.quadraticCurveTo(160, 900, 222, 900 + tap); cc.stroke();
    cc.beginPath(); cc.moveTo(306, 836); cc.quadraticCurveTo(322, 900, 262, 900 + tap); cc.stroke();
    cc.beginPath(); cc.ellipse(228, 900 + tap, 26, 18, 0, 0, Math.PI * 2); cc.ellipse(256, 900 + tap, 26, 18, 0, 0, Math.PI * 2); cc.fill();
    cc.fillStyle = flat ? cc.fillStyle : '#f1ece0';
    cc.beginPath(); cc.ellipse(240 + hx, 586, 76, 42, 0, 0, Math.PI * 2); cc.fill();
    cc.beginPath(); cc.moveTo(304, 596); cc.quadraticCurveTo(340, 640, 322, 770); cc.lineTo(298, 770); cc.quadraticCurveTo(312, 650, 280, 612); cc.closePath(); cc.fill();
    if (!flat) {
      cc.strokeStyle = 'rgba(120,100,70,0.55)'; cc.lineWidth = 3; for (let i = 0; i < 3; i++) { cc.beginPath(); cc.arc(240 + hx, 590 + i * 4, 68 - i * 6, Math.PI * 1.05, Math.PI * 1.95); cc.stroke(); }
      cc.fillStyle = '#1b1612'; cc.beginPath(); cc.moveTo(204 + hx, 676); cc.quadraticCurveTo(240 + hx, 740, 276 + hx, 676); cc.quadraticCurveTo(240 + hx, 700, 204 + hx, 676); cc.closePath(); cc.fill();
    }
  };
  glowDot(c, 241, 880, 190, [200, 225, 255], 0.5 * phoneOn);
  sil(c, [[-4, -2, 'rgba(255,170,100,0.9)'], [4, -2, 'rgba(255,170,100,0.7)']], pose, '#0d0a10');
  c.save(); c.translate(241, 868 + tap); c.rotate(-0.04);
  c.fillStyle = '#0b0b10'; c.beginPath(); c.roundRect(-30, -52, 60, 104, 10); c.fill();
  c.fillStyle = `rgb(${40 + 190 * phoneOn | 0},${46 + 190 * phoneOn | 0},${60 + 180 * phoneOn | 0})`; c.beginPath(); c.roundRect(-26, -48, 52, 96, 7); c.fill();
  c.fillStyle = `rgba(30,30,40,${phoneOn})`; for (let i = 0; i < 4; i++) c.fillRect(-18, -30 + i * 20, 36 - (i % 2) * 12, 7); c.fillStyle = `rgba(220,38,38,${phoneOn})`; c.fillRect(-18, 38, 36, 7);
  c.restore();
  const gg = c.createLinearGradient(0, 0, 0, 1080); gg.addColorStop(0, 'rgba(0,0,0,0.2)'); gg.addColorStop(1, 'rgba(0,0,0,0.3)'); c.fillStyle = gg; c.fillRect(0, 0, 480, 1080);
  okBadge(c, 372, 830, inv(3.2, 3.6, s));
  mention(c, 240, 130, 'book', 'من طلبه‌ام؛', 'از حوزه تا میدان', smooth(1.9, 2.5, s));
}

// ── panel 4 · a university student signs up between the shelves of a library
function panelStudent(c, s) {
  const bg = c.createLinearGradient(0, 0, 0, 1080); bg.addColorStop(0, '#0c1220'); bg.addColorStop(1, '#1a2434');
  c.fillStyle = bg; c.fillRect(0, 0, 480, 1080);
  const wg = c.createLinearGradient(0, 90, 0, 520); wg.addColorStop(0, '#16284a'); wg.addColorStop(1, '#4d74a8');
  c.fillStyle = wg; c.fillRect(150, 90, 180, 430);
  const sr = rng(5); c.fillStyle = 'rgba(255,230,190,0.7)'; for (let i = 0; i < 26; i++) c.fillRect(160 + sr() * 160, 100 + sr() * 150, 2, 2);
  c.fillStyle = '#10182a'; let bx = 150; while (bx < 330) { const w = 16 + sr() * 24, h = 40 + sr() * 120; c.fillRect(bx, 520 - h, w, h); bx += w + 2; }
  c.strokeStyle = '#0a0f1c'; c.lineWidth = 9; c.strokeRect(150, 90, 180, 430); c.beginPath(); c.moveTo(240, 90); c.lineTo(240, 520); c.moveTo(150, 300); c.lineTo(330, 300); c.stroke();
  books(c, 0, 142, 20, 760, 91, 0.7); books(c, 338, 480, 20, 760, 92, 0.7);
  const tg = c.createLinearGradient(0, 806, 0, 1080); tg.addColorStop(0, '#3b2a22'); tg.addColorStop(1, '#16100c'); c.fillStyle = tg; c.fillRect(0, 806, 480, 280);
  c.fillStyle = 'rgba(190,215,255,0.16)'; c.fillRect(0, 806, 480, 3);
  const typingAmt = s > 0.2 ? 1 : 0, bob = typingAmt * (Math.sin(s * 17) * 3 + Math.sin(s * 7) * 2), glow = 0.45 + 0.2 * smooth(3.2, 3.6, s);
  glowDot(c, 330, 730, 340, [170, 205, 255], glow);
  // backpack on the chair behind him
  c.fillStyle = '#1c3b3a'; c.beginPath(); c.roundRect(14, 648, 92, 250, 26); c.fill(); c.fillStyle = '#24504b'; c.beginPath(); c.roundRect(24, 740, 72, 90, 14); c.fill();
  c.strokeStyle = '#0f2423'; c.lineWidth = 7; c.beginPath(); c.moveTo(78, 660); c.quadraticCurveTo(140, 700, 120, 820); c.stroke();
  const pose = (cc, flat) => {
    cc.beginPath(); cc.moveTo(34, 1130); cc.bezierCurveTo(34, 984, 66, 862, 136, 808); cc.bezierCurveTo(166, 784, 180, 752, 180, 708); cc.lineTo(246, 708);
    cc.bezierCurveTo(250, 752, 276, 784, 316, 812); cc.lineTo(334, 1130); cc.closePath(); cc.fill();
    cc.beginPath(); cc.ellipse(206, 600, 56, 68, -0.04, 0, Math.PI * 2); cc.fill();
    cc.beginPath(); cc.ellipse(262, 614, 10, 8, 0, 0, Math.PI * 2); cc.fill();
    cc.lineCap = 'round'; cc.lineJoin = 'round'; cc.lineWidth = 46;
    cc.beginPath(); cc.moveTo(280, 836); cc.quadraticCurveTo(318, 880, 352, 822 + bob); cc.stroke();
    cc.beginPath(); cc.ellipse(372, 816 + bob, 30, 18, 0, 0, Math.PI * 2); cc.fill();
    cc.beginPath(); cc.moveTo(168, 546); cc.quadraticCurveTo(196, 500, 236, 520); cc.lineTo(250, 560); cc.lineTo(160, 576); cc.closePath(); cc.fill();
    if (!flat) {
      cc.strokeStyle = '#2b2d36'; cc.lineWidth = 12; cc.beginPath(); cc.moveTo(160, 560); cc.bezierCurveTo(166, 462, 252, 468, 250, 560); cc.stroke();
      cc.fillStyle = '#2b2d36'; cc.beginPath(); cc.ellipse(204, 598, 15, 24, 0, 0, Math.PI * 2); cc.fill();
    }
  };
  sil(c, [[3, -2, 'rgba(170,205,255,0.95)'], [-3, -2, 'rgba(255,170,100,0.4)']], pose, '#0e0c12');
  // the laptop in side view, glowing towards him
  c.fillStyle = '#20222a'; c.beginPath(); c.roundRect(318, 806, 150, 16, 5); c.fill();
  c.fillStyle = '#16181f'; c.beginPath(); c.moveTo(324, 810); c.lineTo(336, 810); c.lineTo(382, 628); c.lineTo(368, 624); c.closePath(); c.fill();
  c.save(); c.globalCompositeOperation = 'lighter'; const lg = c.createLinearGradient(330, 0, 150, 0); lg.addColorStop(0, 'rgba(190,215,255,0.5)'); lg.addColorStop(1, 'rgba(190,215,255,0)');
  c.fillStyle = lg; c.beginPath(); c.moveTo(332, 806); c.lineTo(374, 626); c.lineTo(110, 540); c.lineTo(110, 806); c.closePath(); c.fill(); c.restore();
  const gg = c.createLinearGradient(0, 0, 0, 1080); gg.addColorStop(0, 'rgba(0,0,0,0.2)'); gg.addColorStop(1, 'rgba(0,0,0,0.32)'); c.fillStyle = gg; c.fillRect(0, 0, 480, 1080);
  okBadge(c, 402, 640, inv(3.3, 3.7, s));
  mention(c, 240, 130, 'brief', 'من دانشجوام؛', 'آینده را می‌سازم', smooth(2.6, 3.2, s));
}

function panelFrame(c, x, k, drawFn, s, side) {
  if (k <= 0.002) return;
  c.save(); c.beginPath(); c.rect(x, 0, PANEL_W, H); c.clip();
  c.translate(x, (1 - E.out(k)) * 70); c.globalAlpha = k;
  drawFn(c, Math.max(0, s));
  const vg = c.createRadialGradient(240, 540, 300, 240, 540, 760); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
  c.fillStyle = vg; c.fillRect(0, -70, 480, 1220);
  c.restore();
}

function drawS1(c, t) {
  const k = splitK(t);
  if (k < 0.002) { drawS1Core(c, t); return; }
  const s = t - SPLIT_T0, out = 1 - smooth(MERGE_T0, MERGE_T0 + 0.5, t);
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  panelFrame(c, 1440, smooth(4.1, 4.7, t) * out, panelProf, s);
  panelFrame(c, 480, smooth(4.17, 4.77, t) * out, panelHawza, s);
  panelFrame(c, 0, smooth(4.24, 4.84, t) * out, panelStudent, s);
  const left = lerp(0, 960, k), right = lerp(1920, 1440, k);
  c.save(); c.beginPath(); c.rect(left, 0, right - left, H); c.clip();
  c.translate(lerp(960, 1200, k), lerp(540, 584, k)); c.scale(lerp(1, 0.78, k), lerp(1, 0.78, k)); c.translate(-960, -540);
  drawS1Core(c, t);
  c.restore();
  c.fillStyle = '#04040a';
  for (const gx of [480, 960, 1440]) c.fillRect(gx - 4, 0, 8, H);
  c.fillStyle = `rgba(242,196,109,${0.35 * k})`;
  for (const gx of [480, 960, 1440]) { c.fillRect(gx - 4, 0, 1.5, H); c.fillRect(gx + 2.5, 0, 1.5, H); }
  mention(c, 1200, 130, 'mega', 'من پرچمدارم؛', 'تا آخر در میدان می‌مانم', smooth(3.0, 3.6, s) * out);
  finish(c, t, 0.25);
}
