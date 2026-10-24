/* Tuluá en Cifras · Compendio de indicadores en gráficos
   Depende de: app.js (window.TC) y Chart.js 4 (window.Chart). */
(() => {
"use strict";

/* ------------------------------------------------------------------ especificación
   Cada tarjeta declara qué indicadores usa; 07_exportar_compendio.py lee este archivo
   y exporta sólo esos códigos. Tipos: serie, indice, multiserie, apiladas, piramide,
   dona, comparadas, ranking, comunas, comunas100, cultivos, mapa, cifras            */
const REF = ["DEP:76", "PAIS:CO"];
const SECCIONES = [
  { id: "demografia", t: "Demografía", tab: "Demografía",
    intro: "Tamaño, estructura y dinámica de la población según las proyecciones del DANE con base en el Censo 2018.",
    cifras: ["TD010010009", "TD010010010", "TD020040003", "TD020090031"],
    cards: [
      { t: "Población total", sub: "Habitantes · proyección DANE (línea discontinua: años futuros)", tipo: "serie", ind: "TD010010009", refs: [], w: 1 },
      { t: "Estructura de la población", sub: "Pirámide por sexo y grupos quinquenales", tipo: "piramide",
        h: rango("TD020010", 1, 17), m: rango("TD020020", 1, 17),
        grupos: ["0-4", "5-9", "10-14", "15-19", "20-24", "25-29", "30-34", "35-39", "40-44", "45-49", "50-54", "55-59", "60-64", "65-69", "70-74", "75-79", "80+"] },
      { t: "Población por sexo", tipo: "dona", semi: true, inds: ["TD020030002", "TD020030001"], etiquetas: ["Mujeres", "Hombres"] },
      { t: "Población urbana y rural", tipo: "dona", inds: ["TD020040001", "TD020040002"], etiquetas: ["Urbana", "Rural"] },
      { t: "Grandes grupos de edad", sub: "% de la población", tipo: "comparadas", inds: ["TD020090013", "TD020090016", "TD020090017"],
        etiquetas: ["Menores de 15", "15 a 59", "60 y más"] },
      { t: "Variación de la población respecto a 2005", sub: "Índice 2005 = 100", tipo: "indice", ind: "TD010010009", base: 2005 },
      { t: "Índice de envejecimiento", sub: "Personas de 60 y más años por cada 100 menores de 15", tipo: "serie", ind: "TD020090031" },
      { t: "Tasa de dependencia", sub: "Dependientes (menores de 15 y mayores de 59) por cada 100 personas de 15 a 59", tipo: "serie", ind: "TD020090030" },
      { t: "Población en los municipios vecinos", sub: "Habitantes · último año publicado", tipo: "ranking", ind: "TD010010009", grupo: "VECINOS" },
      { t: "Población estimada por barrio", sub: "20 barrios más poblados · estimación de la Alcaldía a partir de la base predial", tipo: "territorios", nivel: "BAR", ind: "AN_POB_BAR", n: 20, w: 2 },
      { t: "Población estimada por corregimiento", sub: "Zona rural · estimación de la Alcaldía", tipo: "territorios", nivel: "COR", ind: "AN_POB_BAR", n: 24, w: 2 },
    ] },
  { id: "salud", t: "Salud", tab: "Salud",
    intro: "Aseguramiento, natalidad y mortalidad infantil (Ministerio de Salud y DANE, estadísticas vitales).",
    cifras: ["TD050010007", "TD050020003", "TD050020043"],
    cards: [
      { t: "Afiliados al sistema de salud por régimen", sub: "Personas", tipo: "apiladas", inds: ["TD050010001", "TD050010002", "TD050010005"],
        etiquetas: ["Contributivo", "Subsidiado", "Especiales"] },
      { t: "Mortalidad infantil (menores de 1 año)", sub: "Defunciones por cada 1.000 nacidos vivos", tipo: "serie", ind: "TD050020003" },
      { t: "Fecundidad adolescente (15 a 19 años)", sub: "Nacidos vivos por cada 1.000 mujeres de 15 a 19 años", tipo: "serie", ind: "TD050020043" },
      { t: "Cobertura de vacunación", sub: "% de la población objetivo", tipo: "multiserie", inds: ["TD050020005", "TD050020019"],
        etiquetas: ["Pentavalente (<1 año)", "Triple viral"] },
      { t: "Nacidos vivos con bajo peso", sub: "% de nacidos vivos", tipo: "serie", ind: "TD050020006" },
      { t: "Nacidos vivos con 4 o más controles prenatales", sub: "% de nacidos vivos", tipo: "serie", ind: "TD050020007" },
      { t: "Natalidad y mortalidad general", sub: "Tasas por cada 1.000 habitantes · Secretaría de Salud Municipal", tipo: "multiserie",
        inds: ["LB_TASA_BRUTA_NATALIDAD", "LB_MORTALIDAD_GENERAL"], etiquetas: ["Natalidad", "Mortalidad general"] },
      { t: "Camas de hospitalización", sub: "Por cada 10.000 habitantes · anuario municipal", tipo: "serie", ind: "LB_CAMAS_HOSPITALIZACION" },
    ] },
  { id: "educacion", t: "Educación", tab: "Educación",
    intro: "Cobertura, permanencia y resultados del sistema educativo (Ministerio de Educación e ICFES).",
    cifras: ["TD040010012", "TD040040001", "CNPV_EDSUP"],
    cards: [
      { t: "Cobertura neta por nivel", sub: "% · último año", tipo: "comparadas", inds: ["TD040010007", "TD040010008", "TD040010009", "TD040010010"],
        etiquetas: ["Transición", "Primaria", "Secundaria", "Media"] },
      { t: "Cobertura neta total", sub: "%", tipo: "serie", ind: "TD040010012" },
      { t: "Pruebas Saber 11 · Matemáticas", sub: "Puntaje promedio", tipo: "serie", ind: "TD040040001" },
      { t: "Pruebas Saber 11 · Lectura crítica", sub: "Puntaje promedio", tipo: "serie", ind: "TD040040002" },
      { t: "Deserción escolar intra-anual", sub: "% de transición a once", tipo: "serie", ind: "TD040020004" },
      { t: "Tránsito inmediato a la educación superior", sub: "% de bachilleres", tipo: "serie", ind: "TD040010028" },
      { t: "Educación superior o posgrado por comuna", sub: "% de personas · Censo 2018", tipo: "comunas", ind: "CNPV_EDSUP" },
      { t: "Analfabetismo y asistencia escolar", sub: "% · Censo 2018", tipo: "comparadas", inds: ["TD040030003", "TD040030006"],
        etiquetas: ["Analfabetismo", "Asistencia 5 a 24 años"] },
      { t: "Cobertura neta según la Secretaría de Educación", sub: "% · línea base municipal", tipo: "multiserie",
        inds: ["LB_COBERTURA_NETA_TOTAL_EDU", "LB_COBERTURA_NETA_PRIMARIA", "LB_COBERTURA_NETA_SECUND", "LB_COBERTURA_NETA_MEDIA_EDU"],
        etiquetas: ["Total", "Primaria", "Secundaria", "Media"] },
      { t: "Analfabetismo (Sisbén IV)", sub: "% de la población sisbenizada de 15 años y más", tipo: "serie", ind: "LB_ANALFABETISMO" },
      { t: "Matrícula oficial con conexión a internet", sub: "% de la matrícula", tipo: "serie", ind: "LB_INST_OFICIAL_CON_INTERNET" },
    ] },
  { id: "vivienda", t: "Vivienda y servicios públicos", tab: "Vivienda",
    intro: "Coberturas de acueducto, alcantarillado, aseo y conectividad, y estratificación de las viviendas.",
    cifras: ["TD030010005", "TD030010007", "TD030010045"],
    cards: [
      { t: "Coberturas en zona urbana", sub: "% · Reporte de Estratificación y Coberturas (REC)", tipo: "comparadas",
        inds: ["TD030010010", "TD030010014", "TD030010020", "TD030010062"], etiquetas: ["Acueducto", "Alcantarillado", "Aseo", "Energía"] },
      { t: "Coberturas en zona rural", sub: "% · REC", tipo: "comparadas",
        inds: ["TD030010011", "TD030010015", "TD030010021", "TD030010002"], etiquetas: ["Acueducto", "Alcantarillado", "Aseo", "Energía"] },
      { t: "Penetración de internet fijo", sub: "Accesos por cada 100 habitantes · trimestral", tipo: "serie", ind: "TD030010003" },
      { t: "Cobertura de acueducto", sub: "% · REC", tipo: "serie", ind: "TD030010005" },
      { t: "Estratificación de las viviendas por comuna", sub: "% de viviendas · Censo 2018", tipo: "comunas100",
        inds: ["CNPV_EST12", "CNPV_EST3", "CNPV_EST456"], etiquetas: ["Estratos 1 y 2", "Estrato 3", "Estratos 4 a 6"] },
      { t: "Viviendas con internet y gas natural por comuna", sub: "% de viviendas · Censo 2018", tipo: "comunas",
        inds: ["CNPV_INT", "CNPV_GAS"], etiquetas: ["Internet", "Gas natural"] },
      { t: "Déficit de vivienda", sub: "Hogares · línea base municipal", tipo: "multiserie", barras: true,
        inds: ["LB_DEFICIT_CUANTITATIVO_VIVIEN_TOT", "LB_DEFICIT_CUALITATIVO_VIVIEND_TOT"], etiquetas: ["Cuantitativo", "Cualitativo"] },
      { t: "Hogares con acceso a internet", sub: "% de hogares · anuario municipal", tipo: "serie", ind: "LB_HOGARES_ACCESO_INTERNET" },
      { t: "Predios urbanos por barrio", sub: "20 barrios con más predios · base predial municipal", tipo: "territorios", nivel: "BAR", ind: "AN_PREDIOS", n: 20, w: 2 },
      { t: "Área construida por barrio", sub: "Metros cuadrados · 20 primeros · base predial municipal", tipo: "territorios", nivel: "BAR", ind: "AN_AREACONS", n: 20, w: 2 },
    ] },
  { id: "pobreza", t: "Pobreza y vulnerabilidad", tab: "Pobreza",
    intro: "Pobreza multidimensional y necesidades básicas insatisfechas (censos 2005 y 2018) y clasificación del Sisbén IV.",
    cifras: ["TD140030015", "TD140060001", "TD140060004"],
    cards: [
      { t: "Pobreza multidimensional (IPM)", sub: "% de personas · censos 2005 y 2018", tipo: "comparadas", modo: "periodos",
        inds: ["TD140030015", "TD140030016", "TD140030017"], etiquetas: ["Total", "Cabecera", "Rural"] },
      { t: "Necesidades básicas insatisfechas (NBI)", sub: "% de personas · censos 2005 y 2018", tipo: "comparadas", modo: "periodos",
        inds: ["TD140060001", "TD140060002", "TD140060003"], etiquetas: ["Total", "Cabecera", "Rural"] },
      { t: "Componentes del NBI", sub: "% de personas · Censo 2018", tipo: "comparadas",
        inds: ["TD140060007", "TD140060010", "TD140060013", "TD140060016", "TD140060019"],
        etiquetas: ["Vivienda inadecuada", "Servicios inadecuados", "Hacinamiento crítico", "Inasistencia escolar", "Dependencia económica"] },
      { t: "Pobreza multidimensional censal (Alcaldía)", sub: "% · línea base municipal", tipo: "serie", ind: "LB_POBREZA_MULTIDIMENSIONAL" },
      { t: "Brecha de pobreza extrema urbano-rural", sub: "Puntos porcentuales · línea base municipal", tipo: "serie", ind: "LB_BRECHA_POBREZA_URBANO_RURAL" },
      { t: "Personas en el Sisbén IV por grupo", sub: "A: pobreza extrema · B: pobreza moderada · C: vulnerable · D: no pobre", tipo: "dona",
        inds: ["TD020110004", "TD020110005", "TD020110006", "TD020110007"], etiquetas: ["Grupo A", "Grupo B", "Grupo C", "Grupo D"] },
    ] },
  { id: "economia", t: "Estructura productiva", tab: "Economía",
    intro: "Valor agregado municipal por grandes ramas (DANE) y principales cultivos (Evaluaciones Agropecuarias).",
    cifras: ["TD120210001", "TD120210002", "TD120210004"],
    cards: [
      { t: "Valor agregado por grandes actividades", sub: "Miles de millones de pesos corrientes", tipo: "apiladas",
        inds: ["TD120210005", "TD120210006", "TD120210007"], etiquetas: ["Primarias", "Secundarias", "Terciarias"] },
      { t: "Peso de Tuluá en el valor agregado del Valle", sub: "% del departamento", tipo: "serie", ind: "TD120210004", refs: [] },
      { t: "Valor agregado per cápita", sub: "Pesos corrientes", tipo: "serie", ind: "TD120210002" },
      { t: "Valor agregado por habitante en los municipios vecinos", sub: "Pesos corrientes · último año", tipo: "ranking", ind: "TD120210002", grupo: "VECINOS" },
      { t: "Principales cultivos", sub: "Toneladas producidas · último año", tipo: "cultivos",
        nombres: ["TD120290001", "TD120290004", "TD120290007", "TD120290010", "TD120290013"],
        valores: ["TD120290002", "TD120290005", "TD120290008", "TD120290011", "TD120290014"] },
      { t: "Empresas vigentes", sub: "Cámara de Comercio · anuario municipal", tipo: "serie", ind: "LB_EMPRESAS_VIG" },
      { t: "Densidad empresarial", sub: "Empresas por cada 1.000 habitantes", tipo: "serie", ind: "LB_DENSIDAD_EMP" },
      { t: "Unidades económicas por comuna", sub: "Unidades no residenciales · Censo 2018", tipo: "comunas", apilado: true,
        inds: ["CNPV_UCOM", "CNPV_USER", "CNPV_UIND"], etiquetas: ["Comercio", "Servicios", "Industria"] },
    ] },
  { id: "empleo", t: "Mercado de trabajo", tab: "Empleo",
    intro: "Empleo formal según la Planilla Integrada de Liquidación de Aportes (PILA). La Gran Encuesta Integrada de Hogares no es representativa a nivel municipal.",
    cifras: ["TD160030001", "TD160090001"],
    cards: [
      { t: "Trabajadores cotizantes a la seguridad social", sub: "Promedio mensual", tipo: "serie", ind: "TD160030001", refs: [] },
      { t: "Cotizantes por sexo", sub: "Trabajadores", tipo: "apiladas", inds: ["TD160060001", "TD160060002"], etiquetas: ["Hombres", "Mujeres"] },
      { t: "Cotizantes por edad", sub: "% del total · último año", tipo: "comparadas",
        inds: ["TD160050001", "TD160050002", "TD160050003", "TD160050004", "TD160050005", "TD160050006"],
        etiquetas: ["17 o menos", "18 a 28", "29 a 40", "41 a 50", "51 a 59", "60 y más"] },
      { t: "Ocupación formal", sub: "% de la población total", tipo: "serie", ind: "TD160090001" },
      { t: "Mercado laboral municipal", sub: "% · cálculos de la Alcaldía con Sisbén IV", tipo: "multiserie",
        inds: ["LB_TGP", "LB_TO", "LB_TD", "LB_TASA_INACTIVIDAD"], etiquetas: ["Participación (TGP)", "Ocupación (TO)", "Desempleo (TD)", "Inactividad"] },
    ] },
  { id: "finanzas", t: "Finanzas y gestión pública", tab: "Finanzas",
    intro: "Ejecuciones presupuestales (FUT), transferencias del SGP y medición del desempeño fiscal y municipal (DNP).",
    cifras: ["TD070130012", "TD080010008", "TD070010018"],
    cards: [
      { t: "Ingresos y gastos totales", sub: "Millones de pesos corrientes", tipo: "multiserie", inds: ["TD070010001", "TD070010006"],
        etiquetas: ["Ingresos totales", "Gastos totales"], barras: true },
      { t: "Recaudo por habitante", sub: "Pesos corrientes", tipo: "multiserie", inds: ["TD070010021", "TD070010022"],
        etiquetas: ["Impuesto predial", "Industria y comercio"] },
      { t: "Índice de Desempeño Fiscal", sub: "Puntaje de 0 a 100 (nueva metodología)", tipo: "serie", ind: "TD070130012" },
      { t: "Dependencia de las transferencias", sub: "% de los ingresos", tipo: "serie", ind: "TD070130001" },
      { t: "Sistema General de Participaciones por destino", sub: "Pesos · último año", tipo: "dona",
        inds: ["TD070070001", "TD070070002", "TD070070003", "TD070070007", "TD070070009", "TD070070004", "TD070070005"],
        etiquetas: ["Educación", "Salud", "Agua potable", "Libre inversión", "Alimentación escolar", "Deporte", "Cultura"], otros: 4 },
      { t: "Medición del Desempeño Municipal", sub: "Puntaje de 0 a 100", tipo: "multiserie", inds: ["TD080010008", "TD080010002", "TD080010005"],
        etiquetas: ["MDM", "Gestión", "Resultados"] },
      { t: "Resultados del MDM por sector", sub: "Puntaje · último año", tipo: "comparadas", ref: "grupo",
        inds: ["TD080030001", "TD080030002", "TD080030003", "TD080030004"], etiquetas: ["Educación", "Salud", "Servicios públicos", "Seguridad"] },
      { t: "Ingresos por habitante en los municipios vecinos", sub: "Pesos corrientes · último año", tipo: "ranking", ind: "TD070010018", grupo: "VECINOS" },
    ] },
  { id: "seguridad", t: "Seguridad y convivencia", tab: "Seguridad",
    intro: "Tasas de delitos por cada 100.000 habitantes (Ministerio de Defensa y Medicina Legal) y accidentalidad vial registrada por la Alcaldía.",
    cifras: ["TD060010013", "TD060010001", "ACC_TOTAL"],
    cards: [
      { t: "Homicidio intencional", sub: "Tasa por cada 100.000 habitantes", tipo: "serie", ind: "TD060010013" },
      { t: "Hurto a personas", sub: "Tasa por cada 100.000 habitantes", tipo: "serie", ind: "TD060010001" },
      { t: "Violencia intrafamiliar", sub: "Tasa por cada 100.000 habitantes", tipo: "serie", ind: "TD060020001" },
      { t: "Delitos sexuales", sub: "Tasa por cada 100.000 habitantes", tipo: "serie", ind: "TD060020026" },
      { t: "Homicidio intencional en los municipios vecinos", sub: "Tasa por cada 100.000 habitantes · último año", tipo: "ranking", ind: "TD060010013", grupo: "VECINOS" },
      { t: "Víctimas del conflicto ubicadas en el municipio", sub: "Personas", tipo: "multiserie", inds: ["TD260030001", "TD260030002"],
        etiquetas: ["Víctimas ubicadas", "De desplazamiento forzado"] },
    ] },
  { id: "movilidad", t: "Movilidad y accidentalidad", tab: "Movilidad",
    intro: "Parque automotor, motorización y siniestralidad vial, con los accidentes que publica la Alcaldía georreferenciados por comuna.",
    cifras: ["LB_PARQUE_AUTOMOTOR", "LB_VEHICULOS_X_HABITANTES", "ACC_TOTAL"],
    cards: [
      { t: "Parque automotor", sub: "Vehículos matriculados en el municipio", tipo: "serie", ind: "LB_PARQUE_AUTOMOTOR" },
      { t: "Motorización", sub: "Vehículos y motocicletas por habitante", tipo: "multiserie",
        inds: ["LB_VEHICULOS_X_HABITANTES", "LB_MOTOCICLETAS_POR_HABITANTE"], etiquetas: ["Vehículos por habitante", "Motocicletas por habitante"] },
      { t: "Muertes y lesiones en accidentes de transporte", sub: "Tasas por cada 100.000 habitantes", tipo: "multiserie",
        inds: ["LB_MUERTES_ACCIDENTES_DE_TRANSITO", "LB_LESIONADOS_ACC_TRANS"], etiquetas: ["Muertes", "Lesionados"] },
      { t: "Homicidios en accidentes de tránsito", sub: "Tasa por cada 100.000 habitantes · DNP", tipo: "serie", ind: "TD060010012" },
      { t: "Accidentes de tránsito registrados", sub: "Alcaldía de Tuluá · el año en curso es parcial", tipo: "serie", ind: "ACC_TOTAL", refs: [] },
      { t: "Accidentes de tránsito por comuna", sub: "Accidentes registrados por año (el año en curso es parcial)", tipo: "comunas", ind: "ACC_TOTAL", porAnio: true, w: 2 },
    ] },
  { id: "comunas", t: "Tuluá por comunas", tab: "Comunas", soloFoco: true, nivelPref: "COM",
    intro: "Radiografía intraurbana con el Censo Nacional de Población y Vivienda 2018 agregado por comuna desde las manzanas.",
    cards: [
      { t: "Densidad de población por comuna", sub: "Habitantes por km² · Censo 2018", tipo: "comunas", ind: "CNPV_DENS" },
      { t: "Población censada por comuna", sub: "Personas · Censo 2018", tipo: "comunas", ind: "CNPV_POB" },
      { t: "Población de 60 y más años", sub: "% · Censo 2018", tipo: "comunas", ind: "CNPV_P60" },
      { t: "Personas por hogar", sub: "Censo 2018", tipo: "comunas", ind: "CNPV_PERHOG" },
      { t: "Viviendas con acueducto y alcantarillado", sub: "% · Censo 2018", tipo: "comunas", inds: ["CNPV_ACU", "CNPV_ALC"], etiquetas: ["Acueducto", "Alcantarillado"] },
      { t: "Viviendas tipo apartamento", sub: "% · Censo 2018", tipo: "comunas", ind: "CNPV_APTO" },
    ] },
];
function rango(pref, a, b) { const o = []; for (let k = a; k <= b; k++) o.push(pref + String(k).padStart(3, "0")); return o; }
window.COMPENDIO_SPEC = SECCIONES;

/* ------------------------------------------------------------------ utilidades */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
let D = null;             // datos del compendio
let charts = [];
let obs = null;
let tcActual = null;

const TC = () => window.TC;
const tok = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const paleta = () => [tok("--c1"), tok("--c2"), tok("--c3"), tok("--c4"), tok("--c5"), tok("--c6")];
const serieDe = (ic, tc) => ((D.d[ic] || {})[tc] || []).filter((r) => r[1] !== null && r[1] !== "");
const nombreT = (tc) => ({ "DEP:76": "Valle del Cauca", "PAIS:CO": "Colombia" }[tc] || TC().S.terr[tc]?.n || tc);
const fut = (p) => TC().S.per[p]?.fut;
function ultimoComun(inds, tcs, permitirFut = false) {
  // periodo más reciente en el que existe al menos el primer territorio para todos los indicadores
  const sets = inds.map((ic) => new Set(serieDe(ic, tcs[0]).map((r) => r[0]).filter((p) => permitirFut || !fut(p))));
  const todos = [...sets[0]].filter((p) => sets.every((s) => s.has(p)));
  const lista = (todos.length ? todos : [...sets.flatMap((s) => [...s])]).sort((a, b) => TC().xPer(a) - TC().xPer(b));
  return lista[lista.length - 1];
}
const valor = (ic, tc, p) => { const r = serieDe(ic, tc).find((x) => x[0] === p); return r ? r[1] : null; };
// agrega a años (último valor publicado de cada año) para mezclar series anuales, trimestrales y mensuales
function porAnio(ic, tc) {
  const o = {};
  serieDe(ic, tc).forEach((r) => { if (typeof r[1] === "number" && !fut(r[0])) o[TC().S.per[r[0]]?.y ?? r[0]] = r[1]; });
  return o;
}
const fuenteDe = (ic) => TC().S.cat.fuentes[TC().S.ind[ic]?.f]?.n || "";

async function cargar() {
  if (!D) D = await TC().getJSON("compendio.json");
  return D;
}

/* ------------------------------------------------------------------ render por tema */
let secActual = null;
window.olvidarTema = () => { secActual = null; };
window.reajustarGraficos = () => charts.forEach((ch) => { if (ch.resize && ch.update) { ch.resize(); ch.update("none"); } });

async function renderTema(secId) {
  const S = TC().S;
  let tc = S.t;
  if (S.terr[tc]?.nv !== "MUN") tc = S.cat.foco;
  const esFoco = tc === S.cat.foco;
  const secs = SECCIONES.filter((sec) => !sec.soloFoco || esFoco);
  const sec = secs.find((x) => x.id === secId) || secs[0];
  $$("#navTemas button").forEach((b) => (b.hidden = b.dataset.view.startsWith("tema:") && !secs.some((x) => "tema:" + x.id === b.dataset.view)));
  tcActual = tc;
  if (secActual === sec.id + "|" + tc) return;
  secActual = sec.id + "|" + tc;
  charts.forEach((c) => c.destroy && c.destroy());
  charts = [];
  if (obs) obs.disconnect();
  const body = $("#cmpBody");
  body.innerHTML = `<p class="loading">Preparando los gráficos…</p>`;
  const clave = sec.id + "|" + tc;
  await cargar();
  if (secActual !== clave) return;
  if (!window.Chart) { body.innerHTML = `<p class="note">No se pudo cargar la librería de gráficos.</p>`; return; }
  configurarChart();
  const t = S.terr[tc];
  const i = secs.indexOf(sec);
  body.innerHTML = `
    <header class="tema-head">
      <div><div class="eyebrow">${TC().esc(t.n)} · tema ${i + 1} de ${secs.length}</div>
        <h1>${TC().esc(sec.t)}</h1><p class="note">${TC().esc(sec.intro)}</p>
        <button type="button" class="btn pri btn-pdf" data-pdf>Descargar informe PDF</button></div>
      <div class="cmp-cifras">${(sec.cifras || []).map((ic) => cifra(ic, tc)).join("")}</div>
    </header>
    <div class="cmp-grid" id="temaGrid">
      <article class="cmp-card panel ancho mapa" data-mapa="1">
        <header><h3>Mapa del tema</h3><p class="note">Elige el indicador y la unidad territorial; los rangos son cuantiles de 5 clases.</p></header>
        <div class="cmp-viz"><div class="cmp-ph">Cargando mapa…</div></div>
        <footer><span class="note cmp-fte"></span>
          <span class="cmp-acc"><button class="btn mini" data-acc="tabla" aria-pressed="false">Tabla</button>
            <button class="btn mini" data-acc="mapafull">Explorar todos los indicadores</button></span></footer>
      </article>
      ${sec.cards.map((c, j) => `
        <article class="cmp-card panel${c.w === 2 ? " ancho" : ""}" data-sec="${sec.id}" data-card="${j}">
          <header><h3>${TC().esc(c.t)}</h3>${c.sub ? `<p class="note">${TC().esc(c.sub)}</p>` : ""}</header>
          <div class="cmp-viz"><div class="cmp-ph">Cargando gráfico…</div></div>
          <footer><span class="note cmp-fte"></span>
            <span class="cmp-acc"><button class="btn mini" data-acc="tabla" aria-pressed="false">Tabla</button>${indPrincipal(c) ? `<button class="btn mini" data-acc="ind">Ver indicador</button>` : ""}</span></footer>
        </article>`).join("")}
    </div>
    <nav class="tema-otros" aria-label="Otros temas">
      ${secs.map((x, k) => `<button class="btn${x.id === sec.id ? " pri" : ""}" data-tema="${x.id}">${k + 1}. ${TC().esc(x.t)}</button>`).join("")}
    </nav>`;
  $$("[data-tema]", body).forEach((b) => b.addEventListener("click", () => TC().mostrar("tema:" + b.dataset.tema)));
  $("[data-pdf]", body).addEventListener("click", (e) => informeTema(sec, tc, e.currentTarget));
  window.scrollTo({ top: 0, behavior: "auto" });

  const tarjetaMapa = $(".cmp-card.mapa", body);
  mapaTema(sec, $(".cmp-viz", tarjetaMapa), tc, tarjetaMapa);
  obs = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (!en.isIntersecting) return;
    obs.unobserve(en.target);
    pintar(en.target, tc);
  }), { rootMargin: "300px 0px" });
  $$(".cmp-card[data-card]", body).forEach((el) => obs.observe(el));
}

