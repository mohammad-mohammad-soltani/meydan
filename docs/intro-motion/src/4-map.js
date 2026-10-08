// ───────── Scenes 3–5 · Tehran network → Iran → globe → feature line (20 – 50s)
const TEH = [51.405, 35.728], IRC = [53.7, 32.5];
const SQ = [
  ['میدان آزادی', 51.338, 35.6997], ['میدان انقلاب', 51.3913, 35.7008], ['میدان امام حسین', 51.4452, 35.702], ['میدان ولیعصر', 51.4069, 35.7117],
  ['میدان تجریش', 51.4337, 35.8044], ['میدان ونک', 51.41, 35.7575], ['میدان هفت تیر', 51.4255, 35.7155], ['میدان امام خمینی', 51.4206, 35.6863],
  ['میدان فردوسی', 51.4202, 35.7015], ['میدان راه‌آهن', 51.4041, 35.6603], ['میدان شهدا', 51.4567, 35.6917], ['میدان رسالت', 51.4986, 35.7369],
  ['میدان پونک', 51.326, 35.76], ['میدان صنعت', 51.37, 35.756],
].map(([n, lon, lat]) => ({ n, ll: [lon, lat] }));
SQ.forEach((s, i) => { s.act = i < 8 ? 21.55 + i * 0.07 : 22.45 + (i - 8) * 0.34; s.an = 'l'; });
SQ[2].an = 'r'; SQ[6].an = 'r'; SQ[8].an = 'b'; SQ[10].an = 'r';
const SQE = [[0, 1], [1, 3], [1, 8], [3, 8], [8, 2], [2, 10], [10, 7], [7, 8], [7, 9], [9, 1], [3, 6], [6, 2], [3, 5], [5, 4], [5, 12], [12, 0], [6, 11], [11, 2], [5, 11], [13, 5], [13, 0], [13, 12], [0, 9], [4, 11], [6, 8]]
  .map(([a, b], i) => ({ a, b, s: Math.max(SQ[a].act, SQ[b].act) + 0.2 + (i % 4) * 0.05, bend: (i % 2 ? 1 : -1) * 0.14 }));
