// ───────── Meydan app UI kit: the app's own dark-theme tokens (app/globals.css) and component shapes (features/auth/components/AuthPage.tsx)
// Every helper draws in "app pixels" (a 390px-wide phone layout); callers scale the context.
const T = {
  bg: '#1c1c1c', fg: '#f5f5f7', fg2: '#d1d5db', mute: '#9a9aa3', surf: '#1c1c1c', surfM: '#242424', border: '#2b2b2b', borderS: '#343434',
  input: '#242424', inBorder: '#2b2b2b', brand: '#e4152e', brandMuted: 'rgba(239,68,68,0.13)', brandBorder: 'rgba(239,68,68,0.36)', ring: '#ef4444',
  ok: '#34d399', okFg: '#6ee7b7', okSurf: 'rgba(16,185,129,0.12)', okBorder: 'rgba(52,211,153,0.3)', iconM: '#9a9aa3', divider: '#2b2b2b',
};
const R_CONTROL = 12, R_CARD = 16, R_PANEL = 20;

function uit(c, s, x, y, o = {}) { txt(c, s, x, y, { f: UIF, size: 14, color: T.fg, ...o }); }
function uiW(s, size, w) { return measure(s, size, w, UIF); }
function box(c, x, y, w, h, r, fill, stroke, lw = 1) {
  c.beginPath(); c.roundRect(x, y, w, h, r);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
}

function appHeader(c, cx, cy, a = 1) {
  const nameW = uiW('شبکه سراسری میادین ایران', 9, 700), gw = 40 + 10 + Math.max(nameW, 50), x0 = cx - gw / 2;
  c.save(); c.globalAlpha *= a;
  c.shadowColor = 'rgba(0,0,0,0.3)'; c.shadowBlur = 14; c.shadowOffsetY = 4;
  logoTile(c, x0 + gw - 20, cy, 40);
  c.shadowColor = 'transparent';
  uit(c, 'نقش من', x0 + gw - 50, cy - 8, { size: 14, w: 900, align: 'right' });
  uit(c, 'شبکه سراسری میادین ایران', x0 + gw - 50, cy + 10, { size: 9, w: 700, color: T.mute, align: 'right' });
  c.restore();
}

function panelCard(c, x, y, w, h) {
  c.save(); c.shadowColor = 'rgba(0,0,0,0.44)'; c.shadowBlur = 36; c.shadowOffsetY = 14;
  box(c, x, y, w, h, R_PANEL, T.surf); c.restore();
  box(c, x, y, w, h, R_PANEL, null, T.border, 1);
}

// done = how many steps are complete (0…3, fractional while animating)
function stepper(c, x, y, w, done) {
  const gap = 8, cw = (w - gap * 2) / 3, labels = ['شماره همراه', 'تأیید', 'ساخت حساب'];
  for (let i = 0; i < 3; i++) {
    const cx = x + w - i * (cw + gap) - cw / 2, cy = y + 14, comp = clamp(done - i), active = done >= i && done < i + 1;
    const lineR = i > 0 && (comp > 0 || active) ? T.brand : T.divider, lineL = i < 2 && done > i + 1 - 0.0001 ? T.brand : T.divider;
    c.fillStyle = i === 0 ? 'rgba(0,0,0,0)' : lineR; c.fillRect(cx + 16, cy, cw / 2 - 16, 1);
    c.fillStyle = i === 2 ? 'rgba(0,0,0,0)' : lineL; c.fillRect(cx - cw / 2, cy, cw / 2 - 16, 1);
    // circle: muted → active (tinted) → complete (solid brand + check)
    c.beginPath(); c.arc(cx, cy, 14, 0, Math.PI * 2);
    c.fillStyle = comp >= 1 ? T.brand : active ? T.brandMuted : T.surfM; c.fill();
    if (comp > 0 && comp < 1) { c.fillStyle = `rgba(228,21,46,${comp})`; c.fill(); }
    c.strokeStyle = comp > 0 ? T.brand : active ? T.brand : T.border; c.lineWidth = 1; c.stroke();
    if (comp >= 0.55) icon(c, 'check', cx, cy, 14 * E.back(clamp((comp - 0.55) / 0.45)), '#fff', 3);
    else uit(c, fa(i + 1), cx, cy + 1, { size: 10, w: 900, color: active ? T.brand : T.mute });
    uit(c, labels[i], cx, y + 40, { size: 9, w: 700, color: active || comp >= 1 ? (active ? T.brand : T.mute) : T.mute });
  }
}

function iconTile(c, x, y, size, name, a = 1, solid = false) {
  c.save(); c.globalAlpha *= a;
  box(c, x, y, size, size, 16, solid ? T.brand : T.brandMuted);
  icon(c, name, x + size / 2, y + size / 2, size * 0.5, solid ? '#fff' : T.brand, 2);
  c.restore();
}