async function informeTema(sec, tc, btn) {
  const txt = btn.textContent;
  btn.disabled = true; btn.textContent = "Preparando informe…";
  try {
    const body = $("#cmpBody");
    if (obs) obs.disconnect();
    for (const el of $$(".cmp-card[data-card]", body)) if ($(".cmp-ph", el)) await pintar(el, tc);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const nom = TC().S.terr[tc].n;
    const cif = $$(".cmp-cifra", body).map((el) => ({ v: $("b", el).textContent, l: $("span", el).textContent }));
    const bl = [{ t: "p", texto: sec.intro }];
    if (cif.length) bl.push({ t: "h", texto: "Cifras clave" }, { t: "cifras", items: cif });
    bl.push({ t: "h", texto: "Gráficos del tema" });
    for (const el of $$(".cmp-card[data-card]", body)) {
      const c = sec.cards[+el.dataset.card], fte = $(".cmp-fte", el).textContent;
      if ($("canvas", el)) bl.push({ t: "img", titulo: c.t, sub: c.sub, fuente: fte, canvas: window.EXP.lienzo(el, {}, false) });
      else if (el._tabla) bl.push({ t: "tabla", titulo: c.t, cols: el._tabla.cols, filas: el._tabla.filas, fuente: fte });
    }
    bl.push({ t: "nota", texto: "Los mapas interactivos y el detalle de cada indicador están disponibles en la versión web del observatorio. Informe generado el " + window.EXP.hoyTxt() + "." });
    await window.EXP.pdf({ titulo: sec.t + " - " + nom, sub: "Informe temático · " + nom, bloques: bl, nombre: "tulua_informe_" + window.EXP.slug(sec.t + "_" + nom) });
  } catch (err) {
    console.error(err); window.EXP && window.EXP.aviso("No se pudo generar el informe PDF.");
  } finally { btn.disabled = false; btn.textContent = txt; }
}

