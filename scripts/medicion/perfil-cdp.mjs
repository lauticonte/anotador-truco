// Perfil de CPU de N toques en + (partida limpia, sin publicidad ni analítica), con el tiempo propio de cada función.
// Uso: node scripts/medicion/perfil-cdp.mjs <ws-del-navegador> <url> [toques]
const [wsUrl, url, n = 12] = process.argv.slice(2);
let id = 0; const pend = new Map(); const ws = new WebSocket(wsUrl);
await new Promise((r, e) => { ws.onopen = r; ws.onerror = e; });
ws.onmessage = ({ data }) => { const m = JSON.parse(data); if (m.id && pend.has(m.id)) { const { ok, ko } = pend.get(m.id); pend.delete(m.id); m.error ? ko(new Error(JSON.stringify(m.error))) : ok(m.result); } };
const cdp = (method, params = {}, sessionId) => new Promise((ok, ko) => { const i = ++id; pend.set(i, { ok, ko }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const { targetId } = await cdp("Target.createTarget", { url: "about:blank" });
const { sessionId } = await cdp("Target.attachToTarget", { targetId, flatten: true });
const s = (m, p) => cdp(m, p, sessionId);
await s("Page.enable"); await s("Network.enable");
await s("Network.setBlockedURLs", { urls: ["*themoneytizer*", "*sascdn*", "*smartadserver*", "*googletagmanager*", "*google-analytics*", "*doubleclick*", "*_vercel/insights*"] });
await s("Emulation.setDeviceMetricsOverride", { width: 412, height: 823, deviceScaleFactor: 1.75, mobile: true });
await s("Page.navigate", { url }); await esperar(3000);
await s("Runtime.evaluate", { expression: `localStorage.clear(); localStorage.setItem("tapHintSessions","10")` });
await s("Page.reload"); await esperar(4000);
const { result } = await s("Runtime.evaluate", { returnByValue: true, expression: `(() => { const r = document.querySelector('.counter-body-nos button.counter-button:last-child').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()` });
const { x, y } = result.value;
await s("Profiler.enable"); await s("Profiler.setSamplingInterval", { interval: 100 }); await s("Profiler.start");
for (let i = 0; i < n; i++) { await s("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 }); await s("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 }); await esperar(300); }
const { profile } = await s("Profiler.stop");
const dt = {}; profile.timeDeltas.forEach((d, i) => { dt[profile.samples[i]] = (dt[profile.samples[i]] ?? 0) + d; });
const self = {};
for (const nd of profile.nodes) { const f = nd.callFrame; if (["(idle)", "(program)", "(root)"].includes(f.functionName)) continue; const k = `${f.functionName || "(anónima)"} ${f.url.split("/").pop()}:${f.lineNumber}:${f.columnNumber}`; self[k] = (self[k] ?? 0) + (dt[nd.id] ?? 0) / 1000; }
const tot = Object.values(self).reduce((a, b) => a + b, 0);
console.log(`total JS+GC ${tot.toFixed(1)} ms en ${n} toques (${(tot / n).toFixed(2)} ms/toque, CPU sin limitar)`);
for (const [k, v] of Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 18)) console.log(`${v.toFixed(2).padStart(7)} ms  ${k}`);
await cdp("Target.closeTarget", { targetId }); ws.close();