const ARTERIES = [
  [[51.22, 35.718], [51.28, 35.709], [51.338, 35.6997], [51.3913, 35.7008], [51.4202, 35.7015], [51.4452, 35.702], [51.5, 35.7055], [51.56, 35.709]],
  [[51.4041, 35.6603], [51.4061, 35.687], [51.4069, 35.7117], [51.4085, 35.73], [51.41, 35.7575], [51.417, 35.78], [51.4337, 35.8044]],
  [[51.39, 35.705], [51.387, 35.74], [51.392, 35.77], [51.4, 35.795]],
  [[51.429, 35.705], [51.428, 35.73], [51.423, 35.76], [51.43, 35.79]],
  [[51.388, 35.648], [51.389, 35.699]],
  [[51.31, 35.752], [51.37, 35.752], [51.42, 35.753], [51.47, 35.756], [51.53, 35.758]],
  [[51.3, 35.772], [51.4, 35.773]],
  [[51.43, 35.74], [51.4986, 35.7369], [51.55, 35.735]],
  [[51.443, 35.712], [51.446, 35.76], [51.45, 35.795]],
  [[51.46, 35.68], [51.458, 35.75]],
  [[51.35, 35.68], [51.25, 35.665]],
  [[51.33, 35.655], [51.45, 35.65]],
  [[51.4, 35.66], [51.4, 35.6]],
  [[51.4206, 35.6863], [51.4567, 35.6917], [51.52, 35.695]],
];
const CITIES = [
  ['تهران', 51.389, 35.689, 1], ['مشهد', 59.606, 36.297, 1], ['اصفهان', 51.668, 32.654, 1], ['شیراز', 52.583, 29.592, 1], ['تبریز', 46.291, 38.08, 1],
  ['اهواز', 48.669, 31.32, 1], ['کرمانشاه', 47.065, 34.314, 0], ['قم', 50.876, 34.64, 0], ['کرمان', 57.079, 30.283, 1], ['رشت', 49.583, 37.28, 0],
  ['زاهدان', 60.863, 29.496, 1], ['بندرعباس', 56.266, 27.183, 1], ['یزد', 54.367, 31.897, 0], ['ارومیه', 45.076, 37.552, 0], ['همدان', 48.515, 34.799, 0],
  ['ساری', 53.06, 36.563, 0], ['گرگان', 54.434, 36.841, 0], ['بوشهر', 50.838, 28.923, 0], ['زنجان', 48.478, 36.674, 0], ['اردبیل', 48.293, 38.249, 0],
  ['خرم‌آباد', 48.356, 33.487, 0], ['بیرجند', 59.221, 32.866, 0], ['سمنان', 53.394, 35.572, 0], ['اراک', 49.689, 34.092, 0], ['سنندج', 46.999, 35.31, 0],
  ['ایلام', 46.422, 33.637, 0], ['یاسوج', 51.588, 30.668, 0], ['شهرکرد', 50.864, 32.325, 0], ['بجنورد', 57.334, 37.475, 0], ['قزوین', 50.004, 36.269, 0],
  ['چابهار', 60.643, 25.292, 0], ['کیش', 53.98, 26.53, 0],
].map(([n, lon, lat, big]) => ({ n, ll: [lon, lat], big, d: Math.hypot(lon - 51.389, lat - 35.689) }));
CITIES.forEach(cy => { cy.act = 31.15 + cy.d * 0.13; });
const CE = [];
(() => {
  const seen = new Set();
  const add = (a, b, s) => { const k = a < b ? a + '-' + b : b + '-' + a; if (a === b || seen.has(k)) return; seen.add(k); CE.push({ a, b, s, bend: (CE.length % 2 ? 1 : -1) * 0.12 }); };
  CITIES.forEach((cy, i) => { if (i) add(0, i, 31.0 + cy.d * 0.13); });
  CITIES.forEach((cy, i) => {
    if (!i) return;
    const near = CITIES.map((o, j) => [j, Math.hypot(o.ll[0] - cy.ll[0], o.ll[1] - cy.ll[1])]).filter(([j]) => j && j !== i).sort((p, q) => p[1] - q[1]).slice(0, 2);
    for (const [j] of near) add(i, j, Math.max(cy.act, CITIES[j].act) + 0.25);
  });
})();
const WORLD_CITIES = [[28.98, 41.01, 3], [31.24, 30.04, 3], [46.72, 24.69, 2], [55.27, 25.2, 2], [44.36, 33.31, 2], [67.01, 24.86, 3], [77.21, 28.61, 4], [72.88, 19.08, 3], [37.62, 55.75, 3], [30.52, 50.45, 2], [32.85, 39.93, 2], [69.24, 41.3, 2], [69.17, 34.53, 1], [74.33, 31.55, 2], [73.05, 33.68, 1], [39.17, 21.54, 2], [51.53, 25.29, 1], [47.98, 29.37, 1], [58.41, 23.59, 1], [49.87, 40.41, 1], [44.79, 41.72, 1], [44.51, 40.18, 1], [36.29, 33.51, 1], [35.5, 33.89, 1], [35.93, 31.95, 1], [35.21, 31.77, 1], [44.21, 15.35, 1], [38.75, 9.03, 2], [32.53, 15.5, 1], [36.82, -1.29, 2], [23.73, 37.98, 2], [12.5, 41.9, 2], [13.4, 52.52, 2], [2.35, 48.86, 3], [-0.13, 51.51, 3], [-3.7, 40.42, 2], [21.01, 52.23, 2], [26.1, 44.43, 2], [90.41, 23.81, 4], [88.36, 22.57, 3], [80.27, 13.08, 3], [77.59, 12.97, 3], [78.48, 17.39, 3], [58.38, 37.95, 1], [76.89, 43.24, 1], [74.6, 42.87, 1], [68.78, 38.56, 1], [87.62, 43.83, 1], [116.4, 39.9, 4], [104.07, 30.67, 3], [49.11, 55.79, 1], [50.1, 53.2, 1], [44.5, 48.7, 1], [29.92, 31.2, 2], [47.78, 30.51, 1], [43.13, 36.34, 1], [44.01, 36.19, 1], [39.83, 21.42, 2], [39.61, 24.47, 1], [44.33, 32.0, 1], [44.02, 32.62, 1], [71.58, 34.0, 1], [62.2, 34.35, 1], [65.7, 31.6, 1], [67.0, 30.18, 1], [27.14, 38.42, 1], [85.32, 27.72, 2], [79.86, 6.93, 1], [28.05, -26.2, 2], [39.28, -6.8, 1], [45.3, 2.05, 1], [55.97, 54.73, 1], [60.6, 56.84, 1], [82.9, 55.0, 1], [73.37, 54.98, 1], [71.45, 51.17, 1], [66.96, 39.65, 1], [67.11, 36.7, 1], [80.95, 26.85, 3], [75.8, 26.9, 2], [72.57, 23.02, 2], [83.0, 25.3, 2], [114.3, 30.6, 3], [108.9, 34.3, 2], [121.47, 31.23, 3], [113.26, 23.13, 3], [100.5, 13.75, 2], [106.8, -6.2, 2], [18.07, 59.33, 1], [24.94, 60.17, 1], [16.37, 48.21, 2], [19.04, 47.5, 2], [14.42, 50.08, 1], [9.19, 45.46, 2], [4.9, 52.37, 2], [30.31, 59.94, 2]];