function indPrincipal(c) { return c.ind || (c.inds && c.inds[0]) || (c.valores && c.valores[0]) || null; }

function cifra(ic, tc) {
  const S = TC().S, ind = S.ind[ic];
  if (!ind) return "";
  const s = serieDe(ic, tc).filter((r) => !fut(r[0]) && typeof r[1] === "number");
  const u = s[s.length - 1];
  if (!u) return "";
  return `<div class="cmp-cifra"><b class="num">${TC().esc(TC().fmt(u[1], ic, true))}</b><span>${TC().esc(TC().nombreInd(ic))} · ${TC().esc(TC().perTxt(u[0]))}</span></div>`;
}

function seguirIndice() {
  const links = $$("#cmpIndex a");
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting) links.forEach((a) => a.classList.toggle("activo", "cmp-" + a.dataset.sec === en.target.id));
  }), { rootMargin: "-30% 0px -60% 0px" });
  $$(".cmp-sec").forEach((s) => io.observe(s));
}

/* ------------------------------------------------------------------ Chart.js */
function configurarChart() {
  const C = window.Chart;
  C.defaults.font.family = getComputedStyle(document.body).fontFamily;
  C.defaults.font.size = 12;
  C.defaults.color = tok("--muted");
  C.defaults.borderColor = tok("--line");
  C.defaults.maintainAspectRatio = false;
  // No reemplazar el objeto: Chart.js perdería los tipos de interpolación y fallaría (this._fn is not a function)
  C.defaults.animation.duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 350;
  C.defaults.plugins.legend.labels.boxWidth = 12;
  C.defaults.plugins.legend.labels.boxHeight = 12;
  C.defaults.plugins.legend.labels.color = tok("--ink-2");
  C.defaults.plugins.legend.position = "top";
  C.defaults.plugins.legend.align = "start";
  C.defaults.plugins.tooltip.backgroundColor = tok("--surface");
  C.defaults.plugins.tooltip.titleColor = tok("--ink");
  C.defaults.plugins.tooltip.bodyColor = tok("--ink-2");
  C.defaults.plugins.tooltip.borderColor = tok("--line-2");
  C.defaults.plugins.tooltip.borderWidth = 1;
  C.defaults.plugins.tooltip.padding = 10;
  C.defaults.plugins.tooltip.boxPadding = 4;
  C.defaults.plugins.tooltip.usePointStyle = true;
  C.defaults.elements.line.borderWidth = 2;
  C.defaults.elements.point.radius = 0;
  C.defaults.elements.point.hoverRadius = 5;
  C.defaults.elements.bar.borderRadius = 3;
}
const ejeY = (ic, extra = {}) => ({
  grid: { color: tok("--line") }, border: { display: false },
  ticks: { callback: (v) => corta(v, ic) }, ...extra,
});
function corta(v, ic) {
  const a = Math.abs(v);
  const ut = TC().S.ind[ic]?.ut;
  const suf = ut === "porcentaje" ? " %" : "";
  if (a >= 1e9) return nf(1, v / 1e9) + " mil M";
  if (a >= 1e6) return nf(1, v / 1e6) + " M";
  if (a >= 1e4) return nf(0, v / 1e3) + " mil";
  return nf(a < 10 ? 1 : 0, v) + suf;
}
const _nf = {};
function nf(d, v) { return (_nf[d] ||= new Intl.NumberFormat("es-CO", { maximumFractionDigits: d })).format(v); }
const colorT = (tc, k) => {
  const p = paleta();
  if (tc === tcActual) return p[0];
  if (tc === "DEP:76") return p[1];
  if (tc === "PAIS:CO") return p[2];
  return p[3 + (k % 3)];
};

