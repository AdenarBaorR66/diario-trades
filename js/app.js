/* ============================================================
   APP — liga tudo: estado, menu, mercado, filtros e troca de telas
   Não tem cálculo nem desenho de gráfico aqui (ficam em metrics.js,
   charts.js e views/). Este arquivo só decide o que mostrar.
   ============================================================ */
window.DT = window.DT || {};

DT.app = (function () {
  const U = DT.utils, C = DT.config;

  const VIEWS = {
    overview:   { title: 'Visão Geral',  module: () => DT.views.overview },
    trades:     { title: 'Trades',       module: () => DT.views.trades },
    strategies: { title: 'Estratégias',  module: () => DT.views.strategies },
    assets:     { title: 'Ativos',       module: () => DT.views.assets },
    help:       { title: 'Como usar',    module: () => DT.views.help, noData: true }
  };

  const prefs = DT.storage.loadPrefs();
  const state = {
    data: DT.storage.loadData(),
    market: prefs.market || 'B3',
    view: VIEWS[prefs.view] ? prefs.view : 'overview',
    filters: { estrategia: '', ativo: '', periodo: 'all' }
  };

  const $ = sel => document.querySelector(sel);

  // ---------- Inicialização ----------
  function init() {
    // menu lateral
    document.querySelectorAll('.nav-item[data-view]').forEach(b =>
      b.addEventListener('click', () => { setView(b.dataset.view); closeMobileMenu(); }));
    $('#collapse-btn').addEventListener('click', () => {
      $('#sidebar').classList.toggle('collapsed');
      savePrefs();
      setTimeout(render, 320);
    });
    if (prefs.collapsed || window.innerWidth < 1200) $('#sidebar').classList.add('collapsed');
    $('#menu-btn').addEventListener('click', () => { $('#sidebar').classList.add('open'); $('#backdrop').classList.add('show'); });
    $('#backdrop').addEventListener('click', closeMobileMenu);

    // mercado
    document.querySelectorAll('#market-pills .pill').forEach(p =>
      p.addEventListener('click', () => { state.market = p.dataset.market; resetFilters(); savePrefs(); render(); }));

    // carregar planilha
    const input = $('#file-input');
    document.querySelectorAll('[data-action="load"]').forEach(b => b.addEventListener('click', () => input.click()));
    input.addEventListener('change', onFile);
    $('#forget-btn').addEventListener('click', forget);

    // filtros
    ['estrategia', 'ativo', 'periodo'].forEach(k =>
      $('#f-' + k).addEventListener('change', e => { state.filters[k] = e.target.value; render(); }));

    // redesenha os gráficos quando a tela muda de tamanho
    let t;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(render, 200); });

    render();
  }

  // ---------- Ações ----------
  function setView(v) { state.view = v; savePrefs(); render(); window.scrollTo(0, 0); }

  function closeMobileMenu() { $('#sidebar').classList.remove('open'); $('#backdrop').classList.remove('show'); }

  function resetFilters() { state.filters.estrategia = ''; state.filters.ativo = ''; }

  function savePrefs() {
    DT.storage.savePrefs({ market: state.market, view: state.view, collapsed: $('#sidebar').classList.contains('collapsed') });
  }

  function onFile(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    DT.loader.readFile(file).then(data => {
      state.data = data;
      resetFilters();
      if (!DT.storage.saveData(data)) data.warnings.push('Este navegador não deixou guardar a planilha; será preciso carregá-la de novo na próxima visita.');
      // abre no primeiro mercado que tem trades
      if (!data.markets[state.market].trades.length) {
        const m = C.marketOrder.find(k => data.markets[k].trades.length);
        if (m) state.market = m;
      }
      if (state.view === 'help') state.view = 'overview';
      savePrefs();
      render();
    }).catch(err => alert('Não consegui ler a planilha.\n\n' + err.message));
  }

  function loadDemo() {
    state.data = DT.demo.generate();
    resetFilters();
    if (state.view === 'help') state.view = 'overview';
    render();
  }

  function forget() {
    if (!confirm('Apagar deste aparelho a planilha carregada? O arquivo no seu Drive não é afetado.')) return;
    DT.storage.clearData();
    state.data = null;
    render();
  }

  // ---------- Desenho da página ----------
  function render() {
    DT.charts.hideTip();
    const view = VIEWS[state.view];
    const root = $('#view');
    const hasData = !!state.data;

    // menu ativo, título e mercado
    document.querySelectorAll('.nav-item[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === state.view));
    document.querySelectorAll('#market-pills .pill').forEach(p => p.classList.toggle('active', p.dataset.market === state.market));
    const mk = C.markets[state.market].label;
    $('#page-title').innerHTML = view.title + (view.noData ? '' : ' <span class="text-gradient">' + mk + '</span>');
    $('#market-pills').classList.toggle('hidden', !hasData || !!view.noData);
    renderFileInfo();

    if (!hasData && !view.noData) { $('#filters').classList.add('hidden'); $('#notices').innerHTML = ''; return renderEmpty(root); }

    if (view.noData) {
      $('#filters').classList.add('hidden');
      $('#notices').innerHTML = '';
      return view.module().render(root, {});
    }

    const market = state.data.markets[state.market];
    const cfg = Object.assign({}, C.markets[state.market], market.config);
    const all = market.trades.map(t => DT.metrics.enrich(t, cfg));
    renderFilters(all);
    renderNotices();

    if (!all.length) {
      $('#filters').classList.add('hidden');
      root.innerHTML = '<div class="card empty"><h2>Sem trades em ' + mk + '</h2>' +
        '<p>A planilha carregada não tem trades na aba ' + state.market + '. Escolha outro mercado no topo ou lance trades nessa aba.</p></div>';
      return;
    }

    const trades = DT.metrics.applyFilters(all, state.filters);
    const ctx = { market: state.market, cfg, trades, all, s: DT.metrics.summary(trades, cfg), data: state.data };
    view.module().render(root, ctx);
  }

  function renderFilters(all) {
    const f = state.filters;
    const uniq = key => Array.from(new Set(all.map(t => t[key]))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const opts = (list, sel, allLabel) => '<option value="">' + allLabel + '</option>' +
      list.map(v => '<option value="' + U.esc(v) + '"' + (v === sel ? ' selected' : '') + '>' + U.esc(v) + '</option>').join('');
    $('#f-estrategia').innerHTML = opts(uniq('estrategia'), f.estrategia, 'Todas');
    $('#f-ativo').innerHTML = opts(uniq('ativo'), f.ativo, 'Todos');
    $('#f-periodo').innerHTML = C.periods.map(p => '<option value="' + p.id + '"' + (p.id === f.periodo ? ' selected' : '') + '>' + p.label + '</option>').join('');
    $('#filters').classList.remove('hidden');
  }

  function renderNotices() {
    const d = state.data, box = $('#notices');
    let html = '';
    if (d.demo) html += '<div class="notice"><i class="fa-solid fa-flask"></i><span>Você está vendo <b>dados de exemplo</b>, inventados.</span>' +
      '<button class="btn" data-action="load"><i class="fa-solid fa-file-arrow-up"></i> Carregar minha planilha</button></div>';
    if (d.warnings && d.warnings.length) html += '<div class="notice warn"><i class="fa-solid fa-triangle-exclamation"></i><span>' +
      d.warnings.slice(0, 3).map(U.esc).join('<br>') + (d.warnings.length > 3 ? '<br>… e mais ' + (d.warnings.length - 3) + ' aviso(s).' : '') + '</span></div>';
    box.innerHTML = html;
    box.querySelectorAll('[data-action="load"]').forEach(b => b.addEventListener('click', () => $('#file-input').click()));
  }

  function renderFileInfo() {
    const d = state.data;
    $('#file-name').textContent = d ? d.fileName : 'Nenhuma planilha';
    $('#file-date').textContent = d ? (d.demo ? 'exemplo' : 'carregada em ' + U.fmtDate(U.fromDate(new Date(d.loadedAt)))) : 'toque em Carregar';
    $('#forget-btn').classList.toggle('hidden', !d || d.demo);
  }

  function renderEmpty(root) {
    root.innerHTML =
      '<div class="card empty">' +
      '<h2>Carregue sua <span class="text-gradient">planilha de trades</span></h2>' +
      '<p>Escolha o arquivo Excel onde você registra seus trades. Ele é lido aqui mesmo, no seu navegador, e não é enviado para lugar nenhum.</p>' +
      '<div class="empty-actions">' +
        '<button class="btn btn-primary" data-action="load"><i class="fa-solid fa-file-arrow-up"></i> Carregar planilha</button>' +
        '<a class="btn" href="modelo/Diario_de_Trades.xlsx" download><i class="fa-solid fa-download"></i> Baixar planilha modelo</a>' +
        '<button class="btn" id="demo-btn"><i class="fa-solid fa-flask"></i> Ver com dados de exemplo</button>' +
      '</div></div>';
    root.querySelector('[data-action="load"]').addEventListener('click', () => $('#file-input').click());
    root.querySelector('#demo-btn').addEventListener('click', loadDemo);
  }

  document.addEventListener('DOMContentLoaded', init);
  return { state, render };
})();
