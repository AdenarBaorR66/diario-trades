/* ============================================================
   LOADER — lê a planilha Excel dentro do navegador
   Usa a biblioteca SheetJS (XLSX). O arquivo nunca sai do aparelho.
   Saída: { fileName, loadedAt, markets: {B3:{config,trades}, ...}, strategies, warnings }
   ============================================================ */
window.DT = window.DT || {};

DT.loader = (function () {
  const U = DT.utils;
  const C = DT.config;

  // ---------- Leitura do arquivo ----------
  function readFile(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        try { resolve(parseWorkbook(fr.result, file.name)); }
        catch (e) { reject(e); }
      };
      fr.onerror = () => reject(new Error('Não consegui abrir o arquivo.'));
      fr.readAsArrayBuffer(file);
    });
  }

  function parseWorkbook(buffer, fileName) {
    if (typeof XLSX === 'undefined') throw new Error('A biblioteca de leitura do Excel não carregou. Verifique a internet e recarregue a página.');
    const wb = XLSX.read(buffer, { type: 'array' });
    const out = {
      fileName: fileName || 'planilha.xlsx',
      loadedAt: new Date().toISOString(),
      markets: {},
      strategies: [],
      warnings: []
    };
    C.marketOrder.forEach(m => { out.markets[m] = { config: Object.assign({}, C.markets[m]), trades: [] }; });

    let legacySheets = 0;
    wb.SheetNames.forEach(name => {
      const key = U.normalize(name);
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: null });
      if (key === 'config') return readConfig(rows, out);
      if (key === 'setups' || key === 'tabelas') return readSetups(rows, out, key);
      if (C.ignoredSheets.indexOf(key) >= 0) return;

      const market = marketOfSheet(key);
      const trades = readTrades(rows, market, name, out.warnings);
      if (!trades) return;
      if (!isMarketName(key)) legacySheets++;
      out.markets[market].trades = out.markets[market].trades.concat(trades);
    });

    if (legacySheets) out.warnings.push(legacySheets + ' aba(s) com nome de ativo foram lidas como B3.');
    const total = C.marketOrder.reduce((s, m) => s + out.markets[m].trades.length, 0);
    if (!total) out.warnings.push('Nenhum trade encontrado. Confira se as abas se chamam B3, EUA ou CRIPTO e se os títulos das colunas não mudaram.');
    return out;
  }

  // ---------- Qual mercado é cada aba ----------
  function isMarketName(key) { return ['b3', 'eua', 'usa', 'cripto', 'crypto'].indexOf(key) >= 0; }
  function marketOfSheet(key) {
    if (key === 'eua' || key === 'usa') return 'EUA';
    if (key === 'cripto' || key === 'crypto') return 'CRIPTO';
    return 'B3';
  }

  // ---------- Aba Config ----------
  function readConfig(rows, out) {
    const h = rows.findIndex(r => r && r.some(c => U.normalize(c) === 'mercado'));
    if (h < 0) return;
    const head = rows[h].map(U.normalize);
    const col = name => head.findIndex(c => c.indexOf(name) === 0);
    const cM = col('mercado'), cMo = col('moeda'), cC = col('capital'), cR = col('taxa'), cD = col('dias');
    rows.slice(h + 1).forEach(r => {
      if (!r || r[cM] == null) return;
      const m = marketOfSheet(U.normalize(r[cM]));
      const cfg = out.markets[m].config;
      if (cMo >= 0 && r[cMo]) cfg.moeda = String(r[cMo]).trim();
      if (cC >= 0 && U.toNumber(r[cC]) != null) cfg.capital = U.toNumber(r[cC]);
      if (cR >= 0 && U.toNumber(r[cR]) != null) cfg.rf = U.toNumber(r[cR]) / 100;
      if (cD >= 0 && U.toNumber(r[cD])) cfg.diasAno = U.toNumber(r[cD]);
    });
  }

  // ---------- Aba Setups (lista de estratégias) ----------
  function readSetups(rows, out, key) {
    const list = [];
    if (key === 'setups') {
      rows.slice(1).forEach(r => { if (r && r[0]) list.push(String(r[0]).trim()); });
    } else {  // aba "Tabelas" da planilha antiga: nomes ao lado de números
      rows.forEach(r => (r || []).forEach((c, i) => {
        if (typeof c === 'string' && typeof r[i - 1] === 'number' && c.length > 2) list.push(c.trim());
      }));
    }
    list.forEach(s => { if (out.strategies.indexOf(s) < 0) out.strategies.push(s); });
  }

  // ---------- Abas de trades ----------
  function findHeader(rows) {
    const limit = Math.min(rows.length, C.headerScanRows);
    for (let i = 0; i < limit; i++) {
      const map = mapColumns(rows[i] || []);
      if (C.requiredColumns.every(k => map[k] != null)) return { index: i, map };
    }
    return null;
  }

  function mapColumns(row) {
    const map = {};
    row.forEach((cell, idx) => {
      const n = U.normalize(cell);
      if (!n) return;
      Object.keys(C.columns).forEach(key => {
        if (map[key] == null && C.columns[key].indexOf(n) >= 0) map[key] = idx;
      });
    });
    return map;
  }

  function readTrades(rows, market, sheetName, warnings) {
    const header = findHeader(rows);
    if (!header) return null;
    const m = header.map;
    const get = (r, k) => (m[k] == null ? null : r[m[k]]);
    const trades = [];
    const incompletas = [];

    rows.slice(header.index + 1).forEach((r, i) => {
      if (!r) return;
      const ativo = get(r, 'ativo');
      if (ativo == null || String(ativo).trim() === '') return;
      const dataEntrada = toISODate(get(r, 'dataEntrada'));
      const precoEntrada = U.toNumber(get(r, 'precoEntrada'));
      const qtd = U.toNumber(get(r, 'qtd'));
      if (!dataEntrada || !precoEntrada || !qtd) {
        // linha só com o ativo (sem nenhum dado) é ignorada em silêncio; linha pela metade gera aviso
        if (dataEntrada || precoEntrada || qtd) incompletas.push(header.index + i + 2);
        return;
      }
      const saidas = [1, 2, 3].map(n => ({
        q: U.toNumber(get(r, 'qtdSaida' + n)),
        p: U.toNumber(get(r, 'precoSaida' + n))
      })).filter(s => s.q > 0 && s.p > 0);

      trades.push({
        n: U.toNumber(get(r, 'id')),
        mercado: market,
        ativo: String(ativo).trim().toUpperCase(),
        dataEntrada,
        lado: parseSide(get(r, 'lado')),
        qtd,
        precoEntrada,
        stop: positiveOrNull(get(r, 'stop')),
        alvo: positiveOrNull(get(r, 'alvo')),
        estrategia: String(get(r, 'estrategia') || 'Sem estratégia').trim(),
        tempo: get(r, 'tempo') ? String(get(r, 'tempo')).trim() : '',
        confirmacao: get(r, 'confirmacao') ? String(get(r, 'confirmacao')).trim() : '',
        saidas,
        dataSaida: toISODate(get(r, 'dataSaida')),
        custos: U.toNumber(get(r, 'custos')) || 0,
        obs: get(r, 'obs') ? String(get(r, 'obs')).trim() : ''
      });
    });
    if (incompletas.length) warnings.push('Aba ' + sheetName + ': ' + incompletas.length + ' linha(s) sem data, quantidade ou preço de entrada foram ignoradas (linha ' + incompletas.slice(0, 5).join(', ') + (incompletas.length > 5 ? '...' : '') + ').');
    return trades;
  }

  // ---------- Conversões ----------
  function positiveOrNull(v) { const n = U.toNumber(v); return n > 0 ? n : null; }

  function parseSide(v) {
    const s = U.normalize(v);
    return ['venda', 'v', 'vendido', 'short', 'sell', '-1'].indexOf(s) >= 0 ? -1 : 1;
  }

  function toISODate(v) {
    if (v == null || v === '') return null;
    if (typeof v === 'number') {                       // data do Excel (número de série)
      const d = XLSX.SSF.parse_date_code(v);
      return d && d.y > 1900 ? U.iso(d.y, d.m, d.d) : null;
    }
    if (v instanceof Date) return U.fromDate(v);
    const s = String(v).trim();
    let m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/);   // dd/mm/aaaa
    if (m) return U.iso(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);                          // aaaa-mm-dd
    if (m) return U.iso(+m[1], +m[2], +m[3]);
    return null;
  }

  return { readFile, parseWorkbook };
})();
