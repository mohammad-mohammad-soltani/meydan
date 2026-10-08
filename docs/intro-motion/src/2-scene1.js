// ───────── Scene 1 · the square at sunset (0 – 10s)
const SUN_X = 1350, HORIZON = 812;
let CROWD = [], DUST = [], BIRDS = [], CLOUDS = [];

function towerPath(c, x, base, w) {
  const P = (u, v) => [x + u * w, base + v * w];
  c.beginPath();
  c.moveTo(...P(-0.5, 0));
  c.bezierCurveTo(...P(-0.33, -0.1), ...P(-0.215, -0.38), ...P(-0.2, -0.6));
  for (const [u, v] of [[-0.2, -0.64], [-0.218, -0.645], [-0.218, -0.666], [-0.15, -0.671], [-0.15, -0.69], [-0.072, -0.69], [-0.072, -0.722], [0.072, -0.722], [0.072, -0.69], [0.15, -0.69], [0.15, -0.671], [0.218, -0.666], [0.218, -0.645], [0.2, -0.64], [0.2, -0.6]]) c.lineTo(...P(u, v));
  c.bezierCurveTo(...P(0.215, -0.38), ...P(0.33, -0.1), ...P(0.5, 0));
  c.closePath();
  c.moveTo(...P(-0.152, 0));
  c.lineTo(...P(-0.147, -0.2));
  c.bezierCurveTo(...P(-0.142, -0.3), ...P(-0.065, -0.375), ...P(0, -0.43));
  c.bezierCurveTo(...P(0.065, -0.375), ...P(0.142, -0.3), ...P(0.147, -0.2));
  c.lineTo(...P(0.152, 0));
  c.closePath();
  c.moveTo(...P(-0.036, -0.5));
  c.lineTo(...P(-0.036, -0.54));
  c.quadraticCurveTo(...P(-0.03, -0.577), ...P(0, -0.592));
  c.quadraticCurveTo(...P(0.03, -0.577), ...P(0.036, -0.54));
  c.lineTo(...P(0.036, -0.5));
  c.closePath();
  for (const s of [-1, 1]) {
    c.moveTo(...P(s * 0.39, 0));
    c.lineTo(...P(s * 0.375, -0.05));
    c.quadraticCurveTo(...P(s * 0.34, -0.1), ...P(s * 0.3, -0.105));
    c.quadraticCurveTo(...P(s * 0.27, -0.1), ...P(s * 0.255, -0.05));
    c.lineTo(...P(s * 0.25, 0));
    c.closePath();
  }
}

// silhouette of one person, back to camera
function person(c, x, b, s, kind, arm) {
  c.beginPath();
  if (kind === 'chador') {
    c.moveTo(x - 30 * s, b + 2);
    c.bezierCurveTo(x - 30 * s, b - 22 * s, x - 27 * s, b - 36 * s, x - 18 * s, b - 42 * s);
    c.bezierCurveTo(x - 13 * s, b - 46 * s, x - 13 * s, b - 52 * s, x - 13 * s, b - 58 * s);
    c.bezierCurveTo(x - 13 * s, b - 68 * s, x - 7 * s, b - 73 * s, x, b - 73 * s);
    c.bezierCurveTo(x + 7 * s, b - 73 * s, x + 13 * s, b - 68 * s, x + 13 * s, b - 58 * s);
    c.bezierCurveTo(x + 13 * s, b - 52 * s, x + 13 * s, b - 46 * s, x + 18 * s, b - 42 * s);
    c.bezierCurveTo(x + 27 * s, b - 36 * s, x + 30 * s, b - 22 * s, x + 30 * s, b + 2);
    c.closePath(); c.fill();
  } else {
    c.moveTo(x - 27 * s, b + 2);
    c.lineTo(x - 26 * s, b - 30 * s);
    c.quadraticCurveTo(x - 25 * s, b - 42 * s, x - 9 * s, b - 45 * s);
    c.lineTo(x - 6 * s, b - 50 * s); c.lineTo(x + 6 * s, b - 50 * s); c.lineTo(x + 9 * s, b - 45 * s);
    c.quadraticCurveTo(x + 25 * s, b - 42 * s, x + 26 * s, b - 30 * s);
    c.lineTo(x + 27 * s, b + 2);
    c.closePath(); c.fill();
    c.beginPath(); c.ellipse(x, b - 58 * s, 10.5 * s, 12 * s, 0, 0, Math.PI * 2); c.fill();
    if (kind === 'scarf') {
      c.beginPath();
      c.moveTo(x - 13 * s, b - 58 * s);
      c.quadraticCurveTo(x - 14 * s, b - 40 * s, x - 19 * s, b - 38 * s);
      c.lineTo(x + 19 * s, b - 38 * s);
      c.quadraticCurveTo(x + 14 * s, b - 40 * s, x + 13 * s, b - 58 * s);
      c.ellipse(x, b - 59 * s, 13 * s, 13.5 * s, 0, 0, Math.PI, true);
      c.fill();
    }
  }
  if (arm) {
    c.save();
    c.strokeStyle = c.fillStyle; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 7.5 * s;
    c.beginPath(); c.moveTo(x + 19 * s, b - 36 * s); c.quadraticCurveTo(x + 30 * s, b - 62 * s, x + 28 * s, b - 90 * s); c.stroke();
    c.beginPath(); c.arc(x + 28 * s, b - 92 * s, 5.2 * s, 0, Math.PI * 2); c.fill();
    if (arm === 'flag') { c.lineWidth = 1.8 * s; c.beginPath(); c.moveTo(x + 28 * s, b - 84 * s); c.lineTo(x + 30 * s, b - 156 * s); c.stroke(); }
    c.restore();
  }
}

