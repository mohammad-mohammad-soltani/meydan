// ───────── Last sequence (S8 →): the sign-up page fills the frame, the camera pulls back to a woman at home, then pushes in to the brand card
// t8 = seconds since the hub ends: sign-up page full frame → pull back to the room → push in to the brand card
const Z_START = 2.5, Z_LEN = 2.3, BRAND_AT = 8.6, PUSH_LEN = 2.2;
const SCR = { x: 800, y: 110, w: 960, h: 540 }, PC = [SCR.x + SCR.w / 2, SCR.y + SCR.h / 2];
const SC = mk(W, H), SCC = SC.getContext('2d');
const CAPTION = ['خانه‌ات هم یک میدان است؛', 'نقش خودت را همین‌جا بساز.'];
const F_NAME = 'زهرا رضایی', F_HANDLE = 'zahra_minab', F_PROV = 'هرمزگان', F_CITY = 'میناب';
const KINDS = ['دانشجو', 'دانش‌آموز', 'طلبه', 'سایر'], KIND_SEL = 1, CITY_ITEMS = ['بندرعباس', 'میناب', 'جاسک'];
let LEAVES = [];
function typed(s, p) { return s.slice(0, Math.floor(clamp(p) * s.length + 1e-6)); }

// ── the sign-up page shown on her screen (drawn at 1920×1080, scaled down by the room camera)
function cursorArrow(c, x, y) {
  c.save(); c.translate(x, y);
  c.fillStyle = '#fff'; c.strokeStyle = '#111'; c.lineWidth = 3; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 44); c.lineTo(11, 34); c.lineTo(20, 54); c.lineTo(29, 50); c.lineTo(20, 31); c.lineTo(34, 31); c.closePath(); c.fill(); c.stroke();
  c.restore();
}
// the app's own desktop sign-up page (features/auth/components/AuthPage.tsx), 1440×810 layout scaled to the 1920×1080 screen
function brandSection(c) {
  c.fillStyle = 'rgba(28,28,28,0.88)'; c.fillRect(692, -100, 604, 1300);
  c.fillStyle = T.border; c.fillRect(692, -100, 1, 1300);
  const xr = 1240;
  logoTile(c, xr - 24, 80, 48);
  uit(c, 'نقش من', xr - 62, 72, { size: 18, w: 900, align: 'right' });
  uit(c, 'شبکه سراسری میادین ایران', xr - 62, 94, { size: 11, w: 700, color: T.mute, align: 'right' });
  const cw = uiW('ورود یکپارچه و امن', 11, 900) + 44;
  box(c, xr - cw, 168, cw, 30, 15, T.brandMuted, T.brandBorder, 1);
  icon(c, 'sparkle', xr - 18, 183, 14, T.brand, 2);
  uit(c, 'ورود یکپارچه و امن', xr - 32, 184, { size: 11, w: 900, color: T.brand, align: 'right' });
  uit(c, 'روایت، ارتباط و حضور میدانی؛', xr, 252, { size: 36, w: 900, align: 'right' });
  uit(c, 'در یک حساب.', xr, 304, { size: 36, w: 900, align: 'right' });
  wrap('با شماره همراه وارد شوید. اگر اولین حضور شماست، بعد از تأیید شماره در چند قدم کوتاه حساب شخصی یا میدان خود را می‌سازید.', 14, 400, 448, UIF)
    .forEach((ln, i) => uit(c, ln, xr, 360 + i * 32, { size: 14, color: T.fg2, align: 'right' }));
  [['chatMore', 'دسترسی سریع', 'ورود بدون رمز عبور با کد یک‌بارمصرف'], ['shield', 'هویت مطمئن', 'شماره همراه شما مبنای تأیید و بازیابی حساب است'], ['pin', 'متصل به میدان', 'امکان ساخت حساب شخصی یا ثبت یک میدان محلی']].forEach(([ic, t1, t2], i) => {
    const y = 456 + i * 86;
    box(c, 748, y, 492, 74, R_CARD, T.surf, T.border, 1);
    box(c, xr - 14 - 36, y + 19, 36, 36, 12, T.brandMuted);
    icon(c, ic, xr - 14 - 18, y + 37, 18, T.brand, 2);
    uit(c, t1, xr - 64, y + 28, { size: 12, w: 900, align: 'right' });
    uit(c, t2, xr - 64, y + 50, { size: 11, color: T.mute, align: 'right' });
  });
  uit(c, 'برای امنیت حساب، کد تأیید را در اختیار دیگران قرار ندهید.', xr, 780, { size: 10, color: T.mute, align: 'right' });
}

