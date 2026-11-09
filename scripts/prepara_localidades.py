# Localidades rurais: Tabela 21 do Diagnóstico Hidroagrícola do Canal do Sertão Alagoano (CODEVASF)
# Coordenadas UTM; o documento troca os rótulos N/E e não informa fuso nem datum.
# Os valores só fazem sentido no fuso 24S; assumido SIRGAS 2000 (EPSG:31984).
import sys, pandas as pd, geopandas as gpd
O, D = sys.argv[1], sys.argv[2]
c = pd.read_csv(f"{O}/localidades_codevasf_tabela21.csv")
g = gpd.GeoDataFrame(c, geometry=gpd.points_from_xy(c.este, c.norte), crs=31984)
mun = gpd.read_file(f"{D}/limite_municipal.geojson").to_crs(31984).geometry[0]
dup = g.duplicated(subset=["este", "norte"], keep=False)
g["observacao"] = ""
g.loc[dup, "observacao"] = "Coordenada repetida na fonte; posição a confirmar"
g.loc[~g.within(mun), "observacao"] = "Ponto cai fora do limite municipal; posição a confirmar"
g["fonte"] = "CODEVASF – Diagnóstico Hidroagrícola do Canal do Sertão Alagoano, Tabela 21"
g = g[["nome", "tipo", "observacao", "fonte", "geometry"]].to_crs(4326)
g.to_file(f"{D}/localidades.geojson", driver="GeoJSON", engine="pyogrio", layer_options={"COORDINATE_PRECISION": "6", "RFC7946": "YES"})
print(len(g), "localidades;", (g.observacao != "").sum(), "com observação")
print(g.tipo.value_counts().to_string())
