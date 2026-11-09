/* =====================================================================
   /js/ferramentas.js — interatividade (não precisa editar; use o config.js)
   1. Dê sua opinião   2. Busca   3. Medição de distância e área
   4. Impressão        5. Download (GeoJSON e KML)
   Usa variáveis criadas no mapa.js: mapa, registro, ligarCamada, seguro, formatar, rgba.
   ===================================================================== */

// ---------------------------------------------------------------------
// 1. DÊ SUA OPINIÃO
//    Qualquer botão com o atributo data-opiniao abre o formulário.
//    data-opiniao="Proposta A · ..." → a proposta já vai marcada (se configurado).
// ---------------------------------------------------------------------
const janelaOpiniao = document.getElementById("janela-opiniao");
document.getElementById("texto-opiniao").textContent = CONFIG.FORMULARIO.texto_botao;
document.getElementById("opiniao-texto").textContent = CONFIG.FORMULARIO.aviso_preparacao;
document.getElementById("fechar-opiniao").addEventListener("click", () => janelaOpiniao.close());
document.getElementById("ok-opiniao").addEventListener("click", () => janelaOpiniao.close());
janelaOpiniao.addEventListener("click", (e) => { if (e.target === janelaOpiniao) janelaOpiniao.close(); });

const formularioProvisorio = () => /EM-PREPARACAO/i.test(CONFIG.FORMULARIO.url) || !CONFIG.FORMULARIO.url;

function abrirOpiniao(proposta) {
  if (formularioProvisorio()) { janelaOpiniao.showModal(); return; }
  const f = CONFIG.FORMULARIO;
  let url = f.url;
  if (proposta && f.parametro_proposta) {
    url += (url.includes("?") ? "&" : "?") + encodeURIComponent(f.parametro_proposta) + "=" + encodeURIComponent(proposta);
  }
  window.open(url, "_blank", "noopener");
}
document.addEventListener("click", (e) => {
  const botao = e.target.closest("[data-opiniao]");
  if (botao) { e.preventDefault(); abrirOpiniao(botao.dataset.opiniao); }
});

// ---------------------------------------------------------------------
// 2. BUSCA — localidades, propostas, assentamentos, UCs, municípios e coordenadas
// ---------------------------------------------------------------------
const semAcento = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Índice: cada item sabe em qual camada está e qual elemento do mapa abrir
const indiceBusca = [];
Object.values(registro).forEach(({ def, camada }) => {
  if (!camada) return;
  if (def.tipo === "sede") {
    indiceBusca.push({ nome: CONFIG.SEDE.nome, tipo: "Sede urbana", id: def.id, elemento: camada });
    return;
  }
  if (!def.titulo_popup) return;
  const geo = camada.getLayers ? camada : null;
  geo?.eachLayer((el) => {
    if (!el.feature) return;
    const nome = el.feature.properties[def.titulo_popup];
    const tipo = el.feature.properties.tipo || def.nome.split(" · ")[0];
    if (nome) indiceBusca.push({ nome, tipo, id: def.id, elemento: el });
  });
});

const campoBusca = document.getElementById("campo-busca");
const listaResultados = document.getElementById("resultados-busca");
let resultados = [], selecionado = -1, marcaBusca = null;

// "-9.48, -37.83" ou "-9,48 -37,83" → [lat, lon]
function lerCoordenada(texto) {
  const n = texto.trim().replace(/\s*;\s*|\s*,\s+|\s+/g, " ").split(" ").map((v) => parseFloat(v.replace(",", ".")));
  if (n.length === 2 && n.every(Number.isFinite) && Math.abs(n[0]) <= 90 && Math.abs(n[1]) <= 180) return n;
  return null;
}

function mostrarResultados() {
  listaResultados.innerHTML = resultados.length
    ? resultados.map((r, i) => `<li role="option" id="res-${i}" aria-selected="${i === selecionado}">
        <strong>${seguro(r.nome)}</strong><small>${seguro(r.tipo)}</small></li>`).join("")
    : `<li class="sem-resultado">Nada encontrado. Tente outro nome ou uma coordenada (ex.: -9.48, -37.83).</li>`;
  listaResultados.hidden = false;
  document.getElementById("anuncio-busca").textContent =
    resultados.length ? `${resultados.length} resultado${resultados.length > 1 ? "s" : ""}. Use as setas para escolher.` : "Nada encontrado.";
  campoBusca.setAttribute("aria-expanded", "true");
  campoBusca.setAttribute("aria-activedescendant", selecionado >= 0 ? `res-${selecionado}` : "");
}
function esconderResultados() {
  listaResultados.hidden = true;
  campoBusca.setAttribute("aria-expanded", "false");
  selecionado = -1;
}

