# Tuluá en Cifras

Visualizador de datos territoriales de Tuluá (Valle del Cauca, Colombia), tipo «municipio en cifras», con base de datos estandarizada, comparativas con los 42 municipios del Valle y mapas coropléticos por rangos.

## Estructura

```
tulua_en_cifras/
├── db/
│   ├── 01_esquema.sql            Modelo estandarizado (PostgreSQL + PostGIS)
│   ├── 02_vistas_funciones.sql   Vistas (v_dato, v_ultimo_dato, v_ficha) y funciones (ranking, cortes, GeoJSON para mapas)
│   ├── 03_configuracion.sql      Indicadores destacados, polaridad, clasificación de mapas
│   └── tulua_cifras.dump         Copia completa de la base ya cargada (pg_restore)
├── etl/
│   ├── comun.py                  Conexión, normalización de textos, unidades y periodos
│   ├── 01_cargar_territorios.py  País, Valle, 42 municipios, comunas, secciones, manzanas, barrios
│   ├── 02_cargar_terridata.py    TerriData (DNP): 1.746 indicadores, 2000-2042
│   ├── 03_cargar_cnpv2018.py     Censo 2018 (DANE) hasta manzana y comuna
│   ├── 04_cargar_accidentalidad.py  Accidentes de tránsito (Alcaldía) por comuna, sección y barrio
│   ├── 05_exportar_web.py        Exporta la base a JSON/GeoJSON para la web
│   ├── 06_exportar_tableau.py    Exporta el paquete para Tableau Public
│   ├── 07_exportar_compendio.py  Exporta web/data/compendio.json (series de las páginas temáticas)
│   └── 08_cargar_anuario.py      Anuario Estadístico 2025 de Tuluá: línea base municipal, barrios y corregimientos
├── tableau/
│   ├── GUIA_TABLEAU.md           Paso a paso para montar el tablero en Tableau Public
│   └── tableau_tulua_en_cifras.zip  hechos, indicadores, territorios, periodos, cortes y polígonos
├── data/raw/                     Fuentes descargadas (ver abajo)
└── web/
    ├── index.html                Visualizador (abrir con un servidor web)
    ├── app.js                    Lógica: ficha, mapas, indicadores, comparativa
    ├── compendio.js              Página Compendio: especificación de los 65 gráficos (Chart.js) por capítulos
    ├── data/                     JSON generados por 05_exportar_web.py
    ├── _app.html, construir.py   Plantilla y generador de index.html
```

## Modelo de datos

Modelo en estrella: cada **dato** = indicador × territorio × periodo × desagregación.

| Tabla | Qué estandariza |
|---|---|
| `nivel_territorial` | País › Departamento › Municipio › Zona (cabecera/resto) › Comuna / Corregimiento › Sector › Sección › Barrio / Vereda › Manzana |
| `territorio` | Código interno (`MUN:76834`, `COM:76834-07`, `MZN:<22 dígitos DANE>`), código oficial, jerarquía (`padre_id`), geometría PostGIS completa y simplificada, centroide |
| `territorio_alias` | Nombres alternativos para cruzar fuentes (p. ej. «Tomas Uribe» = «Tomás Uribe Uribe») |
| `grupo_territorial` | Grupos de comparación: vecinos (calculados con geometría), ciudades intermedias, todo el Valle |
| `indicador` | Código, nombre, tema, unidad, fuente, periodicidad, decimales, polaridad (±1), agregación, numerador/denominador |
| `tema`, `unidad`, `fuente` | Catálogos normalizados (unidades de TerriData unificadas: %, tasas, $…) |
| `periodo` | `A2024`, `T2025-2`, `M2025-03`, `C2018` con fechas de inicio/fin |
| `desagregacion` | Total, sexo, grupos de edad, zona |
| `dato` | Valor numérico o texto, estado (publicado / provisional / estimado) y carga de origen |
| `mapa_clasificacion` | Método de rangos (cuantiles, intervalos iguales, Jenks, manual), nº de clases, paleta |

## Instalación

Requisitos: PostgreSQL 14+ con PostGIS 3, Python 3.10+ (`pip install psycopg2-binary pandas shapely`).

**Opción rápida (restaurar la base ya cargada):**

```bash
createdb tulua
psql -d tulua -c "CREATE EXTENSION postgis; CREATE EXTENSION unaccent;"
pg_restore -d tulua --no-owner db/tulua_cifras.dump
```

