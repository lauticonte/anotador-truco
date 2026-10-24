// Mide la respuesta a toques reales en + y − (Event Timing, lo mismo que usa INP), con CPU 4× más lenta.
// Uso: node scripts/medicion/toques-cdp.mjs <ws-del-navegador> <url> <con|sin> [toques]
//   con = deja cargar la publicidad; sin = bloquea anuncios, CMP y analítica para ver solo el código propio
const [wsUrl, url, modo, toquesArg] = process.argv.slice(2);
const toques = Number(toquesArg ?? 12);
let id = 0;
const pend = new Map();
const ws = new WebSocket(wsUrl);
await new Promise((r, e) => { ws.onopen = r; ws.onerror = e; });
ws.onmessage = ({ data }) => { const m = JSON.parse(data); if (m.id && pend.has(m.id)) { const { ok, ko } = pend.get(m.id); pend.delete(m.id); m.error ? ko(new Error(JSON.stringify(m.error))) : ok(m.result); } };
const cdp = (method, params = {}, sessionId) => new Promise((ok, ko) => { const i = ++id; pend.set(i, { ok, ko }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const { targetId } = await cdp("Target.createTarget", { url: "about:blank" });
const { sessionId } = await cdp("Target.attachToTarget", { targetId, flatten: true });
const s = (m, p) => cdp(m, p, sessionId);
await s("Page.enable");
await s("Network.enable");
if (modo === "sin") {
  await s("Network.setBlockedURLs", { urls: ["*themoneytizer*", "*sascdn*", "*smartadserver*", "*inmobi*", "*googletagmanager*", "*google-analytics*", "*doubleclick*", "*prebid*", "*criteo*", "*quantserve*", "*first-id*", "*pubmatic*", "*rubicon*", "*casalemedia*", "*adagio*", "*4dex*", "*amxrtb*", "*hyth.io*", "*pbxai*", "*33across*", "*id5-sync*", "*crwdcntrl*", "*onetag*", "*rlcdn*", "*a-mx*", "*a-mo.net*", "*pbstck*", "*adleadevent*", "*biddertmz*", "*_vercel/insights*"] });
}
await s("Emulation.setDeviceMetricsOverride", { width: 412, height: 823, deviceScaleFactor: 1.75, mobile: true });
await s("Emulation.setCPUThrottlingRate", { rate: 4 });
await s("Runtime.evaluate", { expression: "1" });
await s("Page.navigate", { url: `${url}?inp=${Date.now()}` });
await esperar(modo === "con" ? 15000 : 6000); // con publicidad: dejar que arranquen las subastas

// Observador de Event Timing: cada interacción con su demora de entrada, procesamiento y presentación
await s("Runtime.evaluate", { expression: `
  localStorage.setItem("tapHintSessions", "10");
  window.__inp = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.interactionId && (e.name === "pointerup" || e.name === "click" || e.name === "pointerdown"))
    window.__inp.push({ id: e.interactionId, dur: e.duration, entrada: e.processingStart - e.startTime, proceso: e.processingEnd - e.processingStart, presentacion: e.startTime + e.duration - e.processingEnd, nombre: e.name }); })
    .observe({ type: "event", durationThreshold: 16, buffered: false });
` });
const centro = async (sel) => (await s("Runtime.evaluate", { returnByValue: true, expression: `(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()` })).result.value;
const tocar = async ({ x, y }) => {
  await s("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await s("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
};
const mas = await centro(".counter-body-nos button.counter-button:last-child");
const menos = await centro(".counter-body-nos button.counter-button:first-child");
for (let i = 0; i < toques; i++) { await tocar(i % 3 === 2 ? menos : mas); await esperar(700); }
await esperar(1500);
const { result } = await s("Runtime.evaluate", { returnByValue: true, expression: "window.__inp" });
// Por interacción, la entrada más larga (como INP)
const porId = {};
for (const e of result.value) if (!porId[e.id] || e.dur > porId[e.id].dur) porId[e.id] = e;
const v = Object.values(porId).sort((a, b) => a.dur - b.dur);
const r = (x) => Math.round(x);
const p = (q) => v[Math.min(v.length - 1, Math.floor(q * v.length))];
console.log(`${modo === "con" ? "CON publicidad" : "SIN publicidad"}: ${v.length} toques · mediana ${r(p(0.5).dur)} ms · p75 ${r(p(0.75).dur)} ms · máximo ${r(v[v.length - 1].dur)} ms · lentos (>200 ms): ${v.filter((x) => x.dur > 200).length}`);
const prom = (k) => r(v.reduce((a, x) => a + x[k], 0) / v.length);
console.log(`  promedio por fase: demora de entrada ${prom("entrada")} ms · procesamiento (nuestro JS) ${prom("proceso")} ms · presentación (dibujar) ${prom("presentacion")} ms`);
await cdp("Target.closeTarget", { targetId });
ws.close();
