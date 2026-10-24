// Mide primer dibujo y LCP con CPU y red limitadas (valores de Lighthouse mobile), por CDP.
// Uso: node scripts/medicion/carga-cdp.mjs <ws-url-del-navegador> <corridas> nombre=url [nombre=url...]
const [wsUrl, corridasArg, ...pares] = process.argv.slice(2);
const corridas = Number(corridasArg);

let id = 0;
const pendientes = new Map();
const oyentes = [];
const ws = new WebSocket(wsUrl);
await new Promise((r, e) => { ws.onopen = r; ws.onerror = e; });
ws.onmessage = ({ data }) => {
  const m = JSON.parse(data);
  if (m.id && pendientes.has(m.id)) {
    const { resolve, reject } = pendientes.get(m.id);
    pendientes.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  } else if (m.method) oyentes.forEach((f) => f(m));
};
const cdp = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const i = ++id;
    pendientes.set(i, { resolve, reject });
    ws.send(JSON.stringify({ id: i, method, params, sessionId }));
  });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const mediana = (v) => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)];

const medir = async (url) => {
  const { targetId } = await cdp("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp("Target.attachToTarget", { targetId, flatten: true });
  const s = (m, p) => cdp(m, p, sessionId);
  await s("Page.enable");
  await s("Network.enable");
  await s("Network.setCacheDisabled", { cacheDisabled: true });
  // Lighthouse mobile: RTT 150 ms, 1,6 Mbps de bajada, 750 kbps de subida, CPU 4×
  await s("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await s("Emulation.setCPUThrottlingRate", { rate: 4 });
  await s("Emulation.setDeviceMetricsOverride", { width: 412, height: 823, deviceScaleFactor: 1.75, mobile: true });
  const cargado = new Promise((r) => oyentes.push((m) => m.sessionId === sessionId && m.method === "Page.loadEventFired" && r()));
  await s("Page.navigate", { url });
  // Sin límite, una carga que nunca dispara load colgaba todo
  const aTiempo = await Promise.race([cargado.then(() => true), esperar(30000).then(() => false)]);
  if (!aTiempo) console.error(`  (sin evento load en 30 s: ${url})`);
  await esperar(2500);
  const { result } = await s("Runtime.evaluate", {
    returnByValue: true,
    awaitPromise: true,
    expression: `new Promise(r => {
      const p = Object.fromEntries(performance.getEntriesByType("paint").map(e => [e.name, e.startTime]));
      const n = performance.getEntriesByType("navigation")[0];
      let lcp = 0;
      new PerformanceObserver(l => { for (const e of l.getEntries()) lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
      setTimeout(() => r({ fp: p["first-paint"], fcp: p["first-contentful-paint"], lcp, dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd }), 50);
    })`,
  });
  await cdp("Target.closeTarget", { targetId });
  return result.value;
};

for (const par of pares) {
  const [nombre, url] = par.split("=");
  const v = [];
  for (let i = 0; i < corridas; i++) {
    const r = await Promise.race([medir(`${url}?r=${Date.now()}${i}`), esperar(60000).then(() => null)]);
    if (r) v.push(r); else console.error(`  (corrida ${i + 1} de ${nombre} descartada: más de 60 s)`);
  }
  const f = (k) => Math.round(mediana(v.map((x) => x[k])));
  console.log(`${nombre.padEnd(11)} FCP ${f("fcp")} · LCP ${f("lcp")} · DCL ${f("dcl")} · load ${f("load")}   (FCP por corrida: ${v.map((x) => Math.round(x.fcp)).join(", ")})`);
}
ws.close();