let STREETS = [], CONTOURS = [], STARS = [], LIGHTS = [], IRAN_RINGS = [];
const proj = d3.geoOrthographic().clipAngle(90).precision(0);
let gpath;
let CAM = { L: TEH, R: 1, cx: W / 2, cy: H / 2, tilt: 1 };

function buildMapData() {
  gpath = d3.geoPath(proj);
  const r = rng(3), cell = 0.022;
  const mask = (lon, lat) => ((lon - 51.405) / 0.2) ** 2 + ((lat - 35.718) / 0.098) ** 2 + Math.sin(lon * 90) * 0.06 + Math.cos(lat * 70) * 0.05 < 1 && lat < 35.81;
  for (let lon = 51.2; lon < 51.62; lon += cell) for (let lat = 35.6; lat < 35.83; lat += cell) {
    const cx = lon + cell / 2, cy = lat + cell / 2;
    if (!mask(cx, cy)) continue;
    const ang = (r() - 0.5) * 0.6, k = 1 / Math.cos(cy * Math.PI / 180);
    for (const a of [ang, ang + Math.PI / 2 + (r() - 0.5) * 0.2]) {
      const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx, sp = 0.0028 + r() * 0.0016;
      for (let o = -cell / 2; o <= cell / 2; o += sp) {
        const px = cx + nx * o * k, py = cy + ny * o, L = cell * (0.48 + r() * 0.1);
        if (r() < 0.12) continue;
        const cut = r() < 0.35 ? r() * 0.7 + 0.15 : 1;
        STREETS.push([[px - dx * L * k, py - dy * L], [px + dx * L * k * (2 * cut - 1), py + dy * L * (2 * cut - 1)]]);
      }
    }
  }
  for (let i = 0; i < 7; i++) {
    const lat0 = 35.815 + i * 0.016, pts = [];
    for (let lon = 51.15; lon <= 51.7; lon += 0.01) pts.push([lon, lat0 + Math.sin(lon * 40 + i) * 0.006 + Math.sin(lon * 13 + i * 2) * 0.01]);
    CONTOURS.push(pts);
  }
  const rs = rng(17);
  STARS = Array.from({ length: 900 }, () => ({ x: rs() * (W + 600) - 300, y: rs() * H, r: rs() < 0.92 ? 0.5 + rs() * 0.9 : 1.2 + rs() * 1.2, ph: rs() * 6.28, a: 0.25 + rs() * 0.6 }));
  const rl = rng(41), land = { type: 'Feature', geometry: GEO.land };
  for (const [lon, lat, wgt] of WORLD_CITIES) {
    const n = 8 + wgt * 12, sig = 0.18 + wgt * 0.12;
    LIGHTS.push({ ll: [lon, lat], b: 1, core: wgt });
    for (let k = 0; k < n; k++) {
      const ra = sig * Math.sqrt(-2 * Math.log(1 - rl() * 0.999)), an = rl() * 6.28;
      LIGHTS.push({ ll: [lon + Math.cos(an) * ra * 1.25, lat + Math.sin(an) * ra], b: clamp(1.1 - ra / (sig * 2.2)) * (0.4 + rl() * 0.6) });
    }
  }
  let added = 0, tries = 0;
  while (added < 900 && tries < 6000) {
    tries++;
    const ll = [-20 + rl() * 150, -35 + rl() * 100];
    if (d3.geoContains(land, ll)) { LIGHTS.push({ ll, b: 0.15 + rl() * 0.4 }); added++; }
  }
  IRAN_RINGS = GEO.iran.type === 'MultiPolygon' ? GEO.iran.coordinates.map(p => p[0]) : [GEO.iran.coordinates[0]];
}

