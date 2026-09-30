/* ============================================================
   DEMO — dados de exemplo inventados, só para conhecer o dashboard
   Não tem relação com trades reais.
   ============================================================ */
window.DT = window.DT || {};

DT.demo = (function () {
  const U = DT.utils;

  // gerador aleatório com semente fixa (sempre o mesmo exemplo)
  function rng(seed) {
    return function () {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
  }

  const SETS = {
    B3: { ativos: ['PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'WEGE3', 'EQTL3'], preco: [38, 62, 33, 28, 45, 31], lote: 100, n: 70 },
    EUA: { ativos: ['AAPL', 'MSFT', 'NVDA', 'SPY', 'QQQ'], preco: [190, 410, 120, 520, 450], lote: 1, n: 45 },
    CRIPTO: { ativos: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'], preco: [62000, 3200, 150], lote: 0.0001, n: 35 }
  };
  const ESTRATEGIAS = [['IFR2', 0.70, 0.022, 0.035], ['Pivot', 0.48, 0.045, 0.025], ['Romp. Cong. Clássica', 0.42, 0.06, 0.028]];

  function generate() {
    const out = { fileName: 'Dados de exemplo', loadedAt: new Date().toISOString(), demo: true, markets: {}, strategies: ESTRATEGIAS.map(e => e[0]), warnings: [] };
    DT.config.marketOrder.forEach((m, mi) => {
      const cfg = Object.assign({}, DT.config.markets[m]);
      const set = SETS[m], rand = rng(42 + mi);
      const trades = [];
      let d = U.addDays(U.today(), -Math.round(set.n * 6.5));
      for (let i = 0; i < set.n; i++) {
        d = U.addDays(d, 2 + Math.floor(rand() * 8));
        const a = Math.floor(rand() * set.ativos.length);
        const e = ESTRATEGIAS[Math.floor(rand() * ESTRATEGIAS.length)];
        const pe = set.preco[a] * (0.85 + rand() * 0.3);
        const qtd = Math.max(set.lote, Math.floor((cfg.capital * 0.9 / pe) / set.lote) * set.lote);
        const win = rand() < e[1];
        const move = (win ? 1 : -1) * (0.3 + rand()) * (win ? e[2] : e[3]);
        const dias = 1 + Math.floor(rand() * 6);
        const aberto = i >= set.n - 2;
        const saida = U.addDays(d, dias + Math.floor(dias / 5) * 2);
        const stop = +(pe * (1 - e[3] * 1.4)).toFixed(2);
        trades.push({
          n: i + 1, mercado: m, ativo: set.ativos[a], dataEntrada: d, lado: 1, qtd: +qtd.toFixed(4),
          precoEntrada: +pe.toFixed(2), stop, alvo: +(pe * (1 + e[2] * 1.2)).toFixed(2), estrategia: e[0],
          saidas: aberto ? [] : [{ q: +qtd.toFixed(4), p: +(pe * (1 + move)).toFixed(2) }],
          dataSaida: aberto ? null : saida,
          custos: m === 'B3' ? 2.5 : 1, obs: ''
        });
        d = aberto ? d : saida;
      }
      // desloca as datas para que o exemplo termine perto de hoje
      const last = trades.reduce((mx, t) => (t.dataSaida && t.dataSaida > mx ? t.dataSaida : mx), trades[0].dataEntrada);
      const shift = U.daysBetween(last, U.addDays(U.today(), -3));
      trades.forEach(t => {
        t.dataEntrada = U.addDays(t.dataEntrada, shift);
        if (t.dataSaida) t.dataSaida = U.addDays(t.dataSaida, shift);
      });
      trades.slice(-2).forEach((t, k) => { t.dataEntrada = U.addDays(U.today(), -(4 - k * 2)); });
      out.markets[m] = { config: cfg, trades };
    });
    return out;
  }

  return { generate };
})();
