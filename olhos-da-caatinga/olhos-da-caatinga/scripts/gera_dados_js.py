# Converte cada dados/*.geojson em dados/*.js para o mapa abrir com dois cliques (sem servidor).
# Uso: python gera_dados_js.py   (rodar de dentro da pasta scripts/)
import json, pathlib
pasta = pathlib.Path(__file__).resolve().parent.parent / "dados"
for gj in sorted(pasta.glob("*.geojson")):
    nome = gj.stem
    conteudo = json.dumps(json.loads(gj.read_text(encoding="utf-8")), ensure_ascii=False, separators=(",", ":"))
    js = f"/* Gerado de {gj.name} — não editar à mão */\nwindow.DADOS = window.DADOS || {{}};\nDADOS[\"{nome}\"] = {conteudo};\n"
    gj.with_suffix(".js").write_text(js, encoding="utf-8")
    print(f"{gj.name} -> {nome}.js")