function logLerp(a, b, u) { return Math.exp(lerp(Math.log(a), Math.log(b), u)); }
function sphLerp(a, b, u) { return d3.geoInterpolate(a, b)(u); }

function trap(t, a, b, c2, d, v) {
  if (t <= a) return 0;
  let s = 0;
  const t1 = Math.min(t, b); s += v * (t1 - a) * (t1 - a) / (2 * (b - a)); if (t <= b) return s;
  const t2 = Math.min(t, c2); s += v * (t2 - b); if (t <= c2) return s;
  const t3 = Math.min(t, d), q = t3 - c2; s += v * q - v * q * q / (2 * (d - c2)); return s;
}
const PAN_V = 400, PAN_D = LINE_END, PAN_C = PAN_D - 1.5, PAN_B = 40.6;
const pan = t => trap(t, 39.5, PAN_B, PAN_C, PAN_D, PAN_V);

function camAt(t) {
  let R, L = TEH, cx = W / 2, cy = H / 2 + 10, tilt = 1;
  if (t < 23.8) {
    R = logLerp(1.25e6, 4.3e5, E.io(inv(20.2, 23.8, t)));
    tilt = lerp(0.55, 1, E.io(inv(19.9, 23.6, t)));
  } else if (t < 29.4) {
    R = lerp(4.3e5, 3.7e5, inv(23.8, 29.4, t));
  } else if (t < 33.0) {
    const u = E.io(inv(29.4, 33.0, t));
    R = logLerp(3.7e5, 3300, u);
    L = sphLerp(TEH, IRC, Math.pow(u, 3));
  } else if (t < 34.4) {
    R = 3300 * lerp(1, 0.93, inv(33.0, 34.4, t)); L = IRC;
  } else {
    R = logLerp(3069, 360, E.io(inv(34.4, 37.8, t)));
    L = IRC;
  }
  if (t > 34.4) L = [IRC[0] - 9 * inv(34.4, LINE_END, t), IRC[1] - 4 * E.io(inv(34.4, 38, t))];
  const m = E.io(inv(37.6, 39.3, t));
  if (m > 0) { R *= lerp(1, 0.78, m); cx = lerp(cx, 1500, m) + pan(t); cy = lerp(cy, 540, m); }
  return { L, R, cx, cy, tilt };
}
function setCam(k) {
  CAM = k;
  const m = 80;
  proj.rotate([-k.L[0], -k.L[1]]).scale(k.R).translate([k.cx, k.cy])
    .clipExtent([[-m, k.cy - (k.cy + m) / k.tilt], [W + m, k.cy + (H - k.cy + m) / k.tilt]]);
}
const scr = ll => { const p = proj(ll); return [p[0], CAM.cy + (p[1] - CAM.cy) * CAM.tilt]; };
function poly(c, pts, close) {
  for (let i = 0; i < pts.length; i++) { const p = proj(pts[i]); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }
  if (close) c.closePath();
}
function arcPath(c, p, q, bend) {
  const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, dx = q[0] - p[0], dy = q[1] - p[1];
  const cxp = mx - dy * bend, cyp = my + dx * bend;
  c.moveTo(p[0], p[1]); c.quadraticCurveTo(cxp, cyp, q[0], q[1]);
  return [cxp, cyp];
}
function arcPartial(c, p, q, bend, f) {
  const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, dx = q[0] - p[0], dy = q[1] - p[1];
  const k = [mx - dy * bend, my + dx * bend];
  const a1 = [lerp(p[0], k[0], f), lerp(p[1], k[1], f)], b1 = [lerp(k[0], q[0], f), lerp(k[1], q[1], f)];
  const e = [lerp(a1[0], b1[0], f), lerp(a1[1], b1[1], f)];
  c.moveTo(p[0], p[1]); c.quadraticCurveTo(a1[0], a1[1], e[0], e[1]);
  return { k, e };
}
const qpt = (p, k, q, s) => [(1 - s) * (1 - s) * p[0] + 2 * (1 - s) * s * k[0] + s * s * q[0], (1 - s) * (1 - s) * p[1] + 2 * (1 - s) * s * k[1] + s * s * q[1]];

