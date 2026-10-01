# Diário de Trades

Dashboard para acompanhar os trades lançados numa planilha Excel, com as mesmas métricas do backtest do IFR2 (acerto, payoff, expectativa, fator de lucro, drawdown, Sharpe e outras), separadas por mercado: B3, EUA e Cripto.

**Privacidade:** a página tem só o código. A planilha é lida dentro do navegador de quem abre e não é enviada para nenhum servidor. O navegador guarda uma cópia local da última planilha carregada, só naquele aparelho.

## Como abrir

1. Abra o link do dashboard (GitHub Pages) em qualquer navegador, no celular ou no computador.
2. Toque em **Carregar planilha** e escolha o `Diario_de_Trades.xlsx` no Google Drive.
3. Na próxima visita, o mesmo aparelho já abre com os últimos números. Carregue de novo quando tiver trades novos.

No computador também dá para abrir sem internet de hospedagem: baixe a pasta e dê dois cliques em `index.html` (precisa de internet só para as fontes e a biblioteca de leitura do Excel).

## Como lançar trades

1. Abra `Diario_de_Trades.xlsx` (Excel ou Google Planilhas).
2. Use a aba do mercado: `B3`, `EUA` ou `CRIPTO`. Uma linha por trade.
3. Preencha os dados de entrada, estratégia, tempo gráfico, confirmação e saídas. O dashboard calcula o resto.
4. Trade aberto: deixe `Data Saída` e as saídas em branco.
5. Salve no Drive e carregue no dashboard.

Capital inicial, moeda e taxa livre de risco ficam na aba `Config`. As listas de estratégias, tempos gráficos e confirmações ficam na aba `Setups` (colunas A, D e E).

A planilha antiga (`BACKTEST_IFR2.xlsx`, uma aba por ativo) também é aceita: as abas com nome de ativo são lidas como B3.

## Publicar no GitHub Pages

1. Crie o repositório `diario-trades` (público) no GitHub.
2. Envie todos os arquivos desta pasta para a raiz do repositório.
3. Em **Settings → Pages**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`, e salve.
4. O link fica `https://SEU-USUARIO.github.io/diario-trades/`.

## Organização do código

Cada assunto vive num arquivo próprio. Mexer num deles não afeta os outros.

| Arquivo | O que faz |
|---|---|
| `index.html` | Esqueleto da página: menu, topo, filtros e a área onde as telas aparecem |
| `css/tokens.css` | Cores, fontes e medidas (o design system) |
| `css/base.css` | Reset e tipografia |
| `css/layout.css` | Menu lateral, topo, grades e versão celular |
| `css/components.css` | Botões, cards, KPIs, tabelas, avisos |
| `css/charts.css` | Estilo dos gráficos |
| `js/config.js` | Mercados, valores padrão e nomes aceitos para as colunas |
| `js/utils.js` | Formatação de números e datas |
| `js/storage.js` | Guarda a última planilha neste navegador |
| `js/loader.js` | Lê a planilha Excel |
| `js/metrics.js` | Todos os cálculos (sem nada de tela) |
| `js/charts.js` | Gráficos em SVG |
| `js/demo.js` | Dados de exemplo inventados |
| `js/views/overview.js` | Tela Visão Geral |
| `js/views/trades.js` | Tela Trades |
| `js/views/groups.js` | Telas Estratégias e Ativos |
| `js/views/help.js` | Tela Como usar |
| `js/app.js` | Liga tudo: menu, mercado, filtros e troca de telas |
| `modelo/Diario_de_Trades.xlsx` | Planilha modelo vazia |
