/* ============================================================
   TELAS: ESTRATÉGIAS e ATIVOS — resultados agrupados
   As duas telas usam o mesmo desenho; muda só o campo agrupado.
   ============================================================ */
window.DT = window.DT || {};
DT.views = DT.views || {};

(function () {
  const U = DT.utils;

  // modes: formas de agrupar a tela; com mais de uma, aparecem botões para trocar
  function makeView(modes) {
    let current = 0;
    return {
      render(root, ctx) {
        const cfg = ctx.cfg;
        const mode = modes[current];
        const field = mode.field, title = mode.title, singular = mode.singular;
        const rows = DT.metrics.groupBy(ctx.trades, field, cfg);
        const closedRows = rows.filter(r => r.n > 0);
        const switcher = modes.length < 2 ? '' :
          '<div class="pills">' + modes.map((m, i) =>
            '<button class="pill' + (i === current ? ' active' : '') + '" data-mode="' + i + '">' + m.label + '</button>').join('') + '</div>';

        root.innerHTML =
          '<div class="card"><div class="card-header"><div><div class="card-title">Resultado por ' + singular + '</div>' +
          '<div class="card-sub">Soma dos trades fechados</div></div>' + switcher + '</div><div class="chart" id="gr-chart"></div></div>' +
          '<div class="card"><div class="card-header"><div class="card-title">' + title + '</div>' +
          '<div class="card-sub">' + rows.length + ' no filtro atual</div></div>' + table(rows, cfg, singular) + '</div>';

        DT.charts.hbars(root.querySelector('#gr-chart'), closedRows.map(r => ({ label: r.name, value: r.resultado, row: r })), {
          fmt: v => U.money(v, '', { compact: true, sign: true }),
          tip: it => '<b>' + U.esc(it.label) + '</b><br>' + U.money(it.value, cfg.moeda, { sign: true }) +
            '<br>' + it.row.n + ' trades · acerto ' + U.pct(it.row.acerto)
        });
        root.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
          current = +b.dataset.mode;
          this.render(root, ctx);
        }));
      }
    };
  }

  function table(rows, cfg, singular) {
    if (!rows.length) return '<div class="chart-empty">Sem trades no filtro atual.</div>';
    const head = [singular[0].toUpperCase() + singular.slice(1), 'Trades', 'Abertos', 'Acerto', 'Resultado', 'Payoff', 'Expectativa', 'Fator de lucro', 'Média %', 'Dias médios', 'Drawdown'];
    return '<div class="table-wrap"><table class="table"><thead><tr>' +
      head.map((h, i) => '<th class="' + (i ? 'r' : '') + '" style="cursor:default">' + h + '</th>').join('') +
      '</tr></thead><tbody>' +
      rows.map(r => '<tr><td><b>' + U.esc(r.name) + '</b></td>' +
        '<td class="r">' + r.n + '</td><td class="r">' + (r.abertos || '') + '</td>' +
        '<td class="r">' + U.pct(r.acerto) + '</td>' +
        '<td class="r ' + U.signClass(r.resultado) + '">' + U.money(r.resultado, cfg.moeda, { sign: true }) + '</td>' +
        '<td class="r">' + U.num(r.payoff, 2) + '</td>' +
        '<td class="r ' + U.signClass(r.expectativa) + '">' + U.money(r.expectativa, cfg.moeda, { sign: true }) + '</td>' +
        '<td class="r">' + U.num(r.fatorLucro, 2) + '</td>' +
        '<td class="r ' + U.signClass(r.mediaPct) + '">' + U.pct(r.mediaPct, { sign: true, dec: 2 }) + '</td>' +
        '<td class="r">' + U.num(r.mediaDias, 1) + '</td>' +
        '<td class="r ' + (r.drawdownMax < 0 ? 'neg' : '') + '">' + U.pct(r.drawdownMax) + '</td></tr>').join('') +
      '</tbody></table></div>';
  }

  DT.views.strategies = makeView([
    { field: 'estrategia',  label: 'Estratégia',    title: 'Estratégias comparadas',       singular: 'estratégia' },
    { field: 'tempo',       label: 'Tempo gráfico', title: 'Tempos gráficos comparados',   singular: 'tempo gráfico' },
    { field: 'confirmacao', label: 'Confirmação',   title: 'Confirmações comparadas',      singular: 'confirmação' },
    { field: 'combinacao',  label: 'Combinação',    title: 'Combinações comparadas',       singular: 'combinação' }
  ]);
  DT.views.assets = makeView([
    { field: 'ativo', label: 'Ativo', title: 'Ativos comparados', singular: 'ativo' }
  ]);
})();
