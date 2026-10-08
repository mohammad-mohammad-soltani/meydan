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

function mainPerson(c, ox, t) {
  const x = 560 + ox, br = Math.sin(t * 1.6) * 3;
  const pb = [700 + ox, 1110], pt = [726 + ox + Math.sin(t * 1.1) * 4, 128 + br * 0.5];
  bigFlag(c, pt[0] + 2, pt[1] + 8, 470, 268, t, 1 + 0.4 * Math.sin(Math.PI * inv(5.5, 9.2, t)));
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
    c.restore();
  }
  return [x - 100, 764 + br];
}

// the flag-bearer joins «نقش من» and receives the role «پرچمگردانی» (4.4 – 9.4s)
function joinCard(c, t, ps) {
  const a = smooth(4.4, 4.75, t) * (1 - smooth(9.0, 9.45, t));
  if (a <= 0) return;
  const x0 = 56, y0 = 372, w = 410, h = 266, x1 = x0 + w, R = x1 - 24, ax = x1 - 70, ay = y0 + h;
  c.save();
  c.globalAlpha = a;
  c.strokeStyle = rgba(GOLD, 0.75); c.lineWidth = 2; c.setLineDash([4, 8]);
  c.beginPath(); c.moveTo(ps[0], ps[1] - 76); c.quadraticCurveTo(ps[0] - 4, ay + 40, ax, ay); c.stroke();
  c.setLineDash([]);
  const k = E.back(inv(4.4, 4.95, t));
  c.translate(ax, ay); c.scale(lerp(0.8, 1, k), lerp(0.8, 1, k)); c.translate(-ax, -ay);
  c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 44; c.shadowOffsetY = 14;
  c.fillStyle = 'rgba(13,13,18,0.9)'; c.beginPath(); c.roundRect(x0, y0, w, h, 24); c.fill();
  c.shadowColor = 'transparent';
  c.strokeStyle = 'rgba(255,255,255,0.1)'; c.lineWidth = 1.5; c.stroke();
  const tg = c.createLinearGradient(x0, 0, x1, 0);
  tg.addColorStop(0, 'rgba(242,196,109,0)'); tg.addColorStop(0.5, 'rgba(242,196,109,0.85)'); tg.addColorStop(1, 'rgba(242,196,109,0)');
  c.fillStyle = tg; c.fillRect(x0 + 30, y0, w - 60, 1.5);
  logoTile(c, R - 18, y0 + 42, 36);
  txt(c, 'نقش من', R - 48, y0 + 43, { size: 25, w: 800, align: 'right' });
  const cw = measure('عضویت جدید', 16, 700) + 26;
  c.fillStyle = 'rgba(242,196,109,0.14)'; c.strokeStyle = 'rgba(242,196,109,0.55)'; c.lineWidth = 1.2;
  c.beginPath(); c.roundRect(x0 + 24, y0 + 27, cw, 32, 16); c.fill(); c.stroke();
  txt(c, 'عضویت جدید', x0 + 24 + cw / 2, y0 + 44, { size: 16, w: 700, color: C.goldHi });
  c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(x0 + 24, y0 + 78, w - 48, 1);
  const r2 = smooth(4.8, 5.2, t);
  if (r2 > 0) {
    c.save(); c.globalAlpha *= r2; c.translate(0, (1 - r2) * 10);
    const g = c.createLinearGradient(R - 56, y0 + 98, R, y0 + 154);
    g.addColorStop(0, '#3a3f4a'); g.addColorStop(1, '#1a1d24');
    c.fillStyle = g; c.beginPath(); c.arc(R - 28, y0 + 126, 28, 0, Math.PI * 2); c.fill();
    icon(c, 'user', R - 28, y0 + 126, 30, '#e5e7eb', 1.8);
    txt(c, 'عضو تازه‌ی میدان آزادی', R - 70, y0 + 112, { size: 21, w: 700, align: 'right' });
    txt(c, 'تهران · همین حالا', R - 70, y0 + 142, { size: 16, color: C.mute, align: 'right' });
    c.restore();
  }
  const r3 = smooth(5.25, 5.55, t), ry = y0 + 196;
  if (r3 > 0) {
    c.save(); c.globalAlpha *= r3;
    txt(c, 'نقش شما:', R, ry + 1, { size: 18, color: '#c9ccd3', align: 'right' });
    const lw = measure('نقش شما:', 18, 400), tw = measure('پرچمگردانی', 22, 800), pw = tw + 74, pr = R - lw - 14;
    const kp = E.back(inv(5.45, 5.95, t));
    if (kp > 0) {
      const pcx = pr - pw / 2;
      glowDot(c, pcx, ry, 150, GOLD, 0.7 * (1 - inv(5.6, 6.6, t)) + 0.15);
      c.save();
      c.translate(pcx, ry); c.scale(kp, kp); c.translate(-pcx, -ry);
      const pg = c.createLinearGradient(pr - pw, 0, pr, 0);
      pg.addColorStop(0, '#d9a441'); pg.addColorStop(1, '#f6d58e');
      c.fillStyle = pg; c.beginPath(); c.roundRect(pr - pw, ry - 22, pw, 44, 22); c.fill();
      miniFlag(c, pr - pw + 18, ry - 9, 28, 18, t, 0);
      txt(c, 'پرچمگردانی', pr - 18, ry + 1, { size: 22, w: 800, color: '#1c1305', align: 'right' });
      c.restore();
    }
    c.restore();
  }
  const r4 = inv(6.3, 6.75, t);
  if (r4 > 0) {
    const cy = y0 + 240;
    c.save(); c.globalAlpha *= smooth(6.3, 6.5, t);
    c.fillStyle = '#16a34a'; c.beginPath(); c.arc(R - 11, cy, 11, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 2.4; c.lineCap = 'round'; c.lineJoin = 'round';
    const f = E.out(r4);
    c.beginPath(); c.moveTo(R - 16, cy); c.lineTo(lerp(R - 16, R - 12, clamp(f * 2)), lerp(cy, cy + 4, clamp(f * 2)));
    if (f > 0.5) c.lineTo(lerp(R - 12, R - 5, (f - 0.5) * 2), lerp(cy + 4, cy - 4, (f - 0.5) * 2));
    c.stroke();
    txt(c, 'عضویت تأیید شد', R - 32, cy + 1, { size: 17, w: 600, color: '#4ade80', align: 'right' });
    c.restore();
  }
  c.restore();
}

function pin(c, x, y, s, t, a) {
  if (a <= 0) return;
  c.save();
  c.globalAlpha = a;
  for (let k = 0; k < 2; k++) {
    const p = ((t * 0.8 + k * 0.5) % 1);
    c.strokeStyle = rgba(GOLDHI, (1 - p) * 0.7);
    c.lineWidth = 2;
    c.beginPath(); c.ellipse(x, y + s * 0.62, s * (0.3 + p * 1.1), s * (0.1 + p * 0.36), 0, 0, Math.PI * 2); c.stroke();
  }
  glowDot(c, x, y - s * 0.1, s * 1.6, GOLD, 0.55);
  c.fillStyle = C.red;
  c.shadowColor = 'rgba(255,190,110,0.9)'; c.shadowBlur = 26;
  c.beginPath();
  c.moveTo(x, y + s * 0.62);
  c.bezierCurveTo(x - s * 0.18, y + s * 0.35, x - s * 0.5, y + s * 0.05, x - s * 0.5, y - s * 0.28);
  c.arc(x, y - s * 0.28, s * 0.5, Math.PI, 0);
  c.bezierCurveTo(x + s * 0.5, y + s * 0.05, x + s * 0.18, y + s * 0.35, x, y + s * 0.62);
  c.fill();
  c.shadowBlur = 0;
  c.strokeStyle = rgba(GOLDHI, 0.9); c.lineWidth = 2.5; c.stroke();
  mark(c, x, y - s * 0.28, s * 0.62, '#fff');
  c.restore();
}

function drawS1(c, t) {
  const u = inv(0, 10.3, t);
  const cam = lerp(70, -70, E.sine(u)), z = lerp(1.0, 1.075, E.sine(u));
  c.save();
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  c.translate(W / 2, H * 0.62); c.scale(z, z); c.translate(-W / 2, -H * 0.62);
  const sky = c.createLinearGradient(0, -60, 0, HORIZON);
  sky.addColorStop(0, '#120a24'); sky.addColorStop(0.3, '#33183c'); sky.addColorStop(0.56, '#83293a');
  sky.addColorStop(0.8, '#dd6b38'); sky.addColorStop(1, '#ffb768');
  c.fillStyle = sky; c.fillRect(-120, -120, W + 240, HORIZON + 130);
  const sx = SUN_X + cam * 0.2, sy = 735;
  c.save();
  c.globalCompositeOperation = 'lighter';
  let g = c.createRadialGradient(sx, sy, 0, sx, sy, 900);
  g.addColorStop(0, 'rgba(255,170,90,0.55)'); g.addColorStop(0.3, 'rgba(255,120,70,0.18)'); g.addColorStop(1, 'rgba(255,90,60,0)');
  c.fillStyle = g; c.fillRect(-120, -120, W + 240, H + 240);
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
  c.fillStyle = g; c.fillRect(-120, 760, W + 240, 90);
  g = c.createLinearGradient(0, HORIZON, 0, H);
  g.addColorStop(0, '#2b1520'); g.addColorStop(1, '#07040a');
  c.fillStyle = g; c.fillRect(-120, HORIZON, W + 240, H - HORIZON + 120);
  const bob = [0.45, 0.68, 0.95];
  CROWD.forEach((L, i) => {
    const ox = -200 + cam * bob[i], oy = Math.sin(t * 1.5 + i * 1.7) * (1.2 + i);
    c.drawImage(L.cnv, ox, oy);
    for (const f of L.flags) miniFlag(c, f.x + ox, f.y + oy, 30 * f.s, 18 * f.s, t, f.ph);
  });
  const pinAt = mainPerson(c, cam * 1.18, t);
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
  c.save();
  c.globalCompositeOperation = 'lighter';
  const fx = sx + (sx - W / 2 * 1) * (z - 1);
  g = c.createLinearGradient(fx - 900, 0, fx + 900, 0);
  g.addColorStop(0, 'rgba(255,180,110,0)'); g.addColorStop(0.5, 'rgba(255,200,140,0.22)'); g.addColorStop(1, 'rgba(255,180,110,0)');
  c.fillStyle = g; c.fillRect(fx - 900, 728, 1800, 6);
  c.restore();
  const ps = [W / 2 + (pinAt[0] - W / 2) * z, H * 0.62 + (pinAt[1] - H * 0.62) * z];
  joinCard(c, t, ps);
  const pa = E.out(inv(3.0, 3.8, t)) * (1 - smooth(9.4, 10, t));
  pin(c, ps[0], ps[1] - (1 - E.back(inv(3.0, 3.8, t))) * 40, 92, t, pa);
  const ta = smooth(6.6, 7.3, t) * (1 - smooth(9.2, 9.8, t));
  if (ta > 0) {
    g = c.createLinearGradient(0, H - 300, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${0.6 * ta})`);
    c.fillStyle = g; c.fillRect(0, H - 300, W, 300);
    const yy = H - 118 + (1 - E.out(inv(6.6, 7.5, t))) * 24;
    txt(c, 'هر حضور، یک نقش', W - 120, yy, { size: 46, w: 800, align: 'right', alpha: ta, glow: 'rgba(0,0,0,0.6)', blur: 18 });
    c.save(); c.globalAlpha = ta;
    c.fillStyle = C.gold; c.fillRect(W - 120 - 120 * E.out(inv(6.9, 7.8, t)), yy + 44, 120 * E.out(inv(6.9, 7.8, t)), 3);
    c.restore();
  }
  finish(c, t, 0.55);
  if (t < 1.4) { c.fillStyle = `rgba(0,0,0,${1 - E.out(inv(0, 1.4, t))})`; c.fillRect(0, 0, W, H); }
}