function irPara(r) {
  esconderResultados();
  campoBusca.value = r.nome;
  marcaBusca?.remove();
  if (r.coordenada) {
    marcaBusca = L.circleMarker(r.coordenada, { radius: 8, color: "#fff", weight: 3, fillColor: "#E19B3A", fillOpacity: 1 })
      .bindPopup(`<div class="popup-topo"><small>Coordenada</small><strong>${seguro(r.nome)}</strong></div>`).addTo(mapa).openPopup();
    mapa.flyTo(r.coordenada, 15);
  } else {
    ligarCamada(r.id, true);
    const el = r.elemento;
    if (el.getBounds) mapa.flyToBounds(el.getBounds(), { padding: [40, 40], maxZoom: 15 });
    else mapa.flyTo(el.getLatLng(), 15);
    mapa.once("moveend", () => el.openPopup?.());
  }
  if (telaPequena()) fecharPainel();
}

campoBusca.addEventListener("input", () => {
  const texto = campoBusca.value.trim();
  selecionado = -1;
  if (texto.length < 2) { esconderResultados(); return; }
  const coord = lerCoordenada(texto);
  if (coord) {
    resultados = [{ nome: `${formatar(coord[0])}, ${formatar(coord[1])}`, tipo: "Ir para a coordenada", coordenada: coord }];
  } else {
    const q = semAcento(texto);
    resultados = indiceBusca
      .filter((r) => semAcento(r.nome).includes(q))
      .sort((a, b) => semAcento(a.nome).indexOf(q) - semAcento(b.nome).indexOf(q) || a.nome.localeCompare(b.nome, "pt-BR"))
      .slice(0, 8);
  }
  mostrarResultados();
});
campoBusca.addEventListener("keydown", (e) => {
  if (listaResultados.hidden || !resultados.length) return;
  if (e.key === "ArrowDown") { selecionado = (selecionado + 1) % resultados.length; mostrarResultados(); e.preventDefault(); }
  else if (e.key === "ArrowUp") { selecionado = (selecionado - 1 + resultados.length) % resultados.length; mostrarResultados(); e.preventDefault(); }
  else if (e.key === "Enter") { irPara(resultados[Math.max(selecionado, 0)]); e.preventDefault(); }
  else if (e.key === "Escape") esconderResultados();
});
listaResultados.addEventListener("mousedown", (e) => {
  const li = e.target.closest("li[id^='res-']");
  if (li) { e.preventDefault(); irPara(resultados[Number(li.id.slice(4))]); }
});
campoBusca.addEventListener("blur", () => setTimeout(esconderResultados, 150));

// ---------------------------------------------------------------------
// 3. MEDIÇÃO — distância (régua) e área
// ---------------------------------------------------------------------
const painelMedicao = document.getElementById("medicao");
const valorMedicao = document.getElementById("medicao-valor");
const medicao = { modo: null, pontos: [], desenho: L.layerGroup().addTo(mapa) };

const formatarDistancia = (m) => m < 1000 ? `${formatar(Math.round(m))} m` : `${(m / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km`;
const formatarArea = (m2) => {
  const ha = m2 / 10000;
  return ha < 100 ? `${ha.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ha`
                  : `${formatar(Math.round(ha))} ha (${(m2 / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km²)`;
};

// Área sobre a superfície da Terra (mesma fórmula do Leaflet.draw)
function areaGeodesica(pts) {
  const R = 6378137, rad = Math.PI / 180;
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i], p2 = pts[(i + 1) % pts.length];
    area += (p2.lng - p1.lng) * rad * (2 + Math.sin(p1.lat * rad) + Math.sin(p2.lat * rad));
  }
  return Math.abs(area * R * R / 2);
}

