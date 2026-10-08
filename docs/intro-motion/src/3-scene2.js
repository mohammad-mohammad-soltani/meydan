// ───────── Scene 2 · the photographer and the feed of squares (10 – 22s)
let PZ, SKYLINE, PHOTO, PHOTO_SM, THUMB_CROWD, THUMB_FLAGS;

function buildPlaza() {
  PZ = mk(1800, 1800);
  const c = PZ.getContext('2d'), r = rng(21), cx = 900, cy = 900;
  c.fillStyle = '#26232b'; c.fillRect(0, 0, 1800, 1800);
  for (let i = 0; i < 520; i++) {
    const x = r() * 1800, y = r() * 1800;
    const e = ((x - cx) / 900) ** 2 + ((y - cy) / 700) ** 2;
    if (e < 1.05) continue;
    const w = 40 + r() * 110, h = 30 + r() * 90;
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x + 8, y + 6, w, h);
    c.fillStyle = ['#34303a', '#3b3641', '#2f2c35', '#45403f', '#3a3a44'][(r() * 5) | 0];
    c.fillRect(x, y, w, h);
    c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(x + 6, y + 6, w * 0.4, 6);
  }
  const roads = [0, 0.785, 1.571, 2.356, 3.142, 3.927, 4.712, 5.498];
  for (const a of roads) {
    c.save(); c.translate(cx, cy); c.rotate(a);
    c.fillStyle = '#1d1b21'; c.fillRect(0, -58, 1400, 116);
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.setLineDash([22, 26]); c.lineWidth = 3;
    c.beginPath(); c.moveTo(700, 0); c.lineTo(1400, 0); c.stroke();
    c.restore();
  }
  c.setLineDash([]);
  c.strokeStyle = '#1d1b21'; c.lineWidth = 130;
  c.beginPath(); c.ellipse(cx, cy, 815, 625, 0, 0, Math.PI * 2); c.stroke();
  c.fillStyle = '#403a33';
  c.beginPath(); c.ellipse(cx, cy, 750, 560, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(255,240,220,0.05)'; c.lineWidth = 2;
  for (let k = 1; k < 18; k++) { c.beginPath(); c.ellipse(cx, cy, 750 * k / 18, 560 * k / 18, 0, 0, Math.PI * 2); c.stroke(); }
  for (let k = 0; k < 48; k++) { const a = k * Math.PI / 24; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * 750, cy + Math.sin(a) * 560); c.stroke(); }
  c.fillStyle = '#223d2c';
  for (const [a, d] of [[0.75, 1], [2.39, 1], [3.89, 1], [5.53, 1]]) {
    c.save(); c.translate(cx + Math.cos(a) * 430, cy + Math.sin(a) * 330); c.rotate(a + Math.PI / 2);
    c.beginPath(); c.ellipse(0, 0, 150 * d, 60, 0, 0, Math.PI * 2); c.fill(); c.restore();
  }
  c.fillStyle = '#18384a';
  c.beginPath(); c.roundRect(cx - 560, cy - 30, 330, 60, 30); c.roundRect(cx + 230, cy - 30, 330, 60, 30); c.fill();
  c.fillStyle = 'rgba(160,220,255,0.12)';
  c.fillRect(cx - 540, cy - 22, 290, 6); c.fillRect(cx + 250, cy - 22, 290, 6);
  c.fillStyle = 'rgba(0,0,0,0.38)';
  c.beginPath(); c.moveTo(cx - 112, cy + 74); c.lineTo(cx + 112, cy + 74); c.lineTo(cx + 330, cy + 230); c.lineTo(cx + 120, cy + 230); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(cx + 112, cy - 74); c.lineTo(cx + 330, cy + 80); c.lineTo(cx + 330, cy + 230); c.lineTo(cx + 112, cy + 74); c.closePath(); c.fill();
  const foot = (sx, sy, k) => {
    c.beginPath();
    c.moveTo(cx - sx, cy - sy); c.quadraticCurveTo(cx, cy - sy + k, cx + sx, cy - sy);
    c.quadraticCurveTo(cx + sx - k, cy, cx + sx, cy + sy); c.quadraticCurveTo(cx, cy + sy - k, cx - sx, cy + sy);
    c.quadraticCurveTo(cx - sx + k, cy, cx - sx, cy - sy); c.closePath();
  };
  const tg = c.createLinearGradient(cx - 112, cy + 74, cx + 112, cy - 74);
  tg.addColorStop(0, '#9c8d74'); tg.addColorStop(1, '#e6d8be');
  c.fillStyle = tg; foot(112, 74, 24); c.fill();
  c.strokeStyle = 'rgba(110,92,72,0.45)'; c.lineWidth = 2;
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { c.beginPath(); c.moveTo(cx + a * 50, cy + b * 30); c.lineTo(cx + a * 112, cy + b * 74); c.stroke(); }
  c.fillStyle = '#ebe0cb'; foot(50, 30, 8); c.fill();
  c.fillStyle = '#f6eedf'; c.fillRect(cx - 22, cy - 13, 44, 26);
  const inPlaza = (x, y) => ((x - cx) / 745) ** 2 + ((y - cy) / 555) ** 2 < 1;
  const inPool = (x, y) => Math.abs(y - cy) < 34 && ((x > cx - 565 && x < cx - 225) || (x > cx + 225 && x < cx + 565));
  const inTower = (x, y) => Math.abs(x - cx) < 108 && Math.abs(y - cy) < 80;
  const onRoad = (x, y) => {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
    if (d < 700) return false;
    for (const a of roads) { const px = dx * Math.cos(a) + dy * Math.sin(a), py = -dx * Math.sin(a) + dy * Math.cos(a); if (px > 0 && Math.abs(py) < 52) return true; }
    const e = (dx / 815) ** 2 + (dy / 625) ** 2;
    return e > 0.86 && e < 1.16;
  };
  const cloth = ['#1b1d24', '#262a33', '#3a3f4a', '#4a4038', '#5c5246', '#1d2b22', '#2f2a40', '#e8e2d6', '#7a2a2a', '#264a35', '#111111', '#cfc6b6', '#3d3326'];
  const pts = [];
  let tries = 0;
  while (pts.length < 24000 && tries < 400000) {
    tries++;
    const x = r() * 1800, y = r() * 1800;
    if (inPool(x, y) || inTower(x, y)) continue;
    if (inPlaza(x, y)) { if (r() < 0.04) continue; pts.push([x, y]); continue; }
    if (onRoad(x, y) && r() < 0.55) pts.push([x, y]);
  }
  for (const [x, y] of pts) {
    const a = Math.atan2(cy - y, cx - x) + (r() - 0.5) * 1.2;
    c.fillStyle = 'rgba(0,0,0,0.32)';
    c.beginPath(); c.ellipse(x + 3.5, y + 2.6, 5, 3.6, a, 0, Math.PI * 2); c.fill();
    if (r() < 0.22) {
      c.fillStyle = '#0c0b0e';
      c.beginPath(); c.ellipse(x, y, 5.4, 4.4, a, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.06)'; c.beginPath(); c.arc(x - 1, y - 1, 1.6, 0, Math.PI * 2); c.fill();
    } else {
      c.fillStyle = cloth[(r() * cloth.length) | 0];
      c.beginPath(); c.ellipse(x, y, 5.2, 3.3, a, 0, Math.PI * 2); c.fill();
      c.fillStyle = r() < 0.3 ? ['#0c0c0e', '#2a2230', '#d9d2c4', '#3b2b2b'][(r() * 4) | 0] : '#17110e';
      c.beginPath(); c.arc(x, y, 2.5, 0, Math.PI * 2); c.fill();
    }
  }
  const flagAt = (x, y, w, h, a) => {
    c.save(); c.translate(x, y); c.rotate(a);
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(-w / 2 + 4, -h / 2 + 3, w, h);
    c.fillStyle = '#239f40'; c.fillRect(-w / 2, -h / 2, w, h / 3);
    c.fillStyle = '#f2efe8'; c.fillRect(-w / 2, -h / 6, w, h / 3);
    c.fillStyle = '#da0000'; c.fillRect(-w / 2, h / 6, w, h / 3);
    if (w > 60) { c.fillStyle = '#da0000'; c.beginPath(); c.arc(0, 0, h * 0.09, 0, Math.PI * 2); c.fill(); }
    c.restore();
  };
  for (let i = 0; i < 300; i++) {
    const p = pts[(r() * pts.length) | 0];
    flagAt(p[0], p[1], 16 + r() * 6, 10 + r() * 3, 0.25 + (r() - 0.5) * 0.9);
  }
  flagAt(cx - 330, cy - 250, 190, 108, 0.2);
  flagAt(cx + 380, cy + 260, 170, 98, -0.15);
  flagAt(cx + 160, cy - 380, 150, 86, 0.35);
  c.save(); c.translate(cx - 200, cy + 300); c.rotate(-0.12);
  c.fillStyle = '#c81e1e'; c.fillRect(-150, -18, 300, 36);
  txt(c, 'ایران', 0, 1, { size: 26, w: 900, color: '#fff' });
  c.restore();
  c.globalCompositeOperation = 'soft-light';
  const g = c.createLinearGradient(1800, 0, 0, 1800);
  g.addColorStop(0, 'rgba(255,150,70,0.9)'); g.addColorStop(1, 'rgba(70,40,120,0.8)');
  c.fillStyle = g; c.fillRect(0, 0, 1800, 1800);
  c.globalCompositeOperation = 'source-over';
}

