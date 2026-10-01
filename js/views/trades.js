/* ============================================================
   TELA: TRADES — tabela com todos os trades, busca e ordenação
   ============================================================ */
window.DT = window.DT || {};
DT.views = DT.views || {};

DT.views.trades = (function () {
  const U = DT.utils;
  let sort = { key: 'dataEntrada', dir: -1 };
  let query = '';

  // Colunas da tabela: [chave, título, alinhado à direita?, formatação]
  function columns(cfg) {
    return [
      ['n', 'Nº', true, t => t.n == null ? '' : t.n],
      ['ativo', 'Ativo', false, t => '<b>' + U.esc(t.ativo) + '</b>'],
      ['estrategia', 'Estratégia', false, t => U.esc(t.estrategia)],
      ['tempo', 'Tempo', false, t => U.esc(t.tempo)],
      ['confirmacao', 'Confirmação', false, t => U.esc(t.confirmacao)],
      ['lado', 'Lado', false, t => '<span class="badge ' + (t.lado > 0 ? 'badge-buy' : 'badge-sell') + '">' + (t.lado > 0 ? 'Compra' : 'Venda') + '</span>'],
      ['dataEntrada', 'Entrada', false, t => U.fmtDate(t.dataEntrada)],
      ['qtd', 'Qtd', true, t => U.qty(t.qtd)],
      ['precoEntrada', 'Preço entrada', true, t => U.price(t.precoEntrada)],
      ['stop', 'Stop', true, t => U.price(t.stop)],
      ['alvo', 'Alvo', true, t => U.price(t.alvo)],
      ['precoSaida', 'Preço médio saída', true, t => U.price(t.precoSaida)],
      ['dataSaida', 'Saída', false, t => U.fmtDate(t.dataSaida)],
      ['dias', 'Dias', true, t => t.dias == null ? '—' : t.dias],
      ['resultado', 'Resultado', true, t => '<span class="' + U.signClass(t.resultado) + '">' + U.money(t.resultado, cfg.moeda, { sign: true }) + '</span>'],
      ['resultadoPct', '%', true, t => '<span class="' + U.signClass(t.resultadoPct) + '">' + U.pct(t.resultadoPct, { sign: true, dec: 2 }) + '</span>'],
      ['R', 'R', true, t => t.R == null ? '—' : U.num(t.R, 2)],
      ['status', 'Status', false, t => '<span class="badge ' + (t.status === 'Aberto' ? 'badge-open' : 'badge-closed') + '">' + t.status + '</span>'],
      ['obs', 'Observações', false, t => U.esc(t.obs)]
    ];
  }

  function render(root, ctx) {
    root.innerHTML =
      '<div class="card"><div class="card-header"><div><div class="card-title">Todos os trades</div>' +
      '<div class="card-sub" id="tr-count"></div></div>' +
      '<input class="search" id="tr-search" type="search" placeholder="Buscar ativo, estratégia, observação" value="' + U.esc(query) + '"/></div>' +
      '<div class="table-wrap" id="tr-table"></div></div>';

    const input = root.querySelector('#tr-search');
    input.addEventListener('input', () => { query = input.value; draw(root, ctx); });
    draw(root, ctx);
  }

  function draw(root, ctx) {
    const cols = columns(ctx.cfg);
    const q = U.normalize(query);
    const rows = ctx.trades
      .filter(t => !q || U.normalize(t.ativo + ' ' + t.combinacao + ' ' + t.obs).indexOf(q) >= 0)
      .slice()
      .sort((a, b) => {
        const va = a[sort.key], vb = b[sort.key];
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
      });

    root.querySelector('#tr-count').textContent = rows.length + ' trade' + (rows.length === 1 ? '' : 's') + ' · toque no título da coluna para ordenar';
    root.querySelector('#tr-table').innerHTML = rows.length
      ? '<table class="table"><thead><tr>' +
        cols.map(c => '<th data-k="' + c[0] + '" class="' + (c[2] ? 'r ' : '') + (sort.key === c[0] ? 'sorted' : '') + '">' +
          c[1] + (sort.key === c[0] ? (sort.dir > 0 ? ' ↑' : ' ↓') : '') + '</th>').join('') +
        '</tr></thead><tbody>' +
        rows.map(t => '<tr>' + cols.map(c => '<td class="' + (c[2] ? 'r' : '') + (c[0] === 'obs' ? ' obs' : '') + '">' + c[3](t) + '</td>').join('') + '</tr>').join('') +
        '</tbody></table>'
      : '<div class="chart-empty">Nenhum trade encontrado.</div>';

    root.querySelectorAll('th[data-k]').forEach(th => th.addEventListener('click', () => {
      const k = th.dataset.k;
      sort = sort.key === k ? { key: k, dir: -sort.dir } : { key: k, dir: -1 };
      draw(root, ctx);
    }));
  }

  return { render };
})();
