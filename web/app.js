/* Tuluá en Cifras · visualizador estático
   Lee los JSON exportados desde la base PostgreSQL/PostGIS (etl/05_exportar_web.py). */
(() => {
"use strict";

const DATA = "data/";
const S = {
  cat: null, ind: {}, terr: {}, hijos: {}, per: {}, files: {}, geo: {},
  vista: "ficha", t: null, i: null,
  mapa: { nivel: "MUN", ind: "TD060010013", per: null, metodo: "cuantiles", n: 5, pal: "auto" },
};
const HOY = new Date().getFullYear();
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

/* ---------------------------------------------------------------- datos */
const getJSON = async (f) => {
  if (!S.files[f]) S.files[f] = fetch(DATA + f).then((r) => { if (!r.ok) throw new Error(f + " " + r.status); return r.json(); });
  return S.files[f];
};
async function serie(ic, tc, desag) {
  const ind = S.ind[ic];
  if (!ind) return [];
  const d = await getJSON(ind.a);
  const k = desag ? ic + "|" + desag : ic;
  return (d[k] && d[k][tc]) || [];
}
async function datosInd(ic, desag) {
  const ind = S.ind[ic];
  const d = await getJSON(ind.a);
  return d[desag ? ic + "|" + desag : ic] || {};
}
const valorEn = (arr, per) => { const r = arr.find((x) => x[0] === per); return r ? r[1] : null; };
function ultimo(arr, permitirFuturo = false) {
  for (let k = arr.length - 1; k >= 0; k--) {
    const r = arr[k];
    if (r[1] === null || r[1] === undefined) continue;
    if (!permitirFuturo && S.per[r[0]] && S.per[r[0]].fut) continue;
    return r;
  }
  return null;
}
function xPer(code) {
  const p = S.per[code]; if (!p) return NaN;
  const m = code.match(/^[TSM](\d{4})-(\d+)/);
  if (!m) return p.y;
  const sub = +m[2];
  return p.t === "M" ? p.y + (sub - 1) / 12 : p.t === "T" ? p.y + (sub - 1) / 4 : p.y + (sub - 1) / 2;
}

/* ---------------------------------------------------------------- formato */
const _nf = {};
const nf = (d) => {
  const f = (_nf[d] ||= new Intl.NumberFormat("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: d }));
  return (v) => f.format(v);
};
function fmt(v, ic, corto = false) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string") return v;
  const ind = S.ind[ic] || { d: 1, ut: "" };
  let d = ind.d ?? 1;
  const u = ind.u || "", s = ind.s || "";
  if (Math.abs(v) >= 1000 && d > 1) d = 0;
  if (ind.ut === "porcentaje") return nf(d)(v) + (s === "p.p." ? " p.p." : " %");
  if (ind.ut === "monetario") {
    if (/millones/i.test(u) && /miles de millones/i.test(u)) return "$ " + nf(1)(v) + " mil M";
    if (/millones/i.test(u)) return "$ " + nf(0)(v) + " M";
    if (/miles de d/i.test(u)) return "US$ " + nf(0)(v) + " mil";
    if (/miles/i.test(u)) return "$ " + nf(0)(v) + " mil";
    if (corto && Math.abs(v) >= 1e6) return "$ " + nf(1)(v / 1e6) + " M";
    return "$ " + nf(0)(v);
  }
  let out = nf(d)(v);
  if (s && !["hab.", "pts"].includes(s) && ind.ut !== "tasa" && !corto) out += " " + s;
  return out;
}
const unidadTxt = (ic) => { const i = S.ind[ic]; return i ? i.u + (i.s && i.ut !== "porcentaje" ? ` (${i.s})` : "") : ""; };
const nombreInd = (ic, corto = true) => { const i = S.ind[ic]; return i ? cap((corto && i.nc) || i.n) : ic; };
const perTxt = (pc) => (S.per[pc] ? S.per[pc].e : pc);

/* ---------------------------------------------------------------- arranque */
async function init() {
  const cat = await getJSON("catalogo.json");
  S.cat = cat;
  cat.indicadores.forEach((i) => (S.ind[i.c] = i));
  cat.territorios.forEach((t) => {
    S.terr[t.c] = t;
    if (t.p) (S.hijos[t.p] ||= []).push(t.c);
  });
  S.per = cat.periodos;
  S.temas = Object.fromEntries(cat.temas.map((t) => [t.id, t]));
  S.t = cat.foco;

  // selector de territorio
  const sel = $("#selTerr");
  const grupo = (label, arr) => `<optgroup label="${esc(label)}">${arr.map((t) => `<option value="${t.c}">${esc(t.n)}</option>`).join("")}</optgroup>`;
  const tl = cat.territorios;
  sel.innerHTML =
    grupo("Departamento", tl.filter((t) => t.nv === "DEP")) +
    grupo("Municipios del Valle", tl.filter((t) => t.nv === "MUN").sort((a, b) => a.n.localeCompare(b.n, "es"))) +
    grupo("Tuluá · zonas", tl.filter((t) => t.nv === "CLA")) +
    grupo("Tuluá · comunas", tl.filter((t) => t.nv === "COM"));
  sel.value = S.t;
  sel.addEventListener("change", () => irTerritorio(sel.value));

  const temas = window.COMPENDIO_SPEC || [];
  $("#navTemas").innerHTML = `<button role="tab" data-view="inicio" aria-selected="true">Inicio</button>` +
    temas.map((t) => `<button role="tab" data-view="tema:${t.id}" aria-selected="false" title="${esc(t.t)}">${esc(t.tab || t.t)}</button>`).join("");
  $$("nav.tabs button").forEach((b) => b.addEventListener("click", () => mostrar(b.dataset.view)));
  $("#boot").remove();
  leerHash();
  window.addEventListener("hashchange", leerHash);
}

function leerHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  const v = h.get("v") || S.vista;
  if (h.get("t") && S.terr[h.get("t")]) S.t = h.get("t");
  if (h.get("i") && S.ind[h.get("i")]) S.i = h.get("i");
  $("#selTerr").value = S.t;
  mostrar(v, false);
}
function escribirHash() {
  const h = new URLSearchParams({ v: S.vista, t: S.t });
  if (S.i) h.set("i", S.i);
  history.replaceState(null, "", "#" + h.toString());
}
function mostrar(v, push = true) {
  if (v === "ficha" || v === "compendio") v = "inicio";
  S.vista = v;
  const tema = v.startsWith("tema:") ? v.slice(5) : null;
  const seccion = tema ? "tema" : v === "inicio" ? "ficha" : v;
  $$("nav.tabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.view === v));
  $$(".view").forEach((s) => (s.hidden = s.id !== "v-" + seccion));
  if (push) escribirHash();
  if (tema) {
    [60, 400].forEach((ms) => setTimeout(() => window.reajustarGraficos && window.reajustarGraficos(), ms));
    return window.renderTema && window.renderTema(tema);
  }
  ({ inicio: renderFicha, mapa: renderMapa, explorar: renderExplorar, comparar: renderComparar, metodo: renderMetodo }[v] || renderFicha)();
}
function irTerritorio(tc, vista) {
  S.t = tc;
  if (window.olvidarTema) window.olvidarTema();
  if ([...$("#selTerr").options].some((o) => o.value === tc)) $("#selTerr").value = tc;
  mostrar(vista || S.vista);
}
function irIndicador(ic) { S.i = ic; mostrar("explorar"); }

/* ---------------------------------------------------------------- referencias */
function ancestros(tc) {
  const out = []; let t = S.terr[tc];
  while (t && t.p) { out.unshift(t.p); t = S.terr[t.p]; }
  return out;
}
function referencias(tc) {
  const t = S.terr[tc];
  if (t.nv === "PAIS") return [];
  if (t.nv === "DEP") return ["PAIS:CO"];
  if (t.nv === "MUN") return ["DEP:76", "PAIS:CO"];
  return ["MUN:76834", "DEP:76"];
}
const corto = (tc) => ({ "PAIS:CO": "Colombia", "DEP:76": "Valle", "MUN:76834": "Tuluá" }[tc] || S.terr[tc]?.n || tc);

/* ================================================================ FICHA */
const GRUPOS_FICHA = [
  ["Población y territorio", ["TD010010009", "TD010010010", "CNPV_POB", "CNPV_DENS", "CNPV_P60"]],
  ["Bienestar y pobreza", ["TD140030015", "TD140060001", "CNPV_EST12", "TD050010007", "TD050020003"]],
  ["Educación", ["TD040010012", "TD040040001", "CNPV_EDSUP"]],
  ["Vivienda y servicios", ["CNPV_ACU", "CNPV_ALC", "CNPV_INT", "TD030010005", "TD030010045"]],
  ["Seguridad y convivencia", ["TD060010013", "TD060010001", "TD060020001", "ACC_TOTAL", "ACC_TASA"]],
  ["Economía y gestión pública", ["TD120210001", "TD120210002", "TD080010008", "TD070130012", "TD070130001", "TD310010001"]],
];


/* ---------------------------------------------------------------- cuadro de mando de inicio */
const KPIS = [
  ["TD010010009", "Población total (proyección DANE)"],
  ["TD070010003", "Ingresos tributarios"],
  ["TD040010013", "Cobertura en educación superior"],
  ["TD050010001", "Afiliados al régimen contributivo de salud"],
  ["TD060010008", "Violencia interpersonal (tasa por 100.000 hab.)"],
  ["TD040010006", "Cobertura bruta en educación"],
];
let _dashT = null;
async function renderDash(tc) {
  const box = $("#fDash"); if (!box) return;
  clearInterval(_dashT);
  const t = S.terr[tc];
  if (!t || !["MUN", "DEP"].includes(t.nv)) { box.hidden = true; return; }
  const items = [];
  for (const [ic, lab] of KPIS) {
    const s = (await serie(ic, tc)).filter((r) => r[1] !== null && r[1] !== undefined && !(S.per[r[0]] && S.per[r[0]].fut));
    if (s.length < 2) continue;
    const u = s[s.length - 1], p = s[s.length - 2];
    const pp = (S.ind[ic] || {}).ut === "porcentaje";
    const dif = pp ? u[1] - p[1] : p[1] ? (u[1] / p[1] - 1) * 100 : null;
    if (dif === null) continue;
    const cls = Math.abs(dif) < 0.05 ? "fl" : dif > 0 ? "up" : "dn";
    const flecha = cls === "fl" ? "■" : dif > 0 ? "▲" : "▼";
    items.push(`<div class="kpi"><div class="kpi-in"><small>${esc(lab)}</small><b class="num">${esc(fmt(u[1], ic, true))}</b>` +
      `<div class="kpi-d ${cls}">${flecha} ${dif > 0 ? "+" : dif < 0 ? "−" : ""}${nf(1)(Math.abs(dif))}${pp ? " p.p." : " %"} <em>vs ${esc(perTxt(p[0]))}</em></div>` +
      `<span class="kpi-f">${esc(perTxt(u[0]))} · crecimiento anual</span></div></div>`);
  }
  if (!items.length) { box.hidden = true; return; }
  box.innerHTML = `<h2>${esc(t.n)} en cifras</h2><div class="kpi-view"><div class="kpi-track">${items.join("")}</div></div>`;
  box.hidden = false;
  const track = box.querySelector(".kpi-track");
  const vis = () => +getComputedStyle(box).getPropertyValue("--vis") || 4;
  if (items.length <= vis() || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let pausa = false;
  box.addEventListener("mouseenter", () => (pausa = true));
  box.addEventListener("mouseleave", () => (pausa = false));
  box.addEventListener("focusin", () => (pausa = true));
  box.addEventListener("focusout", () => (pausa = false));
  _dashT = setInterval(() => {
    if (pausa || document.hidden || !box.offsetParent) return;
    track.style.transition = "transform .7s ease";
    track.style.transform = "translateX(calc(-100% / " + vis() + "))";
    track.addEventListener("transitionend", () => {
      track.style.transition = "none"; track.style.transform = "none";
      track.appendChild(track.firstElementChild);
    }, { once: true });
  }, 5000);
}

/* ---------------------------------------------------------------- informe socioeconómico (PDF) */
async function informeSocioeconomico(btn) {
  const tc = S.t, t = S.terr[tc], txt = btn.textContent;
  btn.disabled = true; btn.textContent = "Preparando informe…";
  try {
    const refs = referencias(tc), fuentes = new Set();
    const dato = async (ic) => {
      const s = (await serie(ic, tc)), u = ultimo(s);
      return u ? { u, p: [...s.slice(0, s.indexOf(u))].reverse().find((r) => r[1] !== null && r[1] !== undefined) || null } : null;
    };
    const variacion = (ic, d) => {
      if (!d.p || !d.p[1] && S.ind[ic].ut !== "porcentaje") return "-";
      const pp = S.ind[ic].ut === "porcentaje", v = pp ? d.u[1] - d.p[1] : (d.u[1] / d.p[1] - 1) * 100;
      return (v > 0 ? "+" : "") + nf(1)(v) + (pp ? " p.p." : " %");
    };
    const fte = (ic) => { const f = S.cat.fuentes[(S.ind[ic] || {}).f]; if (f && f.n) fuentes.add(f.n); };
    const cifras = [];
    for (const [ic, lab] of KPIS) {
      const d = await dato(ic); if (!d) continue; fte(ic);
      cifras.push({ v: fmt(d.u[1], ic, true), l: lab, d: d.p ? variacion(ic, d) + " vs " + perTxt(d.p[0]) : perTxt(d.u[0]) });
    }
    const bl = [{ t: "p", texto: "Resumen de los indicadores sociales, económicos y territoriales más importantes de " + t.n + ". Cada fila muestra el último dato disponible, su variación frente al periodo anterior y la comparación con " + (refs.length ? refs.map(corto).join(" y ") : "otros territorios") + "." }];
    if (cifras.length) bl.push({ t: "h", texto: "Indicadores destacados" }, { t: "cifras", items: cifras });
    for (const [grupo, ics] of GRUPOS_FICHA) {
      const filas = [];
      for (const ic of ics) {
        const d = await dato(ic); if (!d || !S.ind[ic]) continue; fte(ic);
        const cmp = [];
        for (const r of refs) { const s = await serie(ic, r), u = ultimo(s); cmp.push(u ? fmt(u[1], ic) : "-"); }
        filas.push([nombreInd(ic), fmt(d.u[1], ic), perTxt(d.u[0]), variacion(ic, d)].concat(cmp));
      }
      if (filas.length) bl.push({ t: "h", texto: grupo }, { t: "tabla", cols: ["Indicador", t.n, "Periodo", "Var. periodo ant."].concat(refs.map(corto)), filas });
    }
    bl.push({ t: "nota", texto: "Fuentes: " + [...fuentes].join("; ") + ". Informe generado el " + window.EXP.hoyTxt() + "." });
    await window.EXP.pdf({ titulo: "Informe socioeconómico de " + t.n, sub: "Resumen de los indicadores más importantes · " + window.EXP.hoyTxt(), bloques: bl, nombre: "tulua_informe_socioeconomico_" + window.EXP.slug(t.n) });
  } catch (err) {
    console.error(err); window.EXP && window.EXP.aviso("No se pudo generar el informe PDF.");
  } finally { btn.disabled = false; btn.textContent = txt; }
}
document.addEventListener("click", (e) => { const b = e.target.closest("#btnInforme"); if (b) informeSocioeconomico(b); });

async function renderFicha() {
  const tc = S.t, t = S.terr[tc];
  const anc = ancestros(tc);
  $("#fCrumbs").innerHTML = anc.map((a) => `<button data-t="${a}">${esc(S.terr[a].n)}</button><span>›</span>`).join("") + `<span>${esc(S.terr[tc].n.replace("Tuluá · ", ""))}</span>`;
  $$("#fCrumbs button").forEach((b) => b.addEventListener("click", () => irTerritorio(b.dataset.t)));
  $("#fName").textContent = t.n.replace("Tuluá · ", "");
  const nivelN = (S.cat.niveles.find((n) => n.c === t.nv) || {}).n;
  const codigo = tc.split(":")[1];
  $("#fSub").innerHTML = `${esc(nivelN)} · código <span class="mono">${esc(codigo)}</span>${t.a ? ` · ${nf(1)(t.a)} km²` : ""}` +
    (t.foco ? " · «Corazón del Valle», en la subregión centro del Valle del Cauca, sobre el río Tuluá" : "");

  // números principales
  const hero = t.nv === "MUN" || t.nv === "DEP"
    ? [["TD010010009", "Población " + HOY + " (proyección DANE)"], ["TD010010010", "Habitantes por km²"], ["TD140030015", "Pobreza multidimensional (IPM)"], ["TD080010008", "Desempeño municipal (MDM)"]]
    : [["CNPV_POB", "Personas censadas (2018)"], ["CNPV_DENS", "Habitantes por km²"], ["CNPV_EST12", "Viviendas en estratos 1 y 2"], ["CNPV_INT", "Viviendas con internet"]];
  const heroHtml = [];
  for (const [ic, lab] of hero) {
    const u = ultimo(await serie(ic, tc));
    if (!u) continue;
    heroHtml.push(`<div><b class="num">${esc(fmt(u[1], ic, true))}</b><small>${esc(lab)} · ${esc(perTxt(u[0]))}</small></div>`);
  }
  $("#fHero").innerHTML = heroHtml.join("");
  renderDash(tc).catch((e) => console.warn("Cuadro de mando:", e));

  // grupos de indicadores con referencia
  const refs = referencias(tc);
  let html = "";
  for (const [titulo, lista] of GRUPOS_FICHA) {
    const filas = [];
    for (const ic of lista) {
      if (!S.ind[ic] || !S.ind[ic].niv[t.nv]) continue;
      const s = await serie(ic, tc);
      const u = ultimo(s);
      if (!u || typeof u[1] !== "number") continue;
      const refVals = [];
      const ind = S.ind[ic];
      const absoluto = ind.ut === "absoluto" || (ind.ut === "monetario" && !/per c[aá]pita/i.test(ind.n));
      if (!absoluto) for (const r of refs) {
        const v = valorEn(await serie(ic, r), u[0]);
        if (typeof v === "number") refVals.push([r, v]);
      }
      // contexto de hermanos (mismo nivel) para ubicar la bola
      const d = await datosInd(ic);
      const herm = Object.entries(d).filter(([k]) => S.terr[k] && S.terr[k].nv === t.nv).map(([, a]) => valorEn(a, u[0])).filter((x) => typeof x === "number");
      filas.push(filaKpi(ic, u, refVals, herm, t.nv));
    }
    if (filas.length) html += `<section class="kgroup"><h2>${esc(titulo)}</h2>${filas.join("")}</section>`;
  }
  $("#fGroups").innerHTML = html || `<p class="note">No hay indicadores destacados para este nivel territorial.</p>`;
  $$("#fGroups .krow").forEach((r) => r.addEventListener("click", () => irIndicador(r.dataset.i)));

  renderEdades(tc);
  renderHijos(tc);
  miniMapa(tc);
}

function filaKpi(ic, u, refVals, herm, nivel) {
  const ind = S.ind[ic];
  const all = herm.concat(refVals.map((r) => r[1]), [u[1]]);
  let lo = Math.min(...all), hi = Math.max(...all);
  if (lo === hi) { lo -= 1; hi += 1; }
  const pos = (v) => ((v - lo) / (hi - lo)) * 100;
  let prev = -99, abajo = false;
  const ticks = refVals.slice().sort((a, b) => a[1] - b[1]).map(([r, v]) => {
    const x = pos(v);
    abajo = x - prev < 16 ? !abajo : false;
    prev = x;
    return `<div class="tick" style="left:${x}%"><span style="${abajo ? "top:18px" : ""}${x > 80 ? ";left:auto;right:5px" : ""}">${esc(corto(r))}</span></div>`;
  }).join("");
  const puesto = herm.filter((h) => h > u[1]).length + 1;
  const nomNivel = { MUN: "municipios", COM: "comunas", DEP: "departamentos", CLA: "zonas" }[nivel] || "territorios";
  let chip = herm.length > 1
    ? `<span class="chip neu" title="Posición entre ${herm.length} ${nomNivel}, ordenados de mayor a menor valor">${puesto}.º de ${herm.length}</span>`
    : `<span class="chip neu">sin referencia</span>`;
  const ref = refVals[0];
  if (ref) {
    const dif = u[1] - ref[1];
    const tol = Math.abs(ref[1]) * 0.02;
    const nombre = corto(ref[0]);
    if (Math.abs(dif) <= tol) chip = `<span class="chip neu">≈ ${esc(nombre)}</span>`;
    else if (ind.p === 0) chip = `<span class="chip neu">${dif > 0 ? "▲ sobre" : "▼ bajo"} ${esc(nombre)}</span>`;
    else {
      const mejor = dif * ind.p > 0;
      chip = `<span class="chip ${mejor ? "good" : "bad"}">${mejor ? "✓ mejor" : "✕ peor"} que ${esc(nombre)}</span>`;
    }
  }
  const est = u[2] ? ` <span class="chip est">${u[2] === "p" ? "provisional" : "proyección"}</span>` : "";
  return `<div class="krow" data-i="${ic}" role="button" tabindex="0" title="Ver serie y ranking">
    <div class="kname">${esc(nombreInd(ic))}<small>${esc(S.cat.fuentes[ind.f]?.n || "")}</small></div>
    <div class="kval num">${esc(fmt(u[1], ic))}<small>${esc(perTxt(u[0]))}${est}</small></div>
    <div class="bullet" aria-hidden="true"><div class="track"></div>${ticks}<div class="dot" style="left:${pos(u[1])}%"></div></div>
    <div class="kchip">${chip}</div></div>`;
}

async function renderEdades(tc) {
  const box = $("#fAges");
  const grupos = S.cat.desag ? Object.values(S.cat.desag).filter((d) => d.t === "EDAD") : [];
  const vals = [];
  for (const g of grupos) {
    const v = valorEn(await serie("CNPV_POB", tc, "EDAD:" + g.c), "C2018");
    vals.push([g.c, v || 0]);
  }
  const tot = vals.reduce((a, b) => a + b[1], 0);
  if (!tot) { box.innerHTML = `<p class="note">Sin datos censales para este territorio.</p>`; return; }
  const refTc = S.terr[tc].nv === "MUN" && tc !== "MUN:76834" ? "MUN:76834" : S.terr[tc].nv === "MUN" ? "DEP:76" : "MUN:76834";
  const refVals = [];
  for (const g of grupos) refVals.push((valorEn(await serie("CNPV_POB", refTc, "EDAD:" + g.c), "C2018")) || 0);
  const refTot = refVals.reduce((a, b) => a + b, 0) || 1;
  const W = Math.max(260, Math.round(box.clientWidth || 330)), rowH = 22, H = vals.length * rowH + 26, x0 = 58;
  const max = Math.max(...vals.map((v) => v[1] / tot), ...refVals.map((v) => v / refTot));
  const sx = (p) => x0 + (p / max) * (W - x0 - 46);
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Distribución por edades">`;
  vals.forEach(([g, v], k) => {
    const y = k * rowH + 4, p = v / tot, pr = refVals[k] / refTot;
    svg += `<text x="${x0 - 8}" y="${y + 13}" text-anchor="end" class="lbl">${esc(g)}</text>
      <rect x="${x0}" y="${y + 3}" width="${Math.max(1, sx(p) - x0)}" height="${rowH - 8}" rx="3" fill="${css("--accent")}"><title>${esc(g)} años: ${nf(0)(v)} personas (${nf(1)(p * 100)} %)</title></rect>
      <line x1="${sx(pr)}" x2="${sx(pr)}" y1="${y + 1}" y2="${y + rowH - 3}" stroke="${css("--ink")}" stroke-width="2"/>
      <text x="${sx(Math.max(p, pr)) + 5}" y="${y + 13}" class="lbl">${nf(1)(p * 100)}%</text>`;
  });
  svg += `<text x="${x0}" y="${H - 2}">Barra: ${esc(corto(tc).replace("Tuluá · ", ""))} · Línea: ${esc(corto(refTc))}</text></svg>`;
  box.innerHTML = svg;
}

async function renderHijos(tc) {
  const panel = $("#fChildrenPanel");
  let hijos = (S.hijos[tc] || []).filter((c) => ["COM", "CLA", "MUN"].includes(S.terr[c].nv));
  if (tc === "MUN:76834") hijos = (S.hijos["CLA:768341"] || []).length ? S.cat.territorios.filter((t) => t.nv === "COM").map((t) => t.c) : hijos;
  if (!hijos.length) { panel.hidden = true; return; }
  panel.hidden = false;
  const esMun = S.terr[hijos[0]].nv === "MUN";
  $("#fChildrenTitle").textContent = esMun ? "Municipios · población " + HOY : "Comunas · población censada 2018";
  const ic = esMun ? "TD010010009" : "CNPV_POB";
  const per = esMun ? "A" + HOY : "C2018";
  const d = await datosInd(ic);
  const filas = hijos.map((h) => [h, valorEn(d[h] || [], per)]).sort((a, b) => (b[1] || 0) - (a[1] || 0));
  const max = Math.max(...filas.map((f) => f[1] || 0));
  $("#fChildren").innerHTML = `<div style="max-height:360px;overflow:auto">` + filas.map(([h, v]) =>
    `<div style="display:grid;grid-template-columns:1fr auto;gap:2px 10px;padding:4px 0;cursor:pointer" data-t="${h}">
      <span>${esc(S.terr[h].n)}</span><span class="num">${fmt(v, ic)}</span>
      <span style="grid-column:1/-1;height:4px;border-radius:2px;background:var(--surface-2)"><span style="display:block;height:4px;border-radius:2px;width:${((v || 0) / max) * 100}%;background:${h === "MUN:76834" ? "var(--accent)" : "var(--ink-2)"}"></span></span>
    </div>`).join("") + `</div>`;
  $$("#fChildren [data-t]").forEach((e) => e.addEventListener("click", () => irTerritorio(e.dataset.t)));
}

/* ---------------------------------------------------------------- mini mapa */
let mini = null;
async function miniMapa(tc) {
  const t = S.terr[tc];
  const capa = ["COM", "CLA"].includes(t.nv) ? "geo_comunas.json" : "geo_municipios.json";
  const [gm, gc] = await Promise.all([getJSON("geo_municipios.json"), getJSON(capa)]);
  if (!window.L) { $("#miniMap").innerHTML = `<p class="note">Mapa no disponible sin conexión.</p>`; return; }
  if (!mini) {
    mini = L.map("miniMap", { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false }).setView([4.08, -76.2], 8);
  }
  mini.eachLayer((l) => mini.removeLayer(l));
  const ink = css("--ink-2"), acc = css("--accent"), bg = css("--surface-2");
  const base = L.geoJSON(gm, {
    filter: (f) => S.terr[f.properties.c]?.nv === "MUN",
    style: (f) => ({ color: css("--map-stroke"), weight: 1, fillColor: f.properties.c === tc || (["COM", "CLA"].includes(t.nv) && f.properties.c === "MUN:76834") ? acc : bg, fillOpacity: 1 }),
  }).addTo(mini);
  let foco = base;
  if (["COM", "CLA"].includes(t.nv)) {
    foco = L.geoJSON(gc, { style: (f) => ({ color: css("--surface"), weight: 1, fillColor: t.nv === "CLA" || f.properties.c === tc ? acc : ink, fillOpacity: f.properties.c === tc || t.nv === "CLA" ? 1 : 0.35 }) }).addTo(mini);
    mini.fitBounds(foco.getBounds(), { padding: [8, 8] });
    $("#fGeoNote").textContent = t.nv === "CLA" ? "Área urbana de Tuluá dividida en comunas." : "Comuna resaltada dentro del casco urbano de Tuluá.";
  } else {
    mini.fitBounds(base.getBounds(), { padding: [4, 4] });
    $("#fGeoNote").textContent = t.nv === "DEP" ? "Los 42 municipios del Valle del Cauca." : `${t.n} resaltado entre los 42 municipios del Valle del Cauca.`;
  }
  setTimeout(() => mini.invalidateSize(), 50);
}

/* ================================================================ MAPA */
const RAMPAS = {
  azules: ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"],
  verdes: ["#d7efe3", "#a9dcc4", "#74c3a1", "#3fa67d", "#1f8761", "#136849", "#0a4a34"],
  rojos: ["#fbdcd6", "#f5b2a6", "#ec8676", "#dc5b49", "#c03e30", "#952b22", "#6a1d17"],
  naranjas: ["#fde3c8", "#fbc68f", "#f5a358", "#e8822d", "#c9651b", "#9c4c14", "#6e350e"],
};
function rampa(nombre, n) {
  const r = RAMPAS[nombre];
  if (n >= 7) return r.slice(0, 7);
  const idx = Array.from({ length: n }, (_, k) => Math.round((k * (r.length - 1)) / (n - 1)));
  return idx.map((i) => r[i]);
}
function cortes(vals, metodo, n, manual) {
  const v = vals.filter((x) => typeof x === "number" && isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return [];
  if (metodo === "manual" && manual && manual.length > 2) return manual.slice();
  const lo = v[0], hi = v[v.length - 1];
  if (metodo === "iguales" || metodo === "manual") return Array.from({ length: n + 1 }, (_, k) => lo + ((hi - lo) * k) / n);
  const q = (p) => { const pos = (v.length - 1) * p, b = Math.floor(pos); return v[b] + (v[Math.min(b + 1, v.length - 1)] - v[b]) * (pos - b); };
  const out = Array.from({ length: n + 1 }, (_, k) => q(k / n));
  return out.filter((x, k) => k === 0 || x > out[k - 1]);
}
const clase = (v, br) => { if (typeof v !== "number") return -1; for (let k = 1; k < br.length; k++) if (v <= br[k]) return k - 1; return br.length - 2; };

let mapa = null, capaDatos = null, capaContexto = null;
const NIVEL_GEO = { MUN: "geo_municipios.json", COM: "geo_comunas.json", SECU: "geo_secu.json", SECR: "geo_secr.json", MZN: "geo_manzanas.json", BAR: "geo_barrios.json" };
const NIVEL_TXT = { MUN: "municipios del Valle", COM: "comunas de Tuluá", SECU: "secciones urbanas de Tuluá", SECR: "secciones rurales de Tuluá", MZN: "manzanas de Tuluá", BAR: "barrios de Tuluá" };

function indicadoresNivel(nivel) {
  return S.cat.indicadores.filter((i) => i.niv[nivel] && !i.nomap && i.ut !== "texto");
}
function llenarIndMapa() {
  const M = S.mapa;
  const lista = indicadoresNivel(M.nivel);
  if (!lista.some((i) => i.c === M.ind)) {
    const pref = { MUN: "TD060010013", COM: "CNPV_INT", SECU: "CNPV_EST12", SECR: "CNPV_POB", MZN: "CNPV_DENS", BAR: "ACC_TOTAL" }[M.nivel];
    M.ind = lista.some((i) => i.c === pref) ? pref : (lista[0] || {}).c;
    M.per = null;
  }
  const porTema = {};
  lista.forEach((i) => {
    let t = S.temas[i.t]; while (t && t.p) t = S.temas[t.p];
    (porTema[t ? t.n : "Otros"] ||= []).push(i);
  });
  $("#mInd").innerHTML = Object.keys(porTema).sort((a, b) => a.localeCompare(b, "es")).map((k) =>
    `<optgroup label="${esc(k)}">${porTema[k].sort((a, b) => (b.dest || 0) - (a.dest || 0) || nombreInd(a.c, false).localeCompare(nombreInd(b.c, false), "es"))
      .map((i) => `<option value="${i.c}">${i.dest ? "★ " : ""}${esc(nombreInd(i.c, false))}</option>`).join("")}</optgroup>`).join("");
  $("#mInd").value = M.ind;
  const pers = (S.ind[M.ind].niv[M.nivel] || []).slice().sort((a, b) => xPer(a) - xPer(b));
  if (!M.per || !pers.includes(M.per)) {
    const pas = pers.filter((p) => !S.per[p]?.fut);
    M.per = (pas.length ? pas : pers)[(pas.length ? pas : pers).length - 1];
  }
  $("#mPer").innerHTML = pers.slice().reverse().map((p) => `<option value="${p}">${esc(perTxt(p))}${S.per[p]?.fut ? " (proyección)" : ""}</option>`).join("");
  $("#mPer").value = M.per;
}

function renderMapa() {
  const M = S.mapa;
  if (!$("#mNivel").dataset.ok) {
    $("#mNivel").dataset.ok = 1;
    $("#mNivel").addEventListener("change", (e) => { M.nivel = e.target.value; llenarIndMapa(); dibujarMapa(true); });
    $("#mInd").addEventListener("change", (e) => { M.ind = e.target.value; M.per = null; llenarIndMapa(); dibujarMapa(); });
    $("#mPer").addEventListener("change", (e) => { M.per = e.target.value; dibujarMapa(); });
    $("#mN").addEventListener("change", (e) => { M.n = +e.target.value; dibujarMapa(); });
    $("#mPal").addEventListener("change", (e) => { M.pal = e.target.value; dibujarMapa(); });
    $$("#mMetodo button").forEach((b) => b.addEventListener("click", () => {
      M.metodo = b.dataset.m; $$("#mMetodo button").forEach((x) => x.setAttribute("aria-pressed", x === b)); dibujarMapa();
    }));
  }
  if (M.pendiente && S.ind[M.pendiente]) {
    const pi = S.ind[M.pendiente];
    const niv = ["MUN", "COM", "SECU", "MZN", "SECR", "BAR"].find((n) => pi.niv[n]);
    if (niv) { M.nivel = niv; M.ind = M.pendiente; M.per = null; }
    M.pendiente = null;
  }
  $("#mNivel").value = M.nivel;
  llenarIndMapa();
  if (!mapa && window.L) {
    mapa = L.map("map", { preferCanvas: true, zoomSnap: 0.25, attributionControl: true, zoomControl: false }).setView([4.08, -76.2], 9);
    L.control.zoom({ position: "topright" }).addTo(mapa);
    mapa.attributionControl.setPrefix(false).addAttribution("Geometrías: DANE MGN 2018 · OSM (barrios)");
    // mapa base opcional: si el navegador no puede cargarlo (p. ej. dentro de un sandbox), se retira sin ruido
    const base = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", { subdomains: "abcd", maxZoom: 19, opacity: 0.55, attribution: "© OpenStreetMap · © CARTO" });
    let fallos = 0;
    base.on("tileerror", () => { if (++fallos > 2 && mapa.hasLayer(base)) mapa.removeLayer(base); });
    base.addTo(mapa);
  }
  setTimeout(() => { mapa && mapa.invalidateSize(); dibujarMapa(true); }, 30);
}

async function dibujarMapa(reencuadrar = false) {
  if (!mapa) { $("#mTitle").innerHTML = "<b>No se pudo cargar la librería de mapas</b>"; return; }
  const M = S.mapa, ic = M.ind, ind = S.ind[ic];
  if (!ind) return;
  const [geo, d] = await Promise.all([getJSON(NIVEL_GEO[M.nivel]), datosInd(ic)]);
  const feats = geo.features.filter((f) => S.terr[f.properties.c]?.nv === M.nivel);
  const val = {};
  feats.forEach((f) => (val[f.properties.c] = valorEn(d[f.properties.c] || [], M.per)));
  const vals = Object.values(val).filter((x) => typeof x === "number");
  const manual = ind.cl && (ind.cl[M.nivel] || Object.values(ind.cl)[0])?.cortes;
  const br = cortes(vals, M.metodo, M.n, manual);
  const nClases = Math.max(1, br.length - 1);
  const pal = M.pal === "auto" ? (ind.p === 1 ? "verdes" : ind.p === -1 ? "rojos" : "azules") : M.pal;
  const cols = rampa(pal, Math.max(2, nClases)).slice(0, nClases);
  const nodata = css("--nodata"), stroke = css("--map-stroke");

  if (capaDatos) mapa.removeLayer(capaDatos);
  if (capaContexto) mapa.removeLayer(capaContexto);
  const conteo = new Array(nClases).fill(0); let sinDato = 0;
  const tip = (c) => `<b>${esc(S.terr[c].n)}</b><br>${esc(fmt(val[c], ic))}${M.nivel === "MZN" || M.nivel === "SECU" ? `<br><span class="mono">${esc(c.split(":")[1])}</span>` : ""}`;

  if (M.nivel === "BAR") {
    const max = Math.max(1, ...vals);
    capaDatos = L.geoJSON(feats, {
      pointToLayer: (f, ll) => {
        const v = val[f.properties.c], k = clase(v, br);
        if (k < 0) sinDato++; else conteo[k]++;
        return L.circleMarker(ll, { radius: typeof v === "number" ? 4 + 14 * Math.sqrt(v / max) : 3, color: stroke, weight: 1.5, fillColor: k < 0 ? nodata : cols[k], fillOpacity: 0.92 });
      },
      onEachFeature: (f, l) => l.bindTooltip(tip(f.properties.c), { className: "tt", sticky: true }),
    });
  } else {
    capaDatos = L.geoJSON(feats, {
      style: (f) => {
        const k = clase(val[f.properties.c], br);
        if (k < 0) sinDato++; else conteo[k]++;
        return { color: stroke, weight: M.nivel === "MZN" ? 0.4 : 1, fillColor: k < 0 ? nodata : cols[k], fillOpacity: 0.95 };
      },
      onEachFeature: (f, l) => {
        l.bindTooltip(tip(f.properties.c), { className: "tt", sticky: true });
        l.on("mouseover", () => l.setStyle({ weight: 2.5, color: css("--context") }));
        l.on("mouseout", () => capaDatos.resetStyle(l));
        l.on("click", () => seleccionMapa(f.properties.c, val, br));
      },
    });
  }
  capaDatos.addTo(mapa);
  if (M.nivel !== "MUN") {
    const [gm, gc] = await Promise.all([getJSON("geo_municipios.json"), getJSON("geo_comunas.json")]);
    const ctx = { type: "FeatureCollection", features: gm.features.filter((f) => f.properties.c === "MUN:76834").concat(["SECU", "MZN", "BAR"].includes(M.nivel) ? gc.features : []) };
    capaContexto = L.geoJSON(ctx, { style: { color: css("--context"), weight: 1.4, fill: false, opacity: 0.7, dashArray: "4 3" }, interactive: false }).addTo(mapa);
  } else capaContexto = null;
  if (reencuadrar) {
    if (["SECU", "MZN", "BAR"].includes(M.nivel)) {
      const gc = await getJSON("geo_comunas.json");
      mapa.fitBounds(L.geoJSON(gc).getBounds(), { padding: [30, 30] });
    } else mapa.fitBounds(capaDatos.getBounds(), { padding: [20, 20] });
  }

  $("#mTitle").innerHTML = `<b>${esc(nombreInd(ic, false))}</b><span>${esc(cap(NIVEL_TXT[M.nivel]))} · ${esc(perTxt(M.per))} · ${esc(unidadTxt(ic))}</span>`;
  const metodoTxt = { cuantiles: "cuantiles (igual número de territorios por clase)", iguales: "intervalos de igual amplitud", manual: manual ? "cortes fijos definidos en la base de datos" : "intervalos iguales (este indicador no tiene cortes fijos)" }[M.metodo];
  $("#mLegend").innerHTML = `<div class="eyebrow">Leyenda · ${esc(unidadTxt(ic))}</div>` + cols.map((c, k) =>
    `<div class="li"><span class="sw" style="background:${c}"></span><span class="num">${esc(fmt(br[k], ic, true))} – ${esc(fmt(br[k + 1], ic, true))}</span><span class="cnt num">${conteo[k]}</span></div>`).join("") +
    (sinDato ? `<div class="li"><span class="sw" style="background:${nodata}"></span><span>Sin dato</span><span class="cnt num">${sinDato}</span></div>` : "") +
    `<p class="note" style="margin:6px 0 0">Rangos por ${metodoTxt}.${M.nivel === "BAR" ? " El tamaño del círculo es proporcional al valor; sólo se muestran barrios con punto de referencia en OpenStreetMap." : ""}${ind.nota ? " " + esc(ind.nota) : ""}</p>`;

  // tabla
  const filas = feats.map((f) => [f.properties.c, val[f.properties.c]]).sort((a, b) => (b[1] ?? -Infinity) - (a[1] ?? -Infinity));
  $("#mTable").innerHTML = `<thead><tr><th>Territorio</th><th>Código</th><th>Valor</th><th>Rango</th></tr></thead><tbody>` +
    filas.map(([c, v], k) => `<tr class="${c === "MUN:76834" ? "foco" : ""}"><td>${esc(S.terr[c].n)}</td><td class="mono">${esc(c.split(":")[1])}</td><td class="num">${esc(fmt(v, ic))}</td><td>${typeof v === "number" ? `<span class="sw" style="display:inline-block;width:14px;height:10px;border-radius:2px;background:${cols[clase(v, br)]}"></span> ${clase(v, br) + 1}` : "—"}</td></tr>`).join("") + `</tbody>`;
  $("#mSel").innerHTML = `<span class="note">Pasa el cursor por el mapa para ver cada valor; haz clic en ${M.nivel === "MUN" ? "un municipio" : "un territorio"} para ver su posición.</span>`;
}

function seleccionMapa(c, val, br) {
  const M = S.mapa, v = val[c];
  const orden = Object.entries(val).filter(([, x]) => typeof x === "number").sort((a, b) => b[1] - a[1]);
  const pos = orden.findIndex(([k]) => k === c) + 1;
  const puedeFicha = ["MUN", "COM"].includes(M.nivel);
  $("#mSel").innerHTML = `<div class="eyebrow">${esc(S.terr[c].n)}</div><b class="num">${esc(fmt(v, M.ind))}</b>
    <div class="note">${pos ? `Posición ${pos} de ${orden.length} (1 = valor más alto)` : "Sin dato en este periodo"}</div>
    <div class="toolbar">${puedeFicha ? `<button class="btn pri" id="mVerFicha">Abrir ficha</button>` : ""}<button class="btn" id="mVerInd">Ver indicador</button></div>`;
  if (puedeFicha) $("#mVerFicha").addEventListener("click", () => irTerritorio(c, "ficha"));
  $("#mVerInd").addEventListener("click", () => irIndicador(M.ind));
}

/* ================================================================ EXPLORAR */
function renderExplorar() {
  if (!$("#treeBody").dataset.ok) {
    $("#treeBody").dataset.ok = 1;
    construirArbol("");
    let tmo;
    $("#q").addEventListener("input", (e) => { clearTimeout(tmo); tmo = setTimeout(() => construirArbol(e.target.value), 160); });
  }
  if (!S.i) S.i = "TD060010013";
  marcarArbol();
  renderIndicador(S.i);
}
function normal(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
function construirArbol(q) {
  const nq = normal(q.trim());
  const hijosTema = {};
  S.cat.temas.forEach((t) => (hijosTema[t.p || 0] ||= []).push(t));
  const indsTema = {};
  S.cat.indicadores.forEach((i) => { if (!nq || normal(i.n + " " + (i.nc || "") + " " + i.c).includes(nq)) (indsTema[i.t] ||= []).push(i); });
  const cuenta = (tid) => (indsTema[tid] || []).length + (hijosTema[tid] || []).reduce((a, h) => a + cuenta(h.id), 0);
  const rama = (tid, nivel) => (hijosTema[tid] || []).filter((t) => cuenta(t.id)).sort((a, b) => a.n.localeCompare(b.n, "es")).map((t) => {
    const inds = (indsTema[t.id] || []).sort((a, b) => (a.ord ?? 999) - (b.ord ?? 999) || a.n.localeCompare(b.n, "es"));
    return `<details ${nq ? "open" : ""}><summary>${esc(t.n)} <span>${cuenta(t.id)}</span></summary>${rama(t.id, nivel + 1)}
      ${inds.length ? `<ul>${inds.slice(0, nq ? 400 : 200).map((i) => `<li><button data-i="${i.c}">${i.dest ? "★ " : ""}${esc(cap(i.n))}</button></li>`).join("")}</ul>` : ""}</details>`;
  }).join("");
  $("#treeBody").innerHTML = rama(0, 0) || `<p class="note">Ningún indicador coincide con «${esc(q)}».</p>`;
  $$("#treeBody button[data-i]").forEach((b) => b.addEventListener("click", () => { S.i = b.dataset.i; escribirHash(); marcarArbol(); renderIndicador(S.i); window.scrollTo({ top: 0, behavior: "smooth" }); }));
  marcarArbol();
}
function marcarArbol() {
  $$("#treeBody button[data-i]").forEach((b) => {
    const on = b.dataset.i === S.i;
    b.setAttribute("aria-current", on);
    if (on) { let p = b.closest("details"); while (p) { p.open = true; p = p.parentElement.closest("details"); } }
  });
}

const COLS_SERIE = ["var(--accent)", "#2a78d6", "#eb6834", "#7a6fd0", "#b0417a", "#8a6d00", "#1baf7a", "#5d6b63"];
async function renderIndicador(ic) {
  const ind = S.ind[ic];
  const box = $("#indView");
  if (!ind) { box.innerHTML = ""; return; }
  let tema = S.temas[ind.t], ruta = [];
  while (tema) { ruta.unshift(tema.n); tema = S.temas[tema.p]; }
  const fte = S.cat.fuentes[ind.f] || {};
  const niveles = Object.keys(ind.niv).map((n) => (S.cat.niveles.find((x) => x.c === n) || {}).n).join(", ");
  const puedeMapa = !ind.nomap && ind.ut !== "texto" && ["MUN", "COM", "SECU", "MZN", "SECR", "BAR"].some((n) => ind.niv[n]);
  box.innerHTML = `<div class="ind-head"><div><div class="eyebrow">${esc(ruta.join(" › "))}</div><h1>${esc(cap(ind.n))}</h1>
    <div class="meta"><span><b>Unidad</b> ${esc(unidadTxt(ic))}</span><span><b>Fuente</b> ${esc(fte.n || "")}</span><span><b>Periodicidad</b> ${esc({ A: "anual", T: "trimestral", M: "mensual", C: "censal" }[ind.per] || ind.per)}</span><span><b>Niveles</b> ${esc(niveles)}</span><span><b>Código</b> <span class="mono">${esc(ic)}</span></span></div>
    ${ind.fx ? `<p class="note">Fórmula: ${esc(ind.fx)}</p>` : ""}${ind.nota ? `<p class="note">${esc(ind.nota)}</p>` : ""}</div>
    <div class="toolbar" style="margin:0">${puedeMapa ? `<button class="btn pri" id="iMapa">Ver en el mapa</button>` : ""}</div></div>
    <div class="cards">
      <div class="panel card" id="cSerie"><h3>Evolución</h3><p class="note">Tuluá frente al Valle, Colombia y los municipios vecinos</p><div class="chart"></div></div>
      <div class="panel card" id="cRank"><h3>Ranking municipal</h3><div class="chart"></div></div>
      <div class="panel card" id="cSub" hidden><h3>Dentro de Tuluá</h3><div class="tbl-wrap"></div></div>
    </div>`;
  if (puedeMapa) $("#iMapa").addEventListener("click", () => { S.mapa.pendiente = ic; mostrar("mapa"); });
  const d = await datosInd(ic);

  // ---- serie temporal
  const vecinos = (S.cat.grupos.VECINOS?.m || []);
  const lineas = [["MUN:76834", "Tuluá"], ["DEP:76", "Valle del Cauca"], ["PAIS:CO", "Colombia"]].concat(vecinos.map((v) => [v, S.terr[v].n]))
    .filter(([c]) => (d[c] || []).filter((r) => typeof r[1] === "number").length);
  const cSerie = $("#cSerie .chart");
  const pers = new Set();
  lineas.forEach(([c]) => d[c].forEach((r) => typeof r[1] === "number" && pers.add(r[0])));
  if (pers.size >= 2) {
    const activos = new Set(lineas.slice(0, 3).map((l) => l[0]));
    const dibuja = () => graficoLineas(cSerie, lineas.filter(([c]) => activos.has(c)).map(([c, n], k) => ({ c, n, color: COLS_SERIE[lineas.findIndex((l) => l[0] === c)] || "#888", pts: d[c].filter((r) => typeof r[1] === "number").map((r) => [xPer(r[0]), r[1], r[0], r[2]]) })), ic);
    const ley = document.createElement("div");
    ley.className = "series-legend";
    ley.innerHTML = lineas.map(([c, n], k) => `<label style="display:inline-flex;align-items:center;gap:5px;cursor:pointer"><input type="checkbox" id="chk-${c.replace(":", "-")}" data-c="${c}" ${activos.has(c) ? "checked" : ""}><i style="background:${COLS_SERIE[k] || "#888"}"></i>${esc(n)}</label>`).join("");
    cSerie.before(ley);
    ley.addEventListener("change", (e) => { const c = e.target.dataset.c; e.target.checked ? activos.add(c) : activos.delete(c); dibuja(); });
    dibuja();
  } else {
    const u = ultimo(d["MUN:76834"] || d[S.t] || [], true);
    cSerie.innerHTML = `<p class="note">Este indicador tiene un único periodo${u ? ` (${esc(perTxt(u[0]))})` : ""}: consulta el ranking o el mapa.</p>`;
  }

  // ---- ranking municipal
  const cRank = $("#cRank .chart");
  const persMun = (ind.niv.MUN || []).filter((p) => !S.per[p]?.fut);
  if (persMun.length) {
    const sel = document.createElement("select");
    sel.id = "rankPer"; sel.setAttribute("aria-label", "Periodo del ranking");
    sel.innerHTML = persMun.slice().sort((a, b) => xPer(b) - xPer(a)).map((p) => `<option value="${p}">${esc(perTxt(p))}</option>`).join("");
    const pTulua = ultimo(d["MUN:76834"] || []);
    if (pTulua && persMun.includes(pTulua[0])) sel.value = pTulua[0];
    $("#cRank h3").after(sel);
    const dib = () => {
      const p = sel.value;
      const filas = Object.entries(d).filter(([c]) => S.terr[c]?.nv === "MUN").map(([c, a]) => [c, valorEn(a, p)]).filter((f) => typeof f[1] === "number").sort((a, b) => b[1] - a[1]);
      graficoRanking(cRank, filas, ic, valorEn(d["DEP:76"] || [], p));
    };
    sel.addEventListener("change", dib);
    dib();
  } else cRank.innerHTML = `<p class="note">Sin datos municipales comparables para este indicador.</p>`;

  // ---- dentro de Tuluá (comunas / zonas)
  const subN = ["COM", "CLA"].filter((n) => ind.niv[n]);
  if (subN.length) {
    const cont = $("#cSub");
    cont.hidden = false;
    const per = (ind.niv.COM || ind.niv.CLA).slice(-1)[0];
    const filas = S.cat.territorios.filter((t) => subN.includes(t.nv)).map((t) => [t.c, valorEn(d[t.c] || [], per)]);
    const ref = valorEn(d["MUN:76834"] || [], per);
    const max = Math.max(...filas.map((f) => Math.abs(f[1] || 0)), Math.abs(ref || 0));
    $(".tbl-wrap", cont).innerHTML = `<p class="note">${esc(perTxt(per))} · Tuluá: <b>${esc(fmt(ref, ic))}</b></p><table><thead><tr><th>Zona / comuna</th><th>Valor</th><th style="width:40%"></th></tr></thead><tbody>` +
      filas.map(([c, v]) => `<tr><td><button class="btn" style="padding:2px 8px" data-t="${c}">${esc(S.terr[c].n.replace("Tuluá · ", ""))}</button></td><td class="num">${esc(fmt(v, ic))}</td>
      <td><div style="height:8px;border-radius:0 4px 4px 0;background:var(--accent);width:${max ? (Math.abs(v || 0) / max) * 100 : 0}%"></div></td></tr>`).join("") + `</tbody></table>`;
    $$("[data-t]", cont).forEach((b) => b.addEventListener("click", () => irTerritorio(b.dataset.t, "ficha")));
  }
}

/* ---------------------------------------------------------------- gráficos SVG */
function niceTicks(lo, hi, n = 5) {
  if (lo === hi) { lo -= 1; hi += 1; }
  const span = hi - lo, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= n) || 10 * mag;
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step;
  const out = []; for (let v = a; v <= b + step / 2; v += step) out.push(+v.toFixed(10));
  return out;
}
const corta = (v) => { const a = Math.abs(v); return a >= 1e9 ? nf(1)(v / 1e9) + " mil M" : a >= 1e6 ? nf(1)(v / 1e6) + " M" : a >= 1e4 ? nf(0)(v / 1e3) + " mil" : nf(a < 10 ? 2 : 1)(v); };

function graficoLineas(el, series, ic) {
  const W = Math.max(320, Math.round(el.clientWidth || 640)), H = 300, m = { l: 56, r: 16, t: 12, b: 28 };
  const xs = series.flatMap((s) => s.pts.map((p) => p[0])), ys = series.flatMap((s) => s.pts.map((p) => p[1]));
  if (!xs.length) { el.innerHTML = `<p class="note">Selecciona al menos un territorio.</p>`; return; }
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const yt = niceTicks(Math.min(0, ...ys) < 0 ? Math.min(...ys) : Math.min(...ys) * (Math.min(...ys) > 0 && Math.min(...ys) / Math.max(...ys) > 0.5 ? 0.97 : 0), Math.max(...ys));
  const y0 = yt[0], y1 = yt[yt.length - 1];
  const sx = (x) => m.l + ((x - x0) / Math.max(1e-9, x1 - x0)) * (W - m.l - m.r);
  const sy = (y) => H - m.b - ((y - y0) / (y1 - y0)) * (H - m.t - m.b);
  const años = []; const paso = Math.max(1, Math.ceil((x1 - x0) / 8));
  for (let a = Math.ceil(x0); a <= Math.floor(x1); a += paso) años.push(a);
  const hoyX = HOY;
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Serie temporal">`;
  yt.forEach((t) => (svg += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${sy(t)}" y2="${sy(t)}"/><text x="${m.l - 8}" y="${sy(t) + 4}" text-anchor="end" class="num">${corta(t)}</text>`));
  svg += `<line class="axis" x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}"/>`;
  años.forEach((a) => (svg += `<text x="${sx(a)}" y="${H - 8}" text-anchor="middle" class="num">${a}</text>`));
  if (x1 > hoyX && x0 < hoyX) svg += `<rect x="${sx(hoyX)}" y="${m.t}" width="${W - m.r - sx(hoyX)}" height="${H - m.t - m.b}" fill="var(--surface-2)" opacity=".55"/><text x="${sx(hoyX) + 6}" y="${m.t + 12}">proyección</text>`;
  series.slice().reverse().forEach((s) => {
    const pts = s.pts.slice().sort((a, b) => a[0] - b[0]);
    const d = pts.map((p, k) => (k ? "L" : "M") + sx(p[0]).toFixed(1) + " " + sy(p[1]).toFixed(1)).join("");
    const w = s.c === "MUN:76834" ? 3 : 2;
    svg += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
    if (pts.length < 25) pts.forEach((p) => (svg += `<circle cx="${sx(p[0])}" cy="${sy(p[1])}" r="${s.c === "MUN:76834" ? 3.5 : 2.5}" fill="${s.color}" stroke="var(--surface)" stroke-width="1.5"/>`));
    const u = pts[pts.length - 1];
    if (s.c === "MUN:76834") svg += `<circle cx="${sx(u[0])}" cy="${sy(u[1])}" r="5" fill="${s.color}" stroke="var(--surface)" stroke-width="2"/>`;
  });
  svg += `<line id="xh" class="axis" y1="${m.t}" y2="${H - m.b}" x1="-10" x2="-10" stroke-dasharray="3 3"/><rect x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}" fill="transparent" id="hit"/></svg>`;
  el.innerHTML = svg;
  const svgEl = $("svg", el), hit = $("#hit", el), xh = $("#xh", el), hb = $("#hover");
  const todasX = [...new Set(xs)].sort((a, b) => a - b);
  hit.addEventListener("mousemove", (e) => {
    const r = svgEl.getBoundingClientRect();
    const xv = x0 + (((e.clientX - r.left) / r.width) * W - m.l) / (W - m.l - m.r) * (x1 - x0);
    const near = todasX.reduce((a, b) => (Math.abs(b - xv) < Math.abs(a - xv) ? b : a), todasX[0]);
    xh.setAttribute("x1", sx(near)); xh.setAttribute("x2", sx(near));
    const filas = series.map((s) => [s, s.pts.find((p) => p[0] === near)]).filter((f) => f[1]).sort((a, b) => b[1][1] - a[1][1]);
    if (!filas.length) return;
    hb.innerHTML = `<div class="h">${esc(perTxt(filas[0][1][2]))}${S.per[filas[0][1][2]]?.fut ? " · proyección" : ""}</div>` + filas.map(([s, p]) => `<div class="r"><span><i style="background:${s.color}"></i>${esc(s.n)}</span><b class="num">${esc(fmt(p[1], ic))}</b></div>`).join("");
    hb.hidden = false;
    hb.style.left = Math.min(window.innerWidth - hb.offsetWidth - 10, e.clientX + 14) + "px";
    hb.style.top = e.clientY + 14 + "px";
  });
  hit.addEventListener("mouseleave", () => { hb.hidden = true; xh.setAttribute("x1", -10); xh.setAttribute("x2", -10); });
}

function graficoRanking(el, filas, ic, valDep) {
  if (!filas.length) { el.innerHTML = `<p class="note">Sin datos para este periodo.</p>`; return; }
  const rowH = 19, W = Math.max(320, Math.round(el.clientWidth || 640)), m = { l: 150, r: 96, t: 6, b: 22 };
  const H = filas.length * rowH + m.t + m.b;
  const vals = filas.map((f) => f[1]).concat(typeof valDep === "number" ? [valDep] : []);
  const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
  const sx = (v) => m.l + ((v - lo) / ((hi - lo) || 1)) * (W - m.l - m.r);
  const pos = filas.findIndex((f) => f[0] === "MUN:76834") + 1;
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ranking de municipios">`;
  filas.forEach(([c, v], k) => {
    const y = m.t + k * rowH, foco = c === "MUN:76834";
    const x = Math.min(sx(0), sx(v)), w = Math.max(1, Math.abs(sx(v) - sx(0)));
    svg += `<g data-t="${c}" style="cursor:pointer"><rect x="0" y="${y}" width="${W}" height="${rowH}" fill="transparent"/>
      <text x="${m.l - 8}" y="${y + 13}" text-anchor="end" class="${foco ? "lbl-strong" : "lbl"}">${k + 1}. ${esc(S.terr[c].n)}</text>
      <rect x="${x}" y="${y + 3}" width="${w}" height="${rowH - 6}" rx="2" fill="${foco ? "var(--accent)" : "var(--line-2)"}"/>
      <text x="${Math.max(sx(v), sx(0)) + 6}" y="${y + 13}" class="${foco ? "lbl-strong" : "lbl"} num">${esc(fmt(v, ic, true))}</text><title>${esc(S.terr[c].n)}: ${esc(fmt(v, ic))}</title></g>`;
  });
  if (typeof valDep === "number") svg += `<line x1="${sx(valDep)}" x2="${sx(valDep)}" y1="${m.t}" y2="${H - m.b + 4}" stroke="var(--ink)" stroke-dasharray="3 3"/><text x="${sx(valDep)}" y="${H - 4}" text-anchor="middle">Valle: ${esc(fmt(valDep, ic))}</text>`;
  svg += `</svg>`;
  const ind = S.ind[ic];
  el.innerHTML = `<p class="note">${pos ? `Tuluá ocupa el puesto <b>${pos}</b> de ${filas.length}` : "Tuluá sin dato en este periodo"}${ind.p ? (ind.p > 0 ? " · a este indicador le conviene subir" : " · a este indicador le conviene bajar") : ""}.</p><div style="max-height:520px;overflow:auto">${svg}</div>`;
  $$("g[data-t]", el).forEach((g) => g.addEventListener("click", () => irTerritorio(g.dataset.t, "ficha")));
}

/* ================================================================ COMPARAR */
const FILAS_COMPARA = ["TD010010009", "TD010010010", "TD140030015", "TD140060001", "TD080010008", "TD070130012", "TD070130001",
  "TD120210002", "TD040010012", "TD040040001", "TD050020003", "TD060010013", "TD060010001", "TD060020001", "TD030010005", "TD030010045",
  "CNPV_ACU", "CNPV_ALC", "CNPV_INT", "CNPV_EST12", "CNPV_EDSUP", "CNPV_P60", "TD310010001"];
async function renderComparar() {
  const sel = $("#cGrupo");
  if (!sel.dataset.ok) {
    sel.dataset.ok = 1;
    sel.innerHTML = Object.entries(S.cat.grupos).sort((a, b) => a[1].m.length - b[1].m.length).map(([k, g]) => `<option value="${k}">${esc(g.n)} (${g.m.length})</option>`).join("");
    sel.value = "VECINOS";
    sel.addEventListener("change", renderComparar);
  }
  let miembros = S.cat.grupos[sel.value].m.slice();
  if (!miembros.includes("MUN:76834")) miembros.unshift("MUN:76834");
  miembros = ["MUN:76834"].concat(miembros.filter((m) => m !== "MUN:76834"));
  const cols = miembros.concat(["DEP:76"]);
  let html = `<thead><tr><th>Indicador</th><th>Año</th>${cols.map((c) => `<th><button class="btn" style="padding:2px 6px;font-size:11px" data-t="${c}">${esc(corto(c))}</button></th>`).join("")}</tr></thead><tbody>`;
  for (const ic of FILAS_COMPARA) {
    const ind = S.ind[ic];
    if (!ind) continue;
    const d = await datosInd(ic);
    const u = ultimo(d["MUN:76834"] || []);
    if (!u) continue;
    const vals = cols.map((c) => valorEn(d[c] || [], u[0]));
    const mun = vals.slice(0, miembros.length).filter((v) => typeof v === "number");
    const best = ind.p ? (ind.p > 0 ? Math.max(...mun) : Math.min(...mun)) : null;
    const worst = ind.p ? (ind.p > 0 ? Math.min(...mun) : Math.max(...mun)) : null;
    html += `<tr><td><button class="btn" style="border:0;padding:0;text-align:left;background:none" data-i="${ic}">${esc(nombreInd(ic))}</button></td><td class="num">${esc(perTxt(u[0]))}</td>` +
      vals.map((v, k) => `<td class="num ${k < miembros.length && mun.length > 2 && v === best ? "best" : ""} ${k < miembros.length && mun.length > 2 && v === worst ? "worst" : ""}" ${k === 0 ? 'style="background:var(--accent-2);font-weight:600"' : ""}>${esc(fmt(v, ic, true))}</td>`).join("") + `</tr>`;
  }
  $("#cTable").innerHTML = html + "</tbody>";
  $$("#cTable [data-t]").forEach((b) => b.addEventListener("click", () => irTerritorio(b.dataset.t, "ficha")));
  $$("#cTable [data-i]").forEach((b) => b.addEventListener("click", () => irIndicador(b.dataset.i)));
}

/* ================================================================ MÉTODO */
function renderMetodo() {
  const c = S.cat;
  const cuenta = (nv) => c.territorios.filter((t) => t.nv === nv).length;
  const nDatos = c.indicadores.length;
  const porFuente = {};
  c.indicadores.forEach((i) => (porFuente[i.f] = (porFuente[i.f] || 0) + 1));
  const top = Object.entries(porFuente).sort((a, b) => b[1] - a[1]);
  $("#v-metodo").innerHTML = `
  <div class="eyebrow">Datos y método</div><h1 style="font-size:clamp(30px,4vw,48px);font-weight:900">Cómo está construido Tuluá en Cifras</h1>
  <p>Todo el visualizador sale de una base de datos <b>PostgreSQL + PostGIS</b> (software libre) con un modelo en estrella: cada dato es la combinación de un <b>indicador</b>, un <b>territorio</b>, un <b>periodo</b> y una <b>desagregación</b>. Así, un mismo indicador puede consultarse para Colombia, el Valle, los 42 municipios, las comunas de Tuluá o sus manzanas sin cambiar la estructura.</p>
  <div class="stat-strip">
    <div><b class="num">${nf(0)(nDatos)}</b><span>indicadores</span></div>
    <div><b class="num">${cuenta("MUN")}</b><span>municipios</span></div>
    <div><b class="num">${cuenta("COM")}</b><span>comunas</span></div>
    <div><b class="num">${cuenta("SECU") + cuenta("SECR")}</b><span>secciones DANE</span></div>
    <div><b class="num">${nf(0)(cuenta("MZN"))}</b><span>manzanas</span></div>
    <div><b class="num">${cuenta("BAR")}</b><span>barrios</span></div>
  </div>
  <h2>Modelo de datos</h2>
  <div class="er">
    <div class="panel hecho"><b>dato</b>indicador · territorio · periodo · desagregación → valor, valor_texto, estado (publicado, provisional, estimado), carga</div>
    <div class="panel"><b>territorio</b>código estándar (<span class="mono">MUN:76834</span>), código oficial DANE, nivel, padre, geometría PostGIS, geometría simplificada, centroide</div>
    <div class="panel"><b>nivel_territorial</b>país › departamento › municipio › zona › comuna / corregimiento › sector › sección › barrio / vereda › manzana</div>
    <div class="panel"><b>indicador</b>código, nombre, tema, unidad, fuente, periodicidad, decimales, polaridad (±1), tipo de agregación, numerador/denominador</div>
    <div class="panel"><b>periodo</b><span class="mono">A2024</span>, <span class="mono">T2025-2</span>, <span class="mono">M2025-03</span>, <span class="mono">C2018</span> con fechas de inicio y fin</div>
    <div class="panel"><b>tema · unidad · fuente</b>catálogos normalizados (las unidades de las fuentes se unifican: “Porcentaje (el valor está multiplicado por 100)” → %)</div>
    <div class="panel"><b>desagregacion</b>total, sexo, grupos de edad, zona…</div>
    <div class="panel"><b>grupo_territorial</b>vecinos de Tuluá (calculados por geometría), ciudades intermedias, todo el Valle</div>
    <div class="panel"><b>mapa_clasificacion</b>método de rangos (cuantiles, intervalos iguales, Jenks, manual), nº de clases y paleta por indicador y nivel</div>
  </div>
  <h2>Fuentes cargadas</h2>
  <div class="tbl-wrap"><table><thead><tr><th>Fuente</th><th>Indicadores</th></tr></thead><tbody>
  ${top.slice(0, 18).map(([f, n]) => `<tr><td>${esc(c.fuentes[f]?.n || f)}</td><td class="num">${n}</td></tr>`).join("")}
  ${top.length > 18 ? `<tr><td>Otras ${top.length - 18} fuentes citadas por TerriData</td><td class="num">${top.slice(18).reduce((a, b) => a + b[1], 0)}</td></tr>` : ""}
  </tbody></table></div>
  <h3>Qué hay en cada nivel</h3>
  <ul>
    <li><b>Municipios y departamento</b>: TerriData (DNP), extracto del ${esc(c.generado)} con Colombia, el Valle y sus 42 municipios, más los indicadores del Censo 2018 (DANE) recalculados con la misma fórmula para todos.</li>
    <li><b>Comunas, secciones y manzanas de Tuluá</b>: Censo Nacional de Población y Vivienda 2018 integrado al Marco Geoestadístico Nacional (DANE). Las comunas se obtienen sumando manzanas; los porcentajes se recalculan desde numerador y denominador, nunca promediando porcentajes.</li>
    <li><b>Barrios</b>: listado por comuna publicado por la Alcaldía de Tuluá; el punto de referencia viene de OpenStreetMap cuando el nombre coincide. Los datos de barrio (accidentalidad vial) proceden del portal de datos abiertos de la Alcaldía. <b>No existen polígonos oficiales de barrios publicados</b>: la base está preparada para recibirlos cuando Planeación Municipal los entregue.</li>
    <li><b>Accidentalidad vial</b>: cada registro trae coordenadas; se asigna a comuna y sección por localización y a barrio por nombre. El año en curso es parcial.</li>
  </ul>
  <h3>Advertencias</h3>
  <ul>
    <li>Los conteos censales de 2018 no están ajustados por omisión; las proyecciones de población de TerriData (DANE) sí lo están, por eso difieren.</li>
    <li>Los años posteriores a ${HOY} en las series son proyecciones y aparecen sombreados.</li>
    <li>El índice de envejecimiento y la razón de dependencia censales usan los grupos de 10 años disponibles a nivel de manzana (0-19 / 20-59 / 60+).</li>
  </ul>
  <p class="note">Base generada el ${esc(c.generado)}. Actualización: volver a descargar las fuentes y ejecutar los scripts <span class="mono">etl/01…05</span>.</p>`;
}

/* ---------------------------------------------------------------- API para compendio.js */
window.TC = { S, fmt, perTxt, nombreInd, getJSON, esc, xPer, HOY, irIndicador, irTerritorio, mostrar, unidadTxt };

/* ---------------------------------------------------------------- teclado */
document.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches(".krow")) { e.preventDefault(); e.target.click(); }
});

init().catch((err) => {
  const b = $("#boot");
  if (b) b.innerHTML = `No se pudieron leer los datos (${esc(err.message)}). Si abriste el archivo directamente, sírvelo con un servidor local: <span class="mono">python -m http.server</span> dentro de la carpeta <span class="mono">web</span>.`;
  console.error(err);
});
})();
