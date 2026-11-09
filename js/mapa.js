/* =====================================================================
   /js/mapa.js — monta o geoportal (não precisa editar; use o config.js)
   1. Mapa base   2. Camadas e barra lateral   3. Sede e rótulos
   4. Ferramentas (início, localização, tela cheia, coordenadas)
   5. Cabeçalho, rodapé e janela "Sobre"
   ===================================================================== */

const telaPequena = () => window.matchMedia("(max-width: 820px)").matches;

// ---------------------------------------------------------------------
// Funções auxiliares
// ---------------------------------------------------------------------

// Números no padrão brasileiro: 3035.49 → "3.035,49"
function formatar(valor) {
  if (typeof valor === "number") return valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return valor ?? "—";
}

// Evita que textos dos dados sejam lidos como HTML
function seguro(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// "#E19B3A" + 0.4 → "rgba(225,155,58,0.4)"
function rgba(hex, alfa) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alfa})`;
}

const ICONES = {
  zoom: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M11 8v6M8 11h6"/></svg>',
  opacidade: '<svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
  seta: '<svg class="seta" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  inicio: '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7M6 10v10h12V10"/></svg>',
  local: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  telaCheia: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  sairTelaCheia: '<svg viewBox="0 0 24 24"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>'
};

// Alfinete da sede (também usado como miniatura na barra lateral)
const SVG_SEDE =
  '<svg viewBox="0 0 32 42" width="32" height="42" aria-hidden="true">' +
  '<path d="M16 1C7.7 1 1 7.6 1 15.8 1 27 16 41 16 41s15-14 15-25.2C31 7.6 24.3 1 16 1z" fill="#1F4F5F" stroke="#fff" stroke-width="2"/>' +
  '<path d="M16 8.5l-7.5 6.3h2.2V22h4v-4.4h2.6V22h4v-7.2h2.2z" fill="#E19B3A"/></svg>';

// ---------------------------------------------------------------------
// 1. Mapa e mapa base
// ---------------------------------------------------------------------
const mapa = L.map("mapa", {
  center: CONFIG.CENTRO_RESERVA,
  zoom: CONFIG.ZOOM_RESERVA,
  minZoom: CONFIG.ZOOM_MINIMO,
  maxZoom: CONFIG.ZOOM_MAXIMO,
  zoomControl: false,
  attributionControl: true
});
// Quem pede "reduzir movimento" no sistema recebe saltos diretos, sem animação de voo
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  mapa.flyTo = (centro, zoom) => mapa.setView(centro, zoom, { animate: false });
  mapa.flyToBounds = (limites, opcoes) => mapa.fitBounds(limites, { ...opcoes, animate: false });
}
mapa.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');

L.tileLayer(CONFIG.MAPA_BASE.url, { maxZoom: CONFIG.ZOOM_MAXIMO, attribution: CONFIG.MAPA_BASE.atribuicao }).addTo(mapa);

// Nomes de lugares ficam acima das áreas coloridas
mapa.createPane("rotulos");
mapa.getPane("rotulos").style.zIndex = 440;
mapa.getPane("rotulos").style.pointerEvents = "none";
const camadaRotulos = L.tileLayer(CONFIG.ROTULOS.url, {
  maxZoom: CONFIG.ZOOM_MAXIMO, pane: "rotulos", attribution: CONFIG.ROTULOS.atribuicao
});
if (CONFIG.ROTULOS.ligada) camadaRotulos.addTo(mapa);
const chaveRotulos = document.getElementById("chave-rotulos");
chaveRotulos.checked = CONFIG.ROTULOS.ligada;
chaveRotulos.addEventListener("change", () => chaveRotulos.checked ? camadaRotulos.addTo(mapa) : camadaRotulos.remove());

// ---------------------------------------------------------------------
// 2. Camadas de dados + barra lateral
// ---------------------------------------------------------------------
const faltando = [];
const registro = {};   // id da camada → { def, camada, fator }

// Ordem de desenho: a primeira camada do primeiro grupo fica por cima de todas
const ordem = [];
CONFIG.GRUPOS.forEach((g) => g.camadas.forEach((c) => ordem.push(c.id)));
const zIndexDe = (id) => 430 - ordem.indexOf(id);   // 430, 429, 428... (abaixo dos rótulos)

function estilo(def, fator = 1, realce = false) {
  return {
    color: def.cor,
    weight: def.espessura + (realce ? 2 : 0),
    opacity: fator,
    dashArray: def.tracejado,
    fill: Boolean(def.preenchimento),
    fillColor: def.preenchimento,
    fillOpacity: Math.min((def.opacidade + (realce ? 0.15 : 0)) * fator, 0.9)
  };
}

function popupHTML(def, p) {
  const linhas = Object.entries(def.popup || {})
    .filter(([campo]) => p[campo] !== "" && p[campo] != null)   // não mostra linhas vazias
    .map(([campo, titulo]) => `<tr><th>${seguro(titulo)}</th><td>${seguro(formatar(p[campo]))}</td></tr>`)
    .join("");
  return `<div class="popup-topo" style="--cor:${def.cor === "#FFFFFF" ? "#5E6366" : def.cor}">
            <small>${seguro(def.nome.split(" · ")[0])}</small>
            <strong>${seguro(p[def.titulo_popup] ?? def.nome)}</strong>
          </div>
          <table class="popup-tabela">${linhas}</table>
          ${def.arquivo === "propostas_uc" && CONFIG.FASE === 1
            ? `<div class="popup-rodape"><button type="button" class="botao-opiniao pequeno" data-opiniao="${seguro(def.nome)}">
                 <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>Opinar sobre esta proposta</button></div>`
            : ""}`;
}

function criarCamada(def) {
  if (def.tipo === "sede") {
    const icone = L.divIcon({ className: "icone-sede", html: SVG_SEDE, iconSize: [32, 42], iconAnchor: [16, 41], popupAnchor: [0, -38], tooltipAnchor: [14, -24] });
    return L.marker(CONFIG.SEDE.coordenadas, { icon: icone, title: CONFIG.SEDE.nome, zIndexOffset: 1000 })
      .bindTooltip(CONFIG.SEDE.nome, { direction: "right", className: "rotulo-sede" })
      .bindPopup(`<div class="popup-topo"><small>Sede urbana</small><strong>${seguro(CONFIG.SEDE.nome)}</strong></div>
                  <table class="popup-tabela"><tr><th>Latitude</th><td>${formatar(CONFIG.SEDE.coordenadas[0])}</td></tr>
                  <tr><th>Longitude</th><td>${formatar(CONFIG.SEDE.coordenadas[1])}</td></tr></table>`);
  }

  const dados = typeof DADOS !== "undefined" ? DADOS[def.arquivo] : null;
  if (!dados) { faltando.push(def.arquivo); return null; }

  const pane = "camada-" + def.id;
  mapa.createPane(pane).style.zIndex = zIndexDe(def.id);

  const passaFiltro = (f) =>
    (!def.filtro || Object.entries(def.filtro).every(([k, v]) => f.properties[k] === v)) &&
    (!def.filtro_excluir || !Object.entries(def.filtro_excluir).every(([k, v]) => f.properties[k] === v));

  const interativa = Boolean(def.popup);
  const geo = L.geoJSON(dados, {
    pane,
    filter: passaFiltro,
    // Pontos (localidades) viram círculos; os nomes só aparecem a partir do zoom definido
    pointToLayer: (f, latlng) => L.circleMarker(latlng, { pane, radius: def.raio || 5 }),
    style: () => estilo(def),
    interactive: interativa,
    onEachFeature: (f, el) => {
      if (interativa) {
        el.bindPopup(popupHTML(def, f.properties), { maxWidth: 320 });
        el.on("mouseover", () => el.setStyle(estilo(def, registro[def.id].fator, true)));
        el.on("mouseout", () => el.setStyle(estilo(def, registro[def.id].fator)));
      }
      if (def.rotulo && (!def.rotulo_se || f.properties[def.rotulo_se])) {
        const ponto = def.tipo === "pontos";
        el.bindTooltip(seguro(f.properties[def.rotulo]), {
          permanent: true, pane: "rotulos",
          direction: ponto ? "right" : "center", offset: ponto ? [6, 0] : [0, 0],
          className: ponto ? "rotulo-local" : "rotulo-area"
        });
      }
    }
  });

  // Limite em destaque: linha escura por baixo da linha clara (contorno nítido sobre o satélite)
  if (def.destaque) {
    const halo = L.geoJSON(dados, { pane, interactive: false, style: { color: "#0E2A33", weight: def.espessura + 4, opacity: 0.55, fill: false } });
    const grupo = L.layerGroup([halo, geo]);
    grupo.getBounds = () => geo.getBounds();
    grupo.setStyle = (s) => { geo.setStyle(s); halo.setStyle({ opacity: 0.55 * s.opacity }); };
    return grupo;
  }

  // Estados: nomes escritos no mapa junto com a camada
  if (def.id === "estados") {
    const nomes = CONFIG.ROTULOS_ESTADOS.map((r) =>
      L.marker(r.posicao, { interactive: false, keyboard: false, icon: L.divIcon({ className: "rotulo-estado", html: r.nome, iconSize: null }) }));
    const grupo = L.layerGroup([geo, ...nomes]);
    grupo.getBounds = () => geo.getBounds();
    grupo.setStyle = (s) => geo.setStyle(s);
    return grupo;
  }
  return geo;
}

// Amostra de cor da legenda
function amostraHTML(def) {
  if (def.tipo === "sede") return `<span class="amostra amostra-sede">${SVG_SEDE.replace('width="32" height="42"', 'width="18" height="22"')}</span>`;
  if (def.tipo === "pontos") {
    return `<span class="amostra amostra-ponto" style="background:${def.preenchimento};border:2px solid #fff;box-shadow:0 0 0 1px #9AA0A3"></span>`;
  }
  const fundo = def.preenchimento ? rgba(def.preenchimento, Math.max(def.opacidade, 0.4)) : "transparent";
  const borda = def.cor === "#FFFFFF" ? "#9AA0A3" : def.cor;
  return `<span class="amostra" style="background:${fundo};border:2px ${def.tracejado ? "dashed" : "solid"} ${borda}"></span>`;
}

const lista = document.getElementById("lista-camadas");

CONFIG.GRUPOS.forEach((grupo, gi) => {
  const det = document.createElement("details");
  det.className = "grupo";
  det.open = grupo.aberto;
  det.innerHTML = `<summary><h2 class="grupo-titulo">${seguro(grupo.titulo)}</h2><span class="contador"></span>${ICONES.seta}</summary>`;
  lista.appendChild(det);

  const atualizarContador = () => {
    const ligadas = grupo.camadas.filter((c) => registro[c.id]?.camada && mapa.hasLayer(registro[c.id].camada)).length;
    det.querySelector(".contador").textContent = `${ligadas}/${grupo.camadas.length}`;
  };

  grupo.camadas.forEach((def) => {
    const camada = criarCamada(def);
    registro[def.id] = { def, camada, fator: 1 };
    if (camada && def.ligada) camada.addTo(mapa);

    const item = document.createElement("div");
    item.className = "camada" + (def.ligada ? "" : " desligada");
    const idChave = `chave-${def.id}`;
    const temOpacidade = def.tipo !== "sede";
    item.innerHTML = `
      <div class="camada-linha">
        <label class="chave" title="Ligar ou desligar">
          <input type="checkbox" id="${idChave}" ${def.ligada ? "checked" : ""} ${camada ? "" : "disabled"}>
          <span class="chave-trilho"></span>
          <span class="so-leitor">${seguro(def.nome)}</span>
        </label>
        ${amostraHTML(def)}
        <label class="camada-texto" for="${idChave}">
          <strong>${seguro(def.nome)}</strong>
          ${def.descricao ? `<small>${seguro(def.descricao)}</small>` : ""}
        </label>
        <div class="acoes">
          <button type="button" class="acao" data-acao="zoom" title="Aproximar desta camada" aria-label="Aproximar de ${seguro(def.nome)}">${ICONES.zoom}</button>
          ${temOpacidade ? `<button type="button" class="acao" data-acao="opacidade" title="Ajustar transparência" aria-expanded="false" aria-label="Transparência de ${seguro(def.nome)}">${ICONES.opacidade}</button>` : ""}
        </div>
      </div>
      ${temOpacidade ? `<div class="transparencia" hidden>
        <span>Opacidade</span>
        <input type="range" id="opacidade-${def.id}" min="0" max="100" value="100" aria-label="Opacidade de ${seguro(def.nome)}">
        <output for="opacidade-${def.id}">100%</output>
      </div>` : ""}`;
    det.appendChild(item);

    // Liga/desliga
    item.querySelector(`#${idChave}`).addEventListener("change", (e) => {
      if (!camada) return;
      e.target.checked ? camada.addTo(mapa) : camada.remove();
      item.classList.toggle("desligada", !e.target.checked);
      atualizarContador();
    });

    // Aproximar da camada (liga a camada se estiver desligada)
    item.querySelector('[data-acao="zoom"]').addEventListener("click", () => {
      if (!camada) return;
      if (!mapa.hasLayer(camada)) item.querySelector(`#${idChave}`).click();
      if (def.tipo === "sede") mapa.flyTo(CONFIG.SEDE.coordenadas, 15);
      else if (def.zoom_minimo) {
        // Camadas que só aparecem de perto: aproxima pelo menos até o zoom mínimo
        const limites = camada.getBounds();
        const z = Math.min(Math.max(mapa.getBoundsZoom(limites, false, L.point(60, 60)), def.zoom_minimo), 15);
        mapa.flyTo(limites.getCenter(), z);
      }
      else mapa.flyToBounds(camada.getBounds(), { padding: [30, 30], maxZoom: 15 });
      if (telaPequena()) fecharPainel();
    });

    // Transparência
    if (temOpacidade) {
      const botao = item.querySelector('[data-acao="opacidade"]');
      const faixa = item.querySelector(".transparencia");
      botao.addEventListener("click", () => {
        faixa.hidden = !faixa.hidden;
        botao.setAttribute("aria-expanded", String(!faixa.hidden));
      });
      const controle = faixa.querySelector("input");
      controle.addEventListener("input", () => {
        const fator = controle.value / 100;
        registro[def.id].fator = fator;
        faixa.querySelector("output").textContent = `${controle.value}%`;
        camada?.setStyle(estilo(def, fator));
      });
    }
  });

  // Comparar propostas: "Todas" ou uma de cada vez, com um clique
  if (grupo.comparar) {
    const letras = [...grupo.camadas].reverse();   // ordem A, B, C
    const barra = document.createElement("div");
    barra.className = "comparar";
    barra.setAttribute("role", "group");
    barra.setAttribute("aria-label", "Comparar propostas");
    barra.innerHTML = `<span>Mostrar</span>` +
      `<button type="button" data-ver="todas" aria-pressed="true">Todas</button>` +
      letras.map((c) => `<button type="button" data-ver="${c.id}" aria-pressed="false" title="${seguro(c.nome)}">
         <i style="background:${c.preenchimento}"></i>${seguro(c.nome.split(" · ")[0].replace("Proposta ", ""))}</button>`).join("");
    det.querySelector("summary").after(barra);
    barra.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ver]");
      if (!b) return;
      grupo.camadas.forEach((c) => ligarCamada(c.id, b.dataset.ver === "todas" || b.dataset.ver === c.id));
      barra.querySelectorAll("[data-ver]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const alvo = b.dataset.ver === "todas" ? null : registro[b.dataset.ver].camada;
      if (alvo) mapa.flyToBounds(alvo.getBounds(), { padding: [40, 40], maxZoom: 15 });
    });
  }
  atualizarContador();
});