function nuevoCanvas(box, alto = 280) {
  box.innerHTML = `<div class="cmp-canvas" style="height:${alto}px"><canvas role="img"></canvas></div>`;
  return $("canvas", box);
}
function registrar(ch, card, tabla) {
  charts.push(ch);
  card._tabla = tabla;
}

async function pintar(card, tc) {
  const sec = SECCIONES.find((s) => s.id === card.dataset.sec);
  const c = sec.cards[+card.dataset.card];
  const box = $(".cmp-viz", card);
  try {
    const fn = { serie, indice, multiserie, apiladas, piramide, dona, comparadas, ranking, comunas, comunas100: comunas, territorios, cultivos, mapa }[c.tipo];
    const info = await fn(c, box, tc, card);
    $(".cmp-fte", card).textContent = info ? `Fuente: ${info.fuente}${info.periodo ? " · " + info.periodo : ""}` : "";
    if (info && window.EXP) window.EXP.menu(card, { titulo: c.t, sub: c.sub, terr: nombreT(tc), fuente: $(".cmp-fte", card).textContent.replace(/^Fuente: /, "") });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const cv = $("canvas", box), ch = cv && window.Chart && window.Chart.getChart(cv);
      if (ch) { ch.resize(); ch.update("none"); }
    }));
    if (!info) { box.innerHTML = `<p class="cmp-vacio">Sin datos publicados para ${TC().esc(nombreT(tc))}.</p>`; $(".cmp-acc", card).hidden = true; }
  } catch (err) {
    console.error(c.t, err);
    box.innerHTML = `<p class="cmp-vacio">No se pudo dibujar este gráfico.</p>`;
  }
  $$("button[data-acc]", card).forEach((b) => b.addEventListener("click", () => accion(b, card, c, tc)));
}

function accion(b, card, c, tc) {
  if (b.dataset.acc === "ind") return TC().irIndicador(indPrincipal(c));
  if (b.dataset.acc === "mapafull") { TC().S.mapa.pendiente = card._ind || null; return TC().mostrar("mapa"); }
  const on = b.getAttribute("aria-pressed") !== "true";
  b.setAttribute("aria-pressed", on);
  let t = $(".cmp-tabla", card);
  if (!on) { t && t.remove(); return; }
  const tab = card._tabla;
  if (!tab) return;
  const html = `<div class="cmp-tabla tbl-wrap"><table><thead><tr>${tab.cols.map((h) => `<th>${TC().esc(h)}</th>`).join("")}</tr></thead><tbody>` +
    tab.filas.map((f) => `<tr>${f.map((v, k) => `<td class="${k ? "num" : ""}">${TC().esc(v)}</td>`).join("")}</tr>`).join("") + `</tbody></table></div>`;
  $(".cmp-viz", card).insertAdjacentHTML("afterend", html);
}

