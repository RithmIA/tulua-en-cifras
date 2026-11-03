/* =====================================================================
   CONFIGURACIÓN DEL OBSERVATORIO
   ---------------------------------------------------------------------
   Para crear el proyecto de otro municipio del Valle del Cauca basta con
   copiar esta carpeta y cambiar los valores de OBS. La paleta completa
   (claro y oscuro, gráficos, botones, PDF) se deriva sola del color.
   ===================================================================== */
window.OBS = {
  nombre: "Tuluá",                 // nombre del municipio
  cod: "76834",                    // código DANE del municipio (5 dígitos)
  subtitulo: "Observatorio territorial",
  color: "#009900",                // color institucional (verde de la Alcaldía de Tuluá)
  descripcion: "«Corazón del Valle», en la subregión centro del Valle del Cauca, sobre el río Tuluá",
  url: "https://rithmia.github.io/tulua-en-cifras/web/",
};

(function () {
  const O = window.OBS;
  O.marca = O.marca || O.nombre + " en cifras";

  /* ---------- utilidades de color ---------- */
  const hex2rgb = (h) => { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgb2hex = (a) => "#" + a.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
  const rgb2hsl = ([r, g, b]) => {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0, s = 0; const l = (mx + mn) / 2;
    if (d) { s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return [h, s * 100, l * 100];
  };
  const hsl = (h, s, l) => {
    s /= 100; l /= 100; const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return rgb2hex([f(0) * 255, f(8) * 255, f(4) * 255]);
  };
  const lum = (rgb) => { const c = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const contraste = (a, b) => { const x = lum(hex2rgb(a)), y = lum(hex2rgb(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const mezcla = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((v, i) => v * (1 - t) + B[i] * t)); };
  // ajusta la luminosidad del color hasta alcanzar el contraste mínimo sobre un fondo
  const conContraste = (color, fondo, min, sube) => {
    let [h, s, l] = rgb2hsl(hex2rgb(color)), c = color, n = 0;
    while (contraste(c, fondo) < min && n++ < 80) { l += sube ? 1 : -1; c = hsl(h, s, Math.max(0, Math.min(100, l))); }
    return c;
  };

  /* ---------- paleta ---------- */
  const P = O.color, h = rgb2hsl(hex2rgb(P))[0];
  // colores categóricos para los gráficos; se descartan los que se parecen al color de marca
  const CATEG = [["#2f6fd6", "#5b9bf0", 216], ["#e0702a", "#f0914f", 24], ["#7b5cc4", "#a394ee", 258], ["#b0417a", "#dc6fa3", 330], ["#8a6d00", "#d1ab2c", 48], ["#0b8a8a", "#3cc0c0", 180]];
  const dist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  const otros = CATEG.filter((c) => dist(c[2], h) >= 35).slice(0, 5);

  const claro = {
    ground: hsl(h, 22, 96), surface: "#ffffff", "surface-2": hsl(h, 18, 92), ink: hsl(h, 35, 12), "ink-2": hsl(h, 14, 30), muted: hsl(h, 10, 38),
    line: hsl(h, 16, 86), "line-2": hsl(h, 14, 76), brand: P, accent: conContraste(P, "#ffffff", 4.5, false),
    "accent-2": mezcla(P, "#ffffff", 0.88), nodata: hsl(h, 12, 89), good: "#1b7f3b", bad: "#b33a2f", neutral: hsl(h, 8, 40),
    "map-bg": hsl(h, 18, 91), "map-stroke": "#ffffff", context: hsl(h, 35, 12),
  };
  claro["on-accent"] = contraste(claro.accent, "#ffffff") >= 4.5 ? "#ffffff" : claro.ink;
  claro.focus = claro.accent;
  claro.c = [P].concat(otros.map((c) => c[0]));

  const oscuro = {
    ground: hsl(h, 30, 7), surface: hsl(h, 24, 11), "surface-2": hsl(h, 22, 15), ink: hsl(h, 18, 93), "ink-2": hsl(h, 10, 72), muted: hsl(h, 8, 62),
    line: hsl(h, 16, 20), "line-2": hsl(h, 14, 28), nodata: hsl(h, 14, 17), good: "#4cc47a", bad: "#f07a6c", neutral: hsl(h, 8, 62),
    "map-bg": hsl(h, 24, 9), "map-stroke": hsl(h, 30, 7), context: hsl(h, 18, 93),
  };
  oscuro.accent = conContraste(P, oscuro.surface, 4.5, true);
  oscuro.brand = oscuro.accent;
  oscuro["accent-2"] = mezcla(oscuro.accent, oscuro.surface, 0.8);
  oscuro["on-accent"] = hsl(h, 40, 8);
  oscuro.focus = oscuro.accent;
  oscuro.c = [oscuro.accent].concat(otros.map((c) => c[1]));

  const vars = (t) => Object.keys(t).filter((k) => k !== "c").map((k) => `--${k}:${t[k]}`).join(";") + ";" + t.c.map((v, i) => `--c${i + 1}:${v}`).join(";");
  const css = `:root{color-scheme:light;${vars(claro)}}` +
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){color-scheme:dark;${vars(oscuro)}}}` +
    `:root[data-theme="dark"]{color-scheme:dark;${vars(oscuro)}}`;
  const st = document.createElement("style");
  st.id = "obs-tema"; st.textContent = css;
  document.head.appendChild(st);
  document.title = O.nombre + " en Cifras";

  /* colores para el PDF (RGB) */
  O.pdf = { marca: hex2rgb(P), acento: hex2rgb(claro.accent), tinta: hex2rgb(claro.ink), gris: hex2rgb(claro.muted), fondo: hex2rgb(claro.ground), linea: hex2rgb(claro.line) };
  O.paleta = { claro, oscuro };
})();