// Liga ou desliga uma camada pelo id (usado pela comparação e pela busca)
function ligarCamada(id, ligar) {
  const chave = document.getElementById(`chave-${id}`);
  if (chave && chave.checked !== ligar) chave.click();
}

// Nomes das localidades só aparecem com o mapa aproximado (evita poluir a visão geral)
const zoomRotuloLocal = Math.min(...CONFIG.GRUPOS.flatMap((g) => g.camadas).filter((c) => c.zoom_rotulo).map((c) => c.zoom_rotulo));
const atualizarRotulosLocais = () => {
  mapa.getContainer().classList.toggle("mostrar-rotulos-local", mapa.getZoom() >= zoomRotuloLocal);
  // Visão regional (zoom < 10): esconde os nomes dos municípios, que se amontoariam
  mapa.getContainer().classList.toggle("zoom-regional", mapa.getZoom() < 10);
};
mapa.on("zoomend", atualizarRotulosLocais);

// Camadas com zoom_minimo: o "pane" da camada só aparece a partir desse zoom
const atualizarZoomMinimo = () => CONFIG.GRUPOS.flatMap((g) => g.camadas).filter((c) => c.zoom_minimo).forEach((c) => {
  const pane = mapa.getPane("camada-" + c.id);
  if (pane) pane.style.display = mapa.getZoom() >= c.zoom_minimo ? "" : "none";
});
mapa.on("zoomend", atualizarZoomMinimo);

