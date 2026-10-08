// ───────── Content hub (HUB_S →) and the brand end card (S8 →)
const CC_W = 500, CC_H = 312;
const COLX = [1250, 710, 170], ROWY = [262, 612, 962];
const CCARDS = [
  { k: 'speaker', ic: 'mic', t: 'اعزام سخنران', col: 0, row: 0, at: 0.8 },
  { k: 'call', ic: 'phone', t: 'بیست‌کال', col: 1, row: 0, at: 1.0 },
  { k: 'campaign', ic: 'mega', t: 'پویش', col: 2, row: 0, at: 1.2 },
  { k: 'note', ic: 'note', t: 'یادداشت', col: 0, row: 1, at: 1.4 },
  { k: 'audio', ic: 'audio', t: 'آوا و نوا', col: 1, row: 1, at: 1.6 },
  { k: 'narr', ic: 'quote', t: 'روایت', col: 2, row: 1, at: 1.8 },
  { k: 'screen', ic: 'film', t: 'اکران فیلم و مستند', col: 0, row: 2, at: 6.6 },
  { k: 'story', ic: 'book', t: 'قصه‌ی آقا', col: 1, row: 2, at: 6.82 },
  { k: 'chat', ic: 'chats', t: 'گفتگو و تعامل', col: 2, row: 2, at: 7.04 },
];
CCARDS.forEach(cd => { cd.x = COLX[cd.col]; cd.y = ROWY[cd.row]; });
const SCROLL = th => -350 * E.io(inv(6.0, 7.3, th));
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
const sec = s => fa(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`);

function cardSpeaker(c, x, y, w, R, lt) {
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
  const tap = inv(2.6, 3.3, lt);
  if (tap > 0 && tap < 1) {
    c.save(); c.beginPath(); c.roundRect(bx, by, bw, bh, 14); c.clip();
    c.fillStyle = `rgba(255,255,255,${0.35 * (1 - tap)})`; c.beginPath(); c.arc(bx + bw * 0.62, by + bh / 2, 20 + tap * 260, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  txt(c, lt > 2.9 ? 'درخواست ثبت شد' : 'درخواست سخنران', bx + bw / 2, by + bh / 2 + 1, { size: 22, w: 700 });
}

// Not a conference: one person on the line, calling to invite someone to take a role.
function cardCall(c, x, y, w, R, lt, t) {
  const w1 = chip(c, 'کمپین دعوت', R, y + 112, true);
  chip(c, 'یک‌به‌یک', R - w1 - 8, y + 112, false);
  const ax = R - 34, ay = y + 178;
  for (let k = 0; k < 2; k++) {
    const p = (t * 0.9 + k * 0.5) % 1;
    c.strokeStyle = `rgba(74,222,128,${(1 - p) * 0.55})`; c.lineWidth = 2;
    c.beginPath(); c.arc(ax, ay, 31 + p * 30, 0, Math.PI * 2); c.stroke();
  }
  const ag = c.createLinearGradient(ax - 31, ay - 31, ax + 31, ay + 31);
  ag.addColorStop(0, '#f59e0b'); ag.addColorStop(1, '#b45309');
  c.fillStyle = ag; c.beginPath(); c.arc(ax, ay, 31, 0, Math.PI * 2); c.fill();
  icon(c, 'user', ax, ay, 32, 'rgba(255,255,255,0.95)', 1.9);
  txt(c, 'تماس با مریم · مشهد', ax - 46, ay - 14, { size: 24, w: 800, align: 'right' });
  const pu = 0.5 + 0.5 * Math.sin(t * 5);
  glowDot(c, ax - 54, ay + 20, 16, [34, 197, 94], 0.5 * pu + 0.2);
  c.fillStyle = C.green; c.beginPath(); c.arc(ax - 54, ay + 20, 6, 0, Math.PI * 2); c.fill();
  txt(c, `در حال تماس · ${sec(12 + Math.max(0, lt))}`, ax - 68, ay + 21, { size: 19, w: 600, color: '#4ade80', align: 'right' });
  c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.arc(x + 58, ay, 24, 0, Math.PI * 2); c.fill();
  icon(c, 'mic', x + 58, ay, 22, '#d6d9df', 2);
  c.fillStyle = C.red; c.beginPath(); c.arc(x + 118, ay, 24, 0, Math.PI * 2); c.fill();
  c.save(); c.translate(x + 118, ay); c.rotate(2.36); icon(c, 'phone', 0, 0, 20, '#fff', 2.2); c.restore();
  txt(c, 'دعوت به نقش‌آفرینی؛ یک نفر، یک تماس', R, y + 232, { size: 20, w: 600, color: C.goldSoft, align: 'right' });
  const pg = 0.61 * E.io(inv(0.4, 2.4, lt)), bw = w - 60;
  txt(c, `${fa(Math.round(300 * pg))} تماس از ${fa(300)} · هر تماس، یک نقشِ تازه`, R, y + 268, { size: 17, color: C.mute, align: 'right' });
  c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.roundRect(x + 30, y + 286, bw, 8, 4); c.fill();
  if (pg > 0.01) {
    const g = c.createLinearGradient(R - bw * (pg / 0.61), 0, R, 0); g.addColorStop(0, '#f6d58e'); g.addColorStop(1, '#c8902f');
    c.fillStyle = g; c.beginPath(); c.roundRect(R - bw * pg, y + 286, bw * pg, 8, 4); c.fill();
  }
}

function cardCampaign(c, cd, x, y, w, R, lt) {
  txt(c, 'پویش «پرچم من»', R, y + 122, { size: 25, w: 700, align: 'right' });
  txt(c, 'یک پیام، برای همه', R, y + 155, { size: 19, color: C.mute, align: 'right' });
  const pg = 0.72 * E.io(inv(0.4, 2.2, lt)), bw = w - 60;
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
}

function cardNote(c, x, y, w, R) {
  let xr = R;
  ['تحلیلی', 'سیاسی', 'اجتماعی'].forEach((s, j) => { xr -= chip(c, s, xr, y + 118, j === 0) + 8; });
  txt(c, 'میدان، صدای مشترک ما', R, y + 172, { size: 28, w: 800, align: 'right' });
  txt(c, 'وقتی مردم کنار هم می‌ایستند، معادله‌ها تغییر می‌کند؛', R, y + 214, { size: 19, color: '#b8bcc6', align: 'right' });
  txt(c, 'این یادداشت از نقش حضور جمعی می‌گوید.', R, y + 246, { size: 19, color: '#b8bcc6', align: 'right' });
  txt(c, '۵ دقیقه مطالعه', R, y + 284, { size: 17, color: C.mute, align: 'right' });
}

function cardAudio(c, x, y, w, R, lt, t) {
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

function cardNarr(c, x, y, w, R, lt) {
  const ax = R - 20;
  c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.arc(ax, y + 118, 20, 0, Math.PI * 2); c.fill();
  c.strokeStyle = rgba(GOLD, 0.85); c.lineWidth = 2; c.stroke();
  icon(c, 'user', ax, y + 118, 22, '#d6d9df', 1.8);
  txt(c, 'راوی میدان انقلاب', ax - 32, y + 110, { size: 21, w: 800, align: 'right' });
  txt(c, 'همین حالا', ax - 32, y + 136, { size: 16, color: C.mute, align: 'right' });
  const lines = ['از همان روزِ اول در خیابان بودیم؛', 'هر روز، تا امروز. این روایتِ ماست.'];
  lines.forEach((ln, i) => {
    const a = smooth(0.7 + i * 0.7, 1.2 + i * 0.7, lt);
    txt(c, ln, R, y + 184 + i * 40 + (1 - a) * 8, { size: 25, w: 700, align: 'right', alpha: a });
  });
  c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(x + 30, y + 250, w - 60, 1);
  const hb = 1 + 0.22 * Math.sin(Math.PI * clamp((lt - 2.4) * 2.5));
  let rx = R - 12;
  [['msg', '۱۲۸', C.mute, 1], ['repeat', '۸۶۰', C.mute, 1], ['heart', fa(Math.round(2400 * E.out(inv(1.6, 3.2, lt))).toLocaleString('en-US').replace(/,/g, '٬')), '#f87171', hb]].forEach(([ic, s, col, sc]) => {
    c.save(); c.translate(rx, y + 282); c.scale(sc, sc);
    icon(c, ic, 0, 0, 24, col, 2);
    c.restore();
    txt(c, s, rx - 20, y + 283, { size: 19, color: col === C.mute ? C.mute : '#fca5a5', align: 'right' });
    rx -= 150;
  });
  icon(c, 'share', x + 40, y + 282, 22, C.mute, 2);
}

function cardScreen(c, x, y, w, R, lt, t) {
  const sx = x + 30, sy = y + 90, sw = w - 60, sh = 116;
  c.save();
  c.beginPath(); c.roundRect(sx, sy, sw, sh, 14); c.clip();
  const zoom = 1 + 0.05 * lt;
  c.drawImage(THUMB_FLAGS, 0, 70, 936, 330, sx - (zoom - 1) * sw / 2, sy - (zoom - 1) * sh / 2, sw * zoom, sh * zoom);
  const g = c.createLinearGradient(0, sy, 0, sy + sh);
  g.addColorStop(0, 'rgba(0,0,0,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0.78)');
  c.fillStyle = g; c.fillRect(sx, sy, sw, sh);
  c.fillStyle = 'rgba(255,255,255,0.92)'; c.beginPath(); c.arc(sx + sw / 2, sy + sh / 2 - 6, 26, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#14100a'; c.beginPath(); c.moveTo(sx + sw / 2 - 7, sy + sh / 2 - 20); c.lineTo(sx + sw / 2 + 14, sy + sh / 2 - 6); c.lineTo(sx + sw / 2 - 7, sy + sh / 2 + 8); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(sx, sy + sh - 5, sw, 5);
  c.fillStyle = C.red; c.fillRect(sx, sy + sh - 5, sw * (0.28 + 0.04 * lt), 5);
  c.restore();
  txt(c, 'مستند · ۴۸ دقیقه', sx + 14, sy + sh - 20, { size: 16, w: 600, align: 'left', color: '#fff', dir: 'ltr' });
  const pu = 0.5 + 0.5 * Math.sin(t * 5);
  c.fillStyle = `rgba(239,68,68,${0.6 + 0.4 * pu})`; c.beginPath(); c.arc(sx + sw - 18, sy + 18, 6, 0, Math.PI * 2); c.fill();
  txt(c, 'اکران در میدان', sx + sw - 32, sy + 19, { size: 16, w: 700, align: 'right', color: '#fff' });
  txt(c, 'امشب · ساعت ۲۱:۳۰ · میدان آزادی', R, y + 238, { size: 20, w: 600, align: 'right' });
  txt(c, 'اکران در میدان خودتان را ثبت کنید', R, y + 274, { size: 18, color: C.goldSoft, align: 'right' });
}

function cardStory(c, x, y, w, R, lt, t) {
  const cx = R - 52, cy = y + 160;
  const g = c.createLinearGradient(cx - 52, cy - 52, cx + 52, cy + 52);
  g.addColorStop(0, '#7a1d1d'); g.addColorStop(0.6, '#dc2626'); g.addColorStop(1, '#f2c46d');
  c.fillStyle = g; c.beginPath(); c.roundRect(cx - 52, cy - 62, 104, 124, 14); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(cx - 52, cy - 62, 10, 124);
  mark(c, cx + 4, cy - 14, 54, 'rgba(255,255,255,0.9)');
  txt(c, 'قصه‌ی آقا', cx + 4, cy + 38, { size: 17, w: 800, color: '#fff' });
  txt(c, 'قصه‌ی آقا', cx - 70, y + 128, { size: 32, w: 900, align: 'right' });
  txt(c, 'قصه‌ای برای خواندن و شنیدن', cx - 70, y + 164, { size: 19, color: C.mute, align: 'right' });
  chip(c, 'قسمت ۳ از ۱۲', cx - 70, y + 204, true);
  const bw = w - 60, py = y + 268, pg = 0.3 + 0.06 * lt;
  c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.roundRect(x + 30, py, bw, 7, 4); c.fill();
  c.fillStyle = C.gold; c.beginPath(); c.roundRect(R - bw * pg, py, bw * pg, 7, 4); c.fill();
  txt(c, `قسمت ۳ · ${sec(Math.max(0, lt) + 192)} از ${fa('11:40')}`, R, y + 292, { size: 17, color: C.mute, align: 'right' });
  const pr = 0.5 + 0.5 * Math.sin(t * 4);
  c.fillStyle = C.gold; c.beginPath(); c.arc(x + 54, y + 204, 24, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#14100a';
  c.beginPath(); c.roundRect(x + 54 - 8, y + 204 - 10, 5.5, 20, 2); c.roundRect(x + 54 + 2.5, y + 204 - 10, 5.5, 20, 2); c.fill();
}

function cardChat(c, x, y, w, R, lt) {
  c.fillStyle = C.red; c.beginPath(); c.arc(x + 44, y + 58, 14, 0, Math.PI * 2); c.fill();
  txt(c, '۳', x + 44, y + 59, { size: 16, w: 800, color: '#fff' });
  const bub = (s, right, y0, at) => {
    const k = E.back(inv(at, at + 0.4, lt));
    if (k <= 0) return;
    const bw = Math.min(w - 90, measure(s, 21, 500) + 40), bx = right ? R - bw : x + 30, by = y + y0;
    c.save();
    c.translate(bx + (right ? bw : 0), by + 25); c.scale(k, k); c.translate(-(bx + (right ? bw : 0)), -(by + 25));
    c.fillStyle = right ? '#232733' : C.red;
    c.beginPath(); c.roundRect(bx, by, bw, 50, 18); c.fill();
    txt(c, s, bx + bw / 2, by + 26, { size: 21, w: 500, color: '#fff' });
    c.restore();
  };
  bub('فردا ساعت ۶، میدان آزادی؟', true, 100, 0.4);
  bub('هستم؛ چند نفر دیگر را هم می‌آورم', false, 166, 1.3);
  if (lt > 2.1 && lt < 3.0) {
    c.fillStyle = '#232733'; c.beginPath(); c.roundRect(R - 92, y + 232, 92, 50, 18); c.fill();
    for (let d = 0; d < 3; d++) {
      c.fillStyle = `rgba(255,255,255,${0.35 + 0.65 * (0.5 + 0.5 * Math.sin(lt * 9 - d * 1.1))})`;
      c.beginPath(); c.arc(R - 28 - d * 20, y + 257, 5, 0, Math.PI * 2); c.fill();
    }
  }
  bub('عالیه؛ برای ایران.', true, 232, 3.0);
  txt(c, 'دوستان و عزیزان، از سراسر کشور', x + w / 2, y + 298, { size: 16, color: C.mute, alpha: smooth(1.6, 2.2, lt) });
}

function contentCard(c, cd, th, t) {
  const k = E.out(inv(cd.at, cd.at + 0.65, th));
  if (k <= 0) return;
  const lt = th - cd.at, x = cd.x, y = cd.y + (1 - k) * 40, w = CC_W, h = CC_H, R = x + w - 30;
  c.save();
  c.globalAlpha *= smooth(cd.at, cd.at + 0.4, th);
  c.translate(x + w / 2, y + h / 2); c.scale(lerp(0.94, 1, k), lerp(0.94, 1, k)); c.translate(-x - w / 2, -y - h / 2);
  const bg = c.createLinearGradient(0, y, 0, y + h);
  bg.addColorStop(0, '#14161d'); bg.addColorStop(1, '#0c0d12');
  c.fillStyle = bg; c.beginPath(); c.roundRect(x, y, w, h, 26); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.09)'; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = 'rgba(242,196,109,0.12)'; c.beginPath(); c.arc(R - 28, y + 58, 28, 0, Math.PI * 2); c.fill();
  icon(c, cd.ic, R - 28, y + 58, 28, C.gold, 2);
  txt(c, cd.t, R - 72, y + 58, { size: cd.t.length > 14 ? 28 : 32, w: 800, align: 'right' });
  if (cd.k === 'speaker') cardSpeaker(c, x, y, w, R, lt);
  else if (cd.k === 'call') cardCall(c, x, y, w, R, lt, t);
  else if (cd.k === 'campaign') cardCampaign(c, cd, x, y, w, R, lt);
  else if (cd.k === 'note') cardNote(c, x, y, w, R);
  else if (cd.k === 'audio') cardAudio(c, x, y, w, R, lt, t);
  else if (cd.k === 'narr') cardNarr(c, x, y, w, R, lt);
  else if (cd.k === 'screen') cardScreen(c, x, y, w, R, lt, t);
  else if (cd.k === 'story') cardStory(c, x, y, w, R, lt, t);
  else cardChat(c, x, y, w, R, lt);
  c.restore();
}

// th is seconds since the hub began fading in over the map
function drawContent(c, th, cardsA = 1) {
  c.fillStyle = '#06070a'; c.fillRect(0, 0, W, H);
  c.save();
  const r = rng(9);
  for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(242,196,109,${0.04 + r() * 0.05})`; c.fillRect(r() * W, r() * H, 1.6, 1.6); }
  c.restore();
  glowDot(c, W / 2, 150, 520, [120, 40, 30], 0.35);
  const sc = SCROLL(th);
  c.save(); c.translate(0, sc);
  const ha = smooth(0.4, 1.0, th) * cardsA;
  txt(c, 'بخش محتوا', W / 2, 118 + (1 - ha) * 10, { size: 26, w: 700, color: C.gold, alpha: ha });
  txt(c, 'همه‌ی محتوا، یک‌جا', W / 2, 176 + (1 - ha) * 10, { size: 54, w: 900, alpha: ha });
  c.globalAlpha = cardsA;
  CCARDS.forEach(cd => contentCard(c, cd, th, th + HUB_S));
  c.restore();
  if (sc < -1) {
    const g = c.createLinearGradient(0, 0, 0, 240);
    g.addColorStop(0, `rgba(6,7,10,${cardsA})`); g.addColorStop(0.55, `rgba(6,7,10,${cardsA})`); g.addColorStop(1, 'rgba(6,7,10,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, 240);
  }
  finish(c, th, 0.5);
}