function buildCrowd() {
  const defs = [
    { seed: 11, n: 300, y0: 800, y1: 852, s0: 0.3, s1: 0.4, body: '#2f1b29', rim: 'rgba(255,150,95,0.75)', flags: 22, fill: 845 },
    { seed: 12, n: 120, y0: 862, y1: 935, s0: 0.66, s1: 0.86, body: '#1b0f17', rim: 'rgba(255,160,100,0.85)', flags: 14, fill: 930 },
    { seed: 13, n: 30, y0: 990, y1: 1110, s0: 1.45, s1: 1.8, body: '#0c070a', rim: 'rgba(255,176,112,0.9)', flags: 5, fill: 1080 },
  ];
  const sunX = SUN_X + 200;
  CROWD = defs.map(d => {
    const cw = W + 400, cnv = mk(cw, H), c = cnv.getContext('2d'), r = rng(d.seed);
    const items = [];
    for (let i = 0; i < d.n; i++) {
      const k = r();
      items.push({ x: r() * cw, b: lerp(d.y0, d.y1, r()), s: lerp(d.s0, d.s1, r()), kind: k < 0.28 ? 'chador' : k < 0.5 ? 'scarf' : 'man', arm: r() < 0.1 ? 'fist' : null });
    }
    const flags = [];
    for (let i = 0; i < d.flags; i++) {
      const p = items[Math.floor(r() * items.length)];
      if (p.kind === 'chador') p.kind = 'scarf';
      p.arm = 'flag';
      flags.push({ x: p.x + 30 * p.s, y: p.b - 156 * p.s, s: p.s, ph: r() * 6.28 });
    }
    items.sort((a, b) => a.b - b.b);
    c.fillStyle = d.body;
    c.fillRect(0, d.fill, cw, H - d.fill);
    for (const p of items) {
      const dir = Math.sign(sunX - p.x) || 1;
      c.fillStyle = d.rim;
      person(c, p.x + dir * 1.7 * p.s, p.b - 1.4 * p.s, p.s, p.kind, p.arm);
      c.fillStyle = d.body;
      person(c, p.x, p.b, p.s, p.kind, p.arm);
    }
    return { cnv, flags, body: d.body };
  });
  const r = rng(5);
  DUST = Array.from({ length: 150 }, () => ({ x: r() * W, y: r() * H, r: 0.6 + r() * 2.2, sp: 0.4 + r(), ph: r() * 6.28, big: r() < 0.08 }));
  BIRDS = Array.from({ length: 7 }, (_, i) => ({ x: 150 + r() * 700, y: 180 + r() * 160, s: 0.7 + r() * 0.6, ph: r() * 6.28, sp: 26 + r() * 22 }));
  CLOUDS = [[300, 300, 520, 0.22], [980, 210, 680, 0.18], [1650, 360, 460, 0.2], [620, 470, 400, 0.16], [1250, 520, 560, 0.14]];
}