// ---------------------------------------------------------------------
// 3. Enquadramento inicial e limite de navegação
// ---------------------------------------------------------------------
let limitesMunicipio = null;
if (typeof DADOS !== "undefined" && DADOS[CONFIG.CAMADA_ENQUADRAMENTO]) {
  limitesMunicipio = L.geoJSON(DADOS[CONFIG.CAMADA_ENQUADRAMENTO]).getBounds();
  mapa.fitBounds(limitesMunicipio, { padding: [24, 24] });
  mapa.setMaxBounds(limitesMunicipio.pad(6));   // impede "se perder" longe da região
}
const voltarAoInicio = () =>
  limitesMunicipio ? mapa.flyToBounds(limitesMunicipio, { padding: [24, 24] }) : mapa.flyTo(CONFIG.CENTRO_RESERVA, CONFIG.ZOOM_RESERVA);

// ---------------------------------------------------------------------
// 4. Ferramentas do mapa
// ---------------------------------------------------------------------
L.control.zoom({ position: "topleft", zoomInTitle: "Aproximar", zoomOutTitle: "Afastar" }).addTo(mapa);

const Ferramentas = L.Control.extend({
  options: { position: "topleft" },
  onAdd() {
    const caixa = L.DomUtil.create("div", "leaflet-bar");
    const botao = (icone, titulo, acao) => {
      const b = L.DomUtil.create("button", "", caixa);
      b.type = "button"; b.title = titulo; b.setAttribute("aria-label", titulo); b.innerHTML = icone;
      L.DomEvent.on(b, "click", (e) => { L.DomEvent.stop(e); acao(b); });
      return b;
    };
    botao(ICONES.inicio, "Ver o município inteiro", voltarAoInicio);
    botao(ICONES.local, "Mostrar minha localização", () => mapa.locate({ setView: true, maxZoom: 15 }));
    botao(ICONES.telaCheia, "Tela cheia", (b) => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
      else document.exitFullscreen?.();
    });
    document.addEventListener("fullscreenchange", () => {
      const b = caixa.lastChild;
      b.innerHTML = document.fullscreenElement ? ICONES.sairTelaCheia : ICONES.telaCheia;
      b.title = document.fullscreenElement ? "Sair da tela cheia" : "Tela cheia";
    });
    L.DomEvent.disableClickPropagation(caixa);
    return caixa;
  }
});
new Ferramentas().addTo(mapa);
L.control.scale({ imperial: false, position: "bottomleft" }).addTo(mapa);