function choiceCard(c, x, y, w, h, sel, ic, title, sub) {
  box(c, x, y, w, h, R_CARD, sel ? T.brandMuted : T.surf, sel ? T.brand : T.border, sel ? 1.5 : 1);
  box(c, x + w - 14 - 36, y + 14, 36, 36, 12, sel ? T.brand : T.surfM);
  icon(c, ic, x + w - 14 - 18, y + 32, 18, sel ? '#fff' : T.iconM, 2);
  uit(c, title, x + w - 14, y + 70, { size: 12, w: 900, align: 'right' });
  uit(c, sub, x + w - 14, y + 90, { size: 10, color: T.mute, align: 'right' });
}

function fieldLabel(c, x, y, w, label, hint) {
  uit(c, label, x + w, y, { size: 12, w: 900, color: T.fg2, align: 'right' });
  if (hint) uit(c, hint, x, y, { size: 10, color: T.mute, align: 'left' });
}
function inputBox(c, x, y, w, value, o = {}) {
  const h = 48, focus = o.focus;
  if (focus) { c.save(); c.strokeStyle = 'rgba(239,68,68,0.45)'; c.lineWidth = 3; c.beginPath(); c.roundRect(x - 1.5, y - 1.5, w + 3, h + 3, R_CONTROL + 1.5); c.stroke(); c.restore(); }
  box(c, x, y, w, h, R_CONTROL, T.input, focus ? T.ring : T.inBorder, 1);
  const hasVal = !!value, dir = o.ltr ? 'ltr' : 'rtl';
  const px = o.ltr ? x + (o.at ? 38 : 14) : x + w - 14;
  if (o.at) icon(c, 'at', x + 22, y + h / 2, 17, T.iconM, 2);
  uit(c, hasVal ? value : o.placeholder || '', px, y + h / 2 + 1, { size: 14, w: 500, color: hasVal ? T.fg : T.mute, align: o.ltr ? 'left' : 'right', dir });
  if (focus && o.caret) { const tw = uiW(value || '', 14, 500); c.fillStyle = T.ring; c.fillRect(o.ltr ? px + tw + 2 : px - tw - 3, y + 14, 1.5, 20); }
  if (o.chevron) icon(c, 'chevd', x + 24, y + h / 2, 16, T.iconM, 2);
}
function field(c, x, y, w, label, hint, value, o = {}) {
  fieldLabel(c, x, y, w, label, hint);
  inputBox(c, x, y + 10, w, value, o);
}

function optionPills(c, x, y, w, items, sel, selP = 1) {
  const gap = 8, cw = (w - gap * (items.length - 1)) / items.length;
  items.forEach((s, i) => {
    const px = x + w - (i + 1) * cw - i * gap, on = i === sel, k = on ? selP : 0;
    box(c, px, y, cw, 40, R_CARD, on ? `rgba(239,68,68,${0.13 * k})` : T.surf, on ? `rgba(${lerp(43, 228, k) | 0},${lerp(43, 21, k) | 0},${lerp(43, 46, k) | 0},1)` : T.border, 1);
    uit(c, s, px + cw / 2, y + 21, { size: 12, w: 900, color: on && k > 0.4 ? T.fg : T.fg2 });
  });
}

function primaryButton(c, x, y, w, label, o = {}) {
  const h = 48, press = o.press || 0, en = o.enabled !== false;
  c.save(); c.translate(x + w / 2, y + h / 2); c.scale(1 - 0.012 * press, 1 - 0.02 * press); c.translate(-x - w / 2, -y - h / 2);
  if (en) { c.shadowColor = 'rgba(0,0,0,0.28)'; c.shadowBlur = 14; c.shadowOffsetY = 5; }
  box(c, x, y, w, h, R_CONTROL, en ? T.brand : '#303030');
  c.shadowColor = 'transparent';
  const rp = o.ripple || 0;
  if (rp > 0 && rp < 1) { c.save(); c.beginPath(); c.roundRect(x, y, w, h, R_CONTROL); c.clip(); c.fillStyle = `rgba(255,255,255,${0.3 * (1 - rp)})`; c.beginPath(); c.arc(x + w * 0.5, y + h / 2, 10 + rp * w * 0.7, 0, Math.PI * 2); c.fill(); c.restore(); }
  const tw = uiW(label, 14, 900), col = en ? '#fff' : '#7a7a7a';
  uit(c, label, x + w / 2 + 12, y + h / 2 + 1, { size: 14, w: 900, color: col });
  icon(c, 'arrowL', x + w / 2 - tw / 2 - 6, y + h / 2, 17, col, 2.2);
  c.restore();
}

function successAlert(c, x, y, w, text, a = 1) {
  c.save(); c.globalAlpha *= a;
  box(c, x, y, w, 44, R_CARD, T.okSurf, T.okBorder, 1);
  icon(c, 'check', x + w - 22, y + 22, 17, T.okFg, 2.4);
  uit(c, text, x + w - 40, y + 23, { size: 12, w: 700, color: T.okFg, align: 'right' });
  c.restore();
}
