/* ============================================================
   UTILS — formatação de números, datas e HTML
   ============================================================ */
window.DT = window.DT || {};

DT.utils = (function () {
  // ---------- Texto ----------
  function normalize(s) {
    return String(s == null ? '' : s)
      .replace(/[º°⁰]/g, 'o')
      .normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---------- Números ----------
  function toNumber(v) {
    if (v == null || v === '') return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    let s = String(v).replace(/[R$US\s%]/g, '');
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(s);
    return isFinite(n) ? n : null;
  }

  const nf = (min, max) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: min, maximumFractionDigits: max });
  const nf0 = nf(0, 0), nf2 = nf(2, 2), nf1 = nf(1, 1);

  function money(v, moeda, opts) {
    if (v == null || !isFinite(v)) return '—';
    const compact = opts && opts.compact && Math.abs(v) >= 10000;
    const body = compact ? compactNum(Math.abs(v)) : nf2.format(Math.abs(v));
    const sign = v < 0 ? '−' : (opts && opts.sign && v > 0 ? '+' : '');
    return sign + (moeda ? moeda + ' ' : '') + body;
  }

  function compactNum(v) {
    if (v >= 1e6) return nf1.format(v / 1e6) + 'M';
    if (v >= 1e3) return nf1.format(v / 1e3) + 'k';
    return nf0.format(v);
  }

  function pct(v, opts) {
    if (v == null || !isFinite(v)) return '—';
    const sign = v < 0 ? '−' : (opts && opts.sign && v > 0 ? '+' : '');
    return sign + nf(opts && opts.dec != null ? opts.dec : 1, opts && opts.dec != null ? opts.dec : 1).format(Math.abs(v * 100)) + '%';
  }

  function num(v, dec) {
    if (v === Infinity) return '∞';
    if (v == null || !isFinite(v)) return '—';
    const s = nf(dec || 0, dec || 0).format(Math.abs(v));
    return (v < 0 ? '−' : '') + s;
  }

  function qty(v) {
    if (v == null) return '—';
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 8 }).format(v);
  }

  function price(v) {
    if (v == null) return '—';
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: Math.abs(v) < 1 ? 8 : 2 }).format(v);
  }

  function signClass(v) { return v > 0 ? 'pos' : v < 0 ? 'neg' : ''; }

  // ---------- Datas (guardadas como texto 'AAAA-MM-DD') ----------
  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }

  function toDate(s) {           // 'AAAA-MM-DD' -> Date (meio-dia, sem problemas de fuso)
    if (!s) return null;
    const p = s.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2], 12);
  }
  function fromDate(d) { return iso(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
  function today() { return fromDate(new Date()); }

  function addDays(s, n) { const d = toDate(s); d.setDate(d.getDate() + n); return fromDate(d); }

  function daysBetween(a, b) { return Math.round((toDate(b) - toDate(a)) / 86400000); }

  function businessDaysBetween(a, b) {   // dias úteis entre a e b (sem contar a)
    let n = 0, d = toDate(a);
    const end = toDate(b);
    while (d < end) {
      d.setDate(d.getDate() + 1);
      const w = d.getDay();
      if (w !== 0 && w !== 6) n++;
    }
    return n;
  }

  function isWeekday(s) { const w = toDate(s).getDay(); return w !== 0 && w !== 6; }

  function fmtDate(s) {
    if (!s) return '—';
    const p = s.split('-');
    return p[2] + '/' + p[1] + '/' + p[0].slice(2);
  }

  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  function fmtMonth(ym) {             // 'AAAA-MM' -> 'mar/25'
    const p = ym.split('-');
    return MESES[+p[1] - 1] + '/' + p[0].slice(2);
  }

  return {
    normalize, esc, toNumber, money, pct, num, qty, price, signClass,
    iso, toDate, fromDate, today, addDays, daysBetween, businessDaysBetween, isWeekday,
    fmtDate, fmtMonth
  };
})();