function miniFlag(c, x, y, w, h, t, ph) {
  const N = 6, sw = w / N;
  for (let i = 0; i < N; i++) {
    const u = i / N, dy = Math.sin(ph + u * 3.2 - t * 6.5) * h * 0.24 * u;
    const sh = 0.85 + 0.15 * Math.cos(ph + u * 3.2 - t * 6.5);
    c.fillStyle = `rgb(${29 * sh | 0},${112 * sh | 0},${62 * sh | 0})`; c.fillRect(x + u * w, y + dy, sw + 0.7, h / 3 + 0.5);
    c.fillStyle = `rgb(${236 * sh | 0},${221 * sh | 0},${200 * sh | 0})`; c.fillRect(x + u * w, y + dy + h / 3, sw + 0.7, h / 3 + 0.5);
    c.fillStyle = `rgb(${190 * sh | 0},${40 * sh | 0},${44 * sh | 0})`; c.fillRect(x + u * w, y + dy + (2 * h) / 3, sw + 0.7, h / 3);
  }
}

const FT = mk(780, 560), FTC = FT.getContext('2d');
function bigFlag(c, px, py, w, h, t, boost = 1) {
  FTC.clearRect(0, 0, 780, 560);
  FTC.imageSmoothingQuality = 'high';
  const N = 170, ox = 10, oy = 120, shade = [];
  const sway = 22 * (1 + 0.3 * Math.sin(t * 1.3));
  for (let i = 0; i < N; i++) {
    const u = i / N, ph = u * 6.6 - t * 4.4;
    const amp = (8 + 44 * u) * Math.pow(u, 0.75) * boost;
    const dy = Math.sin(ph) * amp + u * u * 30;
    const sc = 1 - 0.07 * u * Math.cos(ph);
    const dx = ox + u * w - u * u * sway;
    FTC.drawImage(FLAG, u * 630, 0, 630 / N, 360, dx, oy + dy + ((1 - sc) * h) / 2, w / N + 1.2, h * sc);
    shade.push([dx, Math.cos(ph - 0.9)]);
  }
  FTC.globalCompositeOperation = 'source-atop';
  const x0 = shade[0][0], x1 = shade[N - 1][0] + w / N;
  const sg = FTC.createLinearGradient(x0, 0, x1, 0);
  for (const [dx, sh] of shade) sg.addColorStop(clamp((dx - x0) / (x1 - x0)), sh > 0 ? `rgba(255,236,200,${sh * 0.2})` : `rgba(24,6,12,${-sh * 0.5})`);
  FTC.fillStyle = sg; FTC.fillRect(0, 0, 780, 560);
  const g = FTC.createLinearGradient(0, 0, 780, 0);
  g.addColorStop(0, 'rgba(255,120,60,0.12)');
  g.addColorStop(1, 'rgba(255,180,90,0.34)');
  FTC.fillStyle = g; FTC.fillRect(0, 0, 780, 560);
  FTC.globalCompositeOperation = 'source-over';
  c.drawImage(FT, px - ox, py - oy);
}

// The flag-bearer raises a phone in the left hand; the camera goes over the shoulder onto it.
const PHONE_W = 100, PHONE_H = 205.6, PHONE_S = PHONE_W / 360;
function phonePose(t, ox, br) {
  const x = 560 + ox, ar = E.out(inv(2.1, 3.0, t));
  return { x: lerp(x - 205, x - 150, ar), y: lerp(980, 604 + br, ar), rot: lerp(-0.5, -0.1, ar) + Math.sin(t * 1.3) * 0.012, ar };
}