function redesenharMedicao() {
  medicao.desenho.clearLayers();
  const p = medicao.pontos;
  const cor = "#E19B3A";
  if (medicao.modo === "area" && p.length >= 3) {
    L.polygon(p, { color: cor, weight: 3, dashArray: "6 4", fillColor: cor, fillOpacity: 0.2, interactive: false }).addTo(medicao.desenho);
  } else if (p.length >= 2) {
    L.polyline(p, { color: cor, weight: 3, dashArray: "6 4", interactive: false }).addTo(medicao.desenho);
  }
  p.forEach((pt) => L.circleMarker(pt, { radius: 4, color: "#fff", weight: 2, fillColor: cor, fillOpacity: 1, interactive: false }).addTo(medicao.desenho));

  if (!p.length) { valorMedicao.textContent = "Clique no mapa para começar"; return; }
  if (medicao.modo === "distancia") {
    let total = 0;
    for (let i = 1; i < p.length; i++) total += mapa.distance(p[i - 1], p[i]);
    valorMedicao.textContent = p.length < 2 ? "Clique no próximo ponto" : formatarDistancia(total);
  } else {
    valorMedicao.textContent = p.length < 3 ? `Marque pelo menos 3 pontos (${p.length}/3)` : formatarArea(areaGeodesica(p));
  }
}

function iniciarMedicao(modo) {
  pararMedicao(true);
  medicao.modo = modo;
  document.getElementById("medicao-tipo").textContent = modo === "distancia" ? "Distância" : "Área";
  painelMedicao.hidden = false;
  mapa.getContainer().classList.add("medindo");
  mapa.doubleClickZoom.disable();
  mapa.closePopup();
  redesenharMedicao();
  document.querySelectorAll("[data-medir]").forEach((b) => b.classList.toggle("ativo", b.dataset.medir === modo));
}
function pararMedicao(limpar) {
  medicao.modo = null;
  mapa.getContainer().classList.remove("medindo");
  mapa.doubleClickZoom.enable();
  document.querySelectorAll("[data-medir]").forEach((b) => b.classList.remove("ativo"));
  if (limpar) { medicao.pontos = []; medicao.desenho.clearLayers(); painelMedicao.hidden = true; }
}
mapa.on("click", (e) => {
  if (!medicao.modo) return;
  medicao.pontos.push(e.latlng);
  redesenharMedicao();
});
mapa.on("dblclick", () => { if (medicao.modo) pararMedicao(false); });
document.getElementById("medicao-concluir").addEventListener("click", () => pararMedicao(false));
document.getElementById("medicao-limpar").addEventListener("click", () => pararMedicao(true));

// ---------------------------------------------------------------------
// 4. IMPRESSÃO — imprime o mapa com cabeçalho, logos e legenda das camadas ligadas
// ---------------------------------------------------------------------
document.getElementById("impressao-logos").innerHTML = CONFIG.INSTITUICOES.map((i) => `<img src="${i.logo}" alt="">`).join("");

function imprimirMapa() {
  const ligadas = Object.values(registro).filter(({ camada }) => camada && mapa.hasLayer(camada));
  document.getElementById("impressao-legenda").innerHTML =
    `<strong>Legenda</strong>` +
    ligadas.map(({ def }) => `<span>${amostraHTML(def)} ${seguro(def.nome)}</span>`).join("") +
    `<small>Fontes: ${CONFIG.FONTES.map((f) => seguro(f[1])).join("; ")}.</small>`;
  document.getElementById("impressao-subtitulo").textContent =
    `${CONFIG.SUBTITULO} · impresso em ${new Date().toLocaleDateString("pt-BR")}`;
  window.print();
}
window.addEventListener("beforeprint", () => mapa.invalidateSize());
window.addEventListener("afterprint", () => setTimeout(() => mapa.invalidateSize(), 100));

