"""Genera las páginas del visualizador a partir de _app.html:
   - fragmento.html : contenido sin <html>/<head>/<body> (para publicar como Artifact de Claude)
   - index.html     : documento completo para alojar en cualquier servidor web estático
"""
from pathlib import Path

AQUI = Path(__file__).resolve().parent
app = (AQUI / "_app.html").read_text(encoding="utf-8")
app = app.replace("/*LEAFLET_CSS*/", (AQUI / "_leaflet.min.css").read_text(encoding="utf-8"))
(AQUI / "fragmento.html").write_text(app, encoding="utf-8")

cabecera, _, cuerpo = app.partition("</style>\n\n<header")
cabecera += "</style>"
cuerpo = "<header" + cuerpo
doc = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Visualizador de datos territoriales de Tuluá (Valle del Cauca, Colombia)">
{cabecera}
</head>
<body>
{cuerpo}
</body>
</html>
"""
(AQUI / "index.html").write_text(doc, encoding="utf-8")
print("fragmento.html", len(app), "· index.html", len(doc))