function mainPerson(c, ox, t, ph, zin) {
  const x = 560 + ox, br = Math.sin(t * 1.6) * 3;
  const pb = [700 + ox, 1110], pt = [726 + ox + Math.sin(t * 1.1) * 4, 128 + br * 0.5];
  bigFlag(c, pt[0] + 2, pt[1] + 8, 470, 268, t, 1 + 0.4 * Math.sin(Math.PI * inv(4.6, 9.6, t)));
  c.save();
  c.lineCap = 'round';
  c.strokeStyle = '#140b0b'; c.lineWidth = 10;
  c.beginPath(); c.moveTo(...pb); c.lineTo(...pt); c.stroke();
  c.strokeStyle = 'rgba(255,196,130,0.75)'; c.lineWidth = 2.2;
  c.beginPath(); c.moveTo(pb[0] + 4, pb[1]); c.lineTo(pt[0] + 4, pt[1]); c.stroke();
  c.fillStyle = '#e9b860';
  c.beginPath(); c.arc(pt[0], pt[1] - 6, 9, 0, Math.PI * 2); c.fill();
  glowDot(c, pt[0], pt[1] - 6, 40, GOLDHI, 0.5);
  c.restore();
  const on = smooth(2.9, 3.25, t);
  if (on > 0) glowDot(c, ph.x, ph.y, 210, [255, 236, 210], 0.28 * on);
  const ar = ph.ar, elbow = [lerp(x - 215, x - 262, ar), lerp(960, 772, ar)], hand = [ph.x - 30, ph.y + 92];
  for (const pass of [0, 1]) {
    c.save();
    if (pass === 0) { c.translate(5, -3); c.fillStyle = c.strokeStyle = 'rgba(255,170,105,0.95)'; }
    else { c.fillStyle = c.strokeStyle = '#0a0608'; }
    c.translate(0, br);
    c.beginPath();
    c.moveTo(x - 215, H + 30);
    c.bezierCurveTo(x - 215, 980, x - 205, 890, x - 170, 858);
    c.bezierCurveTo(x - 130, 826, x - 72, 812, x - 44, 792);
    c.lineTo(x - 36, 742); c.lineTo(x + 36, 742); c.lineTo(x + 44, 792);
    c.bezierCurveTo(x + 82, 810, x + 120, 822, x + 150, 846);
    c.lineTo(x + 176, 930);
    c.bezierCurveTo(x + 186, 990, x + 190, 1040, x + 196, H + 30);
    c.closePath(); c.fill();
    c.beginPath(); c.ellipse(x, 692, 62, 73, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(x + 2, 668, 66, 58, 0.04, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(x - 61, 704, 10, 18, -0.15, 0, Math.PI * 2); c.ellipse(x + 61, 704, 10, 18, 0.15, 0, Math.PI * 2); c.fill();
    c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 64;
    c.beginPath(); c.moveTo(x + 124, 872); c.quadraticCurveTo(x + 210, 772, x + 190, 694); c.stroke();
    c.lineWidth = 52;
    c.beginPath(); c.moveTo(x + 190, 694); c.lineTo(x + 160, 592); c.stroke();
    c.beginPath(); c.ellipse(x + 152, 568, 31, 40, -0.2, 0, Math.PI * 2); c.fill();
    if (ar > 0) {
      c.lineWidth = 56;
      c.beginPath(); c.moveTo(x - 150, 880); c.quadraticCurveTo(elbow[0], elbow[1] + 40, elbow[0], elbow[1]); c.stroke();
      c.lineWidth = 46;
      c.beginPath(); c.moveTo(elbow[0], elbow[1]); c.lineTo(hand[0] - br * 0, hand[1] - br); c.stroke();
      c.beginPath(); c.ellipse(hand[0], hand[1] - br, 28, 34, -0.3, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }
  if (ar > 0.05) {
    c.save();
    c.translate(ph.x, ph.y); c.rotate(ph.rot); c.scale(1, lerp(0.9, 1, zin));
    c.globalAlpha = smooth(0.05, 0.4, ar);
    c.fillStyle = '#0c0c10';
    c.beginPath(); c.roundRect(-PHONE_W / 2 - 4, -PHONE_H / 2 - 4, PHONE_W + 8, PHONE_H + 8, 17); c.fill();
    c.strokeStyle = 'rgba(255,190,130,0.75)'; c.lineWidth = 1.4; c.stroke();
    c.beginPath(); c.roundRect(-PHONE_W / 2, -PHONE_H / 2, PHONE_W, PHONE_H, 13); c.clip();
    c.scale(PHONE_S, PHONE_S); c.translate(-180, -370);
    phoneUI(c, t);
    c.restore();
    c.save();
    c.translate(ph.x, ph.y); c.rotate(ph.rot);
    c.fillStyle = '#0a0608';
    c.beginPath(); c.ellipse(-PHONE_W / 2 - 2, 46, 9, 22, 0.15, 0, Math.PI * 2); c.fill();
    c.restore();
  }
}

const PLEDGE_LINES = ['نقش‌آفرینی برای ایران،', 'به یاد آقای شهید.'];
function phoneUI(c, t) {
  const on = smooth(2.9, 3.25, t);
  const bg = c.createLinearGradient(0, 0, 0, 740);
  bg.addColorStop(0, '#12141b'); bg.addColorStop(1, '#08090c');
  c.fillStyle = bg; c.fillRect(0, 0, 360, 740);
  const cd = smooth(3.85, 4.15, t);
  if (cd > 0) { c.save(); c.globalAlpha *= cd; joinScreen(c, t); c.restore(); }
  const sp = 1 - smooth(3.75, 4.05, t);
  if (sp > 0) {
    c.save(); c.globalAlpha *= sp;
    c.fillStyle = C.red; c.fillRect(0, 0, 360, 740);
    mark(c, 180, 320, 132 * lerp(0.8, 1, E.back(inv(3.0, 3.5, t))), '#fff');
    txt(c, 'نقش من', 180, 448, { size: 40, w: 900, color: '#fff' });
    txt(c, 'یک نقشه، هزاران نقش', 180, 496, { size: 19, w: 500, color: '#ffe0cc' });
    c.restore();
  }
  txt(c, '۲۰:۴۵', 28, 24, { size: 14, w: 700, align: 'left', dir: 'ltr' });
  c.save(); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.strokeRect(312, 18, 24, 12); c.fillStyle = '#fff'; c.fillRect(315, 21, 17, 6); c.fillRect(337, 22, 2, 4); c.restore();
  if (on < 1) { c.fillStyle = `rgba(0,0,0,${1 - on})`; c.fillRect(0, 0, 360, 740); }
}

function joinScreen(c, t) {
  logoTile(c, 316, 76, 42);
  txt(c, 'نقش من', 286, 77, { size: 23, w: 800, align: 'right' });
  const cw = measure('عضویت جدید', 14, 700) + 22;
  c.fillStyle = 'rgba(242,196,109,0.14)'; c.strokeStyle = 'rgba(242,196,109,0.55)'; c.lineWidth = 1.2;
  c.beginPath(); c.roundRect(20, 61, cw, 30, 15); c.fill(); c.stroke();
  txt(c, 'عضویت جدید', 20 + cw / 2, 77, { size: 14, w: 700, color: C.goldHi });
  c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(20, 110, 320, 1);
  const av = E.back(inv(4.05, 4.4, t));
  if (av > 0) {
    c.save(); c.translate(180, 170); c.scale(av, av);
    const g = c.createLinearGradient(-44, -44, 44, 44);
    g.addColorStop(0, '#3a3f4a'); g.addColorStop(1, '#1a1d24');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 44, 0, Math.PI * 2); c.fill();
    c.strokeStyle = rgba(GOLD, 0.8); c.lineWidth = 2; c.stroke();
    icon(c, 'user', 0, 0, 46, '#e5e7eb', 1.7);
    c.restore();
  }
  const nm = smooth(4.2, 4.5, t);
  txt(c, 'عضو تازه‌ی میدان آزادی', 180, 238, { size: 21, w: 800, alpha: nm });
  txt(c, 'تهران · همین حالا', 180, 264, { size: 14, color: C.mute, alpha: nm });
  txt(c, 'نقش شما', 180, 304, { size: 15, w: 600, color: '#c9ccd3', alpha: smooth(4.45, 4.7, t) });
  const kp = E.back(inv(4.6, 5.05, t));
  if (kp > 0) {
    const tw = measure('برای ایران', 28, 800), pw = tw + 90, py = 346;
    glowDot(c, 180, py, 170, GOLD, 0.75 * (1 - inv(4.75, 5.8, t)) + 0.18);
    c.save(); c.translate(180, py); c.scale(kp, kp);
    const pg = c.createLinearGradient(-pw / 2, 0, pw / 2, 0);
    pg.addColorStop(0, '#d9a441'); pg.addColorStop(1, '#f6d58e');
    c.fillStyle = pg; c.beginPath(); c.roundRect(-pw / 2, -27, pw, 54, 27); c.fill();
    miniFlag(c, -pw / 2 + 20, -10, 32, 20, t, 0);
    txt(c, 'برای ایران', pw / 2 - 22, 1, { size: 28, w: 800, color: '#1c1305', align: 'right' });
    c.restore();
  }
  const bx = smooth(5.05, 5.3, t);
  if (bx > 0) {
    c.save(); c.globalAlpha *= bx;
    c.fillStyle = 'rgba(255,255,255,0.045)'; c.strokeStyle = 'rgba(242,196,109,0.28)'; c.lineWidth = 1.2;
    c.beginPath(); c.roundRect(20, 392, 320, 158, 18); c.fill(); c.stroke();
    c.fillStyle = C.gold; c.fillRect(330, 408, 3, 126);
    txt(c, 'عهد من', 318, 416, { size: 14, w: 700, color: C.gold, align: 'right' });
    const words = PLEDGE_LINES.map(l => l.split(' '));
    const total = words.reduce((a, w) => a + w.length, 0);
    let shown = inv(5.2, 6.45, t) * total;
    words.forEach((ws, li) => {
      const y = 458 + li * 48, full = Math.min(ws.length, Math.floor(shown)), frac = clamp(shown - full);
      if (full < ws.length && frac > 0) txt(c, ws.slice(0, full + 1).join(' '), 318, y, { size: 25, w: 700, align: 'right', alpha: frac });
      if (full > 0) txt(c, ws.slice(0, full).join(' '), 318, y, { size: 25, w: 700, align: 'right' });
      shown -= ws.length;
    });
    c.restore();
  }
  const ok = inv(6.45, 6.85, t);
  if (ok > 0) {
    const tw = measure('عضویت تأیید شد', 16, 700), cx = 180 + (tw + 30) / 2 - 11, cy = 584;
    c.save(); c.globalAlpha *= smooth(6.45, 6.65, t);
    c.fillStyle = '#16a34a'; c.beginPath(); c.arc(cx, cy, 11, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 2.4; c.lineCap = 'round'; c.lineJoin = 'round';
    const f = E.out(ok);
    c.beginPath(); c.moveTo(cx - 5, cy); c.lineTo(lerp(cx - 5, cx - 1, clamp(f * 2)), lerp(cy, cy + 4, clamp(f * 2)));
    if (f > 0.5) c.lineTo(lerp(cx - 1, cx + 6, (f - 0.5) * 2), lerp(cy + 4, cy - 4, (f - 0.5) * 2));
    c.stroke();
    txt(c, 'عضویت تأیید شد', cx - 19, cy + 1, { size: 16, w: 700, color: '#4ade80', align: 'right' });
    c.restore();
  }
  const btn = smooth(5.4, 5.7, t);
  if (btn > 0) {
    const press = Math.sin(Math.PI * inv(6.75, 7.05, t));
    c.save(); c.globalAlpha *= btn;
    c.translate(180, 646); c.scale(1 - press * 0.04, 1 - press * 0.04);
    c.fillStyle = C.red; c.beginPath(); c.roundRect(-160, -27, 320, 54, 16); c.fill();
    const rp = inv(6.8, 7.3, t);
    if (rp > 0 && rp < 1) { c.save(); c.beginPath(); c.roundRect(-160, -27, 320, 54, 16); c.clip(); c.fillStyle = `rgba(255,255,255,${0.35 * (1 - rp)})`; c.beginPath(); c.arc(30, 0, 20 + rp * 200, 0, Math.PI * 2); c.fill(); c.restore(); }
    txt(c, 'ورود برای نقش‌آفرینی', 0, 1, { size: 20, w: 800 });
    c.restore();
  }
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.roundRect(120, 722, 120, 5, 3); c.fill();
}

// Other members' roles rise out of the crowd as notifications while the camera pulls back.
const TOASTS = [
  { ic: 'news', r: 'من خبرنگارم؛', s: 'راویِ میدانم', x: 1500, y0: 905, at: 7.45 },
  { ic: 'palette', r: 'من هنرمندم؛', s: 'برای ایران اثر می‌آفرینم', x: 1080, y0: 870, at: 7.75 },
  { ic: 'steth', r: 'من پزشکم؛', s: 'پای کارِ وطنم', x: 1560, y0: 1010, at: 8.05 },
  { ic: 'hammer', r: 'من کارگرم؛', s: 'ایران را آجر به آجر می‌سازم', x: 1060, y0: 985, at: 8.35 },
  { ic: 'brief', r: 'من کارمندم؛', s: 'پشت هر میز، سنگری برای ایران', x: 1330, y0: 1090, at: 8.65 },
];
function crowdToasts(c, t) {
  for (const n of TOASTS) {
    const p = inv(n.at, n.at + 1.55, t);
    if (p <= 0 || p >= 1) continue;
    const a = smooth(0, 0.14, p) * (1 - smooth(0.78, 1, p)), rise = E.out(p) * 170, k = E.back(clamp(p / 0.25));
    const rw = measure(n.r, 27, 800), sw = measure(n.s, 25, 500), w = rw + sw + 104, h = 68;
    const cx = clamp(n.x, w / 2 + 40, W - w / 2 - 40), cy = n.y0 - rise;
    glowDot(c, n.x, n.y0 + 20, 70, GOLD, 0.7 * (1 - smooth(0, 0.35, p)));
    c.save();
    c.globalAlpha = a;
    c.strokeStyle = rgba(GOLD, 0.35); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(n.x, n.y0 + 20); c.lineTo(cx, cy + h / 2); c.stroke();
    c.translate(cx, cy); c.scale(k, k);
    c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 24; c.shadowOffsetY = 8;
    c.fillStyle = 'rgba(14,14,20,0.9)'; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, h / 2); c.fill();
    c.shadowColor = 'transparent';
    c.strokeStyle = 'rgba(242,196,109,0.35)'; c.lineWidth = 1.2; c.stroke();
    const xr = w / 2;
    c.fillStyle = 'rgba(242,196,109,0.16)'; c.beginPath(); c.arc(xr - 36, 0, 24, 0, Math.PI * 2); c.fill();
    icon(c, n.ic, xr - 36, 0, 26, C.goldHi, 2);
    txt(c, n.r, xr - 70, 1, { size: 27, w: 800, align: 'right' });
    txt(c, n.s, xr - 77 - rw, 1, { size: 25, w: 500, color: C.goldSoft, align: 'right' });
    c.restore();
  }
}

function drawS1(c, t) {
  const u = inv(0, 10.3, t);
  const cam = lerp(70, -70, E.sine(u));
  const zb = lerp(1.0, 1.075, E.sine(inv(0, 7.2, t))) * lerp(1, 0.9, E.io(inv(7.3, 10.2, t)));
  const ox = cam * 1.18, br = Math.sin(t * 1.6) * 3, ph = phonePose(t, ox, br);
  const zin = E.io(inv(3.15, 4.2, t)) * (1 - E.io(inv(7.1, 8.3, t)));
  const Z = Math.exp(lerp(Math.log(zb), Math.log(4.5), zin));
  const b0 = [W / 2 + (ph.x - W / 2) * zb, H * 0.62 + (ph.y - H * 0.62) * zb];
  const sp = [lerp(b0[0], W / 2, zin), lerp(b0[1], H / 2 + 8, zin)], rot = -ph.rot * zin;
  const toScreen = (p) => {
    const dx = (p[0] - ph.x) * Z, dy = (p[1] - ph.y) * Z;
    return [sp[0] + dx * Math.cos(rot) - dy * Math.sin(rot), sp[1] + dx * Math.sin(rot) + dy * Math.cos(rot)];
  };
  c.save();
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  c.translate(sp[0], sp[1]); c.rotate(rot); c.scale(Z, Z); c.translate(-ph.x, -ph.y);
  const sky = c.createLinearGradient(0, -60, 0, HORIZON);
  sky.addColorStop(0, '#120a24'); sky.addColorStop(0.3, '#33183c'); sky.addColorStop(0.56, '#83293a');
  sky.addColorStop(0.8, '#dd6b38'); sky.addColorStop(1, '#ffb768');
  c.fillStyle = sky; c.fillRect(-160, -160, W + 320, HORIZON + 170);
  const sx = SUN_X + cam * 0.2, sy = 735;
  c.save();
  c.globalCompositeOperation = 'lighter';
  let g = c.createRadialGradient(sx, sy, 0, sx, sy, 900);
  g.addColorStop(0, 'rgba(255,170,90,0.55)'); g.addColorStop(0.3, 'rgba(255,120,70,0.18)'); g.addColorStop(1, 'rgba(255,90,60,0)');
  c.fillStyle = g; c.fillRect(-160, -160, W + 320, H + 320);
  for (let i = 0; i < 11; i++) {
    const a0 = -Math.PI + 0.25 + i * 0.27 + Math.sin(t * 0.15 + i) * 0.03, wd = 0.035 + (i % 3) * 0.018;
    const rg = c.createRadialGradient(sx, sy, 60, sx, sy, 1300);
    rg.addColorStop(0, 'rgba(255,200,140,0.10)'); rg.addColorStop(1, 'rgba(255,200,140,0)');
    c.fillStyle = rg;
    c.beginPath(); c.moveTo(sx, sy); c.arc(sx, sy, 1400, a0, a0 + wd); c.closePath(); c.fill();
  }
  c.restore();
  for (const [cx0, cy0, rx, a] of CLOUDS) {
    const cx = cx0 + cam * 0.12 + t * 5;
    c.save(); c.translate(cx, cy0); c.scale(1, 0.13);
    const cg = c.createRadialGradient(0, 0, 0, 0, 0, rx);
    cg.addColorStop(0, `rgba(255,150,120,${a})`); cg.addColorStop(1, 'rgba(255,150,120,0)');
    c.fillStyle = cg; c.beginPath(); c.arc(0, 0, rx, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  c.save();
  c.strokeStyle = 'rgba(30,12,24,0.85)'; c.lineWidth = 2.2; c.lineCap = 'round';
  for (const b of BIRDS) {
    const bx = b.x + t * b.sp + cam * 0.2, by = b.y + Math.sin(t * 0.8 + b.ph) * 10, f = Math.sin(t * 9 + b.ph) * 0.6, s = 11 * b.s;
    c.beginPath(); c.moveTo(bx - s, by - s * f); c.quadraticCurveTo(bx - s * 0.4, by - s * 0.5 * f - 2, bx, by); c.quadraticCurveTo(bx + s * 0.4, by - s * 0.5 * f - 2, bx + s, by - s * f); c.stroke();
  }
  c.restore();
  g = c.createRadialGradient(sx, sy, 0, sx, sy, 100);
  g.addColorStop(0, '#fffbe8'); g.addColorStop(0.7, '#ffe0a0'); g.addColorStop(1, '#ffb45e');
  c.fillStyle = g; c.beginPath(); c.arc(sx, sy, 94, 0, Math.PI * 2); c.fill();
  c.save();
  c.fillStyle = '#1c0d16'; c.shadowColor = 'rgba(255,170,95,0.85)'; c.shadowBlur = 34;
  towerPath(c, SUN_X + cam * 0.28, 830, 600); c.fill('evenodd');
  c.restore();
  g = c.createLinearGradient(0, 760, 0, 850);
  g.addColorStop(0, 'rgba(255,150,100,0)'); g.addColorStop(1, 'rgba(255,140,100,0.28)');
  c.fillStyle = g; c.fillRect(-160, 760, W + 320, 90);
  g = c.createLinearGradient(0, HORIZON, 0, H);
  g.addColorStop(0, '#2b1520'); g.addColorStop(1, '#07040a');
  c.fillStyle = g; c.fillRect(-160, HORIZON, W + 320, H - HORIZON + 160);
  const bob = [0.45, 0.68, 0.95];
  CROWD.forEach((L, i) => {
    const lx = -200 + cam * bob[i], oy = Math.sin(t * 1.5 + i * 1.7) * (1.2 + i);
    c.drawImage(L.cnv, lx, oy);
    for (const f of L.flags) miniFlag(c, f.x + lx, f.y + oy, 30 * f.s, 18 * f.s, t, f.ph);
  });
  mainPerson(c, ox, t, ph, zin);
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const d of DUST) {
    const x = ((d.x + t * d.sp * 14 + cam * 0.9) % (W + 80) + W + 80) % (W + 80) - 40;
    const y = ((d.y - t * d.sp * 9 + Math.sin(t + d.ph) * 6) % H + H) % H;
    const tw = 0.5 + 0.5 * Math.sin(t * 2 + d.ph);
    if (d.big) { glowDot(c, x, y, 18 + d.r * 6, WARM, 0.12 * tw); continue; }
    c.fillStyle = rgba(GOLDHI, 0.45 * tw);
    c.beginPath(); c.arc(x, y, d.r, 0, Math.PI * 2); c.fill();
  }
  c.restore();
  c.restore();
  const fl = toScreen([sx, sy]);
  if (zin < 0.98) {
    c.save();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - zin;
    g = c.createLinearGradient(fl[0] - 900, 0, fl[0] + 900, 0);
    g.addColorStop(0, 'rgba(255,180,110,0)'); g.addColorStop(0.5, 'rgba(255,200,140,0.22)'); g.addColorStop(1, 'rgba(255,180,110,0)');
    c.fillStyle = g; c.fillRect(fl[0] - 900, fl[1] - 5, 1800, 6);
    c.restore();
  }
  if (zin > 0) {
    g = c.createRadialGradient(W / 2, H / 2 + 8, 260, W / 2, H / 2 + 8, 1050);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${0.6 * zin})`);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  crowdToasts(c, t);
  finish(c, t, 0.55);
  if (t < 1.4) { c.fillStyle = `rgba(0,0,0,${1 - E.out(inv(0, 1.4, t))})`; c.fillRect(0, 0, W, H); }
}