// ── finale: the brand block (map, name, slogan, address) slides right and the app-download panel opens on the left
const BRAND = JSON.parse(document.getElementById('brand-assets').textContent);
const SLOGAN_PATHS = BRAND.slogan.map(d => new Path2D(d));
const ICON_ANDROID = new Path2D(BRAND.android), ICON_APPLE = new Path2D(BRAND.apple);
let PARTS = [], IRAN_PTS = [], FCITIES = [], SEA = null;
const IR_K = 30, IR_CX = 960, IR_CY = 326, IR_COS = Math.cos(32.4 * Math.PI / 180);
const irXY = ([lon, lat]) => [IR_CX + (lon - 53.6) * IR_K * IR_COS, IR_CY - (lat - 32.4) * IR_K];
const SEAS = [
  { n: 'دریای خزر', at: [51.0, 40.4], mask: [51.2, 39.3, 4.6, 3.1] },
  { n: 'خلیج فارس', at: [51.0, 26.9], mask: [52.4, 27.0, 6.6, 4.0] },
  { n: 'دریای عمان', at: [58.7, 24.3], mask: [59.6, 24.4, 4.4, 2.6] },
];

function buildSea() {
  SEA = mk(W, H);
  const c = SEA.getContext('2d'), land = new Path2D();
  for (const poly of GEO.landHi.coordinates) for (const ring of poly) {
    ring.forEach((ll, i) => { const [x, y] = irXY(ll); if (i) land.lineTo(x, y); else land.moveTo(x, y); });
    land.closePath();
  }
  c.strokeStyle = '#fff'; c.lineWidth = 2.6; c.lineJoin = 'round'; c.stroke(land);
  const m = mk(W, H), mc = m.getContext('2d');
  for (const sea of SEAS) {
    const [lon, lat, rx, ry] = sea.mask, [x, y] = irXY([lon, lat]), px = rx * IR_K * IR_COS, py = ry * IR_K;
    mc.save(); mc.translate(x, y); mc.scale(1, py / px);
    const g = mc.createRadialGradient(0, 0, px * 0.5, 0, 0, px); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    mc.fillStyle = g; mc.fillRect(-px, -px, px * 2, px * 2); mc.restore();
  }
  c.globalCompositeOperation = 'destination-in'; c.drawImage(m, 0, 0);
}

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
  PARTS = IRAN_PTS.map(tp => ({ sx: r() * W, sy: r() * H, tx: tp[0], ty: tp[1], d: r() * 0.55, sw: (r() - 0.5) * 520, r: 1.3 + r() * 1.2, ph: r() * 6.28 }));
  FCITIES = CITIES.filter(cy => cy.big).map((cy, i) => ({ p: irXY(cy.ll), d: i * 0.12 }));
  const rw = rng(8);
  WAVE = Array.from({ length: 46 }, (_, j) => 0.25 + 0.75 * Math.abs(Math.sin(j * 0.55) * 0.6 + (rw() - 0.5) * 0.7));
  buildSea();
}