function buildSkyline() {
  SKYLINE = mk(W, 420);
  const c = SKYLINE.getContext('2d'), r = rng(31);
  c.fillStyle = 'rgba(70,40,80,0.75)';
  c.beginPath(); c.moveTo(0, 330);
  for (let x = 0; x <= W; x += 40) c.lineTo(x, 250 - Math.sin(x / 210) * 34 - Math.sin(x / 77) * 12 - (x > 900 && x < 1400 ? 30 : 0));
  c.lineTo(W, 330); c.closePath(); c.fill();
  c.fillStyle = 'rgba(245,225,235,0.35)';
  c.beginPath(); c.moveTo(980, 222); c.lineTo(1060, 212); c.lineTo(1120, 226); c.lineTo(1050, 232); c.closePath(); c.fill();
  let x = 0;
  while (x < W) {
    const w = 30 + r() * 80, h = 30 + r() * (r() < 0.12 ? 150 : 70);
    c.fillStyle = '#16121e'; c.fillRect(x, 340 - h, w, h + 80);
    for (let yy = 340 - h + 8; yy < 336; yy += 12) for (let xx = x + 5; xx < x + w - 6; xx += 10) if (r() < 0.22) { c.fillStyle = `rgba(255,${190 + r() * 40 | 0},120,${0.35 + r() * 0.4})`; c.fillRect(xx, yy, 4, 5); }
    x += w + r() * 6;
  }
  c.fillStyle = '#120f19';
  c.fillRect(1556, 60, 8, 290);
  c.beginPath(); c.moveTo(1520, 168); c.lineTo(1600, 168); c.lineTo(1590, 196); c.lineTo(1530, 196); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(1560, 166, 46, 12, 0, 0, Math.PI * 2); c.fill();
  c.fillRect(1558, 0, 4, 70);
  c.fillStyle = 'rgba(255,90,80,0.9)'; c.beginPath(); c.arc(1560, 4, 3, 0, Math.PI * 2); c.fill();
}