function networkLayer(c, t, nodes, edges, alpha, dur, size) {
  if (alpha <= 0.01) return;
  const P = nodes.map(n => proj(n.ll));
  for (const e of edges) {
    const f = E.io(inv(e.s, e.s + dur, t));
    if (f <= 0) continue;
    const p = P[e.a], q = P[e.b];
    if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 2) continue;
    let k;
    glowLine(c, () => { c.beginPath(); k = arcPartial(c, p, q, e.bend, f).k; }, alpha * 0.85, size.line);
    if (f >= 1) {
      const s = ((t - e.s) * 0.45 + e.bend * 3) % 1;
      const pt = qpt(p, k, q, s);
      glowDot(c, pt[0], pt[1], size.pulse, GOLDHI, alpha * 0.9 * Math.sin(Math.PI * s));
    } else {
      const pt = qpt(p, k, q, f);
      glowDot(c, pt[0], pt[1], size.pulse * 1.5, GOLDHI, alpha);
    }
  }
  nodes.forEach((n, i) => {
    const a = smooth(n.act, n.act + 0.25, t) * alpha;
    if (a <= 0.01) return;
    const [x, y] = P[i], r0 = size.node * (n.big === 0 ? 0.75 : 1);
    glowDot(c, x, y, r0 * 3.2, GOLD, a * 0.55);
    const fl = inv(n.act, n.act + 0.9, t);
    if (fl > 0 && fl < 1) {
      c.save(); c.strokeStyle = rgba(GOLDHI, (1 - fl) * a); c.lineWidth = 2 / CAM.tilt;
      c.beginPath(); c.arc(x, y, r0 + fl * r0 * 5, 0, Math.PI * 2); c.stroke(); c.restore();
    }
    const fig = Math.sin(Math.PI * inv(n.act + 0.05, n.act + 1.3, t));
    c.save(); c.globalAlpha = a * (1 - fig);
    c.fillStyle = C.goldHi; c.beginPath(); c.arc(x, y, r0 * 0.5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = rgba(GOLD, 0.9); c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, r0, 0, Math.PI * 2); c.stroke();
    c.restore();
    if (fig > 0.01) { glowDot(c, x, y - r0, r0 * 3, GOLDHI, a * fig * 0.6); figure(c, x, y - r0 * 0.4, r0 * 3.2, C.goldHi, a * fig); }
  });
}

