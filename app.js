(function () {
  "use strict";

  // ===== CONFIGURAÇÃO =====
  const STORAGE_KEY = "personal_finance_v1";
  const THEME_KEY = "finance_theme";

  const CATEGORIAS = {
    receita: ["Salário", "Freelance", "Investimentos", "Prémios", "Outros"],
    despesa: [
      "Alimentação",
      "Transporte",
      "Habitação",
      "Saúde",
      "Lazer",
      "Educação",
      "Outros",
    ],
    investimento: [
      "Ações",
      "Fundos",
      "Imobiliário",
      "Cripto",
      "Poupança",
      "Outros",
    ],
  };

  // ===== ESTADO =====
  let transacoes = [];
  let editandoId = null;
  let filtros = { tipo: "", categoria: "", dataInicio: "", dataFim: "" };
  let ordenacao = "data-desc";

  // ===== ELEMENTOS DOM =====
  const elements = {
    addBtn: document.getElementById("addTransactionBtn"),
    menuBtn: document.getElementById("menuBtn"),
    filterBtn: document.getElementById("filterBtn"),
    themeToggle: document.getElementById("themeToggle"),
    modal: document.getElementById("transactionModal"),
    menuModal: document.getElementById("menuModal"),
    closeModal: document.getElementById("closeModal"),
    closeMenuModal: document.getElementById("closeMenuModal"),
    form: document.getElementById("transactionForm"),
    list: document.getElementById("transactionList"),
    filtersPanel: document.getElementById("filtersPanel"),
    toast: document.getElementById("toast"),
    totalReceitas: document.getElementById("totalReceitas"),
    totalDespesas: document.getElementById("totalDespesas"),
    totalInvestimentos: document.getElementById("totalInvestimentos"),
    saldo: document.getElementById("saldo"),
    monthSelector: document.getElementById("monthSelector"),
    monthlyResume: document.getElementById("monthlyResume"),
    chartContainer: document.getElementById("chartContainer"),
  };

  // ===== INICIALIZAÇÃO =====
  function init() {
    carregarTransacoes();
    configurarEventos();
    aplicarTema();
    definirDataAtual();
    definirMesAtual();
    popularCategorias();
    popularFiltrosCategorias();
    renderizar();
  }

  // ===== STORAGE =====
  function salvarTransacoes() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transacoes));
    } catch (e) {
      mostrarToast("Erro ao guardar dados", "error");
    }
  }

  function carregarTransacoes() {
    try {
      const dados = localStorage.getItem(STORAGE_KEY);
      if (dados) {
        transacoes = JSON.parse(dados);
      } else {
        inicializarDadosExemplo();
      }
    } catch (e) {
      mostrarToast("Erro ao carregar dados", "error");
      inicializarDadosExemplo();
    }
  }

  function inicializarDadosExemplo() {
    const hoje = new Date();
    transacoes = [
      {
        id: gerarId(),
        tipo: "receita",
        titulo: "Salário Mensal",
        valor: 2500,
        categoria: "Salário",
        data: new Date(hoje.getFullYear(), hoje.getMonth(), 1)
          .toISOString()
          .split("T")[0],
        nota: "Pagamento do mês",
      },
      {
        id: gerarId(),
        tipo: "despesa",
        titulo: "Supermercado",
        valor: 150.5,
        categoria: "Alimentação",
        data: new Date(hoje.getFullYear(), hoje.getMonth(), 5)
          .toISOString()
          .split("T")[0],
        nota: "Compras mensais",
      },
      {
        id: gerarId(),
        tipo: "despesa",
        titulo: "Renda",
        valor: 800,
        categoria: "Habitação",
        data: new Date(hoje.getFullYear(), hoje.getMonth(), 1)
          .toISOString()
          .split("T")[0],
        nota: "Renda do apartamento",
      },
      {
        id: gerarId(),
        tipo: "investimento",
        titulo: "Fundo de Índice",
        valor: 500,
        categoria: "Fundos",
        data: new Date(hoje.getFullYear(), hoje.getMonth(), 10)
          .toISOString()
          .split("T")[0],
        nota: "Investimento mensal",
      },
      {
        id: gerarId(),
        tipo: "receita",
        titulo: "Freelance Website",
        valor: 750,
        categoria: "Freelance",
        data: new Date(hoje.getFullYear(), hoje.getMonth(), 15)
          .toISOString()
          .split("T")[0],
        nota: "Projeto cliente XYZ",
      },
      {
        id: gerarId(),
        tipo: "despesa",
        titulo: "Combustível",
        valor: 60,
        categoria: "Transporte",
        data: new Date(hoje.getFullYear(), hoje.getMonth(), 12)
          .toISOString()
          .split("T")[0],
        nota: "",
      },
      {
        id: gerarId(),
        tipo: "despesa",
        titulo: "Cinema",
        valor: 25,
        categoria: "Lazer",
        data: new Date(hoje.getFullYear(), hoje.getMonth(), 18)
          .toISOString()
          .split("T")[0],
        nota: "Bilhetes para filme",
      },
      {
        id: gerarId(),
        tipo: "investimento",
        titulo: "Poupança Emergência",
        valor: 300,
        categoria: "Poupança",
        data: new Date(hoje.getFullYear(), hoje.getMonth(), 2)
          .toISOString()
          .split("T")[0],
        nota: "Fundo de emergência",
      },
    ];
    salvarTransacoes();
  }

  // ===== EVENTOS =====
  function configurarEventos() {
    elements.addBtn.addEventListener("click", abrirModalNovo);
    elements.menuBtn.addEventListener("click", () =>
      elements.menuModal.classList.add("active")
    );
    elements.closeModal.addEventListener("click", fecharModal);
    elements.closeMenuModal.addEventListener("click", () =>
      elements.menuModal.classList.remove("active")
    );
    elements.form.addEventListener("submit", salvarTransacao);
    document.getElementById("cancelBtn").addEventListener("click", fecharModal);
    document
      .getElementById("tipo")
      .addEventListener("change", atualizarCategorias);
    elements.filterBtn.addEventListener("click", toggleFiltros);
    document
      .getElementById("clearFilters")
      .addEventListener("click", limparFiltros);
    document
      .getElementById("filterTipo")
      .addEventListener("change", aplicarFiltros);
    document
      .getElementById("filterCategoria")
      .addEventListener("change", aplicarFiltros);
    document
      .getElementById("filterDataInicio")
      .addEventListener("change", aplicarFiltros);
    document
      .getElementById("filterDataFim")
      .addEventListener("change", aplicarFiltros);
    document.getElementById("sortBy").addEventListener("change", (e) => {
      ordenacao = e.target.value;
      renderizar();
    });
    elements.monthSelector.addEventListener("change", atualizarResumoMensal);
    document.getElementById("exportBtn").addEventListener("click", exportarCSV);
    document
      .getElementById("importBtn")
      .addEventListener("click", () =>
        document.getElementById("importFile").click()
      );
    document
      .getElementById("importFile")
      .addEventListener("change", importarCSV);
    document.getElementById("resetBtn").addEventListener("click", resetarDados);
    elements.themeToggle.addEventListener("click", alternarTema);

    // Fechar modal ao clicar fora
    elements.modal.addEventListener("click", (e) => {
      if (e.target === elements.modal) fecharModal();
    });
    elements.menuModal.addEventListener("click", (e) => {
      if (e.target === elements.menuModal)
        elements.menuModal.classList.remove("active");
    });
  }

  // ===== MODAL =====
  function abrirModalNovo() {
    editandoId = null;
    document.getElementById("modalTitle").textContent = "Nova Transação";
    elements.form.reset();
    definirDataAtual();
    elements.modal.classList.add("active");
  }

  function abrirModalEditar(id) {
    const transacao = transacoes.find((t) => t.id === id);
    if (!transacao) return;

    editandoId = id;
    document.getElementById("modalTitle").textContent = "Editar Transação";
    document.getElementById("tipo").value = transacao.tipo;
    atualizarCategorias();
    document.getElementById("titulo").value = transacao.titulo;
    document.getElementById("valor").value = transacao.valor;
    document.getElementById("categoria").value = transacao.categoria;
    document.getElementById("data").value = transacao.data;
    document.getElementById("nota").value = transacao.nota || "";
    elements.modal.classList.add("active");
  }

  function fecharModal() {
    elements.modal.classList.remove("active");
    elements.form.reset();
    editandoId = null;
  }

  // ===== TRANSAÇÕES =====
  function salvarTransacao(e) {
    e.preventDefault();

    const dados = {
      tipo: document.getElementById("tipo").value,
      titulo: document.getElementById("titulo").value.trim(),
      valor: parseFloat(document.getElementById("valor").value),
      categoria: document.getElementById("categoria").value,
      data: document.getElementById("data").value,
      nota: document.getElementById("nota").value.trim(),
    };

    if (dados.valor <= 0) {
      mostrarToast("Valor deve ser maior que zero", "error");
      return;
    }

    if (editandoId) {
      const index = transacoes.findIndex((t) => t.id === editandoId);
      transacoes[index] = { ...transacoes[index], ...dados };
      mostrarToast("Transação atualizada!");
    } else {
      transacoes.push({ id: gerarId(), ...dados });
      mostrarToast("Transação adicionada!");
    }

    salvarTransacoes();
    fecharModal();
    renderizar();
  }

  function removerTransacao(id) {
    if (!confirm("Deseja realmente remover esta transação?")) return;

    transacoes = transacoes.filter((t) => t.id !== id);
    salvarTransacoes();
    renderizar();
    mostrarToast("Transação removida!");
  }

  // ===== FILTROS E ORDENAÇÃO =====
  function toggleFiltros() {
    elements.filtersPanel.classList.toggle("hidden");
  }

  function aplicarFiltros() {
    filtros.tipo = document.getElementById("filterTipo").value;
    filtros.categoria = document.getElementById("filterCategoria").value;
    filtros.dataInicio = document.getElementById("filterDataInicio").value;
    filtros.dataFim = document.getElementById("filterDataFim").value;
    renderizar();
  }

  function limparFiltros() {
    filtros = { tipo: "", categoria: "", dataInicio: "", dataFim: "" };
    document.getElementById("filterTipo").value = "";
    document.getElementById("filterCategoria").value = "";
    document.getElementById("filterDataInicio").value = "";
    document.getElementById("filterDataFim").value = "";
    renderizar();
  }

  function filtrarTransacoes() {
    return transacoes.filter((t) => {
      if (filtros.tipo && t.tipo !== filtros.tipo) return false;
      if (filtros.categoria && t.categoria !== filtros.categoria) return false;
      if (filtros.dataInicio && t.data < filtros.dataInicio) return false;
      if (filtros.dataFim && t.data > filtros.dataFim) return false;
      return true;
    });
  }

  function ordenarTransacoes(lista) {
    const [campo, direcao] = ordenacao.split("-");
    return [...lista].sort((a, b) => {
      let valorA = campo === "data" ? a.data : a.valor;
      let valorB = campo === "data" ? b.data : b.valor;

      if (direcao === "asc") {
        return valorA > valorB ? 1 : -1;
      } else {
        return valorA < valorB ? 1 : -1;
      }
    });
  }

  // ===== RENDERIZAÇÃO =====
  function renderizar() {
    renderizarTransacoes();
    atualizarResumo();
    atualizarResumoMensal();
    atualizarGrafico();
  }

  function renderizarTransacoes() {
    const filtradas = filtrarTransacoes();
    const ordenadas = ordenarTransacoes(filtradas);

    if (ordenadas.length === 0) {
      elements.list.innerHTML =
        '<div class="empty-state">Nenhuma transação encontrada</div>';
      return;
    }

    elements.list.innerHTML = ordenadas
      .map(
        (t) => `
                    <div class="transaction-item ${t.tipo}">
                        <div class="transaction-info">
                            <div class="transaction-title">${escapeHtml(
                              t.titulo
                            )}</div>
                            <div class="transaction-meta">
                                <span>${t.categoria}</span>
                                <span>${formatarData(t.data)}</span>
                                ${
                                  t.nota
                                    ? `<span title="${escapeHtml(
                                        t.nota
                                      )}">📝</span>`
                                    : ""
                                }
                            </div>
                        </div>
                        <div class="transaction-value ${
                          t.tipo
                        }">${formatarMoeda(t.valor)}</div>
                        <div class="transaction-actions">
                            <button class="btn btn-icon btn-secondary" onclick="app.editar('${
                              t.id
                            }')" title="Editar">✏️</button>
                            <button class="btn btn-icon btn-danger" onclick="app.remover('${
                              t.id
                            }')" title="Remover">🗑️</button>
                        </div>
                    </div>
                `
      )
      .join("");
  }

  function atualizarResumo() {
    const filtradas = filtrarTransacoes();

    const receitas = filtradas
      .filter((t) => t.tipo === "receita")
      .reduce((sum, t) => sum + t.valor, 0);
    const despesas = filtradas
      .filter((t) => t.tipo === "despesa")
      .reduce((sum, t) => sum + t.valor, 0);
    const investimentos = filtradas
      .filter((t) => t.tipo === "investimento")
      .reduce((sum, t) => sum + t.valor, 0);
    const saldo = receitas - despesas;

    elements.totalReceitas.textContent = formatarMoeda(receitas);
    elements.totalDespesas.textContent = formatarMoeda(despesas);
    elements.totalInvestimentos.textContent = formatarMoeda(investimentos);
    elements.saldo.textContent = formatarMoeda(saldo);
  }

  function atualizarResumoMensal() {
    const mes = elements.monthSelector.value;
    if (!mes) return;

    const [ano, mesNum] = mes.split("-");
    const transacoesMes = transacoes.filter((t) => {
      const [anoT, mesT] = t.data.split("-");
      return anoT === ano && mesT === mesNum;
    });

    const receitas = transacoesMes
      .filter((t) => t.tipo === "receita")
      .reduce((sum, t) => sum + t.valor, 0);
    const despesas = transacoesMes
      .filter((t) => t.tipo === "despesa")
      .reduce((sum, t) => sum + t.valor, 0);
    const investimentos = transacoesMes
      .filter((t) => t.tipo === "investimento")
      .reduce((sum, t) => sum + t.valor, 0);

    elements.monthlyResume.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div>
                            <div style="font-size: 0.875rem; color: var(--text-secondary);">Receitas</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--success-color);">
                                ${formatarMoeda(receitas)}
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; color: var(--text-secondary);">Despesas</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--danger-color);">
                                ${formatarMoeda(despesas)}
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; color: var(--text-secondary);">Investimentos</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--warning-color);">
                                ${formatarMoeda(investimentos)}
                            </div>
                        </div>
                        <div style="border-top: 1px solid var(--border-color); padding-top: 12px;">
                            <div style="font-size: 0.875rem; color: var(--text-secondary);">Saldo</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--primary-color);">
                                ${formatarMoeda(receitas - despesas)}
                            </div>
                        </div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">
                            ${transacoesMes.length} transações
                        </div>
                    </div>
                `;
  }

  function atualizarGrafico() {
    const filtradas = filtrarTransacoes();
    const porCategoria = {};

    filtradas.forEach((t) => {
      if (!porCategoria[t.categoria]) {
        porCategoria[t.categoria] = 0;
      }
      porCategoria[t.categoria] += t.valor;
    });

    const categorias = Object.entries(porCategoria)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (categorias.length === 0) {
      elements.chartContainer.innerHTML =
        '<div style="margin: auto; color: var(--text-secondary);">Sem dados</div>';
      return;
    }

    const max = Math.max(...categorias.map((c) => c[1]));

    elements.chartContainer.innerHTML = categorias
      .map(([cat, valor]) => {
        const altura = (valor / max) * 100;
        return `
                        <div class="chart-bar" style="height: ${altura}%;" title="${cat}: ${formatarMoeda(
          valor
        )}">
                            <div class="chart-label">${cat}</div>
                        </div>
                    `;
      })
      .join("");
  }

  // ===== CATEGORIAS =====
  function popularCategorias() {
    const select = document.getElementById("categoria");
    select.innerHTML = '<option value="">Selecione</option>';
  }

  function atualizarCategorias() {
    const tipo = document.getElementById("tipo").value;
    const select = document.getElementById("categoria");

    if (!tipo) {
      select.innerHTML = '<option value="">Selecione o tipo primeiro</option>';
      return;
    }

    select.innerHTML =
      '<option value="">Selecione</option>' +
      CATEGORIAS[tipo]
        .map((cat) => `<option value="${cat}">${cat}</option>`)
        .join("");
  }

  function popularFiltrosCategorias() {
    const select = document.getElementById("filterCategoria");
    const todasCategorias = [
      ...new Set([
        ...CATEGORIAS.receita,
        ...CATEGORIAS.despesa,
        ...CATEGORIAS.investimento,
      ]),
    ];
    select.innerHTML =
      '<option value="">Todas</option>' +
      todasCategorias
        .map((cat) => `<option value="${cat}">${cat}</option>`)
        .join("");
  }

  // ===== IMPORT/EXPORT =====
  function exportarCSV() {
    const csv = [
      ["Tipo", "Título", "Valor", "Categoria", "Data", "Nota"].join(";"),
      ...transacoes.map((t) =>
        [t.tipo, t.titulo, t.valor, t.categoria, t.data, t.nota || ""].join(";")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `financas_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    mostrarToast("Dados exportados!");
    elements.menuModal.classList.remove("active");
  }

  function importarCSV(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const linhas = event.target.result.split("\n").filter((l) => l.trim());
        const dados = linhas.slice(1).map((linha) => {
          const [tipo, titulo, valor, categoria, data, nota] = linha.split(";");
          return {
            id: gerarId(),
            tipo: tipo.trim(),
            titulo: titulo.trim(),
            valor: parseFloat(valor),
            categoria: categoria.trim(),
            data: data.trim(),
            nota: nota ? nota.trim() : "",
          };
        });

        const validos = dados.filter(
          (d) => d.tipo && d.titulo && d.valor > 0 && d.categoria && d.data
        );

        if (validos.length === 0) {
          mostrarToast("Nenhuma transação válida encontrada", "error");
          return;
        }

        if (
          confirm(
            `Importar ${validos.length} transações? Isto irá adicionar às existentes.`
          )
        ) {
          transacoes.push(...validos);
          salvarTransacoes();
          renderizar();
          mostrarToast(`${validos.length} transações importadas!`);
        }
      } catch (error) {
        mostrarToast("Erro ao importar CSV", "error");
      }
      elements.menuModal.classList.remove("active");
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  function resetarDados() {
    if (!confirm("ATENÇÃO: Isto irá apagar todos os dados. Confirma?")) return;
    if (!confirm("Tem a certeza absoluta? Esta ação não pode ser revertida!"))
      return;

    localStorage.removeItem(STORAGE_KEY);
    transacoes = [];
    inicializarDadosExemplo();
    renderizar();
    mostrarToast("Dados resetados!");
    elements.menuModal.classList.remove("active");
  }

  // ===== TEMA =====
  function aplicarTema() {
    const tema = localStorage.getItem(THEME_KEY) || "light";
    document.documentElement.setAttribute("data-theme", tema);
  }

  function alternarTema() {
    const temaAtual =
      document.documentElement.getAttribute("data-theme") || "light";
    const novoTema = temaAtual === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", novoTema);
    localStorage.setItem(THEME_KEY, novoTema);
  }

  // ===== UTILITÁRIOS =====
  function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  function formatarMoeda(valor) {
    return new Intl.NumberFormat(navigator.language || "pt-PT", {
      style: "currency",
      currency: "AOA",
    }).format(valor);
  }

  function formatarData(dataISO) {
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function definirDataAtual() {
    const hoje = new Date().toISOString().split("T")[0];
    document.getElementById("data").value = hoje;
  }

  function definirMesAtual() {
    const hoje = new Date();
    const mes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    elements.monthSelector.value = mes;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function mostrarToast(mensagem, tipo = "success") {
    elements.toast.textContent = mensagem;
    elements.toast.className = `toast ${tipo} active`;
    setTimeout(() => {
      elements.toast.classList.remove("active");
    }, 3000);
  }

  // ===== API PÚBLICA =====
  window.app = {
    editar: abrirModalEditar,
    remover: removerTransacao,
  };

  // ===== INICIAR =====
  init();
})();
