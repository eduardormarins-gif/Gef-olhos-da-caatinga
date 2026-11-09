/* =====================================================================
   /js/config.js — CONFIGURAÇÕES DO GEOPORTAL OLHOS DA CAATINGA
   ---------------------------------------------------------------------
   ★ Este é o ÚNICO arquivo que a equipe precisa editar.
   Regras para editar sem quebrar o site:
     - Mude só o texto entre aspas "assim" ou os números.
     - Não apague vírgulas, chaves { } ou colchetes [ ].
     - Depois de salvar, recarregue a página no navegador (F5).
   ===================================================================== */

const CONFIG = {

  // Fase do projeto: 1 = consulta pública (3 propostas) | 2 = UC definitiva
  FASE: 1,

  // Textos do cabeçalho e da barra lateral
  TITULO: "Olhos da Caatinga",
  SUBTITULO: "Geoportal · Olho d'Água do Casado, Alagoas",
  CHAMADA_TITULO: "Consulta pública",
  CHAMADA_TEXTO:
    "Três áreas estão em estudo para virar uma Unidade de Conservação no município. " +
    "Veja onde cada uma fica, clique nelas para ver os detalhes e compare as propostas.",

  // Enquadramento inicial e limites de navegação
  CAMADA_ENQUADRAMENTO: "limite_municipal",
  CENTRO_RESERVA: [-9.43, -37.81],   // [latitude, longitude] usado se o arquivo falhar
  ZOOM_RESERVA: 11,
  ZOOM_MINIMO: 8,
  ZOOM_MAXIMO: 18,

  // Mapa base (satélite) e nomes de lugares por cima
  MAPA_BASE: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    atribuicao: "Imagem &copy; Esri, Maxar, Earthstar Geographics"
  },
  ROTULOS: {
    nome: "Nomes de lugares",
    ligada: true,
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    atribuicao: "Rótulos &copy; Esri"
  },

  // Sede urbana do município
  // Fonte: Prefeitura de Olho d'Água do Casado e SGB/CPRM — 9°30'03" S, 37°49'56" O
  SEDE: {
    nome: "Olho d'Água do Casado",
    descricao: "Sede urbana do município",
    coordenadas: [-9.500833, -37.832222]
  },

  // ------------------------------------------------------------------
  // FORMULÁRIO DE OPINIÃO (consulta pública)
  //   url        : endereço do formulário. Enquanto for o provisório abaixo,
  //                o botão mostra o aviso "formulário em preparação".
  //   parametro_proposta : (opcional) campo do Google Forms que recebe a proposta
  //                já marcada, ex.: "entry.123456789". Deixe "" se não usar.
  // ------------------------------------------------------------------
  FORMULARIO: {
    url: "https://forms.gle/FORMULARIO-EM-PREPARACAO",
    parametro_proposta: "",
    texto_botao: "Dê sua opinião",
    aviso_preparacao:
      "O formulário da consulta pública está em preparação e será publicado aqui em breve. " +
      "Enquanto isso, explore as propostas no mapa."
  },

  // Arquivos oferecidos para download (pasta /dados)
  DOWNLOADS: [
    { arquivo: "propostas_uc", nome: "Propostas de UC (A, B e C)" },
    { arquivo: "ucs_existentes", nome: "MONA do Rio São Francisco" },
    { arquivo: "assentamentos", nome: "Assentamentos do INCRA" },
    { arquivo: "localidades", nome: "Localidades rurais" },
    { arquivo: "limite_municipal", nome: "Limite municipal" }
  ],

  // Nomes dos estados escritos no mapa [latitude, longitude]
  ROTULOS_ESTADOS: [
    { nome: "SERGIPE", posicao: [-9.66, -37.80] },
    { nome: "BAHIA", posicao: [-9.38, -38.28] },
    { nome: "PERNAMBUCO", posicao: [-9.05, -38.00] }
  ],

  // Instituições (rodapé e cabeçalho)
  INSTITUICOES: [
    { papel: "Elaboração", nome: "IBAM — Instituto Brasileiro de Administração Municipal", logo: "img/logo-ibam.png", site: "https://www.ibam.org.br" },
    { papel: "Financiamento", nome: "FUNBIO — Fundo Brasileiro para a Biodiversidade", logo: "img/logo-funbio.jpg", site: "https://www.funbio.org.br" }
  ],

  // ------------------------------------------------------------------
  // GRUPOS DE CAMADAS (barra lateral). Dentro de cada grupo, a primeira
  // camada da lista aparece em cima na legenda e por cima no mapa.
  //   arquivo   : nome do arquivo em /dados, sem extensão
  //   filtro    : mostra só as feições com esse valor  { campo: valor }
  //   nome / descricao : textos da barra lateral
  //   ligada    : true = aparece ao abrir
  //   cor, espessura, tracejado ("6 4" ou null): borda
  //   preenchimento, opacidade (0 a 1): interior
  //   rotulo    : campo escrito sobre a área | rotulo_se: só quando este campo for verdadeiro
  //   titulo_popup : campo usado como título do popup
  //   popup     : campos da tabela do popup  { campo: "Título amigável" }
  //   tipo "pontos": raio = tamanho do ponto; zoom_rotulo = zoom a partir do qual o nome aparece
  //   zoom_minimo : a camada só aparece a partir desse zoom (opcional)
  // ------------------------------------------------------------------
  GRUPOS: [
    {
      titulo: "Propostas de Unidade de Conservação",
      aberto: true,
      comparar: true,        // mostra os botões "Todas / A / B / C"
      camadas: [
        {
          id: "proposta-c", arquivo: "propostas_uc", filtro: { id: "C" },
          nome: "Proposta C · MONA Serra Grande",
          descricao: "Monumento Natural · Proteção Integral · 345 ha",
          ligada: true,
          cor: "#4FA3D9", espessura: 3, tracejado: null, preenchimento: "#3A7CA5", opacidade: 0.45,
          titulo_popup: "nome",
          popup: { categoria: "Categoria", grupo: "Grupo SNUC", area_ha: "Área (ha)", perimetro_km: "Perímetro (km)" }
        },
        {
          id: "proposta-b", arquivo: "propostas_uc", filtro: { id: "B" },
          nome: "Proposta B · REVIS Cânions Dourados",
          descricao: "Refúgio de Vida Silvestre · Proteção Integral · 1.504 ha",
          ligada: true,
          cor: "#E0673A", espessura: 3, tracejado: null, preenchimento: "#B3532A", opacidade: 0.45,
          titulo_popup: "nome",
          popup: { categoria: "Categoria", grupo: "Grupo SNUC", area_ha: "Área (ha)", perimetro_km: "Perímetro (km)" }
        },
        {
          id: "proposta-a", arquivo: "propostas_uc", filtro: { id: "A" },
          nome: "Proposta A · APA Cânions Dourados",
          descricao: "Área de Proteção Ambiental · Uso Sustentável · 3.035 ha",
          ligada: true,
          cor: "#F2B34C", espessura: 3, tracejado: null, preenchimento: "#E19B3A", opacidade: 0.35,
          titulo_popup: "nome",
          popup: { categoria: "Categoria", grupo: "Grupo SNUC", area_ha: "Área (ha)", perimetro_km: "Perímetro (km)" }
        }
      ]
    },
    {
      titulo: "Áreas protegidas existentes",
      aberto: true,
      camadas: [
        {
          id: "mona-sf", arquivo: "ucs_existentes",
          nome: "MONA do Rio São Francisco",
          descricao: "Monumento Natural federal · 26.723 ha",
          ligada: true,
          cor: "#A6D96A", espessura: 2, tracejado: "6 4", preenchimento: "#3F5E36", opacidade: 0.25,
          titulo_popup: "nome",
          popup: { categoria: "Categoria", grupo: "Grupo SNUC", esfera: "Esfera", area_total_ha: "Área total (ha)", area_no_municipio_ha: "Área no município (ha)" }
        }
      ]
    },
    {
      titulo: "Território e ocupação",
      aberto: true,
      camadas: [
        { id: "sede", tipo: "sede", nome: "Sede urbana", descricao: "Cidade de Olho d'Água do Casado", ligada: true },
        {
          id: "localidades", arquivo: "localidades", tipo: "pontos",
          nome: "Localidades rurais",
          descricao: "38 povoados, sítios e assentamentos · aparecem ao aproximar o mapa",
          ligada: true,
          cor: "#FFFFFF", espessura: 1.5, preenchimento: "#1F4F5F", opacidade: 1, raio: 5,
          rotulo: "nome", zoom_rotulo: 13,
          zoom_minimo: 12,      // pontos só aparecem com o mapa aproximado (não competem com as propostas)
          titulo_popup: "nome",
          popup: { tipo: "Tipo", observacao: "Observação", fonte: "Fonte" }
        },
        {
          id: "assentamentos", arquivo: "assentamentos",
          nome: "Assentamentos do INCRA",
          descricao: "PA Nova Esperança II e PA Costa",
          ligada: true,
          cor: "#D7B8F0", espessura: 2, tracejado: "4 4", preenchimento: "#7A3E9D", opacidade: 0.2,
          titulo_popup: "nome",
          popup: { area_ha: "Área (ha)", familias: "Famílias assentadas", capacidade_familias: "Capacidade (famílias)", data_criacao: "Criado em", forma_obtencao: "Obtenção do imóvel" }
        }
      ]
    },
    {
      titulo: "Limites",
      aberto: false,
      camadas: [
        {
          id: "municipio", arquivo: "limite_municipal",
          nome: "Olho d'Água do Casado",
          descricao: "Limite municipal · IBGE 2025",
          ligada: true, destaque: true,
          cor: "#F5E2C6", espessura: 3, tracejado: null, preenchimento: null, opacidade: 0
        },
        {
          id: "municipios-al", arquivo: "municipios_al",
          nome: "Demais municípios de Alagoas",
          descricao: "Malha municipal · IBGE 2025",
          ligada: true,
          cor: "#FFFFFF", espessura: 0.8, tracejado: null, preenchimento: "#5E6366", opacidade: 0.6,
          rotulo: "nome", rotulo_se: "limitrofe",
          titulo_popup: "nome",
          popup: { area_km2: "Área (km²)", cod_ibge: "Código IBGE" }
        },
        {
          id: "estados", arquivo: "estados", filtro_excluir: { sigla: "AL" },
          nome: "Estados limítrofes",
          descricao: "Sergipe, Bahia e Pernambuco · IBGE 2024",
          ligada: true,
          cor: "#FFFFFF", espessura: 1.6, tracejado: null, preenchimento: "#2E3235", opacidade: 0.75
        }
      ]
    }
  ],

  // Fontes exibidas na janela "Sobre"
  FONTES: [
    ["Propostas de UC", "IBAM / GEF Alagoas"],
    ["MONA do Rio São Francisco", "Base do projeto (ICMBio)"],
    ["Assentamentos", "INCRA / SIPRA"],
    ["Limites municipais", "IBGE, malha municipal 2025"],
    ["Estados limítrofes", "IBGE, malha estadual 2024"],
    ["Sede urbana", "Prefeitura de Olho d'Água do Casado; SGB/CPRM"],
    ["Localidades rurais", "CODEVASF, Diagnóstico Hidroagrícola do Canal do Sertão Alagoano (Tabela 21) — posições aproximadas"],
    ["Imagem de satélite", "Esri World Imagery"]
  ]
};