// Minha localização (GPS do celular)
let marcaLocal = null;
mapa.on("locationfound", (e) => {
  marcaLocal?.remove();
  marcaLocal = L.layerGroup([
    L.circle(e.latlng, { radius: e.accuracy, color: "#3A7CA5", weight: 1, fillOpacity: 0.12 }),
    L.circleMarker(e.latlng, { radius: 7, color: "#fff", weight: 2, fillColor: "#3A7CA5", fillOpacity: 1 })
      .bindTooltip("Você está aqui", { direction: "top" })
  ]).addTo(mapa);
});
mapa.on("locationerror", () => {
  document.getElementById("coordenadas").textContent = "Localização indisponível: permita o acesso no navegador";
});

// Coordenadas do cursor
const caixaCoord = document.getElementById("coordenadas");
const grau = (v) => v.toLocaleString("pt-BR", { minimumFractionDigits: 5, maximumFractionDigits: 5 }) + "°";
mapa.on("mousemove", (e) => { caixaCoord.textContent = `Lat ${grau(e.latlng.lat)}   Lon ${grau(e.latlng.lng)}`; });

// ---------------------------------------------------------------------
// 5. Barra lateral (abrir/fechar), cabeçalho, rodapé e "Sobre"
// ---------------------------------------------------------------------
const painel = document.getElementById("painel");
const botaoPainel = document.getElementById("botao-painel");
function definirPainel(aberto) {
  painel.classList.toggle("fechado", !aberto);
  botaoPainel.setAttribute("aria-expanded", String(aberto));
  setTimeout(() => mapa.invalidateSize(), 260);   // o mapa ocupa o espaço liberado
}
const fecharPainel = () => definirPainel(false);
// No celular: ao abrir a gaveta, o foco vai para a busca; Esc fecha a gaveta
botaoPainel.addEventListener("click", () => {
  // espera a gaveta terminar de abrir antes de mover o foco
  setTimeout(() => {
    if (telaPequena() && !painel.classList.contains("fechado")) document.getElementById("campo-busca").focus({ preventScroll: true });
  }, 260);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && telaPequena() && !painel.classList.contains("fechado") && !document.querySelector("dialog[open]")) {
    fecharPainel(); botaoPainel.focus();
  }
});
botaoPainel.addEventListener("click", () => definirPainel(painel.classList.contains("fechado")));
if (telaPequena()) definirPainel(false);
mapa.on("click", () => { if (telaPequena()) fecharPainel(); });