function drawMap(c, t) {
  const k = camAt(t);
  setCam(k);
  const lnR = Math.log(k.R);
  const fade = (a, b) => clamp((lnR - Math.log(a)) / (Math.log(b) - Math.log(a)));
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  const starA = fade(9000, 1500);
  if (starA > 0) {
    const ox = t > 38 ? pan(t) * 0.12 : 0;
    c.save();
    for (const s of STARS) {
      const tw = 0.6 + 0.4 * Math.sin(t * 1.7 + s.ph);
      c.fillStyle = `rgba(255,248,235,${s.a * tw * starA})`;
      const x = ((s.x + ox) % (W + 600) + W + 600) % (W + 600) - 300;
      c.fillRect(x, s.y, s.r, s.r);
    }
    c.restore();
  }
  const bg = c.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1100);
  bg.addColorStop(0, 'rgba(40,30,20,0.25)'); bg.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  c.save();
  c.translate(0, k.cy); c.scale(1, k.tilt); c.translate(0, -k.cy);
  const globeA = fade(14000, 3500);
  if (globeA > 0) {
    c.save(); c.globalAlpha = globeA;
    const ag = c.createRadialGradient(k.cx, k.cy, k.R * 0.94, k.cx, k.cy, k.R * 1.28);
    ag.addColorStop(0, 'rgba(110,150,255,0.0)'); ag.addColorStop(0.12, 'rgba(110,160,255,0.32)'); ag.addColorStop(0.45, 'rgba(70,90,200,0.08)'); ag.addColorStop(1, 'rgba(40,60,140,0)');
    c.fillStyle = ag; c.beginPath(); c.arc(k.cx, k.cy, k.R * 1.3, 0, Math.PI * 2); c.fill();
    const og = c.createRadialGradient(k.cx - k.R * 0.35, k.cy - k.R * 0.4, k.R * 0.05, k.cx, k.cy, k.R);
    og.addColorStop(0, '#0f1a30'); og.addColorStop(1, '#03050b');
    c.fillStyle = og; c.beginPath(); c.arc(k.cx, k.cy, k.R, 0, Math.PI * 2); c.fill();
    gpath.context(c);
    c.beginPath(); gpath(GEO.land); c.fillStyle = '#0e121b'; c.fill();
    c.strokeStyle = 'rgba(242,196,109,0.16)'; c.lineWidth = 0.8; c.stroke();
    c.beginPath(); gpath(d3.geoGraticule10()); c.strokeStyle = 'rgba(160,180,255,0.05)'; c.stroke();
    c.restore();
  }
  const regA = fade(260000, 60000) * (1 - fade(2600, 1100));
  if (regA > 0) {
    c.save(); c.globalAlpha = regA;
    gpath.context(c);
    c.beginPath(); gpath(GEO.landHi);
    c.fillStyle = '#0d1018'; c.fill();
    c.strokeStyle = 'rgba(242,196,109,0.14)'; c.lineWidth = 1; c.stroke();
    c.restore();
  }
  const irA = fade(300000, 50000);
  if (irA > 0) {
    c.save();
    c.globalAlpha = irA;
    c.fillStyle = 'rgba(242,196,109,0.06)';
    for (const ring of IRAN_RINGS) { c.beginPath(); poly(c, ring, true); c.fill(); }
    const pa = fade(150000, 12000) * (1 - fade(1500, 700));
    if (pa > 0) {
      c.strokeStyle = rgba(GOLD, 0.22 * pa); c.lineWidth = 1;
      for (const pr of GEO.provs) for (const p of pr.paths) { c.beginPath(); poly(c, p, true); c.stroke(); }
    }
    c.restore();
    glowLine(c, () => { c.beginPath(); for (const ring of IRAN_RINGS) poly(c, ring, true); }, irA * 0.9, k.R > 2000 ? 1.8 : 1.1);
  }
  const stA = 1 - fade(300000, 110000);
  if (stA > 0) {
    c.save();
    c.globalAlpha = stA;
    c.strokeStyle = 'rgba(150,170,210,0.10)'; c.lineWidth = 1;
    c.beginPath(); for (const s of STREETS) poly(c, s, false); c.stroke();
    c.strokeStyle = 'rgba(190,200,230,0.06)'; c.lineWidth = 1.2;
    c.beginPath(); for (const s of CONTOURS) poly(c, s, false); c.stroke();
    c.strokeStyle = 'rgba(200,210,240,0.28)'; c.lineWidth = 2.4;
    c.beginPath(); for (const s of ARTERIES) poly(c, s, false); c.stroke();
    const mp = proj([51.3753, 35.7448]);
    c.fillStyle = 'rgba(200,210,240,0.5)'; c.beginPath(); c.arc(mp[0], mp[1], 5, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  const lightA = fade(3500, 700);
  if (lightA > 0) {
    const ctr = [-proj.rotate()[0], -proj.rotate()[1]];
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const l of LIGHTS) {
      if (d3.geoDistance(l.ll, ctr) > 1.5) continue;
      const p = proj(l.ll);
      if (l.core) { glowDot(c, p[0], p[1], 4 + l.core * 3, WARM, 0.35 * lightA); continue; }
      c.fillStyle = `rgba(255,214,160,${0.6 * l.b * lightA})`;
      c.fillRect(p[0] - 0.7, p[1] - 0.7, 1.4, 1.4);
    }
    c.restore();
  }
  const netA = 1 - fade(60000, 9000);
  networkLayer(c, t, SQ, SQE, netA, 0.65, { line: 2 / k.tilt, pulse: 14, node: 9 });
  if (netA < 1 && t > 29) glowDot(c, ...proj(TEH), 40 + 30 * (1 - netA), GOLD, (1 - netA) * 0.9 * (1 - fade(2000, 600) * 0.4));
  const cityA = smooth(30.9, 31.3, t) * (1 - fade(1500, 500) * 0.55);
  networkLayer(c, t, CITIES, CE, cityA, 0.7, { line: k.R > 1500 ? 1.6 : 1.1, pulse: k.R > 1500 ? 10 : 6, node: k.R > 1500 ? 6.5 : 3.2 });
  if (globeA > 0) {
    const tp = proj(TEH);
    glowDot(c, tp[0], tp[1], 26 + k.R * 0.28, GOLD, globeA * 0.45);
  }
  c.restore();
  const labA = smooth(21.7, 22.4, t) * (1 - fade(220000, 90000)) * (1 - smooth(29.2, 30.0, t));
  if (labA > 0) {
    SQ.forEach(s => {
      const a = labA * smooth(s.act + 0.15, s.act + 0.6, t);
      if (a <= 0) return;
      const [x, y] = scr(s.ll);
      const o = { size: 23, w: 600, color: 'rgba(255,240,215,0.9)', alpha: a, glow: 'rgba(0,0,0,0.9)', blur: 10 };
      if (s.an === 'r') txt(c, s.n, x + 22, y + 2, { ...o, align: 'left' });
      else if (s.an === 'b') txt(c, s.n, x, y + 34, { ...o, align: 'center' });
      else txt(c, s.n, x - 22, y + 2, { ...o, align: 'right' });
    });
    const mp = scr([51.3753, 35.7448]);
    txt(c, 'برج میلاد', mp[0] + 14, mp[1], { size: 18, align: 'left', color: 'rgba(200,210,240,0.6)', alpha: labA });
  }
  const cLab = smooth(31.8, 32.5, t) * (1 - smooth(34.2, 34.9, t));
  if (cLab > 0) {
    CITIES.forEach(cy => {
      if (!cy.big) return;
      const a = cLab * smooth(cy.act + 0.2, cy.act + 0.6, t);
      const [x, y] = scr(cy.ll);
      txt(c, cy.n, x - 16, y + 1, { size: cy.n === 'تهران' ? 26 : 21, w: cy.n === 'تهران' ? 800 : 500, align: 'right', color: 'rgba(255,240,215,0.88)', alpha: a, glow: 'rgba(0,0,0,0.9)', blur: 8 });
    });
  }
  const capA = smooth(24.2, 25.0, t) * (1 - smooth(28.6, 29.3, t));
  if (capA > 0) caption(c, 'تهران؛ هر میدان یک گره، همه به هم وصل', capA);
  const capB = smooth(32.3, 33.0, t) * (1 - smooth(35.4, 36.0, t));
  if (capB > 0) caption(c, 'از تهران تا همه‌ی ایران', capB);
  if (t > 37.9) drawFeatureLine(c, t, k);
  finish(c, t, 0.55);
}

