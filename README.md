# Olhos da Caatinga — Geoportal

Mapa interativo da consulta pública para criação de Unidade de Conservação em Olho d'Água do Casado (AL).
Projeto financiado pelo FUNBIO e elaborado pelo IBAM.

## Como abrir no seu computador

1. Extraia o .zip (botão direito → **Extrair tudo**). Não abra os arquivos de dentro do .zip.
2. Na pasta extraída, dê dois cliques em **index.html**. O mapa abre no navegador.

É preciso estar conectado à internet para ver a imagem de satélite.

Para editar textos (`js/config.js`), use qualquer editor; o [VS Code](https://code.visualstudio.com/) é o recomendado.

## Como os dados chegam ao mapa
Cada camada existe em dois formatos na pasta `dados/`:
- `.geojson` — o dado original, abre no QGIS e serve para download;
- `.js` — cópia do mesmo dado que o mapa lê (permite abrir com dois cliques).

Ao trocar um `.geojson`, gere o `.js` de novo com `scripts/gera_dados_js.py`.

## Estrutura

| Pasta/arquivo | O que é | Editar? |
|---|---|---|
| `js/config.js` | Textos, cores, fase do projeto | **Sim** — único arquivo editável |
| `dados/*.geojson` | Camadas do mapa (EPSG:4326) | Só para trocar dados (ver `dados/DICIONARIO_DE_DADOS.md`) |
| `img/` | Logos e ícone | Só para trocar imagens, mantendo o mesmo nome |
| `index.html`, `css/`, `js/mapa.js`, `js/ferramentas.js` | Página, mapa e ferramentas (busca, medição, impressão, download, opinião) | Não |
| `lib/leaflet/` | Biblioteca Leaflet 1.9.4 (licença BSD-2) | Não |

## Formulário de opinião
Enquanto o formulário não existir, o botão "Dê sua opinião" mostra um aviso de "em preparação".
Quando o formulário estiver pronto, troque o endereço em `js/config.js` → `FORMULARIO.url`.

## Fontes dos dados
- Propostas de UC e MONA do Rio São Francisco: IBAM / GEF Alagoas
- Limites municipais: IBGE, malha municipal 2025
- Assentamentos: INCRA / SIPRA
- Localidades rurais: CODEVASF, Diagnóstico Hidroagrícola do Canal do Sertão Alagoano (posições aproximadas)
- Estados: IBGE, malha estadual 2024
- Imagem de satélite: Esri World Imagery