/* ---------- serie temporal: territorio + referencias; tramo futuro discontinuo */
async function serie(c, box, tc) {
  const ic = c.ind;
  const tcs = [tc].concat(c.refs || REF);
  const base = serieDe(c.ind, tc).filter((r) => typeof r[1] === "number");
  if (!base.length) return null;
  const xmin = TC().xPer(base[0][0]), xmax = TC().xPer(base[base.length - 1][0]);
  const ds = tcs.map((t) => ({ t, pts: serieDe(c.ind, t).filter((r) => typeof r[1] === "number"
      && (t === tc || (r[1] !== 0 && TC().xPer(r[0]) >= xmin && TC().xPer(r[0]) <= xmax))) })).filter((x) => x.pts.length);
  const hoy = TC().HOY;
  const cfg = {
    type: "line",
    data: { datasets: ds.map((x, k) => ({
      label: nombreT(x.t), borderColor: colorT(x.t, k), backgroundColor: colorT(x.t, k),
      borderWidth: x.t === tc ? 2.5 : 2,
      data: x.pts.map((r) => ({ x: TC().xPer(r[0]), y: r[1], p: r[0] })),
      pointRadius: x.pts.length <= 14 ? 3 : 0,
      segment: { borderDash: (s) => (s.p1.parsed.x > hoy ? [5, 4] : undefined) },
    })) },
    options: {
      interaction: { mode: "nearest", axis: "x", intersect: false },
      plugins: {
        legend: { display: ds.length > 1 },
        tooltip: { callbacks: { title: (it) => TC().perTxt(it[0].raw.p) + (fut(it[0].raw.p) ? " (proyección)" : ""), label: (it) => ` ${it.dataset.label}: ${TC().fmt(it.parsed.y, ic)}` } },
      },
      scales: {
        x: { type: "linear", min: xmin, max: xmax, grid: { display: false }, ticks: { callback: (v) => (Number.isInteger(v) ? String(v) : ""), maxTicksLimit: 9 } },
        y: ejeY(ic),
      },
    },
  };
  const ch = new Chart(nuevoCanvas(box), cfg);
  const pers = [...new Set(ds.flatMap((x) => x.pts.map((r) => r[0])))].sort((a, b) => TC().xPer(a) - TC().xPer(b));
  registrar(ch, box.closest(".cmp-card"), { cols: ["Periodo", ...ds.map((x) => nombreT(x.t))], filas: pers.map((p) => [TC().perTxt(p), ...ds.map((x) => TC().fmt(valor(ic, x.t, p), ic))]) });
  const ult = ds[0].pts.filter((r) => !fut(r[0])).pop();
  return { fuente: fuenteDe(ic), periodo: `${TC().perTxt(ds[0].pts[0][0])}–${TC().perTxt(ds[0].pts[ds[0].pts.length - 1][0])}${ult ? "" : ""}` };
}

/* ---------- índice base 100 */
async function indice(c, box, tc) {
  const ic = c.ind, bp = "A" + c.base, hoy = TC().HOY;
  const tcs = [tc, ...REF];
  const ds = tcs.map((t) => {
    const b = valor(ic, t, bp);
    const lim = TC().xPer((serieDe(ic, tc).slice(-1)[0] || [])[0]);
    const pts = serieDe(ic, t).filter((r) => typeof r[1] === "number" && TC().xPer(r[0]) >= c.base && TC().xPer(r[0]) <= lim && b);
    return { t, pts: pts.map((r) => ({ x: TC().xPer(r[0]), y: (r[1] / b) * 100, p: r[0] })) };
  }).filter((x) => x.pts.length);
  if (!ds.length || ds[0].t !== tc) return null;
  const ch = new Chart(nuevoCanvas(box), {
    type: "line",
    data: { datasets: ds.map((x, k) => ({ label: nombreT(x.t), data: x.pts, borderColor: colorT(x.t, k), backgroundColor: colorT(x.t, k),
      segment: { borderDash: (s) => (s.p1.parsed.x > hoy ? [5, 4] : undefined) } })) },
    options: {
      interaction: { mode: "nearest", axis: "x", intersect: false },
      plugins: { tooltip: { callbacks: { title: (it) => TC().perTxt(it[0].raw.p), label: (it) => ` ${it.dataset.label}: ${nf(1, it.parsed.y)}` } } },
      scales: { x: { type: "linear", grid: { display: false }, ticks: { callback: (v) => (Number.isInteger(v) ? String(v) : "") } },
        y: { grid: { color: tok("--line") }, border: { display: false } } },
    },
  });
  registrar(ch, box.closest(".cmp-card"), { cols: ["Año", ...ds.map((x) => nombreT(x.t))],
    filas: ds[0].pts.map((p, i) => [TC().perTxt(p.p), ...ds.map((x) => { const q = x.pts.find((z) => z.p === p.p); return q ? nf(1, q.y) : "—"; })]) });
  return { fuente: fuenteDe(ic), periodo: `${c.base} = 100` };
}

/* ---------- varias series de un mismo territorio (líneas o barras) */
async function multiserie(c, box, tc) {
  const p = paleta();
  const ds = c.inds.map((ic, k) => ({ ic, k, y: porAnio(ic, tc) })).filter((x) => Object.keys(x.y).length);
  if (!ds.length) return null;
  const anios = [...new Set(ds.flatMap((x) => Object.keys(x.y)))].map(Number).sort((a, b) => a - b);
  const ic0 = c.inds[0];
  const ch = new Chart(nuevoCanvas(box), {
    type: c.barras ? "bar" : "line",
    data: { labels: anios.map(String), datasets: ds.map((x) => ({
      label: c.etiquetas[x.k], borderColor: p[x.k], backgroundColor: p[x.k],
      data: anios.map((a) => x.y[a] ?? null), spanGaps: true, pointRadius: anios.length <= 14 ? 3 : 0,
    })) },
    options: {
      interaction: { mode: "index", intersect: false },
      plugins: { tooltip: { callbacks: { label: (it) => ` ${it.dataset.label}: ${TC().fmt(it.parsed.y, ds[it.datasetIndex].ic)}` } } },
      scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } }, y: ejeY(ic0) },
    },
  });
  registrar(ch, box.closest(".cmp-card"), { cols: ["Año", ...ds.map((x) => c.etiquetas[x.k])], filas: anios.map((a) => [String(a), ...ds.map((x) => TC().fmt(x.y[a] ?? null, x.ic))]) });
  return { fuente: fuenteDe(ic0), periodo: `${anios[0]}–${anios[anios.length - 1]}` };
}

/* ---------- barras apiladas en el tiempo */
async function apiladas(c, box, tc) {
  const p = paleta();
  const ys = c.inds.map((ic) => porAnio(ic, tc));
  const anios = [...new Set(ys.flatMap((y) => Object.keys(y)))].map(Number).sort((a, b) => a - b)
    .filter((a) => ys.every((y) => y[a] !== undefined));
  if (!anios.length) return null;
  const ic0 = c.inds[0];
  const ch = new Chart(nuevoCanvas(box), {
    type: "bar",
    data: { labels: anios.map(String), datasets: c.inds.map((ic, k) => ({
      label: c.etiquetas[k], backgroundColor: p[k], borderColor: tok("--surface"), borderWidth: { top: 2 },
      data: anios.map((a) => ys[k][a]),
    })) },
    options: {
      interaction: { mode: "index", intersect: false },
      plugins: { tooltip: { callbacks: {
        label: (it) => ` ${it.dataset.label}: ${TC().fmt(it.parsed.y, c.inds[it.datasetIndex])}`,
        footer: (its) => "Total: " + TC().fmt(its.reduce((a, i) => a + (i.parsed.y || 0), 0), ic0) } } },
      scales: { x: { stacked: true, grid: { display: false } }, y: { ...ejeY(ic0), stacked: true } },
    },
  });
  registrar(ch, box.closest(".cmp-card"), { cols: ["Año", ...c.etiquetas], filas: anios.map((a) => [String(a), ...c.inds.map((ic, k) => TC().fmt(ys[k][a], ic))]) });
  return { fuente: fuenteDe(ic0), periodo: `${anios[0]}–${anios[anios.length - 1]}` };
}

/* ---------- pirámide con selector de año */
async function piramide(c, box, tc, card) {
  const hoy = TC().HOY;
  const pers = serieDe(c.h[0], tc).map((r) => r[0]).sort();
  if (!pers.length) return null;
  let per = pers.includes("A" + hoy) ? "A" + hoy : pers.filter((p) => !fut(p)).pop();
  box.innerHTML = `<div class="cmp-ctrl"><label for="pir-${card.dataset.sec}">Año</label>
      <input type="range" id="pir-${card.dataset.sec}" min="0" max="${pers.length - 1}" step="1" value="${pers.indexOf(per)}">
      <output class="num"></output></div><div class="cmp-canvas" style="height:380px"><canvas role="img" aria-label="Pirámide de población"></canvas></div>`;
  const out = $("output", box), rg = $("input", box);
  const p = paleta();
  const datos = (q) => {
    const h = c.h.map((ic) => valor(ic, tc, q) || 0), m = c.m.map((ic) => valor(ic, tc, q) || 0);
    const tot = h.reduce((a, b) => a + b, 0) + m.reduce((a, b) => a + b, 0) || 1;
    return { h: h.map((v) => -(v / tot) * 100), m: m.map((v) => (v / tot) * 100), hA: h, mA: m, tot };
  };
  let d0 = datos(per);
  const lim = Math.ceil(Math.max(...pers.flatMap((q) => { const d = datos(q); return [...d.m, ...d.h.map(Math.abs)]; })));
  const ch = new Chart($("canvas", box), {
    type: "bar",
    data: { labels: c.grupos.slice(), datasets: [
      { label: "Mujeres", data: d0.m, backgroundColor: p[0], borderRadius: 2 },
      { label: "Hombres", data: d0.h, backgroundColor: tok("--line-2"), borderRadius: 2 },
    ] },
    options: {
      indexAxis: "y",
      interaction: { mode: "index", intersect: false },
      plugins: { tooltip: { callbacks: { label: (it) => { const abs = it.datasetIndex ? d0.hA[it.dataIndex] : d0.mA[it.dataIndex];
        return ` ${it.dataset.label}: ${nf(0, abs)} (${nf(1, Math.abs(it.parsed.x))} %)`; } } } },
      scales: {
        x: { stacked: true, min: -lim, max: lim, grid: { color: tok("--line") }, ticks: { callback: (v) => nf(0, Math.abs(v)) + " %" } },
        y: { stacked: true, reverse: true, grid: { display: false } },
      },
    },
  });
  const pintarAnio = () => {
    const mayores = d0.mA.slice(13).concat(d0.hA.slice(13)).reduce((x, y) => x + y, 0);
    out.textContent = TC().perTxt(per) + (fut(per) ? " · proyección" : "") + " · " + nf(0, d0.tot) + " personas · " + nf(1, (mayores / d0.tot) * 100) + " % con 65 años o más";
    card._tabla = { cols: ["Grupo de edad", "Mujeres", "Hombres"], filas: c.grupos.map((g, i) => [g, nf(0, d0.mA[i]), nf(0, d0.hA[i])]) };
  };
  rg.addEventListener("input", () => { per = pers[+rg.value]; d0 = datos(per); ch.data.datasets[0].data = d0.m; ch.data.datasets[1].data = d0.h; ch.update(); pintarAnio(); });
  charts.push(ch);
  pintarAnio();
  return { fuente: fuenteDe(c.h[0]), periodo: `${TC().perTxt(pers[0])}–${TC().perTxt(pers[pers.length - 1])}` };
}