// ---------------------------------------------------------------------
// Botões no mapa: régua, área e impressão
// ---------------------------------------------------------------------
const ICONES_FERRAMENTAS = {
  regua: '<svg viewBox="0 0 24 24"><path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/></svg>',
  area: '<svg viewBox="0 0 24 24"><path d="M5 19l2-13 12 3-3 10z"/><circle cx="5" cy="19" r="1.5"/><circle cx="7" cy="6" r="1.5"/><circle cx="19" cy="9" r="1.5"/><circle cx="16" cy="19" r="1.5"/></svg>',
  imprimir: '<svg viewBox="0 0 24 24"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><path d="M7 14h10v7H7z"/></svg>'
};
const Medidas = L.Control.extend({
  options: { position: "topright" },   // à direita: equilibra com os botões de navegação à esquerda
  onAdd() {
    const caixa = L.DomUtil.create("div", "leaflet-bar");
    const botao = (icone, titulo, acao, medir) => {
      const b = L.DomUtil.create("button", "", caixa);
      b.type = "button"; b.title = titulo; b.setAttribute("aria-label", titulo); b.innerHTML = icone;
      if (medir) b.dataset.medir = medir;
      L.DomEvent.on(b, "click", (e) => { L.DomEvent.stop(e); acao(); });
    };
    botao(ICONES_FERRAMENTAS.regua, "Medir distância", () => medicao.modo === "distancia" ? pararMedicao(true) : iniciarMedicao("distancia"), "distancia");
    botao(ICONES_FERRAMENTAS.area, "Medir área", () => medicao.modo === "area" ? pararMedicao(true) : iniciarMedicao("area"), "area");
    botao(ICONES_FERRAMENTAS.imprimir, "Imprimir ou salvar em PDF", imprimirMapa);
    L.DomEvent.disableClickPropagation(caixa);
    return caixa;
  }
});
new Medidas().addTo(mapa);

// ---------------------------------------------------------------------
// 5. DOWNLOAD — GeoJSON (QGIS) e KML (Google Earth), gerados no próprio navegador
// ---------------------------------------------------------------------
function baixar(conteudo, nomeArquivo, tipo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = Object.assign(document.createElement("a"), { href: url, download: nomeArquivo });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const xml = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));
const anelKML = (anel) => anel.map(([x, y]) => `${x},${y},0`).join(" ");
function geometriaKML(g) {
  const poligono = (p) => `<Polygon><outerBoundaryIs><LinearRing><coordinates>${anelKML(p[0])}</coordinates></LinearRing></outerBoundaryIs>` +
    p.slice(1).map((b) => `<innerBoundaryIs><LinearRing><coordinates>${anelKML(b)}</coordinates></LinearRing></innerBoundaryIs>`).join("") + `</Polygon>`;
  if (g.type === "Point") return `<Point><coordinates>${g.coordinates[0]},${g.coordinates[1]},0</coordinates></Point>`;
  if (g.type === "Polygon") return poligono(g.coordinates);
  if (g.type === "MultiPolygon") return `<MultiGeometry>${g.coordinates.map(poligono).join("")}</MultiGeometry>`;
  if (g.type === "LineString") return `<LineString><coordinates>${anelKML(g.coordinates)}</coordinates></LineString>`;
  return "";
}
function paraKML(geojson, titulo) {
  const marcas = geojson.features.map((f) => {
    const p = f.properties || {};
    const nome = p.nome || p.name || titulo;
    const dados = Object.entries(p).map(([k, v]) => `<Data name="${xml(k)}"><value>${xml(v)}</value></Data>`).join("");
    return `<Placemark><name>${xml(nome)}</name><ExtendedData>${dados}</ExtendedData>${geometriaKML(f.geometry)}</Placemark>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${xml(titulo)}</name>\n${marcas}\n</Document></kml>`;
}

document.getElementById("lista-download").innerHTML = CONFIG.DOWNLOADS
  .filter((d) => typeof DADOS !== "undefined" && DADOS[d.arquivo])
  .map((d) => `<li><span>${seguro(d.nome)}</span>
      <button type="button" data-baixar="${d.arquivo}" data-formato="geojson">GeoJSON</button>
      <button type="button" data-baixar="${d.arquivo}" data-formato="kml">KML</button></li>`).join("");
document.getElementById("lista-download").addEventListener("click", (e) => {
  const b = e.target.closest("[data-baixar]");
  if (!b) return;
  const item = CONFIG.DOWNLOADS.find((d) => d.arquivo === b.dataset.baixar);
  const dados = DADOS[item.arquivo];
  if (b.dataset.formato === "kml") baixar(paraKML(dados, item.nome), `${item.arquivo}.kml`, "application/vnd.google-earth.kml+xml");
  else baixar(JSON.stringify(dados), `${item.arquivo}.geojson`, "application/geo+json");
});

// Estado inicial dos nomes e da visibilidade das localidades
atualizarRotulosLocais();
atualizarZoomMinimo();
