/* ============================================================
   CONFIG — mercados, nomes de colunas e ajustes gerais
   Único lugar para mudar valores padrão do dashboard.
   ============================================================ */
window.DT = window.DT || {};

DT.config = {
  // Valores padrão de cada mercado. A aba "Config" da planilha substitui estes.
  markets: {
    B3:     { label: 'B3',     moeda: 'R$',  capital: 25000, rf: 0, diasAno: 252, diasUteis: true },
    EUA:    { label: 'EUA',    moeda: 'US$', capital: 5000,  rf: 0, diasAno: 252, diasUteis: true },
    CRIPTO: { label: 'Cripto', moeda: 'US$', capital: 5000,  rf: 0, diasAno: 365, diasUteis: false }
  },
  marketOrder: ['B3', 'EUA', 'CRIPTO'],

  // Abas da planilha que não contêm trades
  ignoredSheets: ['como usar', 'config', 'setups', 'tabelas'],

  // Nomes aceitos para cada coluna (já normalizados: minúsculas, sem acento).
  // Aceita o modelo novo e a planilha antiga (BACKTEST_IFR2).
  columns: {
    id:           ['no', 'n', 'numero', '#'],
    ativo:        ['ativo'],
    dataEntrada:  ['data entrada', 'data de entrada'],
    lado:         ['lado', 'compra ou venda'],
    qtd:          ['qtd entrada', 'quantidade de entrada', 'quantidade'],
    precoEntrada: ['preco entrada', 'preco de entrada'],
    stop:         ['stop'],
    alvo:         ['alvo'],
    estrategia:   ['estrategia', 'setup'],
    qtdSaida1:    ['qtd saida 1', 'quantidade de saida 01', 'quantidade de saida 1'],
    precoSaida1:  ['preco saida 1', 'preco saida 01'],
    qtdSaida2:    ['qtd saida 2', 'quantidade de saida 02', 'quantidade de saida 2'],
    precoSaida2:  ['preco saida 2', 'preco saida 02'],
    qtdSaida3:    ['qtd saida 3', 'quantidade de saida 03', 'quantidade de saida 3'],
    precoSaida3:  ['preco saida 3', 'preco saida 03'],
    dataSaida:    ['data saida', 'data final de saida', 'data de saida'],
    custos:       ['custos', 'taxas', 'corretagem'],
    obs:          ['observacoes', 'obsevacoes', 'obs']
  },

  // Colunas obrigatórias para reconhecer uma tabela de trades
  requiredColumns: ['ativo', 'dataEntrada', 'precoEntrada'],
  headerScanRows: 40,

  // Opções do filtro de período
  periods: [
    { id: 'all', label: 'Tudo' },
    { id: 'ytd', label: 'Ano atual' },
    { id: '12m', label: '12 meses' },
    { id: '3m',  label: '3 meses' },
    { id: 'custom', label: 'Personalizado' }
  ],

  // Chave usada para lembrar a última planilha neste navegador
  storageKey: 'diario-trades:v1',
  prefsKey: 'diario-trades:prefs'
};