/* ---------- dona / semidona (último periodo común) */
async function dona(c, box, tc) {
  const per = ultimoComun(c.inds, [tc]);
  if (!per) return null;
  let vals = c.inds.map((ic) => valor(ic, tc, per) || 0);
  let labels = c.etiquetas.slice();
  if (c.otros && vals.length > c.otros) {
    const resto = vals.slice(c.otros).reduce((a, b) => a + b, 0);
    vals = vals.slice(0, c.otros).concat(resto);
    labels = labels.slice(0, c.otros).concat("Otros destinos");
  }
  const tot = vals.reduce((a, b) => a + b, 0);
  if (!tot) return null;
  const p = paleta();
  const cols = labels.map((_, k) => (c.semi && k === 1 ? tok("--line-2") : p[k % p.length]));
  const ch = new Chart(nuevoCanvas(box, 260), {
    type: "doughnut",
    data: { labels, datasets: [{ data: vals, backgroundColor: cols, borderColor: tok("--surface"), borderWidth: 2 }] },
    options: {
      cutout: c.semi ? "58%" : "60%",
      rotation: c.semi ? -90 : 0, circumference: c.semi ? 180 : 360,
      plugins: {
        legend: { position: "right", align: "center" },
        tooltip: { callbacks: { label: (it) => ` ${it.label}: ${TC().fmt(it.parsed, c.inds[Math.min(it.dataIndex, c.inds.length - 1)])} (${nf(1, (it.parsed / tot) * 100)} %)` } },
      },
    },
    plugins: [{ id: "centro", afterDraw(chart) {
      const { ctx, chartArea: a } = chart;
      const meta = chart.getDatasetMeta(0).data[0];
      if (!meta) return;
      ctx.save();
      ctx.fillStyle = tok("--ink"); ctx.textAlign = "center";
      ctx.font = `700 18px ${getComputedStyle(document.body).fontFamily}`;
      const y = c.semi ? meta.y - 8 : meta.y + 2;
      ctx.fillText(nf(1, (vals[0] / tot) * 100) + " %", meta.x, y);
      ctx.font = `12px ${getComputedStyle(document.body).fontFamily}`; ctx.fillStyle = tok("--muted");
      ctx.fillText(labels[0].toLowerCase(), meta.x, y + 16);
      ctx.restore();
    } }],
  });
  registrar(ch, box.closest(".cmp-card"), { cols: ["Categoría", "Valor", "%"], filas: labels.map((l, k) => [l, TC().fmt(vals[k], c.inds[Math.min(k, c.inds.length - 1)]), nf(1, (vals[k] / tot) * 100) + " %"]) });
  return { fuente: fuenteDe(c.inds[0]), periodo: TC().perTxt(per) };
}

/* ---------- barras comparadas: categorías × (territorio, Valle, Colombia) o × periodos */
async function comparadas(c, box, tc) {
  const p = paleta();
  let series, per;
  if (c.modo === "periodos") {
    const pers = [...new Set(c.inds.flatMap((ic) => serieDe(ic, tc).map((r) => r[0])))].sort();
    if (!pers.length) return null;
    series = pers.map((q, k) => ({ label: `${nombreT(tc)} ${TC().perTxt(q)}`, color: k === pers.length - 1 ? p[0] : tok("--line-2"),
      vals: c.inds.map((ic) => valor(ic, tc, q)) }));
    const pl = pers[pers.length - 1];
    series.push({ label: `Valle del Cauca ${TC().perTxt(pl)}`, color: p[1], vals: c.inds.map((ic) => valor(ic, "DEP:76", pl)) });
    per = pers.map((q) => TC().perTxt(q)).join(" y ");
  } else {
    const q = ultimoComun(c.inds, [tc]);
    if (!q) return null;
    per = TC().perTxt(q);
    const tcs = [tc, ...REF];
    series = tcs.map((t, k) => ({ label: nombreT(t), color: colorT(t, k), vals: c.inds.map((ic) => valor(ic, t, q)) }))
      .filter((s) => s.vals.some((v) => typeof v === "number"));
  }
  if (!series.length || !series[0].vals.some((v) => typeof v === "number")) return null;
  const ic0 = c.inds[0];
  const horizontal = c.etiquetas.some((e) => e.length > 14) || c.inds.length > 4;
  const ch = new Chart(nuevoCanvas(box, horizontal ? Math.max(240, c.inds.length * series.length * 16 + 60) : 280), {
    type: "bar",
    data: { labels: c.etiquetas, datasets: series.map((s) => ({ label: s.label, data: s.vals, backgroundColor: s.color, borderColor: tok("--surface"), borderWidth: 1 })) },
    options: {
      indexAxis: horizontal ? "y" : "x",
      interaction: { mode: "index", intersect: false },
      plugins: { tooltip: { callbacks: { label: (it) => ` ${it.dataset.label}: ${TC().fmt(horizontal ? it.parsed.x : it.parsed.y, c.inds[it.dataIndex])}` } } },
      scales: horizontal
        ? { x: ejeY(ic0), y: { grid: { display: false } } }
        : { x: { grid: { display: false } }, y: ejeY(ic0) },
    },
  });
  registrar(ch, box.closest(".cmp-card"), { cols: ["Categoría", ...series.map((s) => s.label)], filas: c.etiquetas.map((e, k) => [e, ...series.map((s) => TC().fmt(s.vals[k], c.inds[k]))]) });
  return { fuente: fuenteDe(ic0), periodo: per };
}

/* ---------- ranking en un grupo de municipios (o todo el Valle) */
async function ranking(c, box, tc) {
  const S = TC().S;
  const ic = c.ind;
  let miembros = (S.cat.grupos[c.grupo]?.m || []).slice();
  if (tc !== S.cat.foco || !miembros.length) miembros = S.cat.territorios.filter((t) => t.nv === "MUN").map((t) => t.c);
  if (!miembros.includes(tc)) miembros.push(tc);
  const q = ultimoComun([ic], [tc]);
  if (!q) return null;
  const filas = miembros.map((m) => [m, valor(ic, m, q)]).filter((f) => typeof f[1] === "number").sort((a, b) => b[1] - a[1]);
  const vd = valor(ic, "DEP:76", q);
  const p = paleta();
  const ch = new Chart(nuevoCanvas(box, Math.max(220, filas.length * 26 + 50)), {
    type: "bar",
    data: { labels: filas.map((f) => S.terr[f[0]].n), datasets: [{ data: filas.map((f) => f[1]),
      backgroundColor: filas.map((f) => (f[0] === tc ? p[0] : tok("--line-2"))) }] },
    options: {
      indexAxis: "y",
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (it) => " " + TC().fmt(it.parsed.x, ic) } } },
      scales: { x: ejeY(ic), y: { grid: { display: false }, ticks: { color: tok("--ink-2") } } },
    },
    plugins: [refLinea(vd, "Valle")],
  });
  registrar(ch, box.closest(".cmp-card"), { cols: ["Municipio", "Valor"], filas: filas.map((f) => [S.terr[f[0]].n, TC().fmt(f[1], ic)]) });
  return { fuente: fuenteDe(ic), periodo: TC().perTxt(q) };
}
function refLinea(v, txt) {
  return { id: "ref", afterDatasetsDraw(chart) {
    if (typeof v !== "number") return;
    const { ctx, chartArea: a, scales } = chart;
    const x = scales.x.getPixelForValue(v);
    if (x < a.left || x > a.right) return;
    ctx.save();
    ctx.strokeStyle = tok("--ink"); ctx.setLineDash([4, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, a.top); ctx.lineTo(x, a.bottom); ctx.stroke();
    ctx.setLineDash([]);
    etiqueta(ctx, `${txt}: ${corta(v)}`, x, a.bottom + 2, x > a.right - 80 ? "right" : "left", a);
    ctx.restore();
  } };
}

function etiqueta(ctx, txt, x, y, align, a) {
  ctx.font = `600 11px ${getComputedStyle(document.body).fontFamily}`;
  const w = ctx.measureText(txt).width + 10, h = 16;
  let x0 = align === "right" ? x - w : x;
  x0 = Math.max(a.left, Math.min(x0, a.right - w));
  ctx.fillStyle = tok("--surface"); ctx.strokeStyle = tok("--ink"); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x0, y, w, h, 3) : ctx.rect(x0, y, w, h); ctx.fill(); ctx.stroke();
  ctx.fillStyle = tok("--ink"); ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText(txt, x0 + 5, y + h / 2 + 0.5);
}