function sloganArt(c, cx, cy, width, a, reveal) {
  if (a <= 0 || reveal <= 0) return;
  const s = width / 160.8;
  c.save(); c.translate(cx - 80.4 * s, cy - 12.6 * s); c.scale(s, s);
  c.beginPath(); c.rect(160.8 * (1 - reveal) - 2, -6, 160.8 * reveal + 6, 40); c.clip();
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [lw, al, col] of [[7, 0.1, GOLD], [3, 0.22, GOLD], [1.35, 1, GOLDHI]]) {
    c.globalAlpha = a * al; c.lineWidth = lw; c.strokeStyle = rgba(col, 1);
    for (const p of SLOGAN_PATHS) c.stroke(p);
  }
  c.restore();
}

function qrCode(c, key, x, y, size) {
  const q = BRAND.qr[key], n = q.n, pad = 20, m = (size - pad * 2) / n;
  c.fillStyle = '#fff'; c.beginPath(); c.roundRect(x, y, size, size, 20); c.fill();
  c.fillStyle = '#0a0a0c';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.rows[r][k] === '1') c.fillRect(Math.round(x + pad + k * m), Math.round(y + pad + r * m), Math.ceil(m) + 0.5, Math.ceil(m) + 0.5);
}

const QR_ROWS = [
  { k: 'android', t: 'اپلیکیشن اندروید', sub: '', logo: 'android' },
  { k: 'ios', t: 'اپلیکیشن آی‌او‌اس', sub: '', logo: 'apple' },
  { k: 'web', t: 'وب‌سایت نقش من', sub: 'naghshman.ir', logo: 'tile' },
];
function qrPanel(c, t) {
  const a0 = inv(59.9, 60.6, t);
  if (a0 <= 0) return;
  const x0 = 110, w = 620, e = E.out(inv(59.9, 60.9, t));
  c.save(); c.globalAlpha = smooth(0, 1, a0); c.translate((1 - e) * -80, 0);
  c.fillStyle = 'rgba(255,255,255,0.04)'; c.strokeStyle = 'rgba(255,255,255,0.1)'; c.lineWidth = 2;
  c.beginPath(); c.roundRect(x0 - 40, 56, w + 80, 968, 44); c.fill(); c.stroke();
  txt(c, 'برنامه را دریافت کنید', x0 + w, 146, { size: 50, w: 900, align: 'right' });
  txt(c, 'با دوربین گوشی اسکن کنید', x0 + w, 200, { size: 28, color: C.goldSoft, align: 'right' });
  QR_ROWS.forEach((row, i) => {
    const ra = smooth(60.1 + i * 0.14, 60.5 + i * 0.14, t), y = 250 + i * 252;
    if (ra <= 0) return;
    c.save(); c.globalAlpha *= ra; c.translate(0, (1 - ra) * 24);
    c.fillStyle = 'rgba(255,255,255,0.05)'; c.beginPath(); c.roundRect(x0, y, w, 232, 30); c.fill();
    qrCode(c, row.k, x0 + w - 21 - 190, y + 21, 190);
    const xr = x0 + w - 21 - 190 - 28, ly = y + 76;
    if (row.logo === 'tile') logoTile(c, xr - 36, ly, 72);
    else {
      c.save(); c.translate(xr - 72, ly - 36); c.scale(3, 3); c.fillStyle = row.logo === 'android' ? '#3ddc84' : '#f5f5f7'; c.fill(row.logo === 'android' ? ICON_ANDROID : ICON_APPLE); c.restore();
    }
    txt(c, row.t, xr, y + 152, { size: 34, w: 800, align: 'right' });
    if (row.sub) txt(c, row.sub, xr, y + 196, { size: 26, color: C.mute, align: 'right', dir: 'ltr' });
    c.restore();
  });
  c.restore();
}