**Opción completa (recargar desde las fuentes):**

```bash
psql -d tulua -f db/01_esquema.sql -f db/02_vistas_funciones.sql
export TULUA_DSN="dbname=tulua user=... password=... host=localhost"
cd etl
python 01_cargar_territorios.py
python 02_cargar_terridata.py
python 03_cargar_cnpv2018.py
python 04_cargar_accidentalidad.py
psql -d tulua -f ../db/03_configuracion.sql
python 05_exportar_web.py
python 06_exportar_tableau.py   # paquete para Tableau Public
python 08_cargar_anuario.py     # anuario estadístico municipal
python 07_exportar_compendio.py # datos de las páginas temáticas
```

**Web:** `cd web && python -m http.server 8000` y abrir http://localhost:8000. Se puede subir la carpeta `web/` tal cual a cualquier hosting estático.

## Fuentes (data/raw)

| Archivo | Origen |
|---|---|
| `TerriData_Valle.txt` (133 MB, en tu carpeta Descargas) | DNP TerriData, descarga completa TXT (actualización 7-ago-2026), filtrada a Colombia (01) y Valle (76) |
| `dane_tulua.json` | DANE Geoportal: MGN 2018 integrado con CNPV 2018 (municipios del Valle; sectores, secciones y manzanas de Tuluá) y capa de comunas 2018 |
| `tulua_barrios_fuentes.json` | datos.gov.co: Accidentalidad vehicular de Tuluá (`ezt8-5wyj`), Puntos Innova, Juntas de Acción Comunal; OpenStreetMap (puntos de barrios) |
| `barrios_comunas_tulua.csv` | Listado de barrios por comuna (Alcaldía de Tuluá, recogido en Wikipedia) |
| `anuario_2025.xlsx`, `linea_base_sociales.xlsx`, `linea_base_economicos.xlsx` | Anuario Estadístico 2025 de la Alcaldía de Tuluá (hay que descargarlos a mano: la web pide captcha) |

## Consultas útiles

```sql
SET search_path = cifras, public;
-- Ficha de Tuluá con referencia departamental y nacional
SELECT * FROM v_ficha WHERE cod_territorio = '76834';
-- Ranking de homicidio intencional 2025 en el Valle
SELECT * FROM fn_ranking('TD060010013', 'MUN', 2025, '76');
-- GeoJSON listo para un mapa de comunas (internet en viviendas, 5 cuantiles)
SELECT fn_geojson_mapa('CNPV_INT', 'COM', 'C2018', '76834', 5, 'cuantiles');
```

## Limitaciones conocidas

- **Barrios**: no hay polígonos oficiales publicados. Se cargan los 132 barrios por comuna y 60 tienen punto de referencia (OpenStreetMap). Cuando Planeación Municipal entregue el shapefile, basta con actualizar `territorio.geom` de nivel `BAR` y reasignar manzanas a barrios con `ST_Contains`.
- «El Limonar» y «Río Paila» aparecen en dos comunas en el listado de origen; se asignaron a una sola (7 y 8).
- Los conteos del Censo 2018 no están ajustados por omisión; las proyecciones DANE de TerriData sí.
- La población por barrio y corregimiento del anuario municipal es una estimación de la Alcaldía a partir de la base predial: cambió de metodología en 2021 y su suma no coincide con la población del DANE. Sirve para comparar barrios entre sí, no como cifra oficial.
- Accidentalidad: el año en curso es parcial; la mitad de los registros no traen un nombre de barrio reconocible (sí coordenadas, por eso comunas y secciones están completas).

## Páginas temáticas

`web/compendio.js` define los temas (una pestaña cada uno) y sus tarjetas en la constante `SECCIONES`. Cada tarjeta indica su tipo de gráfico (`serie`, `indice`, `multiserie`, `apiladas`, `piramide`, `dona`, `comparadas`, `ranking`, `comunas`, `comunas100`, `cultivos`, `mapa`) y los códigos de indicador que usa. Cada tema abre con un mapa (indicador, unidad territorial y periodo seleccionables) y sigue con sus gráficos. Para añadir un gráfico basta con añadir una tarjeta y ejecutar `python etl/07_exportar_compendio.py`, que lee los códigos del propio archivo. Los temas funcionan con cualquier municipio del Valle elegido en el selector de territorio (el de comunas solo aparece para Tuluá).