/* ---------- comunas (barras simples, agrupadas, apiladas, 100 % o por año) */
async function comunas(c, box, tc) {
  const S = TC().S;
  const coms = S.cat.territorios.filter((t) => t.nv === "COM").map((t) => t.c);
  const p = paleta();
  const inds = c.inds || [c.ind];
  let labels = coms.map((k) => S.terr[k].n.replace("Comuna ", "C"));
  let datasets, per, cols, filas;
  if (c.porAnio) {
    const pers = [...new Set(coms.flatMap((k) => serieDe(c.ind, k).map((r) => r[0])))].sort();
    if (!pers.length) return null;
    datasets = pers.map((q, j) => ({ label: TC().perTxt(q) + (TC().S.per[q]?.y >= TC().HOY ? " (parcial)" : ""),
      data: coms.map((k) => valor(c.ind, k, q) || 0), backgroundColor: p[j % p.length], borderColor: tok("--surface"), borderWidth: { top: 1 } }));
    per = `${TC().perTxt(pers[0])}–${TC().perTxt(pers[pers.length - 1])}`;
    cols = ["Comuna", ...datasets.map((d) => d.label)];
    filas = coms.map((k, i) => [S.terr[k].n, ...datasets.map((d) => nf(0, d.data[i]))]);
  } else {
    const q = ultimoComun(inds, [coms[0]]);
    if (!q) return null;
    per = TC().perTxt(q);
    const refMun = inds.map((ic) => valor(ic, "MUN:76834", q));
    datasets = inds.map((ic, j) => ({ label: c.etiquetas ? c.etiquetas[j] : TC().nombreInd(ic), data: coms.map((k) => valor(ic, k, q)),
      backgroundColor: inds.length === 1 ? p[0] : p[j % p.length], borderColor: tok("--surface"), borderWidth: c.tipo === "comunas100" || c.apilado ? { top: 1 } : 0 }));
    cols = ["Comuna", ...datasets.map((d) => d.label)];
    filas = coms.map((k, i) => [S.terr[k].n, ...inds.map((ic, j) => TC().fmt(datasets[j].data[i], ic))]);
    if (refMun.every((v) => typeof v === "number") && c.tipo !== "comunas100" && !c.apilado && TC().S.ind[inds[0]].ut !== "absoluto") {
      filas.push(["Tuluá (municipio)", ...inds.map((ic, j) => TC().fmt(refMun[j], ic))]);
      if (inds.length === 1) c._ref = refMun[0];
    }
  }
  const apilar = c.tipo === "comunas100" || c.apilado || c.porAnio;
  const ic0 = inds[0];
  const ch = new Chart(nuevoCanvas(box, 280), {
    type: "bar",
    data: { labels, datasets },
    options: {
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: datasets.length > 1 },
        tooltip: { callbacks: {
          title: (it) => S.terr[coms[it[0].dataIndex]].n,
          label: (it) => ` ${it.dataset.label}: ${c.porAnio ? nf(0, it.parsed.y) : TC().fmt(it.parsed.y, inds[it.datasetIndex] || ic0)}` } },
      },
      scales: {
        x: { stacked: apilar, grid: { display: false } },
        y: { ...ejeY(ic0), stacked: apilar, ...(c.tipo === "comunas100" ? { max: 100 } : {}),
          ticks: { callback: (v) => (c.porAnio ? nf(0, v) : corta(v, ic0)) } },
      },
    },
    plugins: c._ref !== undefined ? [refLineaY(c._ref, "Tuluá", ic0)] : [],
  });
  registrar(ch, box.closest(".cmp-card"), { cols, filas });
  return { fuente: fuenteDe(ic0), periodo: per };
}
function refLineaY(v, txt, ic) {
  return { id: "refy", afterDatasetsDraw(chart) {
    const { ctx, chartArea: a, scales } = chart;
    const y = scales.y.getPixelForValue(v);
    if (y < a.top || y > a.bottom) return;
    ctx.save();
    ctx.strokeStyle = tok("--ink"); ctx.setLineDash([4, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(a.left, y); ctx.lineTo(a.right, y); ctx.stroke();
    ctx.setLineDash([]);
    etiqueta(ctx, `${txt}: ${TC().fmt(v, ic)}`, a.right, y - 18, "right", a);
    ctx.restore();
  } };
}

/* ---------- barras por barrio o corregimiento (los N mayores del último periodo) */
async function territorios(c, box, tc) {
  const S = TC().S;
  const lista = S.cat.territorios.filter((t) => t.nv === c.nivel && (!t.cod_mpio || t.cod_mpio === "76834")).map((t) => t.c);
  if (!lista.length) return null;
  // periodo más reciente con datos en al menos el 60 % de los territorios
  const pers = [...new Set(lista.flatMap((k) => serieDe(c.ind, k).filter((r) => !fut(r[0])).map((r) => r[0])))]
    .sort((x, y) => TC().xPer(x) - TC().xPer(y));
  const cobertura = (q) => lista.filter((k) => (valor(c.ind, k, q) || 0) > 0).length / lista.length;
  const per = [...pers].reverse().find((q) => cobertura(q) >= 0.6) || pers[pers.length - 1];
  if (!per) return null;
  const todas = lista.map((k) => [k, valor(c.ind, k, per)]).filter((f) => typeof f[1] === "number").sort((a, b) => b[1] - a[1]);
  if (!todas.length) return null;
  const filas = todas.slice(0, c.n || 20);
  const p = paleta();
  const ch = new Chart(nuevoCanvas(box, Math.max(220, filas.length * 20 + 50)), {
    type: "bar",
    data: { labels: filas.map((f) => S.terr[f[0]].n), datasets: [{ data: filas.map((f) => f[1]), backgroundColor: p[0] }] },
    options: {
      indexAxis: "y",
      plugins: { legend: { display: false }, tooltip: { callbacks: {
        label: (it) => " " + TC().fmt(it.parsed.x, c.ind),
        afterLabel: (it) => { const t = S.terr[filas[it.dataIndex][0]]; return t.com ? "Comuna " + Number(t.com) : ""; } } } },
      scales: { x: ejeY(c.ind), y: { grid: { display: false }, ticks: { color: tok("--ink-2"), autoSkip: false, font: { size: 11 } } } },
    },
  });
  registrar(ch, box.closest(".cmp-card"), {
    cols: [c.nivel === "COR" ? "Corregimiento" : "Barrio", "Comuna", TC().nombreInd(c.ind)],
    filas: todas.map(([k, v]) => [S.terr[k].n, S.terr[k].com ? "Comuna " + Number(S.terr[k].com) : "—", TC().fmt(v, c.ind)]),
  });
  return { fuente: fuenteDe(c.ind), periodo: TC().perTxt(per) + (todas.length > filas.length ? ` · ${filas.length} de ${todas.length}, la tabla trae todos` : "") };
}

/* ---------- principales cultivos (nombre en texto + toneladas) */
async function cultivos(c, box, tc) {
  const q = ultimoComun([c.valores[0]], [tc]);
  if (!q) return null;
  const filas = c.nombres.map((n, k) => [valor(n, tc, q), valor(c.valores[k], tc, q)]).filter((f) => f[0] && typeof f[1] === "number");
  if (!filas.length) return null;
  const p = paleta();
  const ch = new Chart(nuevoCanvas(box, Math.max(200, filas.length * 34 + 40)), {
    type: "bar",
    data: { labels: filas.map((f) => cap(String(f[0]).toLowerCase())), datasets: [{ data: filas.map((f) => f[1]), backgroundColor: p[0] }] },
    options: { indexAxis: "y", plugins: { legend: { display: false }, tooltip: { callbacks: { label: (it) => ` ${nf(0, it.parsed.x)} t` } } },
      scales: { x: { grid: { color: tok("--line") }, ticks: { callback: (v) => corta(v) + " t" } }, y: { grid: { display: false }, ticks: { color: tok("--ink-2") } } } },
  });
  registrar(ch, box.closest(".cmp-card"), { cols: ["Cultivo", "Toneladas"], filas: filas.map((f) => [cap(String(f[0]).toLowerCase()), nf(0, f[1])]) });
  return { fuente: fuenteDe(c.valores[0]), periodo: TC().perTxt(q) };
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- mapa coroplético (municipios del Valle o comunas) */
async function mapa(c, box, tc, card) {
  if (!window.L) return null;
  const nivel = c.nivel || "MUN";
  const S = TC().S;
  const geo = await TC().getJSON(nivel === "COM" ? "geo_comunas.json" : "geo_municipios.json");
  const feats = geo.features.filter((f) => S.terr[f.properties.c]?.nv === nivel);
  const ref = nivel === "COM" ? feats[0].properties.c : tc;
  const q = ultimoComun([c.ind], [ref]);
  if (!q) return null;
  const vals = Object.fromEntries(feats.map((f) => [f.properties.c, valor(c.ind, f.properties.c, q)]));
  const vs = Object.values(vals).filter((v) => typeof v === "number").sort((a, b) => a - b);
  const n = 4;
  const br = [0, 1, 2, 3, 4].map((k) => vs[Math.min(vs.length - 1, Math.round((k / n) * (vs.length - 1)))]);
  const rampa = ["#d7efe3", "#74c3a1", "#1f8761", "#0a4a34"];
  const clase = (v) => { if (typeof v !== "number") return -1; for (let k = 1; k <= n; k++) if (v <= br[k]) return k - 1; return n - 1; };
  box.innerHTML = `<div class="cmp-map" id="map-${card.dataset.sec}-${card.dataset.card}"></div><div class="cmp-leyenda"></div>`;
  const m = L.map($(".cmp-map", box), { zoomControl: false, attributionControl: false, scrollWheelZoom: false });
  const cnt = [0, 0, 0, 0];
  const capa = L.geoJSON({ type: "FeatureCollection", features: feats }, {
    style: (f) => { const k = clase(vals[f.properties.c]); if (k >= 0) cnt[k]++;
      const foco = f.properties.c === tc;
      return { fillColor: k < 0 ? tok("--nodata") : rampa[k], fillOpacity: 1, color: foco ? tok("--ink") : tok("--surface"), weight: foco ? 2.5 : 0.8 }; },
    onEachFeature: (f, l) => l.bindTooltip(`<b>${TC().esc(S.terr[f.properties.c].n)}</b><br>${TC().esc(TC().fmt(vals[f.properties.c], c.ind))}`, { className: "tt", sticky: true }),
  }).addTo(m);
  m.fitBounds(capa.getBounds(), { padding: [6, 6] });
  capa.eachLayer((l) => { if (l.feature.properties.c === tc) l.bringToFront(); });
  L.control.zoom({ position: "topright" }).addTo(m);
  $(".cmp-leyenda", box).innerHTML = rampa.map((col, k) =>
    `<span><i style="background:${col}"></i>${TC().esc(corta(br[k], c.ind))} – ${TC().esc(corta(br[k + 1], c.ind))} <em>(${cnt[k]})</em></span>`).join("");
  setTimeout(() => m.invalidateSize(), 60);
  charts.push({ destroy: () => m.remove() });
  const orden = Object.entries(vals).filter((e) => typeof e[1] === "number").sort((a, b) => b[1] - a[1]);
  card._tabla = { cols: [nivel === "COM" ? "Comuna" : "Municipio", "Valor"], filas: orden.map(([k, v]) => [S.terr[k].n, TC().fmt(v, c.ind)]) };
  return { fuente: fuenteDe(c.ind), periodo: TC().perTxt(q) + " · rangos por cuartiles" };
}

/* ---------- mapa del tema: selector de indicador y de unidad territorial */
function indsDeSeccion(sec) {
  const o = [];
  sec.cards.forEach((c) => { (c.inds || (c.ind ? [c.ind] : [])).forEach((ic) => { if (!o.includes(ic) && TC().S.ind[ic] && !TC().S.ind[ic].nomap) o.push(ic); }); });
  return o;
}
function nivelesCon(ic) {
  const S = TC().S, dd = D.d[ic] || {};
  const n = { MUN: 0, COM: 0 };
  Object.keys(dd).forEach((k) => { const nv = S.terr[k]?.nv; if (n[nv] !== undefined && serieDe(ic, k).length) n[nv]++; });
  return n;
}
async function mapaTema(sec, box, tc, card) {
  if (!window.L) { box.innerHTML = `<p class="cmp-vacio">Mapa no disponible sin conexión.</p>`; return; }
  const S = TC().S;
  const inds = indsDeSeccion(sec).filter((ic) => { const n = nivelesCon(ic); return n.MUN >= 8 || n.COM >= 5; });
  if (!inds.length) { card.remove(); return; }
  let ic = inds.find((x) => nivelesCon(x).MUN >= 8) || inds[0];
  let nivel = sec.nivelPref && nivelesCon(ic)[sec.nivelPref] >= 5 ? sec.nivelPref : (nivelesCon(ic).MUN >= 8 ? "MUN" : "COM");
  box.innerHTML = `<div class="cmp-mapctrl">
      <select id="mt-ind-${sec.id}" aria-label="Indicador del mapa"></select>
      <select id="mt-niv-${sec.id}" aria-label="Unidad territorial"></select>
      <select id="mt-per-${sec.id}" aria-label="Periodo"></select>
    </div><div class="cmp-map"></div><div class="cmp-leyenda"></div>`;
  const selI = $(`#mt-ind-${sec.id}`, box), selN = $(`#mt-niv-${sec.id}`, box), selP = $(`#mt-per-${sec.id}`, box);
  selI.innerHTML = inds.map((x) => `<option value="${x}">${TC().esc(TC().nombreInd(x, false))}</option>`).join("");
  selI.value = ic;
  const m = L.map($(".cmp-map", box), { zoomSnap: 0.25, attributionControl: false, scrollWheelZoom: false, zoomControl: false });
  L.control.zoom({ position: "topright" }).addTo(m);
  charts.push({ destroy: () => m.remove() });
  let capa = null, per = null;

  const opcionesNivel = () => {
    const n = nivelesCon(ic);
    const ops = [];
    if (n.MUN >= 8) ops.push(["MUN", "Municipios del Valle"]);
    if (n.COM >= 5) ops.push(["COM", "Comunas de Tuluá"]);
    if (!ops.some((o) => o[0] === nivel)) nivel = ops[0][0];
    selN.innerHTML = ops.map(([v, t]) => `<option value="${v}">${t}</option>`).join("");
    selN.value = nivel;
    selN.disabled = ops.length < 2;
  };
  const opcionesPeriodo = () => {
    const ref = nivel === "COM" ? S.cat.territorios.find((x) => x.nv === "COM").c : tc;
    const pers = serieDe(ic, ref).map((r) => r[0]).filter((p) => !fut(p));
    const lista = pers.length ? pers : serieDe(ic, ref).map((r) => r[0]);
    if (!lista.includes(per)) per = lista[lista.length - 1];
    selP.innerHTML = lista.slice().reverse().map((p) => `<option value="${p}">${TC().esc(TC().perTxt(p))}</option>`).join("");
    selP.value = per;
    selP.disabled = lista.length < 2;
    return lista.length > 0;
  };

  async function dibujar(encuadrar) {
    opcionesNivel();
    if (!opcionesPeriodo()) return;
    const geo = await TC().getJSON(nivel === "COM" ? "geo_comunas.json" : "geo_municipios.json");
    const feats = geo.features.filter((f) => S.terr[f.properties.c]?.nv === nivel);
    const vals = Object.fromEntries(feats.map((f) => [f.properties.c, valor(ic, f.properties.c, per)]));
    const vs = Object.values(vals).filter((v) => typeof v === "number").sort((a, b) => a - b);
    const n = 5;
    const q = (k) => vs[Math.min(vs.length - 1, Math.round((k / n) * (vs.length - 1)))];
    const br = [...new Set([0, 1, 2, 3, 4, 5].map(q))];
    const pol = S.ind[ic].p;
    const ramp = { 1: ["#d7efe3", "#a9dcc4", "#74c3a1", "#3fa67d", "#1f8761"], "-1": ["#fbdcd6", "#f5b2a6", "#ec8676", "#dc5b49", "#c03e30"],
      0: ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf"] }[pol] || ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf"];
    const nc = Math.max(1, br.length - 1);
    const cols = ramp.filter((_, k) => k < nc);
    const clase = (v) => { if (typeof v !== "number") return -1; for (let k = 1; k < br.length; k++) if (v <= br[k]) return k - 1; return nc - 1; };
    const cnt = new Array(nc).fill(0);
    let sin = 0;
    if (capa) m.removeLayer(capa);
    capa = L.geoJSON({ type: "FeatureCollection", features: feats }, {
      style: (f) => { const k = clase(vals[f.properties.c]); if (k < 0) sin++; else cnt[k]++;
        const foco = f.properties.c === tc;
        return { fillColor: k < 0 ? tok("--nodata") : cols[k], fillOpacity: 1, color: foco ? tok("--ink") : tok("--map-stroke"), weight: foco ? 2.5 : 0.9 }; },
      onEachFeature: (f, l) => {
        l.bindTooltip(`<b>${TC().esc(S.terr[f.properties.c].n)}</b><br>${TC().esc(TC().fmt(vals[f.properties.c], ic))}`, { className: "tt", sticky: true });
        l.on("mouseover", () => l.setStyle({ weight: 2.5, color: tok("--context") }));
        l.on("mouseout", () => capa.resetStyle(l));
        l.on("click", () => { if (S.terr[f.properties.c].nv === "MUN") TC().irTerritorio(f.properties.c, "tema:" + sec.id); });
      },
    }).addTo(m);
    if (encuadrar) m.fitBounds(capa.getBounds(), { padding: [10, 10] });
    setTimeout(() => m.invalidateSize(), 50);
    $(".cmp-leyenda", box).innerHTML = cols.map((c2, k) =>
      `<span><i style="background:${c2}"></i>${TC().esc(corta(br[k], ic))} – ${TC().esc(corta(br[k + 1], ic))} <em>(${cnt[k]})</em></span>`).join("") +
      (sin ? `<span><i style="background:${tok("--nodata")}"></i>Sin dato <em>(${sin})</em></span>` : "");
    $(".cmp-fte", card).textContent = `Fuente: ${fuenteDe(ic)} · ${TC().perTxt(per)} · ${TC().unidadTxt(ic)}`;
    const orden = Object.entries(vals).filter((e) => typeof e[1] === "number").sort((a, b) => b[1] - a[1]);
    card._tabla = { cols: [nivel === "COM" ? "Comuna" : "Municipio", TC().nombreInd(ic)], filas: orden.map(([k, v]) => [S.terr[k].n, TC().fmt(v, ic)]) };
    card._ind = ic;
  }
  selI.addEventListener("change", () => { ic = selI.value; per = null; dibujar(true); });
  selN.addEventListener("change", () => { nivel = selN.value; per = null; dibujar(true); });
  selP.addEventListener("change", () => { per = selP.value; dibujar(false); });
  $$("button[data-acc]", card).forEach((b) => b.addEventListener("click", () => accion(b, card, {}, tc)));
  await dibujar(true);
}

/* ------------------------------------------------------------------ enganche con app.js */
window.renderTema = (id) => renderTema(id).catch((e) => { console.error(e); $("#cmpBody").innerHTML = `<p class="note">No se pudo cargar el tema (${e.message}).</p>`; });
})();
