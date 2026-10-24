/* Exportaciones de Tuluá en Cifras: imagen (PNG/JPEG), JSON, Excel y PDF.
   jsPDF, autoTable y SheetJS se cargan solo al pedir la primera descarga. */
(function () {
  const CDN = {
    jspdf: ["https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js", () => window.jspdf && window.jspdf.jsPDF],
    autotable: ["https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js", "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js", () => window.jspdf && window.jspdf.jsPDF.API.autoTable],
    xlsx: ["https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js", "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js", () => window.XLSX],
  };
  const cargas = {};
  const tag = (src) => new Promise((ok) => { const s = document.createElement("script"); s.src = src; s.onload = () => ok(true); s.onerror = () => ok(false); document.head.appendChild(s); });
  function lib(k) {
    const [a, b, listo] = CDN[k];
    if (listo()) return Promise.resolve();
    return (cargas[k] = cargas[k] || (async () => {
      if (!(await tag(a)) || !listo()) await tag(b);
      if (!listo()) { delete cargas[k]; throw new Error("No se pudo cargar la librería " + k); }
    })());
  }

  /* ---------- utilidades */
  const limpia = (s) => String(s ?? "").replace(/[\u202f\u00a0]/g, " ").replace(/[\u2212\u2013\u2014]/g, "-").replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[^\x20-\xff]/g, "");
  const slug = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 70);
  const num = (v) => {
    if (typeof v === "number") return v;
    const t = String(v ?? "").replace(/\u2212/g, "-").trim();
    return /^-?\d{1,3}(\.\d{3})+(,\d+)?$|^-?\d+(,\d+)?$/.test(t) ? parseFloat(t.replace(/\./g, "").replace(",", ".")) : v;
  };
  const hoyTxt = () => new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
  function guardar(blob, nombre) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function aviso(txt) {
    const d = document.createElement("div"); d.className = "exp-toast"; d.setAttribute("role", "status"); d.textContent = txt;
    document.body.appendChild(d); setTimeout(() => d.remove(), 4000);
  }
  const cs = () => getComputedStyle(document.body);
  const tok = (v, d) => cs().getPropertyValue(v).trim() || d;
  function recorta(g, t, ancho) {
    t = String(t || "");
    if (g.measureText(t).width <= ancho) return t;
    while (t.length > 1 && g.measureText(t + "…").width > ancho) t = t.slice(0, -1);
    return t + "…";
  }

  /* ---------- imagen: el lienzo del gráfico sobre fondo opaco, con título y fuente */
  function lienzo(card, meta, conTexto) {
    const cv = card.querySelector("canvas");
    if (!cv) return null;
    const ch = window.Chart && window.Chart.getChart && window.Chart.getChart(cv);
    if (ch) { ch.stop(); ch.update("none"); }
    const k = cv.width / (cv.clientWidth || cv.width), px = (n) => Math.round(n * k);
    const pad = px(14), cab = conTexto ? px(56) : 0, pie = conTexto ? px(36) : 0;
    const o = document.createElement("canvas");
    o.width = cv.width + 2 * pad; o.height = cv.height + 2 * pad + cab + pie;
    const g = o.getContext("2d"), fam = cs().fontFamily || "sans-serif", ancho = o.width - 2 * pad;
    g.fillStyle = tok("--surface", "#ffffff"); g.fillRect(0, 0, o.width, o.height);
    g.drawImage(cv, pad, pad + cab);
    if (conTexto) {
      g.textBaseline = "top";
      g.fillStyle = tok("--ink", "#111111"); g.font = `700 ${px(17)}px ${fam}`;
      g.fillText(recorta(g, meta.titulo, ancho), pad, pad);
      g.fillStyle = tok("--muted", "#666666"); g.font = `${px(12.5)}px ${fam}`;
      if (meta.sub) g.fillText(recorta(g, meta.sub, ancho), pad, pad + px(25));
      g.font = `${px(11.5)}px ${fam}`;
      const y = pad + cab + cv.height + px(8);
      g.fillText(recorta(g, [meta.terr, meta.fuente && "Fuente: " + meta.fuente].filter(Boolean).join(" · "), ancho), pad, y);
      g.fillText("Tuluá en Cifras · Alcaldía de Tuluá", pad, y + px(16));
    }
    return o;
  }
  const base = (meta) => slug(meta.terr + "_" + meta.titulo) || "grafico";
  function imagen(card, meta, fmt) {
    const o = lienzo(card, meta, true);
    if (!o) return;
    o.toBlob((b) => (b ? guardar(b, base(meta) + (fmt === "jpeg" ? ".jpg" : ".png")) : aviso("No se pudo generar la imagen.")),
      fmt === "jpeg" ? "image/jpeg" : "image/png", 0.92);
  }

  /* ---------- datos: JSON y Excel, a partir de la tabla de la tarjeta */
  function json(card, meta) {
    const t = card._tabla;
    const obj = {
      titulo: meta.titulo, subtitulo: meta.sub || "", territorio: meta.terr, fuente: meta.fuente || "",
      generado: new Date().toISOString().slice(0, 10), columnas: t.cols,
      filas: t.filas.map((f) => Object.fromEntries(t.cols.map((c, i) => [c, num(f[i])]))),
    };
    guardar(new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" }), base(meta) + ".json");
  }
  async function excel(card, meta) {
    await lib("xlsx");
    const X = window.XLSX, t = card._tabla;
    const ws = X.utils.aoa_to_sheet([t.cols].concat(t.filas.map((f) => f.map(num))));
    ws["!cols"] = t.cols.map((c, i) => ({ wch: Math.min(42, Math.max(String(c).length, ...t.filas.slice(0, 80).map((f) => String(f[i] ?? "").length)) + 2) }));
    const info = X.utils.aoa_to_sheet([["Título", meta.titulo], ["Subtítulo", meta.sub || ""], ["Territorio", meta.terr], ["Fuente", meta.fuente || ""], ["Generado", hoyTxt()], ["Publicación", "Tuluá en Cifras · Alcaldía de Tuluá"]]);
    info["!cols"] = [{ wch: 14 }, { wch: 80 }];
    const wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, ws, "Datos"); X.utils.book_append_sheet(wb, info, "Metadatos");
    X.writeFile(wb, base(meta) + ".xlsx");
  }

  /* ---------- menú de descargas de cada tarjeta */
  let abierto = null;
  const cerrar = () => { if (abierto) { abierto.hidden = true; abierto.previousElementSibling.setAttribute("aria-expanded", "false"); abierto = null; } };
  document.addEventListener("click", (e) => { if (abierto && !abierto.parentNode.contains(e.target)) cerrar(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrar(); });
  function menu(card, meta) {
    const acc = card.querySelector(".cmp-acc");
    if (!acc || acc.querySelector(".exp-btn")) return;
    const hayImg = !!card.querySelector("canvas"), hayTab = !!card._tabla;
    if (!hayImg && !hayTab) return;
    const items = [].concat(hayImg ? [["png", "Imagen PNG"], ["jpeg", "Imagen JPEG"]] : [], hayTab ? [["json", "Datos JSON"], ["xlsx", "Tabla Excel (.xlsx)"]] : []);
    const wrap = document.createElement("span");
    wrap.className = "exp";
    wrap.innerHTML = `<button type="button" class="btn mini exp-btn" aria-haspopup="menu" aria-expanded="false" title="Descargar" aria-label="Descargar este gráfico o sus datos"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M8 2v8m0 0L5 7m3 3 3-3M3 13h10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` +
      `<div class="exp-menu" role="menu" hidden>${items.map(([k, t]) => `<button type="button" role="menuitem" data-f="${k}">${t}</button>`).join("")}</div>`;
    acc.insertBefore(wrap, acc.firstChild);
    const bt = wrap.firstElementChild, mn = wrap.lastElementChild;
    bt.addEventListener("click", (e) => {
      e.stopPropagation();
      const abrir = mn.hidden; cerrar();
      if (abrir) { mn.hidden = false; bt.setAttribute("aria-expanded", "true"); abierto = mn; }
    });
    mn.addEventListener("click", async (e) => {
      const f = e.target.closest("[data-f]");
      if (!f) return;
      cerrar();
      try {
        if (f.dataset.f === "png" || f.dataset.f === "jpeg") imagen(card, meta, f.dataset.f);
        else if (f.dataset.f === "json") json(card, meta);
        else await excel(card, meta);
      } catch (err) { console.error(err); aviso("No se pudo completar la descarga."); }
    });
  }

  /* ---------- PDF: bloques {t:"h"|"p"|"cifras"|"img"|"tabla"|"nota"} */
  async function pdf(o) {
    await lib("jspdf"); await lib("autotable");
    const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
    const W = 210, M = 15, AN = W - 2 * M, LIM = 278, AZ = [51, 102, 204], OSC = [0, 72, 132], TXT = [27, 42, 65], GRIS = [100, 115, 139];
    const L = limpia;
    let y = 0;
    const salto = (h) => { if (y + h > LIM) { doc.addPage(); y = M; } };
    const texto = (t, tam, est, col) => { doc.setFont("helvetica", est); doc.setFontSize(tam); doc.setTextColor(...col); };

    doc.setFillColor(...OSC); doc.rect(0, 0, W, 22, "F");
    texto("", 11, "bold", [255, 255, 255]); doc.text("Alcaldía de Tuluá", M, 9.5);
    texto("", 9, "normal", [255, 255, 255]); doc.text(L("Tuluá en Cifras · Observatorio territorial"), M, 15.5);
    y = 35;
    texto("", 19, "bold", TXT);
    const tt = doc.splitTextToSize(L(o.titulo), AN); doc.text(tt, M, y); y += tt.length * 8;
    if (o.sub) { texto("", 10, "normal", GRIS); const ss = doc.splitTextToSize(L(o.sub), AN); doc.text(ss, M, y); y += ss.length * 5; }
    y += 5;

    for (const b of o.bloques) {
      if (b.t === "h") {
        salto(16); texto("", 13, "bold", AZ); doc.text(L(b.texto), M, y + 5);
        doc.setDrawColor(...AZ); doc.setLineWidth(0.4); doc.line(M, y + 7.5, M + AN, y + 7.5); y += 13;
      } else if (b.t === "p" || b.t === "nota") {
        texto("", b.t === "p" ? 9.5 : 8, b.t === "p" ? "normal" : "italic", b.t === "p" ? [70, 83, 107] : GRIS);
        const ln = doc.splitTextToSize(L(b.texto), AN), h = ln.length * (b.t === "p" ? 4.6 : 3.8);
        salto(h + 2); doc.text(ln, M, y + 4); y += h + 5;
      } else if (b.t === "cifras") {
        const w = (AN - 8) / 3, h = 26;
        b.items.forEach((it, i) => {
          if (i % 3 === 0) salto(h + 4);
          const x = M + (i % 3) * (w + 4);
          doc.setFillColor(244, 246, 251); doc.setDrawColor(217, 224, 238); doc.setLineWidth(0.2); doc.roundedRect(x, y, w, h, 1.5, 1.5, "FD");
          doc.setFillColor(...AZ); doc.rect(x, y, w, 1.2, "F");
          texto("", 8, "normal", GRIS); doc.text(doc.splitTextToSize(L(it.l), w - 6).slice(0, 2), x + 3, y + 6);
          texto("", 14, "bold", TXT); doc.text(L(it.v), x + 3, y + 16.5);
          if (it.d) { texto("", 8, "normal", AZ); doc.text(L(it.d), x + 3, y + 22); }
          if (i % 3 === 2 || i === b.items.length - 1) y += h + 4;
        });
        y += 2;
      } else if (b.t === "img" && b.canvas) {
        const ratio = b.canvas.height / b.canvas.width;
        let w = AN, h = w * ratio; if (h > 92) { h = 92; w = h / ratio; }
        salto(h + 20);
        texto("", 10.5, "bold", TXT); doc.text(doc.splitTextToSize(L(b.titulo), AN).slice(0, 2), M, y + 4); y += 6.5;
        if (b.sub) { texto("", 8.5, "normal", GRIS); doc.text(doc.splitTextToSize(L(b.sub), AN).slice(0, 1), M, y + 1.5); y += 5; }
        doc.addImage(b.canvas.toDataURL("image/jpeg", 0.9), "JPEG", M + (AN - w) / 2, y, w, h); y += h + 3.5;
        if (b.fuente) { texto("", 7.5, "normal", GRIS); doc.text(doc.splitTextToSize(L(b.fuente), AN).slice(0, 2), M, y); y += 4.5; }
        y += 5;
      } else if (b.t === "tabla") {
        salto(34);
        if (b.titulo) { texto("", 10.5, "bold", TXT); doc.text(L(b.titulo), M, y + 4); y += 7; }
        doc.autoTable({
          startY: y, head: [b.cols.map(L)], body: b.filas.map((f) => f.map(L)), theme: "grid",
          margin: { left: M, right: M, bottom: 18 },
          styles: { fontSize: 8, cellPadding: 1.7, textColor: TXT, lineColor: [217, 224, 238], lineWidth: 0.15 },
          headStyles: { fillColor: AZ, textColor: 255, fontStyle: "bold" },
          alternateRowStyles: { fillColor: [244, 246, 251] },
          columnStyles: Object.fromEntries(b.cols.map((c, i) => [i, i ? { halign: "right" } : { cellWidth: "auto" }])),
        });
        y = doc.lastAutoTable.finalY + 4;
        if (b.fuente) { texto("", 7.5, "normal", GRIS); doc.text(L(b.fuente), M, y + 2); y += 4; }
        y += 5;
      }
    }
    const n = doc.getNumberOfPages(), pie = o.pie || "Tuluá en Cifras · " + location.host + location.pathname;
    for (let p = 1; p <= n; p++) {
      doc.setPage(p); doc.setDrawColor(217, 224, 238); doc.setLineWidth(0.2); doc.line(M, 285, W - M, 285);
      texto("", 7.5, "normal", GRIS);
      doc.text(doc.splitTextToSize(L(pie), AN - 30).slice(0, 1), M, 289.5);
      doc.text(`Página ${p} de ${n}`, W - M, 289.5, { align: "right" });
    }
    doc.save((o.nombre || "informe") + ".pdf");
    return doc;
  }

  window.EXP = { menu, pdf, lienzo, aviso, slug, hoyTxt, lib, _num: num };
})();
