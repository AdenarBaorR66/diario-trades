/* ============================================================
   TELA: VISÃO GERAL — KPIs, curva de capital, drawdown,
   resultado mensal, distribuição, posições abertas e métricas
   ============================================================ */
window.DT = window.DT || {};
DT.views = DT.views || {};

DT.views.overview = (function () {
  const U = DT.utils;

  function render(root, ctx) {
    const s = ctx.s, cfg = ctx.cfg, M = v => U.money(v, cfg.moeda);

    root.innerHTML =
      // Linha 1: KPIs principais
      '<div class="row-grid-4">' +
        kpi('Resultado líquido', '<span class="' + U.signClass(s.resultado) + '">' + U.money(s.resultado, cfg.moeda, { sign: true, compact: true }) + '</span>',
            U.pct(s.retorno, { sign: true }) + ' sobre ' + U.money(cfg.capital, cfg.moeda, { compact: true })) +
        kpi('Taxa de acerto', U.pct(s.acerto), s.ganhos + ' ganhos · ' + s.perdas + ' perdas') +
        kpi('Payoff', U.num(s.payoff, 2), 'ganho médio ÷ perda média') +
        kpi('Expectativa', '<span class="' + U.signClass(s.expectativa) + '">' + U.money(s.expectativa, cfg.moeda, { sign: true }) + '</span>', 'média esperada por trade') +
      '</div>' +
      '<div class="row-grid-4">' +
        kpi('Fator de lucro', U.num(s.fatorLucro, 2), 'soma dos ganhos ÷ soma das perdas') +
        kpi('Drawdown máximo', '<span class="' + (s.drawdownMax < 0 ? 'neg' : '') + '">' + U.pct(s.drawdownMax) + '</span>', 'maior queda a partir de um topo') +
        kpi('Índice de Sharpe', U.num(s.sharpe, 2), 'anualizado, taxa livre de risco ' + U.pct(cfg.rf)) +
        kpi('Trades', s.n + (s.abertos ? ' <span class="muted" style="font-size:0.9rem">+ ' + s.abertos + ' aberto' + (s.abertos > 1 ? 's' : '') + '</span>' : ''),
            'duração média ' + U.num(s.mediaDias, 1) + ' dias') +
      '</div>' +

      // Linha 2: curva de capital + posições abertas
      '<div class="row-split-2-1">' +
        '<div class="card"><div class="card-header"><div><div class="card-title">Curva de capital</div>' +
          '<div class="card-sub">Patrimônio após cada trade fechado</div></div>' +
          '<div class="card-sub">Atual: <b class="' + U.signClass(s.resultado) + '">' + M(s.patrimonio) + '</b></div></div>' +
          '<div class="chart" id="ch-equity"></div></div>' +
        '<div class="card"><div class="card-header"><div class="card-title">Posições abertas</div>' +
          '<div class="card-sub">' + M(s.capitalExposto) + ' exposto</div></div>' + openList(s.open, cfg) + '</div>' +
      '</div>' +

      // Linha 3: drawdown + resultado mensal
      '<div class="row-split-1-1">' +
        '<div class="card"><div class="card-header"><div class="card-title">Drawdown</div>' +
          '<div class="card-sub">Queda do patrimônio a partir do topo anterior</div></div><div class="chart" id="ch-dd"></div></div>' +
        '<div class="card"><div class="card-header"><div class="card-title">Resultado por mês</div>' +
          '<div class="card-sub">Soma dos trades fechados no mês</div></div><div class="chart" id="ch-month"></div></div>' +
      '</div>' +

      // Linha 4: distribuição + mais métricas
      '<div class="row-split-1-1">' +
        '<div class="card"><div class="card-header"><div class="card-title">Distribuição dos resultados</div>' +
          '<div class="card-sub">Quantidade de trades por faixa de resultado (%)</div></div><div class="chart" id="ch-dist"></div></div>' +
        '<div class="card"><div class="card-header"><div class="card-title">Mais métricas</div></div>' + moreMetrics(s, cfg) + '</div>' +
      '</div>';

    // Gráficos
    DT.charts.area(root.querySelector('#ch-equity'), s.equity, {
      height: 260,
      fmtY: v => U.money(v, '', { compact: true }),
      tip: p => '<b>' + M(p.value) + '</b><br>' + U.fmtDate(p.date) +
        (p.trade ? '<br>' + U.esc(p.trade.ativo) + ' · ' + U.esc(p.trade.estrategia) +
          '<br><span class="' + U.signClass(p.trade.resultado) + '">' + U.money(p.trade.resultado, cfg.moeda, { sign: true }) + '</span>' : '<br>Capital inicial')
    });
    DT.charts.area(root.querySelector('#ch-dd'), s.drawdownSerie, {
      height: 200, tone: 'loss', includeZero: true,
      fmtY: v => U.pct(v, { dec: 0 }),
      tip: p => '<b>' + U.pct(p.value) + '</b><br>' + U.fmtDate(p.date)
    });
    DT.charts.bars(root.querySelector('#ch-month'), DT.metrics.monthly(s.closed), {
      height: 200,
      fmtY: v => U.money(v, '', { compact: true }),
      tip: it => '<b>' + it.label + '</b><br><span class="' + U.signClass(it.value) + '">' + U.money(it.value, cfg.moeda, { sign: true }) + '</span>'
    });
    const bins = DT.metrics.distribution(s.closed).map(b => ({
      label: U.pct(b.from, { dec: b.to - b.from < 0.01 ? 1 : 0 }), value: b.count, bin: b, from: b.from, to: b.to
    }));
    const faixa = b => b.openLow ? 'abaixo de ' + U.pct(b.to) : b.openHigh ? 'a partir de ' + U.pct(b.from) : 'de ' + U.pct(b.from) + ' a ' + U.pct(b.to);
    DT.charts.bars(root.querySelector('#ch-dist'), bins, {
      height: 200,
      fmtY: v => U.num(v),
      toneOf: it => (it.from >= 0 ? 'gain' : 'loss'),
      tip: it => '<b>' + it.value + ' trade' + (it.value === 1 ? '' : 's') + '</b><br>' + faixa(it.bin)
    });
  }

  // ---------- Pedaços da tela ----------
  function kpi(label, value, note) {
    return '<div class="card kpi"><div class="kpi-label">' + label + '</div>' +
      '<div class="kpi-val num">' + value + '</div><div class="kpi-note">' + note + '</div></div>';
  }

  function openList(open, cfg) {
    if (!open.length) return '<div class="chart-empty">Nenhuma posição aberta.</div>';
    return '<div class="table-wrap"><table class="table"><thead><tr>' +
      '<th>Ativo</th><th class="r">Entrada</th><th class="r">Stop</th><th class="r">Alvo</th><th class="r">Dias</th></tr></thead><tbody>' +
      open.map(t => '<tr title="' + U.esc(t.estrategia) + '"><td>' + U.esc(t.ativo) +
        ' <span class="badge ' + (t.lado > 0 ? 'badge-buy' : 'badge-sell') + '">' + (t.lado > 0 ? 'C' : 'V') + '</span></td>' +
        '<td class="r">' + U.price(t.precoEntrada) + '</td><td class="r">' + U.price(t.stop) + '</td>' +
        '<td class="r">' + U.price(t.alvo) + '</td><td class="r">' + t.diasAberto + '</td></tr>').join('') +
      '</tbody></table></div>';
  }

  function moreMetrics(s, cfg) {
    const M = v => U.money(v, cfg.moeda);
    const rows = [
      ['Média de ganho', '<span class="pos">' + M(s.mediaGanho) + '</span>'],
      ['Média de perda', '<span class="neg">' + M(s.mediaPerda) + '</span>'],
      ['Maior ganho', '<span class="pos">' + M(s.maiorGanho) + '</span>'],
      ['Maior perda', '<span class="neg">' + M(s.maiorPerda) + '</span>'],
      ['Resultado médio por trade', U.pct(s.mediaPct, { sign: true, dec: 2 })],
      ['Resultado médio em R', s.mediaR == null ? '— (sem stop)' : U.num(s.mediaR, 2) + ' R'],
      ['Critério de Kelly', U.pct(s.kelly)],
      ['Maior sequência de ganhos', s.maxSeqGanhos],
      ['Maior sequência de perdas', s.maxSeqPerdas],
      ['Custos pagos', M(s.custos)],
      ['Risco das posições abertas', M(s.riscoAberto)],
      ['Patrimônio atual', M(s.patrimonio)]
    ];
    return '<div class="metric-list">' + rows.map(r => '<div class="metric-row"><span>' + r[0] + '</span><span class="num">' + r[1] + '</span></div>').join('') + '</div>';
  }

  return { render };
})();
