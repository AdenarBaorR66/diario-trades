/* ============================================================
   TELA: COMO USAR — guia dentro do próprio dashboard
   ============================================================ */
window.DT = window.DT || {};
DT.views = DT.views || {};

DT.views.help = (function () {
  const HTML =
    '<div class="row-split-1-1 help">' +

    '<div class="card"><h3>1. Abrir o dashboard</h3><ol>' +
      '<li>Abra o link do dashboard em qualquer navegador, no celular ou no computador. Salve nos favoritos para achar rápido.</li>' +
      '<li>Toque em <b>Carregar planilha</b> e escolha o seu arquivo <code>Diario_de_Trades.xlsx</code> no Google Drive (no celular, o Drive aparece na tela de escolher arquivo).</li>' +
      '<li>O arquivo é lido dentro do seu navegador. Nada é enviado para servidor nenhum.</li>' +
      '<li>Este aparelho lembra a última planilha carregada. Na próxima visita os números já aparecem; carregue de novo só quando tiver trades novos.</li>' +
    '</ol></div>' +

    '<div class="card"><h3>2. Lançar um trade novo</h3><ol>' +
      '<li>Abra a planilha no Excel ou no Google Planilhas e vá na aba do mercado: <b>B3</b>, <b>EUA</b> ou <b>CRIPTO</b>.</li>' +
      '<li>Na primeira linha vazia, preencha Ativo, Data Entrada, Compra ou Venda, Qtd Entrada, Preço Entrada, Stop, Alvo, Estratégia, Tempo Gráfico e Confirmação.</li>' +
      '<li>Enquanto o trade estiver aberto, deixe Data Saída e as saídas em branco. Ele aparece em <b>Posições abertas</b>.</li>' +
      '<li>Ao sair, preencha Qtd e Preço da Saída 1 (e 2 e 3 se sair em partes), a Data Saída e os Custos.</li>' +
      '<li>Salve o arquivo no Drive e toque em <b>Carregar planilha</b> aqui.</li>' +
    '</ol></div>' +

    '<div class="card"><h3>3. Ajustes na planilha</h3><ul>' +
      '<li><b>Capital inicial, moeda e taxa livre de risco:</b> aba <code>Config</code>, uma linha por mercado.</li>' +
      '<li><b>Estratégias novas:</b> acrescente o nome na aba <code>Setups</code> (coluna A); ele entra na lista da coluna Estratégia.</li>' +
      '<li><b>Tempos gráficos e confirmações novos:</b> aba <code>Setups</code>, colunas D e E.</li>' +
      '<li>Não renomeie as abas nem os títulos das colunas: o dashboard encontra os dados pelos nomes.</li>' +
      '<li>O dashboard calcula sozinho financeiro, risco, resultado, % e dias. A planilha não precisa de fórmulas.</li>' +
    '</ul></div>' +

    '<div class="card"><h3>4. Como ler as métricas</h3><ul>' +
      '<li><b>Acerto:</b> % dos trades fechados com lucro.</li>' +
      '<li><b>Payoff:</b> ganho médio ÷ perda média.</li>' +
      '<li><b>Expectativa:</b> (acerto × ganho médio) − (erro × perda média). Quanto se espera ganhar, em média, por trade.</li>' +
      '<li><b>Fator de lucro:</b> soma dos ganhos ÷ soma das perdas. Acima de 1, a estratégia é lucrativa.</li>' +
      '<li><b>Drawdown máximo:</b> maior queda do patrimônio a partir de um topo anterior.</li>' +
      '<li><b>Sharpe:</b> retorno por unidade de oscilação do patrimônio, anualizado. Acima de 1 é bom; acima de 2, muito bom.</li>' +
      '<li><b>R:</b> resultado dividido pelo risco até o stop. Só aparece nos trades com stop preenchido.</li>' +
      '<li><b>Kelly:</b> fração do capital que maximiza o crescimento, pela fórmula de Kelly. Use como referência, não como regra.</li>' +
    '</ul></div>' +

    '<div class="card"><h3>5. Backup e privacidade</h3><ul>' +
      '<li>O único lugar onde seus trades ficam é a planilha no seu Drive. O Drive já guarda versões anteriores do arquivo.</li>' +
      '<li>O link do dashboard tem só o código da página, sem nenhum dado seu.</li>' +
      '<li>Para apagar os dados deste aparelho, use <b>Esquecer planilha</b> no rodapé do menu.</li>' +
    '</ul></div>' +

    '<div class="card"><h3>6. Filtros e mercados</h3><ul>' +
      '<li>Os botões <b>B3 · EUA · Cripto</b> no topo trocam de mercado. Cada um tem capital, moeda e números próprios.</li>' +
      '<li>Os filtros de estratégia, tempo, confirmação, ativo e período valem para todas as telas.</li>' +
      '<li>Na tela <b>Estratégias</b>, os botões no topo comparam por estratégia, por tempo gráfico, por confirmação ou pela combinação (ex.: 123 + Éden · Diário).</li>' +
      '<li>Para um intervalo exato (ex.: dia 1 ao 26), escolha <b>Período → Personalizado</b> e preencha <b>De</b> e <b>Até</b>. Vale a data de entrada do trade.</li>' +
      '<li>Toque em um gráfico para ver o valor exato de cada ponto ou barra.</li>' +
    '</ul></div>' +

    '</div>';

  return { render: root => { root.innerHTML = HTML; } };
})();
