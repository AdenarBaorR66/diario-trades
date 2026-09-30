/* ============================================================
   METRICS — todos os cálculos (sem nada de tela aqui)
   Mesmas definições do notebook de backtest do IFR2.
   ============================================================ */
window.DT = window.DT || {};

DT.metrics = (function () {
  const U = DT.utils;

  // ---------- 1. Completa cada trade com os campos calculados ----------
  function enrich(t, cfg) {
    const qtdSaida = t.saidas.reduce((s, x) => s + x.q, 0);
    const valorSaida = t.saidas.reduce((s, x) => s + x.q * x.p, 0);
    const fechado = !!t.dataSaida && qtdSaida > 0;
    const financeiro = t.qtd * t.precoEntrada;
    const risco = t.stop ? Math.abs(t.precoEntrada - t.stop) * t.qtd : null;
    const resultado = fechado ? t.lado * (valorSaida - qtdSaida * t.precoEntrada) - t.custos : null;
    const base = qtdSaida * t.precoEntrada;
    let dias = null;
    if (fechado) dias = cfg.diasUteis ? U.businessDaysBetween(t.dataEntrada, t.dataSaida) : U.daysBetween(t.dataEntrada, t.dataSaida);
    return Object.assign({}, t, {
      status: fechado ? 'Fechado' : 'Aberto',
      qtdSaida,
      precoSaida: qtdSaida ? valorSaida / qtdSaida : null,
      financeiro,
      risco,
      resultado,
      resultadoPct: fechado && base ? resultado / base : null,
      R: fechado && risco ? resultado / (risco * qtdSaida / t.qtd) : null,
      dias,
      diasAberto: fechado ? null : (cfg.diasUteis ? U.businessDaysBetween(t.dataEntrada, U.today()) : U.daysBetween(t.dataEntrada, U.today()))
    });
  }

  // ---------- 2. Filtros (estratégia, ativo, período) ----------
  function periodStart(id) {
    const t = U.today();
    if (id === 'ytd') return t.slice(0, 4) + '-01-01';
    if (id === '12m') return U.addDays(t, -365);
    if (id === '3m') return U.addDays(t, -91);
    return null;
  }

  function applyFilters(trades, f) {
    const start = periodStart(f.periodo);
    return trades.filter(t =>
      (!f.estrategia || t.estrategia === f.estrategia) &&
      (!f.ativo || t.ativo === f.ativo) &&
      (!start || t.dataEntrada >= start));
  }

  // ---------- 3. Resumo estatístico ----------
  function closedSorted(trades) {
    return trades.filter(t => t.status === 'Fechado')
      .sort((a, b) => (a.dataSaida < b.dataSaida ? -1 : a.dataSaida > b.dataSaida ? 1 : a.dataEntrada < b.dataEntrada ? -1 : 1));
  }

  function summary(trades, cfg) {
    const closed = closedSorted(trades);
    const open = trades.filter(t => t.status === 'Aberto');
    const n = closed.length;
    const gains = closed.filter(t => t.resultado > 0);
    const losses = closed.filter(t => t.resultado <= 0);
    const sum = arr => arr.reduce((s, t) => s + t.resultado, 0);
    const somaGanhos = sum(gains), somaPerdas = sum(losses);
    const mediaGanho = gains.length ? somaGanhos / gains.length : 0;
    const mediaPerda = losses.length ? somaPerdas / losses.length : 0;
    const acerto = n ? gains.length / n : null;
    const payoff = mediaPerda ? mediaGanho / Math.abs(mediaPerda) : (gains.length ? Infinity : null);
    const resultado = somaGanhos + somaPerdas;
    const withR = closed.filter(t => t.R != null);

    const equity = equityCurve(closed, cfg.capital);
    const dd = drawdown(equity);
    const streak = streaks(closed);

    return {
      n, abertos: open.length,
      ganhos: gains.length, perdas: losses.length,
      acerto,
      resultado,
      retorno: cfg.capital ? resultado / cfg.capital : null,
      patrimonio: cfg.capital + resultado,
      mediaGanho, mediaPerda,
      maiorGanho: n ? Math.max.apply(null, closed.map(t => t.resultado)) : null,
      maiorPerda: n ? Math.min.apply(null, closed.map(t => t.resultado)) : null,
      payoff,
      expectativa: n ? acerto * mediaGanho + (1 - acerto) * mediaPerda : null,
      fatorLucro: somaPerdas ? somaGanhos / Math.abs(somaPerdas) : (somaGanhos ? Infinity : null),
      kelly: acerto != null && payoff && isFinite(payoff) ? acerto - (1 - acerto) / payoff : null,
      mediaDias: n ? closed.reduce((s, t) => s + (t.dias || 0), 0) / n : null,
      mediaPct: n ? closed.reduce((s, t) => s + (t.resultadoPct || 0), 0) / n : null,
      mediaR: withR.length ? withR.reduce((s, t) => s + t.R, 0) / withR.length : null,
      comStop: withR.length,
      drawdownMax: dd.max,
      drawdownSerie: dd.serie,
      sharpe: sharpe(trades, closed, cfg),
      maxSeqGanhos: streak.win, maxSeqPerdas: streak.loss,
      capitalExposto: open.reduce((s, t) => s + t.financeiro, 0),
      riscoAberto: open.reduce((s, t) => s + (t.risco || 0), 0),
      custos: closed.reduce((s, t) => s + (t.custos || 0), 0),
      equity,
      closed, open
    };
  }

  // Patrimônio depois de cada trade fechado (capital inicial + resultados)
  function equityCurve(closed, capital) {
    if (!closed.length) return [];
    const pts = [{ date: closed[0].dataEntrada, value: capital, trade: null }];
    let eq = capital;
    closed.forEach(t => { eq += t.resultado; pts.push({ date: t.dataSaida, value: eq, trade: t }); });
    return pts;
  }

  // Maior queda do patrimônio a partir do topo anterior
  function drawdown(equity) {
    let peak = -Infinity, max = 0;
    const serie = equity.map(p => {
      peak = Math.max(peak, p.value);
      const d = peak > 0 ? p.value / peak - 1 : 0;
      max = Math.min(max, d);
      return { date: p.date, value: d };
    });
    return { max: equity.length ? max : null, serie };
  }

  // Índice de Sharpe anualizado, a partir dos retornos diários do patrimônio
  function sharpe(all, closed, cfg) {
    if (closed.length < 2) return null;
    const first = all.reduce((m, t) => (t.dataEntrada < m ? t.dataEntrada : m), closed[0].dataEntrada);
    const last = closed[closed.length - 1].dataSaida;
    const pnlByDay = {};
    closed.forEach(t => { pnlByDay[t.dataSaida] = (pnlByDay[t.dataSaida] || 0) + t.resultado; });

    const rets = [];
    let eq = cfg.capital, d = first;
    while (d <= last) {
      if (!cfg.diasUteis || U.isWeekday(d) || pnlByDay[d]) {
        const prev = eq;
        eq += pnlByDay[d] || 0;
        if (d !== first && prev > 0) rets.push(eq / prev - 1);
      }
      d = U.addDays(d, 1);
    }
    if (rets.length < 2) return null;
    const rfDia = Math.pow(1 + (cfg.rf || 0), 1 / cfg.diasAno) - 1;
    const mean = rets.reduce((s, r) => s + r, 0) / rets.length - rfDia;
    const sd = Math.sqrt(rets.reduce((s, r) => s + Math.pow(r - mean - rfDia, 2), 0) / (rets.length - 1));
    return sd ? (mean / sd) * Math.sqrt(cfg.diasAno) : null;
  }

  function streaks(closed) {
    let w = 0, l = 0, win = 0, loss = 0;
    closed.forEach(t => {
      if (t.resultado > 0) { w++; l = 0; } else { l++; w = 0; }
      win = Math.max(win, w); loss = Math.max(loss, l);
    });
    return { win, loss };
  }

  // ---------- 4. Resultado por mês ----------
  function monthly(closed) {
    if (!closed.length) return [];
    const map = {};
    closed.forEach(t => { const k = t.dataSaida.slice(0, 7); map[k] = (map[k] || 0) + t.resultado; });
    const keys = Object.keys(map).sort();
    const out = [];
    let [y, m] = keys[0].split('-').map(Number);
    const [ly, lm] = keys[keys.length - 1].split('-').map(Number);
    while (y < ly || (y === ly && m <= lm)) {
      const k = y + '-' + String(m).padStart(2, '0');
      out.push({ key: k, label: U.fmtMonth(k), value: map[k] || 0 });
      m++; if (m > 12) { m = 1; y++; }
    }
    return out;
  }

  // ---------- 5. Distribuição dos resultados (%) ----------
  function distribution(closed) {
    const vals = closed.map(t => t.resultadoPct).filter(v => v != null);
    if (!vals.length) return [];
    // ignora os 2% mais extremos de cada lado para escolher a escala;
    // eles entram nas faixas das pontas ("até" / "acima de")
    const sorted = vals.slice().sort((a, b) => a - b);
    const q = p => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))))];
    const lo = sorted.length >= 20 ? q(0.02) : sorted[0];
    const hi = sorted.length >= 20 ? q(0.98) : sorted[sorted.length - 1];
    const span = Math.max(Math.abs(lo), Math.abs(hi)) || 0.01;
    const steps = [0.0025, 0.005, 0.01, 0.02, 0.025, 0.05, 0.1, 0.2, 0.25, 0.5, 1];
    const width = steps.find(s => span / s <= 8) || 1;   // no máximo ~8 faixas de cada lado
    const first = Math.floor(lo / width), last = Math.max(Math.ceil(hi / width), first + 1);
    const round = v => Math.round(v * 1e9) / 1e9;
    const bins = [];
    for (let k = first; k < last; k++) bins.push({ from: round(k * width), to: round((k + 1) * width), count: 0 });
    vals.forEach(v => {
      const i = Math.min(bins.length - 1, Math.max(0, Math.floor(round(v / width)) - first));
      bins[i].count++;
    });
    bins[0].openLow = sorted[0] < bins[0].from;
    bins[bins.length - 1].openHigh = sorted[sorted.length - 1] >= bins[bins.length - 1].to;
    return bins;
  }

  // ---------- 6. Agrupamento (por estratégia, por ativo...) ----------
  function groupBy(trades, key, cfg) {
    const groups = {};
    trades.forEach(t => { (groups[t[key]] = groups[t[key]] || []).push(t); });
    return Object.keys(groups).map(name => {
      const s = summary(groups[name], cfg);
      return {
        name, n: s.n, abertos: s.abertos, acerto: s.acerto, resultado: s.resultado,
        payoff: s.payoff, expectativa: s.expectativa, fatorLucro: s.fatorLucro,
        mediaDias: s.mediaDias, mediaPct: s.mediaPct, drawdownMax: s.drawdownMax
      };
    }).sort((a, b) => b.resultado - a.resultado);
  }

  return { enrich, applyFilters, summary, monthly, distribution, groupBy };
})();
