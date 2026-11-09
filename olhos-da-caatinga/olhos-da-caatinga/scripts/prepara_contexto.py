# Contexto regional: todos os municípios de AL (cinza) e estados limítrofes (SE, BA, PE)
import os, sys, json, shapely, geopandas as gpd, pandas as pd
from shapely.geometry import shape
O, D = sys.argv[1], sys.argv[2]
opts = {"COORDINATE_PRECISION": "5", "RFC7946": "YES"}
def salva(g, nome, prec="5"):
    p = f"{D}/{nome}.geojson"
    g.to_file(p, driver="GeoJSON", engine="pyogrio", layer_options={"COORDINATE_PRECISION": prec, "RFC7946": "YES"})
    print(f"{nome}.geojson: {len(g)} feições, {shapely.get_num_coordinates(g.geometry.values).sum()} vértices, {os.path.getsize(p)/1024:.0f} KB")

# --- Alagoas: malha IBGE 2025 (precisa) ---
al = gpd.read_file(f"{O}/AL_Municipios_2025.shp").to_crs(31984)
al_uniao = al.union_all()
# simplificação de cobertura: 40 m é invisível na escala estadual e as divisas continuam encaixadas
al["geometry"] = shapely.coverage_simplify(al.geometry.values, tolerance=40)
al = al.rename(columns={"CD_MUN": "cod_ibge", "NM_MUN": "nome"})
al["area_km2"] = (al.area / 1e6).round(1)
olho_geom = al.loc[al.cod_ibge == "2705804", "geometry"].iloc[0]
al["limitrofe"] = al.intersects(olho_geom.buffer(50)) & (al.cod_ibge != "2705804")
salva(al[al.cod_ibge != "2705804"][["cod_ibge", "nome", "area_km2", "limitrofe", "geometry"]].to_crs(4326), "municipios_al")

# --- Estados limítrofes inteiros: malha de UF do IBGE 2024 (br_uf_2024.shp, SIRGAS 2000 geográfico) ---
os.environ["SHAPE_RESTORE_SHX"] = "YES"     # o arquivo veio sem .shx
uf = gpd.read_file(f"{O}/br_uf_2024.shp").to_crs(31984)
uf = uf[uf.SIGLA_UF.isin(["AL", "SE", "BA", "PE"])].rename(columns={"SIGLA_UF": "sigla", "NM_UF": "nome"})
# Simplificação de cobertura de 20 m (AL entra no cálculo para a divisa continuar encaixada).
# Sem simplificar seriam 164 mil vértices e 4 MB; com 20 m, 1,1 MB, sem diferença visível no mapa.
uf["geometry"] = shapely.coverage_simplify(uf.geometry.values, tolerance=20)
salva(uf[uf.sigla != "AL"][["sigla", "nome", "geometry"]].to_crs(4326), "estados")
