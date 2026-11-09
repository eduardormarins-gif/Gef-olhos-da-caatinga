# Dicionário de dados — Geoportal Olhos da Caatinga

Preparado em 06/11/2026. Todos os arquivos: GeoJSON (RFC 7946), EPSG:4326 (WGS 84 / compatível com SIRGAS 2000 geográfico), UTF-8, 6 casas decimais (~0,1 m).
Áreas e perímetros calculados em SIRGAS 2000 / UTM 24S (EPSG:31984) a partir da geometria original, antes da reprojeção.

## propostas_uc.geojson — Propostas de Unidade de Conservação (Fase 1)
Origem: APA_CD.shp, REVIS_CD.shp, MONA_SG.shp (IBAM / GEF Alagoas), SIRGAS 2000 UTM 24S. Sem simplificação.

| Campo | Tipo | Descrição | Exemplo |
|---|---|---|---|
| id | texto | Letra da proposta na consulta | A |
| sigla | texto | Sigla da categoria SNUC | APA |
| nome | texto | Nome da proposta | APA Cânions Dourados |
| categoria | texto | Categoria SNUC (Lei 9.985/2000) | Área de Proteção Ambiental |
| grupo | texto | Grupo SNUC | Uso Sustentável |
| area_ha | número | Área em hectares | 3035.49 |
| perimetro_km | número | Perímetro em quilômetros | 24.00 |

## ucs_existentes.geojson — UCs já criadas
Origem: MONA_CaniosSF.shp, SIRGAS 2000 UTM 24S. Coordenada Z removida; simplificação de 5 m.

| Campo | Tipo | Descrição |
|---|---|---|
| sigla, nome, categoria, grupo | texto | Identificação SNUC |
| esfera | texto | Federal / Estadual / Municipal |
| area_total_ha | número | Área total da UC |
| area_no_municipio_ha | número | Parte da UC dentro de Olho d'Água do Casado |

## limite_municipal.geojson e municipios_vizinhos.geojson
Origem: AL_Municipios_2025.shp (IBGE, malha 2025), SIRGAS 2000 geográfico. Simplificação de cobertura com tolerância de 15 m (divisas compartilhadas continuam idênticas).

| Campo | Tipo | Descrição |
|---|---|---|
| cod_ibge | texto | Código IBGE do município |
| nome | texto | Nome do município |
| area_km2 | número | Área recalculada após simplificação |

## assentamentos.geojson — Projetos de Assentamento (INCRA)
Origem: Assentamentos_INCRA.shp (WGS 84). Veio sem .shx (reconstruído). Dados públicos do SIPRA, sem dados pessoais.

| Campo | Tipo | Descrição | Exemplo |
|---|---|---|---|
| cod_sipra | texto | Código do projeto no SIPRA/INCRA | AL0054000 |
| nome | texto | Nome do projeto | PA Nova Esperança II |
| area_ha | número | Área recalculada em UTM 24S | 1567.28 |
| capacidade_familias | inteiro | Capacidade de famílias | 150 |
| familias | inteiro | Famílias assentadas | 137 |
| data_criacao | texto | Data de criação | 15/12/2000 |
| forma_obtencao | texto | Forma de obtenção do imóvel | Desapropriação |

## municipios_al.geojson — Demais municípios de Alagoas
Origem: AL_Municipios_2025.shp (IBGE, malha 2025). Simplificação de cobertura de 40 m. Exclui Olho d'Água do Casado.

| Campo | Tipo | Descrição |
|---|---|---|
| cod_ibge | texto | Código IBGE do município |
| nome | texto | Nome do município |
| area_km2 | número | Área após simplificação |
| limitrofe | lógico | Verdadeiro para os 4 municípios que fazem divisa com Olho d'Água do Casado |

## estados.geojson — Estados limítrofes (SE, BA, PE)
Origem: br_uf_2024.shp (IBGE, malha estadual 2024, SIRGAS 2000 geográfico). Estados inteiros, sem recorte; simplificação de cobertura de 20 m (Alagoas entra no cálculo para a divisa continuar encaixada).

| Campo | Tipo | Descrição |
|---|---|---|
| sigla | texto | Sigla da UF |
| nome | texto | Nome da UF |

## localidades.geojson — Localidades rurais
Origem: CODEVASF, Diagnóstico para o Desenvolvimento Hidroagrícola das Comunidades Rurais na Área de Influência do Canal do Sertão Alagoano, Tabela 21 (38 núcleos). A tabela troca os rótulos N/E e não informa fuso nem datum; assumido SIRGAS 2000 / UTM 24S. Posições aproximadas, a validar com a prefeitura.

| Campo | Tipo | Descrição |
|---|---|---|
| nome | texto | Nome do núcleo populacional |
| tipo | texto | Povoado, Sítio ou Assentamento |
| observacao | texto | Alerta de qualidade (coordenada repetida, ponto fora do município) |
| fonte | texto | Documento de origem |

## Arquivos recebidos e não usados
- geoft_bho_cursodagua.shp (ANA, BHO 2012, 1:1.000.000) — descartado: traçado deslocado em média 590 m do leito real. O rio é visto na imagem de satélite.
- MONA_CaniosSF_municip.shp — recorte municipal do MONA; o mapa usa o polígono completo e calcula a parte no município.
- olho_dagua.shp — igual ao registro de Olho d'Água em AL_Municipios_2025.
- regua_mikael.shp — retângulo auxiliar (aparenta ser moldura de layout).