function drawFinale(c, t) {
  const pT0 = 55.5;
  const shift = 370 * E.io(inv(59.8, 60.7, t));
  c.save(); c.translate(shift, 0);
  const sea = smooth(57.0, 58.4, t);
  if (sea > 0) {
    c.save(); c.globalAlpha = 0.9 * sea; c.drawImage(SEA, 0, 0); c.restore();
    for (const sn of SEAS) {
      const [x, y] = irXY(sn.at);
      txt(c, sn.n, x, y, { size: 24, w: 600, color: 'rgba(255,255,255,0.9)', alpha: smooth(57.6, 58.6, t), glow: 'rgba(0,0,0,0.85)', blur: 8 });
    }
  }
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
      glowDot(c, fc.p[0], fc.p[1], 20, GOLD, a * 0.6);
      c.save(); c.globalAlpha = a * (1 - fig); c.fillStyle = C.goldHi; c.beginPath(); c.arc(fc.p[0], fc.p[1], 3.6, 0, Math.PI * 2); c.fill(); c.restore();
      figure(c, fc.p[0], fc.p[1] - 5, 23, C.goldHi, a * fig);
    });
  }
  const LK_Y = 730, TILE = 130, GAP = 40, tw = measure('نقش من', 116, 900), gw = tw + GAP + TILE;
  const tileX = IR_CX + gw / 2 - TILE / 2, textX = IR_CX - gw / 2 + tw / 2;
  const lo = smooth(56.9, 57.25, t), la = E.back(inv(56.9, 57.6, t));
  if (lo > 0) {
    glowDot(c, tileX, LK_Y, 220, REDC, 0.4 * lo);
    c.save(); c.globalAlpha = lo;
    c.translate(tileX, LK_Y); c.scale(lerp(0.6, 1, la), lerp(0.6, 1, la));
    c.shadowColor = 'rgba(220,38,38,0.55)'; c.shadowBlur = 44;
    logoTile(c, 0, 0, TILE);
    c.restore();
    const sh = inv(58.3, 59.0, t);
    if (sh > 0 && sh < 1) {
      c.save(); c.beginPath(); c.roundRect(tileX - TILE / 2, LK_Y - TILE / 2, TILE, TILE, TILE * 0.226); c.clip();
      const sx = lerp(tileX - TILE, tileX + TILE, sh);
      const g = c.createLinearGradient(sx - 40, 0, sx + 40, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(tileX - TILE / 2, LK_Y - TILE / 2, TILE, TILE); c.restore();
    }
  }
  const na = smooth(57.1, 57.7, t);
  if (na > 0) txt(c, 'نقش من', textX, LK_Y + 4 + (1 - E.out(inv(57.1, 57.8, t))) * 26, { size: 116, w: 900, alpha: na, glow: 'rgba(242,196,109,0.35)', blur: 40 });
  sloganArt(c, IR_CX, 858, 560, smooth(57.75, 58.2, t), E.io(inv(57.8, 59.0, t)));
  const ua = smooth(58.6, 59.2, t);
  if (ua > 0) txt(c, 'naghshman.ir', IR_CX, 976 + (1 - E.out(inv(58.6, 59.3, t))) * 14, { size: 52, w: 700, color: '#f5f5f7', alpha: ua, dir: 'ltr', glow: 'rgba(242,196,109,0.25)', blur: 24 });
  c.restore();
  qrPanel(c, t);
}