function plazaView(c, t, cw, ch, blur = 0) {
  const k = cw / W;
  c.save();
  c.fillStyle = '#121016'; c.fillRect(0, 0, cw, ch);
  c.translate(cw / 2, ch / 2);
  c.rotate(-0.16 + Math.sin(t * 0.9) * 0.006);
  const z = lerp(1.24, 1.34, inv(12.4, 14.0, t)) * k;
  c.scale(z, z);
  c.translate(-960 + Math.sin(t * 1.3) * 4, -930 + Math.cos(t * 1.1) * 3);
  if (blur > 0.2) c.filter = `blur(${blur}px)`;
  c.drawImage(PZ, 0, 0);
  c.restore();
}

let CITY;
function buildCity() {
  CITY = mk(1024, 1024);
  const c = CITY.getContext('2d'), r = rng(61);
  c.fillStyle = '#26232b'; c.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 380; i++) {
    const x = r() * 1024, y = r() * 1024, w = 40 + r() * 110, h = 30 + r() * 90;
    const col = ['#34303a', '#3b3641', '#2f2c35', '#45403f', '#3a3a44'][(r() * 5) | 0];
    for (const [ox, oy] of [[0, 0], [-1024, 0], [0, -1024], [-1024, -1024]]) {
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x + ox + 8, y + oy + 6, w, h);
      c.fillStyle = col; c.fillRect(x + ox, y + oy, w, h);
    }
  }
  c.fillStyle = '#1d1b21';
  for (const k of [140, 520, 860]) { c.fillRect(k, 0, 70, 1024); c.fillRect(0, k - 60, 1024, 70); }
  for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(255,${200 + r() * 40 | 0},140,${0.25 + r() * 0.4})`; c.fillRect(r() * 1024, r() * 1024, 3, 3); }
}

function photographer(c, t) {
  const br = Math.sin(t * 1.4) * 2, x = 470;
  for (const pass of [0, 1]) {
    c.save();
    c.translate(0, br);
    if (pass === 0) { c.translate(5, -3); c.fillStyle = c.strokeStyle = 'rgba(255,165,110,0.9)'; }
    else c.fillStyle = c.strokeStyle = '#0b080d';
    c.beginPath();
    c.moveTo(x - 300, H + 30);
    c.bezierCurveTo(x - 300, 960, x - 270, 880, x - 205, 850);
    c.bezierCurveTo(x - 140, 822, x - 80, 806, x - 50, 780);
    c.lineTo(x - 42, 740); c.lineTo(x + 42, 740); c.lineTo(x + 50, 780);
    c.bezierCurveTo(x + 80, 806, x + 140, 822, x + 205, 850);
    c.bezierCurveTo(x + 270, 880, x + 300, 960, x + 300, H + 30);
    c.closePath(); c.fill();
    c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 58;
    c.beginPath(); c.moveTo(x - 178, 880); c.quadraticCurveTo(x - 246, 730, x - 206, 640); c.lineTo(x - 146, 530); c.stroke();
    c.beginPath(); c.moveTo(x + 178, 880); c.quadraticCurveTo(x + 246, 730, x + 206, 640); c.lineTo(x + 146, 530); c.stroke();
    c.beginPath(); c.ellipse(x, 694, 62, 76, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(x + 2, 670, 66, 58, 0.04, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(x - 60, 704, 10, 17, -0.15, 0, Math.PI * 2); c.ellipse(x + 60, 704, 10, 17, 0.15, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.roundRect(x - 132, LCD_Y - 82, 264, 164, 22); c.fill();
    c.beginPath(); c.roundRect(x - 44, LCD_Y - 104, 88, 30, 8); c.fill();
    c.beginPath(); c.ellipse(x - 140, LCD_Y + 14, 30, 46, 0.15, 0, Math.PI * 2); c.ellipse(x + 140, LCD_Y + 14, 30, 46, -0.15, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  plazaView(LCDC, t + 1.2, 384, 216, 0);
  c.save();
  c.translate(0, br);
  glowDot(c, x, LCD_Y, 240, [255, 225, 190], 0.12);
  c.drawImage(LCD, x - 108, LCD_Y - 61, 216, 122);
  c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 2;
  const fx = x, fy = LCD_Y, fs = 16;
  c.strokeRect(fx - fs / 2, fy - fs / 2, fs, fs);
  c.fillStyle = '#ef4444'; c.beginPath(); c.arc(x - 92, LCD_Y - 48, 4, 0, Math.PI * 2); c.fill();
  c.restore();
}
const LCD = mk(384, 216), LCDC = LCD.getContext('2d'), LCD_Y = 470;

function drawS2A(c, t) {
  const u = inv(9.7, 12.7, t);
  c.save();
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const zi = inv(11.95, 12.5, t), z = 1 + 0.05 * u + E.in(zi) * 8.5, m = E.io(zi);
  c.translate(lerp(470, W / 2, m), lerp(LCD_Y, H / 2, m)); c.scale(z, z); c.translate(-470, -LCD_Y);
  const yh = 330, F = 900, Hc = 430, camX = 940 + 50 * u, camY = 2080 - 90 * u;
  const sky = c.createLinearGradient(0, 0, 0, yh + 40);
  sky.addColorStop(0, '#1a1232'); sky.addColorStop(0.45, '#4a2348'); sky.addColorStop(0.8, '#b4503c'); sky.addColorStop(1, '#ee9a5c');
  c.fillStyle = sky; c.fillRect(-50, -50, W + 100, yh + 100);
  c.fillStyle = '#2a2530'; c.fillRect(-50, yh, W + 100, H - yh + 50);
  c.imageSmoothingQuality = 'high';
  const pat = c.createPattern(CITY, 'repeat');
  for (let y = yh + 2; y < H + 10; y += 3) {
    const D0 = Hc * F / (y - yh), D1 = Hc * F / (y + 3 - yh), v0 = camY - D0, v1 = camY - D1;
    const half = ((D0 + D1) / 2) * (W / 2) / F, sx = (half * 2) / (W + 40), sy = Math.max(0.05, v1 - v0) / 3.6;
    pat.setTransform(new DOMMatrix([1 / sx, 0, 0, 1 / sy, -20 - (camX - half) / sx, y - v0 / sy]));
    c.fillStyle = pat; c.fillRect(-20, y, W + 40, 3.6);
    if (v1 > 0) c.drawImage(PZ, camX - half, Math.max(0, v0), half * 2, Math.max(0.6, v1 - Math.max(0, v0)), -20, y, W + 40, 3.6);
  }
  const Dt = camY - 900, tx = W / 2 + (900 - camX) * F / Dt, ty = yh + Hc * F / Dt, tw = 236 * F / Dt;
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(tx + tw * 0.25, ty + 4, tw * 0.75, tw * 0.09, 0, 0, Math.PI * 2); c.fill();
  const tgr = c.createLinearGradient(tx - tw / 2, 0, tx + tw / 2, 0);
  tgr.addColorStop(0, '#a48c74'); tgr.addColorStop(0.55, '#e9d8bd'); tgr.addColorStop(1, '#fff0d8');
  c.fillStyle = tgr; towerPath(c, tx, ty + 2, tw); c.fill('evenodd');
  c.drawImage(SKYLINE, -u * 30, yh - 336);
  let g = c.createLinearGradient(0, yh - 10, 0, yh + 230);
  g.addColorStop(0, 'rgba(214,120,100,0.92)'); g.addColorStop(1, 'rgba(120,70,100,0)');
  c.fillStyle = g; c.fillRect(-50, yh - 10, W + 100, 240);
  g = c.createRadialGradient(1500, 330, 0, 1500, 330, 700);
  g.addColorStop(0, 'rgba(255,170,100,0.35)'); g.addColorStop(1, 'rgba(255,170,100,0)');
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(-50, -50, W + 100, H + 100); c.restore();
  photographer(c, t);
  c.restore();
  finish(c, t, 0.6);
  const ttl = smooth(10.4, 10.9, t) * (1 - smooth(11.9, 12.2, t));
  if (ttl > 0) txt(c, 'میدان، از نگاه شما', W - 120, H - 118, { size: 40, w: 700, align: 'right', alpha: ttl, glow: 'rgba(0,0,0,0.7)' });
}

function drawS2B(c, t) {
  const blur = 7 * (1 - E.out(inv(12.55, 13.25, t)));
  plazaView(c, t, W, H, blur);
  c.save();
  c.fillStyle = 'rgba(0,0,0,0.8)';
  c.beginPath(); c.rect(0, 0, W, H); c.roundRect(150, 90, W - 300, H - 210, 16); c.fill('evenodd');
  c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 3;
  const bx0 = 190, by0 = 130, bx1 = W - 190, by1 = H - 160, L = 46;
  for (const [x, y, sx, sy] of [[bx0, by0, 1, 1], [bx1, by0, -1, 1], [bx0, by1, 1, -1], [bx1, by1, -1, -1]]) {
    c.beginPath(); c.moveTo(x, y + sy * L); c.lineTo(x, y); c.lineTo(x + sx * L, y); c.stroke();
  }
  c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 1.5;
  for (let i = 1; i < 3; i++) {
    c.beginPath(); c.moveTo(150 + (W - 300) * i / 3, 90); c.lineTo(150 + (W - 300) * i / 3, H - 120); c.stroke();
    c.beginPath(); c.moveTo(150, 90 + (H - 210) * i / 3); c.lineTo(W - 150, 90 + (H - 210) * i / 3); c.stroke();
  }
  const lock = t > 13.3;
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const x = W / 2 + i * 150, y = 480 + j * 100, on = lock && i === 0 && j === 0;
    c.strokeStyle = on ? '#4ade80' : 'rgba(255,255,255,0.55)'; c.lineWidth = on ? 3 : 1.6;
    const s = on ? 36 - 8 * E.out(inv(13.3, 13.5, t)) : 22;
    c.strokeRect(x - s / 2, y - s / 2, s, s);
  }
  c.restore();
  c.save();
  c.direction = 'ltr';
  c.font = `500 30px ${FONT}`; c.textBaseline = 'middle'; c.fillStyle = 'rgba(255,255,255,0.92)';
  const yb = H - 64;
  c.textAlign = 'left'; c.fillText('1/500', 250, yb); c.fillText('F5.6', 420, yb); c.fillText('ISO 400', 560, yb);
  c.textAlign = 'right'; c.fillText('[ 342 ]', W - 250, yb);
  for (let k = -3; k <= 3; k++) { c.fillRect(W / 2 + k * 34 - 1.5, yb - (k === 0 ? 12 : 7), 3, k === 0 ? 24 : 14); }
  c.fillStyle = '#facc15'; c.fillRect(W / 2 + Math.sin(t * 3) * 6 - 4, yb + 16, 8, 8);
  if (lock) { c.fillStyle = '#4ade80'; c.beginPath(); c.arc(820, yb, 9, 0, Math.PI * 2); c.fill(); }
  c.restore();
  finish(c, t, 0.4);
  if (t >= 14.0) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); }
}

// ── feed of squares
const POSTS = [
  { n: 'میدان آزادی', h: 'azadi_sq', tm: 'همین حالا', tx: 'امروز در کنار هم ایستادیم.', img: 'photo', st: ['۳۱۲', '۱٫۲ هزار', '۴٫۸ هزار'] },
  { n: 'میدان انقلاب', h: 'enghelab_sq', tm: '۱ دقیقه', tx: 'صدای ما یکی است؛ از انقلاب تا آزادی.', st: ['۸۴', '۴۲۰', '۲٫۱ هزار'] },
  { n: 'میدان امام حسین', h: 'imamhossein_sq', tm: '۲ دقیقه', tx: 'جمعیت هر لحظه بیشتر می‌شود. پرچم‌ها بالاست.', img: 'crowd', st: ['۱۲۶', '۶۱۰', '۳٫۴ هزار'] },
  { n: 'میدان ولیعصر', h: 'valiasr_sq', tm: '۳ دقیقه', tx: 'خیابان ولیعصر از جنوب تا شمال یکپارچه پرچم شده است.', st: ['۵۷', '۲۳۸', '۱٫۶ هزار'] },
  { n: 'میدان تجریش', h: 'tajrish_sq', tm: '۴ دقیقه', tx: 'از شمالی‌ترین میدان شهر، کنار شما هستیم.', st: ['۴۱', '۱۹۰', '۹۸۰'] },
  { n: 'میدان ونک', h: 'vanak_sq', tm: '۵ دقیقه', tx: 'ایستگاه صلوات برپاست؛ همه دعوتید.', img: 'flags', st: ['۶۳', '۲۵۴', '۱٫۹ هزار'] },
  { n: 'میدان هفت تیر', h: 'haftetir_sq', tm: '۶ دقیقه', tx: 'قرار ما ساعت شش عصر، کنار هم.', st: ['۳۸', '۱۴۷', '۸۶۰'] },
  { n: 'میدان امام خمینی', h: 'imamkhomeini_sq', tm: '۷ دقیقه', tx: 'مسیر راهپیمایی از همین‌جا آغاز می‌شود.', st: ['۵۲', '۲۰۱', '۱٫۳ هزار'] },
];
const COLS = [[0, 5], [1, 3, 6], [2, 4, 7]];
const COL_X = [1260, 700, 140], CW = 520, PAD = 26;
const RISE = [null, 15.15, 15.5, 15.85, 16.2, 16.55, 16.9, 17.25];

function layoutPosts() {
  for (const p of POSTS) {
    FONT_OVERRIDE = UIF; p.lines = wrap(p.tx, 27, 400, CW - PAD * 2); FONT_OVERRIDE = null;
    let h = PAD + 58 + 18 + p.lines.length * 44;
    if (p.img) { p.imgY = h + 8; h += 8 + (CW - PAD * 2) * 9 / 16; }
    h += 26 + 30 + PAD;
    p.hh = h;
  }
  COLS.forEach((col, ci) => {
    let y = 170;
    for (const i of col) { POSTS[i].x = COL_X[ci]; POSTS[i].y = y; y += POSTS[i].hh + 28; }
  });
}

function buildThumbs() {
  PHOTO = mk(1200, 675);
  plazaView(PHOTO.getContext('2d'), 14.0, 1200, 675, 0);
  PHOTO_SM = mk(96, 54);
  PHOTO_SM.getContext('2d').drawImage(PHOTO, 0, 0, 96, 54);
  THUMB_CROWD = mk(936, 527);
  let c = THUMB_CROWD.getContext('2d');
  c.save(); c.translate(468, 263); c.rotate(0.35); c.scale(1.55, 1.55); c.drawImage(PZ, -1220, -620); c.restore();
  THUMB_FLAGS = mk(936, 527);
  c = THUMB_FLAGS.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 527);
  g.addColorStop(0, '#3a1d3f'); g.addColorStop(0.6, '#c45a3e'); g.addColorStop(1, '#f2a35f');
  c.fillStyle = g; c.fillRect(0, 0, 936, 527);
  const r = rng(77);
  for (let i = 0; i < 9; i++) {
    const x = 40 + r() * 820, y = 60 + r() * 200, w = 120 + r() * 120, h = w * 0.57;
    c.save(); c.translate(x, y); c.rotate((r() - 0.5) * 0.25);
    c.strokeStyle = '#1a0d14'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -10); c.lineTo(0, 420); c.stroke();
    c.globalAlpha = 0.92; c.drawImage(FLAG, 0, 0, w, h); c.restore();
  }
  c.fillStyle = '#140a10';
  for (let i = 0; i < 26; i++) person(c, r() * 936, 470 + r() * 80, 1.2 + r() * 0.6, ['man', 'scarf', 'chador'][(r() * 3) | 0], null);
  c.fillRect(0, 500, 936, 27);
}

function postCard(c, p, x, y, a, photoRect) { FONT_OVERRIDE = UIF; try { postCardImpl(c, p, x, y, a, photoRect); } finally { FONT_OVERRIDE = null; } }
function postCardImpl(c, p, x, y, a, photoRect) {
  const w = CW, h = p.hh;
  c.save();
  c.globalAlpha = a;
  c.fillStyle = T.surf;
  c.beginPath(); c.roundRect(x, y, w, h, 26); c.fill();
  c.strokeStyle = T.border; c.lineWidth = 1.5; c.stroke();
  const ax = x + w - PAD - 28, ay = y + PAD + 28;
  c.fillStyle = C.red; c.beginPath(); c.arc(ax, ay, 28, 0, Math.PI * 2); c.fill();
  mark(c, ax, ay, 34, '#fff');
  const nr = ax - 28 - 14;
  txt(c, p.n, nr, ay - 13, { size: 26, w: 800, align: 'right' });
  icon(c, 'badge', nr - measure(p.n, 26, 800) - 18, ay - 13, 22, C.gold, 2);
  txt(c, `${p.tm} · @${p.h}`, nr, ay + 19, { size: 19, color: C.mute, align: 'right' });
  let ty = y + PAD + 58 + 18 + 20;
  for (const ln of p.lines) { txt(c, ln, x + w - PAD, ty, { size: 27, align: 'right' }); ty += 44; }
  if (p.img && !photoRect) {
    const iw = w - PAD * 2, ih = iw * 9 / 16, ix = x + PAD, iy = y + p.imgY;
    c.save(); c.beginPath(); c.roundRect(ix, iy, iw, ih, 18); c.clip();
    c.drawImage(p.img === 'photo' ? PHOTO : p.img === 'crowd' ? THUMB_CROWD : THUMB_FLAGS, ix, iy, iw, ih);
    c.restore();
  }
  const ry = y + h - PAD - 15;
  let rx = x + w - PAD - 12;
  ['msg', 'repeat', 'heart'].forEach((ic, k) => {
    icon(c, ic, rx, ry, 24, k === 2 ? '#f87171' : C.mute, 2);
    txt(c, p.st[k], rx - 20, ry + 1, { size: 19, color: C.mute, align: 'right' });
    rx -= 140;
  });
  icon(c, 'share', x + PAD + 12, ry, 22, C.mute, 2);
  c.restore();
}

const scrollAt = t => -E.io(inv(16.6, 21.0, t)) * 230;

function feedBg(c, t, a) {
  c.save();
  c.globalAlpha = a;
  c.fillStyle = '#07080c'; c.fillRect(0, 0, W, H);
  c.globalAlpha = a * 0.28;
  c.imageSmoothingQuality = 'high';
  c.drawImage(PHOTO_SM, -40, -40, W + 80, H + 80);
  c.globalAlpha = a;
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(7,8,12,0.55)'); g.addColorStop(1, 'rgba(7,8,12,0.9)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.restore();
}

function feedHeader(c, t, a) {
  if (a <= 0) return;
  const tw = measure('شبکه‌ی میدان‌ها', 40, 800);
  txt(c, 'شبکه‌ی میدان‌ها', W / 2 - 50, 92, { size: 40, w: 800, alpha: a });
  const px = W / 2 - 50 + tw / 2 + 70;
  c.save(); c.globalAlpha = a;
  c.fillStyle = 'rgba(220,38,38,0.16)'; c.strokeStyle = 'rgba(239,68,68,0.5)'; c.lineWidth = 1.5;
  c.beginPath(); c.roundRect(px - 52, 72, 104, 40, 20); c.fill(); c.stroke();
  c.fillStyle = C.redHi; c.globalAlpha = a * (0.55 + 0.45 * Math.sin(t * 6));
  c.beginPath(); c.arc(px + 28, 92, 7, 0, Math.PI * 2); c.fill();
  c.restore();
  txt(c, 'زنده', px - 10, 93, { size: 22, w: 700, color: '#fca5a5', alpha: a });
}

function drawFeed(c, t, flight) {
  const sc = scrollAt(Math.min(t, 19.95));
  const ha = smooth(14.9, 15.5, t) * (1 - smooth(19.9, 20.7, t));
  feedHeader(c, t, ha);
  for (let i = POSTS.length - 1; i >= 0; i--) {
    const p = POSTS[i];
    let x = p.x, y = p.y + sc, a = 1, s = 1;
    if (i === 0) {
      if (t < 15.0) {
        const m = E.io(inv(14.15, 15.0, t));
        const iw = CW - PAD * 2, ih = iw * 9 / 16;
        const rx = lerp(0, x + PAD, m), ry = lerp(0, y + p.imgY, m), rw = lerp(W, iw, m), rh = lerp(H, ih, m);
        postCard(c, p, x, y, smooth(14.7, 15.0, t), true);
        c.save(); c.beginPath(); c.roundRect(rx, ry, rw, rh, 18 * m); c.clip(); c.drawImage(PHOTO, rx, ry, rw, rh); c.restore();
        continue;
      }
    } else {
      const k = E.out(inv(RISE[i], RISE[i] + 0.75, t));
      if (k <= 0) continue;
      y += (1 - k) * 460; a = smooth(RISE[i], RISE[i] + 0.4, t);
    }
    if (flight) {
      const f = flight(i, x + CW / 2, y + p.hh / 2);
      if (!f) continue;
      c.save();
      c.translate(f.x, f.y); c.scale(f.s, f.s); c.translate(-CW / 2, -p.hh / 2);
      postCard(c, p, 0, 0, a * f.a, false);
      c.restore();
      continue;
    }
    postCard(c, p, x, y, a, false);
  }
  if (t < 14.5) { c.fillStyle = `rgba(255,255,255,${0.92 * (1 - E.out(inv(14.02, 14.5, t)))})`; c.fillRect(0, 0, W, H); }
}