function drawForm(c, tf) {
  c.fillStyle = T.bg; c.fillRect(0, 0, W, H);
  const done = inv(4.8, 5.3, tf);
  const scroll = 232 * E.io(inv(2.3, 3.1, tf)) * (1 - E.io(inv(4.8, 5.4, tf)));
  c.save(); c.scale(4 / 3, 4 / 3);
  const g1 = c.createRadialGradient(1344, 0, 0, 1344, 0, 340); g1.addColorStop(0, 'rgba(239,68,68,0.16)'); g1.addColorStop(1, 'rgba(239,68,68,0)'); c.fillStyle = g1; c.fillRect(1000, 0, 440, 400);
  const g2 = c.createRadialGradient(96, 810, 0, 96, 810, 360); g2.addColorStop(0, 'rgba(70,70,70,0.45)'); g2.addColorStop(1, 'rgba(70,70,70,0)'); c.fillStyle = g2; c.fillRect(0, 450, 460, 360);
  c.translate(0, -scroll);
  brandSection(c);
  const cx = 194, cy = 84, cwid = 448, ix = cx + 28, iw = 392, ir = ix + iw;
  panelCard(c, cx, cy, cwid, done > 0 ? 640 : 932);
  const st = done > 0 ? 2 + E.out(done) : 2;
  stepper(c, ix, cy + 28, iw, st);
  if (done <= 0) {
    iconTile(c, ir - 48, cy + 96, 48, 'uround');
    uit(c, 'حساب خود را کامل کنید', ir, cy + 178, { size: 24, w: 900, align: 'right' });
    uit(c, 'شماره شما تأیید شد. فقط اطلاعات اصلی را وارد کنید تا', ir, cy + 214, { size: 14, color: T.mute, align: 'right' });
    uit(c, 'وارد میدان شوید.', ir, cy + 242, { size: 14, color: T.mute, align: 'right' });
    uit(c, 'نوع حساب', ir, cy + 288, { size: 12, w: 900, color: T.fg2, align: 'right' });
    choiceCard(c, ix + 200, cy + 304, 192, 118, true, 'uround', 'حساب شخصی', 'برای حضور و فعالیت فردی');
    choiceCard(c, ix, cy + 304, 192, 118, false, 'uroundS', 'میدان یا مجموعه هستم', 'میدان، مجموعه، رسانه یا سازمان');
    const nameT = typed(F_NAME, inv(0.4, 1.3, tf)), hT = typed(F_HANDLE, inv(1.35, 2.25, tf));
    field(c, ix, cy + 462, iw, 'نام و نام خانوادگی', '', nameT, { focus: tf > 0.35 && tf < 1.35, caret: Math.floor(tf * 2.4) % 2 === 0, placeholder: 'نام کامل شما' });
    field(c, ix, cy + 560, iw, 'شناسه کاربری', 'در همه‌جا با @ نمایش داده می‌شود', hT, { focus: tf >= 1.35 && tf < 2.4, caret: Math.floor(tf * 2.4) % 2 === 0, ltr: true, at: true, placeholder: 'reza_salehi' });
    uit(c, 'فقط حروف انگلیسی، عدد و _ (۳ تا ۳۰ نویسه)؛ بعداً هم قابل تغییر است.', ir, cy + 638, { size: 10, color: T.mute, align: 'right' });
    const pv = tf > 3.1 ? F_PROV : '', ct = tf > 3.75 ? F_CITY : '';
    field(c, ix + 202, cy + 678, 190, 'استان', '', pv, { chevron: true, placeholder: 'انتخاب استان', focus: tf > 2.95 && tf < 3.3 });
    field(c, ix, cy + 678, 190, 'شهر', '', ct, { chevron: true, placeholder: pv ? 'انتخاب شهر' : 'ابتدا استان را انتخاب کنید', focus: tf > 3.3 && tf < 3.75 });
    uit(c, 'جایگاه من', ir, cy + 776, { size: 12, w: 900, color: T.fg2, align: 'right' });
    uit(c, 'اختیاری', ix, cy + 776, { size: 10, color: T.mute, align: 'left' });
    optionPills(c, ix, cy + 788, iw, KINDS, tf > 3.95 ? KIND_SEL : -1, E.out(inv(3.95, 4.2, tf)));
    const ready = tf > 3.95;
    primaryButton(c, ix, cy + 856, iw, 'تکمیل ثبت‌نام و ورود', { enabled: ready, press: Math.sin(Math.PI * inv(4.5, 4.8, tf)), ripple: inv(4.52, 5.1, tf) });
    if (tf > 3.25 && tf < 3.78) {
      const ox = ix, oy = cy + 744 - 12, ow = 190;
      c.save(); c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 24; c.shadowOffsetY = 8;
      box(c, ox, oy + 16, ow, 128, R_CARD, '#2a2a2a', T.borderS, 1); c.restore();
      CITY_ITEMS.forEach((s, i) => {
        const hot = tf > 3.5 && i === 1;
        if (hot) box(c, ox + 6, oy + 22 + i * 40, ow - 12, 36, 10, 'rgba(255,255,255,0.09)');
        uit(c, s, ox + ow - 18, oy + 41 + i * 40, { size: 13, w: hot ? 900 : 500, color: hot ? T.fg : T.fg2, align: 'right' });
      });
    }
    const path = [[0, [560, 700]], [2.9, [560, 700]], [3.05, [ix + 297, cy + 756]], [3.22, [ix + 297, cy + 756]], [3.42, [ix + 95, cy + 756]], [3.62, [ix + 95, cy + 840]], [3.78, [ix + 95, cy + 840]], [3.98, [ix + 392 - 2 * 92 - 8 - 46, cy + 808]], [4.08, [ix + 392 - 2 * 92 - 8 - 46, cy + 808]], [4.45, [ix + 196, cy + 884]], [4.9, [ix + 196, cy + 884]]];
    let cur = path[0][1];
    for (let i = 1; i < path.length; i++) if (tf >= path[i - 1][0] && tf <= path[i][0]) { const u = E.io(inv(path[i - 1][0], path[i][0], tf)); cur = [lerp(path[i - 1][1][0], path[i][1][0], u), lerp(path[i - 1][1][1], path[i][1][1], u)]; }
    if (tf > path[path.length - 1][0]) cur = path[path.length - 1][1];
    if (tf > 2.9) cursorArrow(c, cur[0], cur[1]);
  } else {
    c.save(); c.globalAlpha = smooth(0, 1, done);
    const k = E.back(inv(4.8, 5.3, tf));
    c.save(); c.translate(ir - 24, cy + 124); c.scale(k, k);
    box(c, -24, -24, 48, 48, 16, T.okSurf, T.okBorder, 1); icon(c, 'check', 0, 0, 24, T.okFg, 2.4);
    c.restore();
    uit(c, 'عضویت شما تأیید شد', ir, cy + 194, { size: 24, w: 900, align: 'right', alpha: smooth(5.0, 5.4, tf) });
    uit(c, 'خوش آمدی زهرا؛ از امروز، نقشِ تو روی این نقشه است.', ir, cy + 230, { size: 14, color: T.mute, align: 'right', alpha: smooth(5.15, 5.55, tf) });
    successAlert(c, ix, cy + 270, iw, 'حساب شما در میناب ساخته شد', smooth(5.3, 5.7, tf));
    for (let i = 0; i < 7; i++) {
      const a = smooth(5.45 + i * 0.08, 5.75 + i * 0.08, tf), fx = ix + iw / 2 + (i - 3) * 52;
      glowDot(c, fx, cy + 366, 26, GOLD, 0.45 * a);
      figure(c, fx, cy + 366, 40, i === 3 ? '#fff' : C.goldHi, a);
    }
    primaryButton(c, ix, cy + 430, iw, 'ورود برای نقش‌آفرینی', { enabled: true });
    c.restore();
  }
  c.restore();
  finish(c, tf, 0.3);
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
  // pencils in a cup and a stack of school notebooks
  const cx = 1780, cy = 790;
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(cx + 6, cy + 4, 34, 9, 0, 0, Math.PI * 2); c.fill();
  [['#e0527a', -0.35], ['#f2b43c', -0.12], ['#3a8fd0', 0.1], ['#4caf50', 0.3], ['#d9d2c6', 0.5]].forEach(([col, a]) => {
    c.save(); c.translate(cx, cy - 20); c.rotate(a); c.fillStyle = col; c.fillRect(-4, -64, 8, 70); c.fillStyle = '#3a2a1c'; c.fillRect(-4, -72, 8, 8); c.restore();
  });
  c.fillStyle = '#3d2e5a'; c.beginPath(); c.moveTo(cx - 28, cy - 38); c.lineTo(cx + 28, cy - 38); c.lineTo(cx + 24, cy + 8); c.lineTo(cx - 24, cy + 8); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(cx - 24, cy - 38, 6, 46);
  [['#2f6ea5', 0], ['#c0392b', -8]].forEach(([col, dx], i) => {
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(1660 + dx + 6, 842 - i * 20 + 6, 124, 18);
    c.fillStyle = col; c.fillRect(1660 + dx, 842 - i * 20, 124, 18);
    c.fillStyle = '#efe7d6'; c.fillRect(1664 + dx, 858 - i * 20, 116, 3);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(1690 + dx, 846 - i * 20, 36, 6);
  });
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
  c.moveTo(300, 1130); c.bezierCurveTo(300, 990, 335, 880, 405, 824); c.bezierCurveTo(455, 790, 500, 782, 520, 758);
  c.lineTo(526, 706); c.lineTo(584, 706); c.lineTo(590, 758); c.bezierCurveTo(615, 782, 665, 792, 710, 824);
  c.bezierCurveTo(775, 878, 805, 990, 805, 1130); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(552, 604, 68, 78, 0.04, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(622, 620, 10, 8, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(500, 560); c.bezierCurveTo(430, 578, 414, 660, 446, 748); c.bezierCurveTo(456, 700, 474, 650, 508, 620); c.closePath(); c.fill();
  c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 40;
  c.beginPath(); c.moveTo(698, 836); c.quadraticCurveTo(764, 940, 962, 862 + bob); c.stroke();
  c.beginPath(); c.ellipse(994, 850 + bob, 38, 20, -0.14, 0, Math.PI * 2); c.fill();
  if (!flat) {
    c.fillStyle = '#d9d2c6';
    c.beginPath(); c.moveTo(526, 758); c.lineTo(556, 806); c.lineTo(536, 818); c.lineTo(504, 774); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(584, 758); c.lineTo(554, 806); c.lineTo(574, 818); c.lineTo(606, 774); c.closePath(); c.fill();
    c.fillStyle = '#e0527a'; c.beginPath(); c.moveTo(498, 560); c.lineTo(466, 538); c.lineTo(470, 580); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(498, 560); c.lineTo(520, 536); c.lineTo(524, 574); c.closePath(); c.fill();
    c.fillStyle = '#2a1722'; c.beginPath(); c.ellipse(556, 548, 66, 40, 0.04, Math.PI * 1.02, Math.PI * 1.98); c.fill();
  }
}

function woman(c, t8) {
  const typing = t8 > 2.6 && t8 < 5.8;
  const bob = typing ? Math.sin(t8 * 17) * 3 + Math.sin(t8 * 7.3) * 2 : 0;
  const br = Math.sin(t8 * 1.5) * 2;
  c.save(); c.translate(0, br);
  c.save(); c.translate(4, -3); womanShape(c, t8, bob, 'rgba(190,215,255,0.85)'); c.restore();
  c.save(); c.translate(-4, -2); c.globalAlpha = 0.5; womanShape(c, t8, bob, 'rgba(255,150,90,0.9)'); c.restore();
  womanShape(c, t8, bob, null);
  c.restore();
}

function drawS8(c, t) {
  const t8 = t - S8, loc = 55.5 + (t8 - BRAND_AT);
  SCC.save();
  if (t8 < 0.6) {
    drawContent(SCC, t - HUB_S, 1 - smooth(0, 0.6, t8));
    SCC.save(); SCC.globalAlpha = smooth(0, 0.6, t8); drawForm(SCC, t8 - 0.3); SCC.restore();
  } else {
    drawForm(SCC, t8 - 0.3);
    if (t8 > BRAND_AT) { SCC.save(); SCC.globalAlpha = smooth(BRAND_AT, BRAND_AT + 0.5, t8); drawContent(SCC, 0, 0); drawFinale(SCC, loc); SCC.restore(); }
  }
  SCC.restore();
  const pi = E.io(inv(BRAND_AT, BRAND_AT + PUSH_LEN, t8)), zk = E.io(inv(Z_START, Z_START + Z_LEN, t8)) * (1 - pi);
  if (zk < 0.0005) c.drawImage(SC, 0, 0);
  else {
    const drift = inv(Z_START + Z_LEN, BRAND_AT, t8) * (1 - pi);
    const Z = Math.exp(lerp(Math.log(2), 0, zk)) * (1 + 0.02 * drift), cx = lerp(W / 2, PC[0], zk) + 8 * drift, cy = lerp(H / 2, PC[1], zk) - 4 * drift;
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
    const vg = c.createRadialGradient(W / 2, H / 2, H * 0.38, W / 2, H / 2, H * 1.0);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${0.5 * zk})`);
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
  }
  const ca = smooth(5.5, 6.2, t8) * (1 - smooth(8.3, 8.8, t8));
  if (ca > 0) {
    const g = c.createLinearGradient(0, H - 330, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${0.62 * ca})`);
    c.fillStyle = g; c.fillRect(0, H - 330, W, 330);
    CAPTION.forEach((ln, i) => {
      const a = smooth(5.5 + i * 0.6, 6.2 + i * 0.6, t8) * (1 - smooth(8.3, 8.8, t8));
      txt(c, ln, W - 110, H - 150 + i * 72 + (1 - E.out(inv(5.5 + i * 0.6, 6.4 + i * 0.6, t8))) * 18, { size: i ? 50 : 54, w: i ? 600 : 900, align: 'right', color: i ? C.goldHi : '#fff', alpha: a, glow: 'rgba(0,0,0,0.7)', blur: 20 });
    });
    c.save(); c.globalAlpha = ca; c.fillStyle = C.gold;
    const lw = 130 * E.out(inv(6.3, 7.2, t8)); c.fillRect(W - 110 - lw, H - 150 + 118, lw, 3); c.restore();
  }
  const fo = smooth(SEQ_LEN - 0.5, SEQ_LEN, t8);
  if (fo > 0) { c.fillStyle = `rgba(0,0,0,${fo})`; c.fillRect(0, 0, W, H); }
}
