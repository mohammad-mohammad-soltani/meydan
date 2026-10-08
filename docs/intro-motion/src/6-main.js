// ───────── timeline + player
const cv = document.getElementById('stage');
const ctx = cv.getContext('2d');
const BUF = mk(W, H), BC = BUF.getContext('2d');

function flightFn(t) {
  return (i, cx, cy) => {
    const p = E.io(inv(19.95 + i * 0.07, 21.55 + i * 0.07, t));
    if (p >= 1) return null;
    const tg = scr(SQ[i].ll);
    return { x: lerp(cx, tg[0], p), y: lerp(cy, tg[1], p), s: lerp(1, 0.03, p), a: 1 - smooth(0.72, 1, p) };
  };
}
function over(fn, t, a) {
  BC.save(); BC.clearRect(0, 0, W, H); fn(BC, t); BC.restore();
  ctx.save(); ctx.globalAlpha = a; ctx.drawImage(BUF, 0, 0); ctx.restore();
}
function render(t) {
  t = clamp(t, 0, DUR - 1e-4);
  const c = ctx;
  c.save();
  if (t < 10.25) {
    drawS1(c, t);
    if (t > 9.7) over(drawS2A, t, smooth(9.7, 10.25, t));
  } else if (t < 12.5) {
    drawS2A(c, t);
    if (t > 12.25) over(drawS2B, t, smooth(12.25, 12.5, t));
  }
  else if (t < 14.02) drawS2B(c, t);
  else if (t < 19.9) { feedBg(c, t, 1); drawFeed(c, t, null); }
  else if (t < 22.3) { drawMap(c, t); feedBg(c, t, 1 - E.io(inv(19.9, 21.0, t))); drawFeed(c, t, flightFn(t)); }
  else if (t < 49.6) drawMap(c, t);
  else if (t < 50.4) { drawMap(c, t); over(drawContent, t, smooth(49.6, 50.4, t)); }
  else if (t < 55.4) drawContent(c, t);
  else { drawContent(c, t, 1 - smooth(55.4, 56.3, t)); drawFinale(c, t); }
  c.restore();
}

async function init() {
  const img = await loadImg('data:image/svg+xml;base64,' + document.getElementById('flag-svg').textContent.trim());
  FLAG = mk(630, 360);
  FLAG.getContext('2d').drawImage(img, 0, 0, 630, 360);
  await Promise.all(['400', '500', '600', '700', '800', '900'].map(w => document.fonts.load(`${w} 40px Vazirmatn`, 'نقش من')));
  buildGrain(); buildCrowd(); buildPlaza(); buildCity(); buildSkyline(); layoutPosts(); buildThumbs(); buildMapData(); buildFinale();
}

const CHAPTERS = [
  [0, 'اجتماعی بودن'], [10, 'میدان و شبکه‌ی میدان'], [20, 'اتصال میدان‌ها'], [30, 'ایران و کره‌ی زمین'],
  [38, 'خط قابلیت‌ها'], [50, 'بخش محتوا'], [55.5, 'نقش من'],
];
const ui = {
  big: document.getElementById('big'), play: document.getElementById('play'), restart: document.getElementById('restart'),
  bar: document.getElementById('bar'), fill: document.getElementById('fill'), time: document.getElementById('time'),
  fs: document.getElementById('fs'), list: document.getElementById('chapters'), stage: document.querySelector('.stage'),
};
let playing = false, cur = 0, last = 0, ready = false;
const clock = s => fa(`${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`);

function updateUI() {
  ui.fill.style.width = `${(cur / DUR) * 100}%`;
  ui.time.textContent = `${clock(cur)} / ${clock(DUR)}`;
  ui.big.hidden = playing || !ready;
  ui.play.setAttribute('aria-label', playing ? 'توقف' : 'پخش');
  ui.play.querySelector('.i-play').hidden = playing;
  ui.play.querySelector('.i-pause').hidden = !playing;
  let on = 0;
  CHAPTERS.forEach(([s], i) => { if (cur >= s - 0.01) on = i; });
  ui.list.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === on));
}
function tick(now) {
  if (!playing) return;
  cur += Math.min(0.1, (now - last) / 1000);
  last = now;
  if (cur >= DUR) { cur = DUR; playing = false; }
  render(cur);
  updateUI();
  if (playing) requestAnimationFrame(tick);
}
function play() {
  if (!ready) return;
  if (cur >= DUR - 0.05) cur = 0;
  playing = true; last = performance.now();
  requestAnimationFrame(tick); updateUI();
}
function pause() { playing = false; updateUI(); }
function seek(s) { cur = clamp(s, 0, DUR); render(cur); updateUI(); }

ui.big.addEventListener('click', play);
ui.play.addEventListener('click', () => (playing ? pause() : play()));
ui.restart.addEventListener('click', () => { seek(0); play(); });
ui.fs.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else if (ui.stage.requestFullscreen) ui.stage.requestFullscreen().catch(() => {});
});
cv.addEventListener('click', () => (playing ? pause() : play()));
let dragging = false;
const barSeek = e => { const r = ui.bar.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * DUR); };
ui.bar.addEventListener('pointerdown', e => { if (!ready) return; dragging = true; ui.bar.setPointerCapture(e.pointerId); barSeek(e); });
ui.bar.addEventListener('pointermove', e => { if (dragging) barSeek(e); });
ui.bar.addEventListener('pointerup', () => { dragging = false; });
ui.bar.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') { seek(cur + 5); e.preventDefault(); }
  if (e.key === 'ArrowLeft') { seek(cur - 5); e.preventDefault(); }
});
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !/BUTTON|INPUT/.test(e.target.tagName)) { e.preventDefault(); playing ? pause() : play(); }
});
CHAPTERS.forEach(([s, name]) => {
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.type = 'button';
  b.innerHTML = `<span class="tm">${clock(s)}</span><span class="nm"></span>`;
  b.querySelector('.nm').textContent = name;
  b.addEventListener('click', () => { seek(s); play(); });
  li.appendChild(b); ui.list.appendChild(li);
  const tk = document.createElement('span');
  tk.className = 'tick'; tk.style.left = `${(s / DUR) * 100}%`;
  ui.bar.appendChild(tk);
});

const READY = init().then(() => {
  ready = true;
  cur = 59.6;
  render(cur);
  cur = 0;
  updateUI();
  ui.time.textContent = `${clock(0)} / ${clock(DUR)}`;
}).catch(err => {
  console.error(err);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  txt(ctx, 'بارگذاری موشن ناموفق بود؛ صفحه را دوباره باز کنید.', W / 2, H / 2, { size: 40 });
});
window.NM = { ready: READY, renderAt: t => render(t), canvas: cv };