document.getElementById("titulo").textContent = CONFIG.TITULO;
document.getElementById("subtitulo").textContent = CONFIG.SUBTITULO;
document.getElementById("chamada-titulo").textContent = CONFIG.CHAMADA_TITULO;
document.getElementById("chamada-texto").textContent = CONFIG.CHAMADA_TEXTO;
document.querySelector(".marca").addEventListener("click", (e) => { e.preventDefault(); voltarAoInicio(); });

const logo = (i) => `<a href="${i.site}" target="_blank" rel="noopener" title="${seguro(i.nome)}"><img src="${i.logo}" alt="${seguro(i.nome)}"></a>`;
document.getElementById("logos-cabecalho").innerHTML = CONFIG.INSTITUICOES.map(logo).join('<span class="divisor"></span>');
document.getElementById("painel-rodape").innerHTML =
  `<div class="logos-rodape">${CONFIG.INSTITUICOES.map(logo).join("")}</div>
   Elaboração IBAM · Financiamento FUNBIO · <a href="#" id="link-sobre">Fontes e créditos</a>`;
document.getElementById("logos-sobre").innerHTML = CONFIG.INSTITUICOES
  .map((i) => `<figure><figcaption>${seguro(i.papel)}</figcaption>${logo(i)}</figure>`).join("");
document.getElementById("tabela-fontes").innerHTML = CONFIG.FONTES
  .map(([camada, fonte]) => `<tr><td>${seguro(camada)}</td><td>${seguro(fonte)}</td></tr>`).join("");

const janela = document.getElementById("janela-sobre");
const abrirSobre = (e) => { e?.preventDefault(); janela.showModal(); };
document.getElementById("botao-sobre").addEventListener("click", abrirSobre);
document.getElementById("link-sobre").addEventListener("click", abrirSobre);
document.getElementById("fechar-sobre").addEventListener("click", () => janela.close());
janela.addEventListener("click", (e) => { if (e.target === janela) janela.close(); });

// ---------------------------------------------------------------------
// Verificação final
// ---------------------------------------------------------------------
if (faltando.length) {
  console.error("[Olhos da Caatinga] Camadas não encontradas:", faltando.join(", "));
  document.getElementById("aviso").hidden = false;
} else {
  console.log("[Olhos da Caatinga] Geoportal carregado.");
}
