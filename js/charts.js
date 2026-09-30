/* ============================================================
   CHARTS — gráficos em SVG puro, com caixa de informação no hover
   Cada função recebe o elemento, os dados e opções de formatação.
   ============================================================ */
window.DT = window.DT || {};

DT.charts = (function () {
  const U = DT.utils;
  const PAD = { top: 12, right: 12, bottom: 26, left: 56 };

  // ---------- Caixa de informação (tooltip) compartilhada ----------
  let tipEl = null;
  function tip() {
    if (!tipEl) {
      tipEl = document.createElement('div');
      tipEl.className = 'chart-tip';
      document.body.appendChild(tipEl);
    }
    return tipEl;
  }
  function showTip(html, clientX, clientY) {
    const t = tip();
    t.innerHTML = html;
    t.classList.add('show');
    const r = t.getBoundingClientRect();
    let x = clientX + 14, y = clientY - r.height - 10;
    if (x + r.width > window.innerWidth - 8) x = clientX - r.width - 14;
    if (y < 8) y = clientY + 16;
    t.style.left = Math.max(8, x) + 'px';
    t.style.top = y + 'px';
  }
  function hideTip() { if (tipEl) tipEl.classList.remove('show'); }

  // ---------- Escalas ----------
  function niceTicks(min, max, count) {
    if (min === max) { min -= 1; max += 1; }
    const raw = (max - min) / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw);
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(10));
    return ticks;
  }
  const lin = (d0, d1, r0, r1) => v => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);

  function frame(el, height) {
    const w = Math.max(el.clientWidth, 260);
    return { w, h: height, iw: w - PAD.left - PAD.right, ih: height - PAD.top - PAD.bottom };
  }

  function yAxis(ticks, y, w, fmt) {
    return ticks.map(t =>
      '<line class="grid-line" x1="' + PAD.left + '" x2="' + (w - PAD.right) + '" y1="' + y(t) + '" y2="' + y(t) + '"/>' +
      '<text class="axis-text" x="' + (PAD.left - 8) + '" y="' + (y(t) + 3) + '" text-anchor="end">' + fmt(t) + '</text>'
    ).join('');
  }

  function empty(el, msg) { el.innerHTML = '<div class="chart-empty">' + (msg || 'Sem trades fechados para mostrar.') + '</div>'; }

  // ---------- Linha com área (curva de capital, drawdown) ----------
  function area(el, pts, opts) {
    opts = opts || {};
    if (!pts || pts.length < 2) return empty(el);
    const f = frame(el, opts.height || 240);
    const xs = pts.map(p => U.toDate(p.date).getTime());
    const vals = pts.map(p => p.value);
    let lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if (opts.includeZero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
    const ticks = niceTicks(lo, hi, 4);
    const x = lin(xs[0], xs[xs.length - 1], PAD.left, PAD.left + f.iw);
    const y = lin(ticks[0], ticks[ticks.length - 1], PAD.top + f.ih, PAD.top);
    const base = opts.includeZero ? y(0) : PAD.top + f.ih;
    const cls = opts.tone === 'loss' ? 'line-loss' : 'line-main';
    const color = opts.tone === 'loss' ? 'var(--loss)' : 'var(--accent)';
    const gid = 'g' + Math.random().toString(36).slice(2, 8);

    const line = pts.map((p, i) => (i ? 'L' : 'M') + x(xs[i]).toFixed(1) + ',' + y(p.value).toFixed(1)).join('');
    const fill = line + 'L' + x(xs[xs.length - 1]).toFixed(1) + ',' + base + 'L' + x(xs[0]).toFixed(1) + ',' + base + 'Z';

    // rótulos do eixo X: até 5 datas
    const nx = Math.min(5, pts.length, Math.max(2, Math.floor(f.iw / 80)));
    let xl = '';
    for (let i = 0; i < nx; i++) {
      const idx = Math.round(i * (pts.length - 1) / (nx - 1 || 1));
      const anchor = i === 0 ? 'start' : i === nx - 1 ? 'end' : 'middle';
      xl += '<text class="axis-text" x="' + x(xs[idx]) + '" y="' + (f.h - 6) + '" text-anchor="' + anchor + '">' + U.fmtDate(pts[idx].date) + '</text>';
    }

    el.innerHTML =
      '<svg viewBox="0 0 ' + f.w + ' ' + f.h + '" height="' + f.h + '">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + color + '" stop-opacity="' + (opts.tone === 'loss' ? 0.05 : 0.28) + '"/>' +
      '<stop offset="100%" stop-color="' + color + '" stop-opacity="' + (opts.tone === 'loss' ? 0.28 : 0) + '"/>' +
      '</linearGradient></defs>' +
      yAxis(ticks, y, f.w, opts.fmtY || String) +
      (opts.includeZero ? '<line class="zero-line" x1="' + PAD.left + '" x2="' + (f.w - PAD.right) + '" y1="' + y(0) + '" y2="' + y(0) + '"/>' : '') +
      '<path d="' + fill + '" fill="url(#' + gid + ')"/>' +
      '<path class="' + cls + '" d="' + line + '"/>' +
      xl +
      '<line class="cross-line" y1="' + PAD.top + '" y2="' + (PAD.top + f.ih) + '" style="display:none"/>' +
      '<circle class="cross-dot" r="4.5" style="display:none' + (opts.tone === 'loss' ? ';fill:var(--loss)' : '') + '"/>' +
      '<rect class="hit" x="' + PAD.left + '" y="' + PAD.top + '" width="' + f.iw + '" height="' + f.ih + '" fill="transparent"/>' +
      '</svg>';

    // hover: linha vertical + ponto + caixa de informação
    const svg = el.querySelector('svg');
    const cl = svg.querySelector('.cross-line'), cd = svg.querySelector('.cross-dot');
    function move(ev) {
      const pt = ev.touches ? ev.touches[0] : ev;
      const rect = svg.getBoundingClientRect();
      const mx = (pt.clientX - rect.left) * (f.w / rect.width);
      let best = 0;
      xs.forEach((v, i) => { if (Math.abs(x(v) - mx) < Math.abs(x(xs[best]) - mx)) best = i; });
      const px = x(xs[best]), py = y(pts[best].value);
      cl.setAttribute('x1', px); cl.setAttribute('x2', px); cl.style.display = '';
      cd.setAttribute('cx', px); cd.setAttribute('cy', py); cd.style.display = '';
      showTip(opts.tip ? opts.tip(pts[best]) : String(pts[best].value), pt.clientX, pt.clientY);
    }
    function leave() { cl.style.display = 'none'; cd.style.display = 'none'; hideTip(); }
    const hit = svg.querySelector('.hit');
    hit.addEventListener('mousemove', move);
    hit.addEventListener('touchstart', move, { passive: true });
    hit.addEventListener('touchmove', move, { passive: true });
    hit.addEventListener('mouseleave', leave);
    hit.addEventListener('touchend', leave);
  }

  // ---------- Barras verticais positivas/negativas (resultado mensal, histograma) ----------
  function bars(el, items, opts) {
    opts = opts || {};
    if (!items || !items.length) return empty(el);
    const f = frame(el, opts.height || 220);
    const vals = items.map(i => i.value);
    const ticks = niceTicks(Math.min(0, Math.min.apply(null, vals)), Math.max(0, Math.max.apply(null, vals)), 4);
    const y = lin(ticks[0], ticks[ticks.length - 1], PAD.top + f.ih, PAD.top);
    const slot = f.iw / items.length;
    const gap = slot > 8 ? 2 : 1;
    const bw = Math.max(1, Math.min(slot - gap, 48));
    const every = Math.ceil(items.length / Math.max(1, Math.floor(f.iw / 56)));   // rótulos sem sobrepor

    let marks = '', labels = '';
    items.forEach((it, i) => {
      const cx = PAD.left + slot * i + slot / 2;
      const y0 = y(0), y1 = y(it.value);
      const top = Math.min(y0, y1), h = Math.max(Math.abs(y1 - y0), it.value ? 1 : 0);
      const tone = opts.toneOf ? opts.toneOf(it) : (it.value >= 0 ? 'gain' : 'loss');
      const r = Math.min(4, bw / 2, h);
      marks += '<rect class="bar-hit" data-i="' + i + '" x="' + (cx - slot / 2) + '" y="' + PAD.top + '" width="' + slot + '" height="' + f.ih + '"/>' +
        '<path class="bar-' + tone + '" d="' + roundedBar(cx - bw / 2, top, bw, h, r, it.value >= 0) + '"/>';
      if (i % every === 0) labels += '<text class="axis-text" x="' + cx + '" y="' + (f.h - 6) + '" text-anchor="middle">' + U.esc(it.label) + '</text>';
    });

    el.innerHTML = '<svg viewBox="0 0 ' + f.w + ' ' + f.h + '" height="' + f.h + '">' +
      yAxis(ticks, y, f.w, opts.fmtY || String) +
      marks +
      '<line class="zero-line" x1="' + PAD.left + '" x2="' + (f.w - PAD.right) + '" y1="' + y(0) + '" y2="' + y(0) + '"/>' +
      labels + '</svg>';

    el.querySelectorAll('.bar-hit').forEach(r => {
      const it = items[+r.dataset.i];
      const show = ev => { const p = ev.touches ? ev.touches[0] : ev; showTip(opts.tip ? opts.tip(it) : it.label + ': ' + it.value, p.clientX, p.clientY); };
      r.addEventListener('mousemove', show);
      r.addEventListener('touchstart', show, { passive: true });
      r.addEventListener('mouseleave', hideTip);
      r.addEventListener('touchend', hideTip);
    });
  }

  // barra com cantos arredondados só na ponta (longe do zero)
  function roundedBar(x, y, w, h, r, up) {
    if (h <= 0) return '';
    if (up) return 'M' + x + ',' + (y + h) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y +
      'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h) + 'Z';
    return 'M' + x + ',' + y + 'V' + (y + h - r) + 'Q' + x + ',' + (y + h) + ' ' + (x + r) + ',' + (y + h) +
      'H' + (x + w - r) + 'Q' + (x + w) + ',' + (y + h) + ' ' + (x + w) + ',' + (y + h - r) + 'V' + y + 'Z';
  }

  // ---------- Barras horizontais (resultado por estratégia / ativo) ----------
  function hbars(el, items, opts) {
    opts = opts || {};
    if (!items || !items.length) return empty(el);
    const rowH = 30, labelW = Math.min(150, Math.max(70, el.clientWidth * 0.3));
    const w = Math.max(el.clientWidth, 260), h = items.length * rowH + 8;
    const vals = items.map(i => i.value);
    const lo = Math.min(0, Math.min.apply(null, vals)), hi = Math.max(0, Math.max.apply(null, vals));
    const x = lin(lo, hi, labelW + 8, w - 72);
    let out = '';
    items.forEach((it, i) => {
      const cy = 4 + i * rowH + rowH / 2;
      const x0 = x(0), x1 = x(it.value);
      const left = Math.min(x0, x1), bw = Math.max(Math.abs(x1 - x0), 1);
      out += '<rect class="bar-hit" data-i="' + i + '" x="0" y="' + (cy - rowH / 2) + '" width="' + w + '" height="' + rowH + '"/>' +
        '<rect class="bar-' + (it.value >= 0 ? 'gain' : 'loss') + '" x="' + left + '" y="' + (cy - 7) + '" width="' + bw + '" height="14" rx="3"/>' +
        '<text class="axis-text" x="' + labelW + '" y="' + (cy + 4) + '" text-anchor="end" style="font-size:11px;fill:var(--text)">' + U.esc(trim(it.label, 22)) + '</text>' +
        '<text class="axis-text" x="' + (it.value >= 0 ? x1 + 6 : x0 + 6) + '" y="' + (cy + 4) + '">' + (opts.fmt ? opts.fmt(it.value) : it.value) + '</text>';
    });
    el.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" height="' + h + '">' +
      '<line class="zero-line" x1="' + x(0) + '" x2="' + x(0) + '" y1="0" y2="' + h + '"/>' + out + '</svg>';
    el.querySelectorAll('.bar-hit').forEach(r => {
      const it = items[+r.dataset.i];
      r.addEventListener('mousemove', ev => showTip(opts.tip ? opts.tip(it) : it.label, ev.clientX, ev.clientY));
      r.addEventListener('mouseleave', hideTip);
    });
  }

  function trim(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  window.addEventListener('scroll', hideTip, { passive: true });

  return { area, bars, hbars, hideTip };
})();