function caption(c, s, a) {
  txt(c, s, W - 120, H - 118, { size: 40, w: 700, align: 'right', alpha: a, glow: 'rgba(0,0,0,0.85)', blur: 18 });
  c.save(); c.globalAlpha = a; c.fillStyle = C.gold; c.fillRect(W - 240, H - 74, 120, 3); c.restore();
}

// ── Scene 5 · the line of features
const FEAT = [
  { ic: 'mic', t: 'اعزام سخنران', s: ['سخنران مناسب، در لحظه'] },
  { ic: 'phone', t: 'بیست‌کال', s: ['تماسِ یک‌به‌یک؛ دعوت به نقش‌آفرینی'] },
  { ic: 'mega', t: 'پویش', s: ['یک پیام، برای همه'] },
  { ic: 'note', t: 'یادداشت تحلیلی و سیاسی', s: ['تحلیل، شفاف و به‌روز'] },
  { ic: 'audio', t: 'آوا و نوا', s: ['سخنرانی و مداحی، هر لحظه در گوش‌تان'] },
  { ic: 'quote', t: 'روایت', s: ['امروزِ ایران، به روایتِ خودِ مردم'] },
  { ic: 'help', t: 'کارها', s: ['تصمیمِ جمعی، کارِ واقعی؛ هر کس به قدر توانش', 'تعریف کن یا بپیوند؛ همه‌اش داوطلبانه'] },
  { ic: 'tv', t: 'پوشش رسانه‌ای', s: ['کارهای شما در قابِ رسانه‌های ملی؛', 'الگویی از کفِ ایران‌زمین'] },
  { ic: 'pin', t: 'نقشه‌ی زنده', s: ['میدان‌ها و کارهای ایران، زنده و شفاف'] },
  { ic: 'chats', t: 'گفتگو و تعامل', s: ['با مردمِ سراسرِ ایران و عزیزانتان؛ تا راه ادامه یابد'] },
];
const FX0 = 860, FSP = 700;
const waveY = xw => 590 + 52 * Math.sin((FX0 - xw) / 340);
function headX(t, tx) {
  if (t < 39.4) return lerp(tx, 520, E.out(inv(38.15, 39.4, t)));
  if (t < LINE_END - 1.3) return 520;
  return lerp(520, -260, E.in(inv(LINE_END - 1.3, LINE_END - 0.2, t)));
}
function drawFeatureLine(c, t, k) {
  const p = pan(t), tp = scr(TEH), hx = headX(t, tp[0]);
  const lineA = smooth(37.9, 38.3, t);
  const x0s = FX0 + p;
  const pts = [];
  for (let x = tp[0]; x >= hx; x -= 6) {
    const wv = waveY(x - p), b = smooth(x0s, tp[0], x);
    pts.push([x, lerp(wv, tp[1], b * b)]);
  }
  if (pts.length > 1) {
    c.save(); c.globalAlpha = lineA * 0.35; c.strokeStyle = C.gold; c.lineWidth = 1;
    c.setLineDash([3, 16]);
    c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y + 30) : c.moveTo(x, y + 30))); c.stroke();
    c.setLineDash([]);
    c.restore();
    glowLine(c, () => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); }, lineA, 2.6);
    const [hxp, hyp] = pts[pts.length - 1];
    glowDot(c, hxp, hyp, 90, GOLD, lineA * 0.7);
    glowDot(c, hxp, hyp, 18, [255, 255, 255], lineA);
  }
  FEAT.forEach((f, i) => {
    const xs = FX0 - FSP * i + p, ys = waveY(FX0 - FSP * i);
    const prog = clamp((xs - hx) / 260);
    if (prog <= 0 || xs < -400 || xs > W + 400) return;
    featNode(c, f, i, xs, ys, prog, t);
  });
}
function featNode(c, f, i, x, y, prog, t) {
  const pr = E.back(clamp(prog * 1.5)), ring = E.out(clamp(prog * 1.3));
  const pp = (t * 0.7 + i * 0.3) % 1;
  c.save(); c.strokeStyle = rgba(GOLD, (1 - pp) * 0.5 * ring); c.lineWidth = 2;
  c.beginPath(); c.arc(x, y, 66 + pp * 60, 0, Math.PI * 2); c.stroke(); c.restore();
  glowDot(c, x, y, 160, GOLD, 0.28 * ring);
  c.save();
  c.fillStyle = 'rgba(9,10,14,0.96)'; c.beginPath(); c.arc(x, y, 64 * pr, 0, Math.PI * 2); c.fill();
  c.restore();
  glowLine(c, () => { c.beginPath(); c.arc(x, y, 64, -Math.PI / 2, -Math.PI / 2 - Math.PI * 2 * ring, true); }, 1, 2.2);
  const ia = clamp((prog - 0.15) * 2);
  if (ia > 0) icon(c, f.ic, x, y, 54 * E.back(ia), C.goldHi, 1.7);
  const tp = E.out(clamp((prog - 0.3) * 1.8));
  if (tp > 0) {
    const below = i % 2 === 0, ty = below ? y + 135 : y - 172;
    const up = !below && f.s.length > 1 ? (f.s.length - 1) * 42 : 0;
    txt(c, f.t, x, ty - up + (1 - tp) * 18, { size: 50, w: 800, alpha: tp, glow: 'rgba(0,0,0,0.8)', blur: 14 });
    f.s.forEach((ln, k) => txt(c, ln, x, ty - up + 58 + k * 42 + (1 - tp) * 18, { size: 30, color: C.goldSoft, alpha: tp * 0.95 }));
  }
}
