// Valida en Chrome real lo que reportWebVitals.js le mandaría a GA4, antes de publicar (lección 19 del handoff).
// Uso: node scripts/medicion/validar-vitals.mjs <ws-del-navegador> <url>
//   ws: agent-browser get cdp-url, o un chromium-browser con --remote-debugging-port
//   url: un preview local (npx astro preview) o un deploy de Vercel
//   DIST=dist: responde las peticiones a <url> con ese build, en el dominio real. Así la publicidad corre como en
//   producción (usar con un navegador que salga por el túnel a a1: desde casa el AdGuard bloquea los anuncios)
// Bloquea el envío a GA4 y reemplaza window.gtag para capturar los eventos. Provoca los casos difíciles en
// cargas separadas (el INP se reporta una vez por carga) y comprueba cada parámetro. Sale con 1 si algo falla.
import { readFileSync } from "node:fs";

const [wsUrl, url] = process.argv.slice(2);
const { version } = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url)));
let id = 0;
const pend = new Map();
const ws = new WebSocket(wsUrl);
await new Promise((r, e) => { ws.onopen = r; ws.onerror = e; });
ws.onmessage = ({ data }) => { const m = JSON.parse(data); if (m.id && pend.has(m.id)) { const { ok, ko } = pend.get(m.id); pend.delete(m.id); m.error ? ko(new Error(JSON.stringify(m.error))) : ok(m.result); } };
const cdp = (method, params = {}, sessionId) => new Promise((ok, ko) => { const i = ++id; pend.set(i, { ok, ko }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Cada caso: qué se agrega a la página antes de tocar
const CASOS = {
  "toques normales": "",
  // Tareas de 250 ms que no dibujan, como la subasta: el caso del error de web-vitals de la 2.0.5
  "toques sobre tareas largas": `setInterval(() => { const t = performance.now(); while (performance.now() - t < 250); }, 320);`,
  // Handler lento: el procesamiento tiene que aparecer en inp_processing y en inp_script
  "handler lento": `document.addEventListener("click", () => { const t = performance.now(); while (performance.now() - t < 180); }, true);`,
};

const fallas = [];
const fallar = (caso, ev, msj) => fallas.push(`${caso} · ${ev}: ${msj}`);
const num = (x) => typeof x === "number" && Number.isFinite(x);

const validar = (caso, nombre, p) => {
  const f = (msj) => fallar(caso, nombre, msj);
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === null || v === "" || (typeof v === "number" && !Number.isFinite(v))) f(`${k} = ${v}`);
    if (typeof v === "string" && v.length > 100) f(`${k} tiene ${v.length} caracteres (GA4 corta en 100)`);
  }
  for (const k of ["value", "metric_value"]) if (!num(p[k])) f(`${k} no es número`);
  if (p.value < 0) f(`value negativo (${p.value})`);
  if (!["good", "needs-improvement", "poor"].includes(p.metric_rating)) f(`metric_rating = ${p.metric_rating}`);
  if (p.app_version !== version) f(`app_version = ${p.app_version}, package.json dice ${version}`);
  if (p.experimento !== "ninguno") f(`experimento = ${p.experimento}`);
  if (!/^(\d+(\.\d+)?|sin dato)$/.test(p.ram_gb)) f(`ram_gb = ${p.ram_gb}`);
  if (!/^(\d+|sin dato)$/.test(p.nucleos)) f(`nucleos = ${p.nucleos}`);
  if (nombre === "LCP" && !(p.lcp_render_delay >= 0)) f(`lcp_render_delay = ${p.lcp_render_delay}`);
  if (nombre !== "INP") return;

  const v = p.metric_value;
  const fases = ["inp_input_delay", "inp_processing", "inp_presentation"];
  for (const k of fases) if (!(p[k] >= 0 && p[k] <= v)) f(`${k} = ${p[k]} fuera de [0, ${v}]`);
  // web-vitals redondea la duración a 8 ms; cada fase se redondea a 1 ms
  const suma = fases.reduce((a, k) => a + p[k], 0);
  if (Math.abs(suma - v) > 10) f(`entrada + procesamiento + presentación = ${suma}, INP = ${v}`);
  if (!(p.inp_desde_carga >= 0)) f(`inp_desde_carga = ${p.inp_desde_carga}`);
  const franja = p.inp_desde_carga < 6000 ? "0-6 s" : p.inp_desde_carga < 60000 ? "6-60 s" : p.inp_desde_carga < 300000 ? "1-5 min" : "5+ min";
  if (p.inp_franja !== franja) f(`inp_franja = ${p.inp_franja} con inp_desde_carga = ${p.inp_desde_carga}`);
  if (!/^((input-delay|processing-duration|presentation-delay): .+ \(.+\)|sin script largo|sin frames largos|sin loaf)$/.test(p.inp_script)) f(`inp_script = ${p.inp_script}`);
  // Este Chrome tiene LoAF: "sin loaf" sería clasificar mal (pasó en la 2.0.6 con los toques rápidos)
  if (p.inp_script === "sin loaf") f("inp_script = sin loaf en un navegador que tiene Long Animation Frames");
  if (p.inp_script_ms !== undefined && !(p.inp_script_ms >= 0 && p.inp_script_ms <= v)) f(`inp_script_ms = ${p.inp_script_ms} fuera de [0, ${v}]`);
  if (p.inp_script === "sin loaf" || p.inp_script === "sin frames largos") return;
  for (const k of ["inp_style_layout", "inp_paint"]) if (!(p[k] >= 0 && p[k] <= v)) f(`${k} = ${p[k]} fuera de [0, ${v}]`);
  // Sin atribuir puede ser apenas negativo por los redondeos, nunca miles de ms (el error de la 2.0.5)
  if (!(p.inp_unattributed >= -5 && p.inp_unattributed <= v)) f(`inp_unattributed = ${p.inp_unattributed} fuera de [0, ${v}]`);
};

for (const [caso, inyectar] of Object.entries(CASOS)) {
  const { targetId } = await cdp("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp("Target.attachToTarget", { targetId, flatten: true });
  const s = (m, p) => cdp(m, p, sessionId);
  const ev = async (expression) => (await s("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value;
  await s("Network.enable");
  // Nada de esto llega a GA4, Vercel ni Clarity
  await s("Network.setBlockedURLs", { urls: ["*google-analytics.com*", "*analytics.google.com*", "*_vercel/insights*", "*clarity.ms*"] });
  await s("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36" });
  await s("Emulation.setDeviceMetricsOverride", { width: 412, height: 823, deviceScaleFactor: 1.75, mobile: true });
  if (process.env.DIST) {
    const { readFile } = await import("node:fs/promises");
    const { join, extname } = await import("node:path");
    const origen = new URL(url).origin;
    const tipos = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2", ".ico": "image/x-icon", ".txt": "text/plain", ".xml": "application/xml", ".webmanifest": "application/manifest+json" };
    ws.addEventListener("message", async ({ data }) => {
      const m = JSON.parse(data);
      if (m.method !== "Fetch.requestPaused" || m.sessionId !== sessionId) return;
      const { requestId, request } = m.params;
      const ruta = decodeURIComponent(new URL(request.url).pathname);
      for (const archivo of [ruta, join(ruta, "index.html"), `${ruta}.html`]) {
        try {
          if (!extname(archivo)) continue;
          const cuerpo = await readFile(join(process.env.DIST, archivo));
          return cdp("Fetch.fulfillRequest", { requestId, responseCode: 200, body: cuerpo.toString("base64"), responseHeaders: [{ name: "Content-Type", value: tipos[extname(archivo)] ?? "application/octet-stream" }, { name: "Cache-Control", value: "no-store" }] }, sessionId);
        } catch (_) {}
      }
      cdp("Fetch.continueRequest", { requestId }, sessionId).catch(() => {});
    });
    await s("Fetch.enable", { patterns: [{ urlPattern: `${origen}/*`, requestStage: "Request" }] });
  }
  await s("Page.enable");
  await s("Page.navigate", { url: `${url}?validar=${Date.now()}` });
  await esperar(5000);
  await ev(`localStorage.clear(); localStorage.setItem("tapHintSessions", "10"); 1`);
  await s("Page.reload");
  await esperar(process.env.DIST ? 15000 : 6000); // con publicidad: dejar que arranquen las subastas
  const ver = await ev(`document.body.innerText.match(/versión [0-9.]+/)?.[0]`);
  if (ver !== `versión ${version}`) fallar(caso, "página", `muestra "${ver}", se esperaba versión ${version}`);
  // gtag se declara como función global (no se puede redefinir con defineProperty): se asigna la captura y se vuelve a
  // asignar si gtag.js o la publicidad la pisan
  await ev(`window.__ev = []; const captura = (...a) => { if (a[0] === "event") window.__ev.push({ nombre: a[1], p: a[2] }); };
    window.gtag = captura; setInterval(() => { if (window.gtag !== captura) { window.__pisado = (window.__pisado || 0) + 1; window.gtag = captura; } }, 50); ${inyectar} 1`);
  const centro = (sel) => ev(`(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  const mas = await centro(".counter-body-nos button.counter-button:last-child");
  const menos = await centro(".counter-body-nos button.counter-button:first-child");
  for (let i = 0; i < 6; i++) {
    const p = i % 2 ? menos : mas;
    // Sin await entre press y release: así el toque puede caer encima de una tarea larga
    s("Input.dispatchMouseEvent", { type: "mousePressed", ...p, button: "left", clickCount: 1 });
    s("Input.dispatchMouseEvent", { type: "mouseReleased", ...p, button: "left", clickCount: 1 });
    await esperar(700);
  }
  // Ocultar la página: web-vitals manda lo que tiene pendiente (INP, CLS, LCP)
  const eventos = await ev(`(async () => { Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true }); document.dispatchEvent(new Event("visibilitychange"));
    for (let i = 0; i < 40 && !window.__ev.some((e) => e.nombre === "INP"); i++) await new Promise((r) => setTimeout(r, 200)); return window.__ev; })()`);
  const vitals = eventos.filter((e) => ["LCP", "INP", "CLS", "FCP", "TTFB"].includes(e.nombre));
  const inp = vitals.find((e) => e.nombre === "INP");
  // Con publicidad, ~1 de cada 6 cargas de "tareas largas" no captura ningún evento (ni LCP ni CLS): es la captura, no
  // reportWebVitals (sin causa encontrada; no es gtag pisado). Si pasa, repetir: lo que importa son los rangos
  if (!inp) fallar(caso, "INP", vitals.length ? "no se mandó" : "no se capturó ningún evento (repetir la corrida; ver el comentario)");
  for (const e of vitals) validar(caso, e.nombre, e.p);
  const anuncio = await ev(`!!document.querySelector(".ad-slot iframe")`);
  const pisado = await ev(`window.__pisado || 0`);
  if (pisado) console.log(`  (algo reasignó window.gtag ${pisado} veces; la captura se repuso)`);
  console.log(`${caso}: ${vitals.map((e) => e.nombre).join(", ") || "ningún evento"}${process.env.DIST ? ` · anuncio ${anuncio ? "sí" : "no"}` : ""}`);
  if (inp) {
    const p = inp.p;
    console.log(`  INP ${p.metric_value} ms (${p.metric_rating}) = entrada ${p.inp_input_delay} + procesamiento ${p.inp_processing} + presentación ${p.inp_presentation}` +
      ` · ${p.inp_script} · script ${p.inp_script_ms ?? "-"} · estilos ${p.inp_style_layout ?? "-"} · pintado ${p.inp_paint ?? "-"} · sin atribuir ${p.inp_unattributed ?? "-"}`);
    console.log(`  ${p.inp_franja} (${p.inp_desde_carga} ms) · versión ${p.app_version} · RAM ${p.ram_gb} · núcleos ${p.nucleos} · ${p.experimento}`);
  }
  await cdp("Target.closeTarget", { targetId });
}
ws.close();
if (fallas.length) {
  console.log(`\n✗ ${fallas.length} problema${fallas.length > 1 ? "s" : ""}:\n  ${fallas.join("\n  ")}`);
  process.exit(1);
}
console.log("\n✓ Todo lo que se manda a GA4 tiene sentido");
