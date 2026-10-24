// Promedio real por métrica y día con eventValue (el parámetro "value" que manda reportWebVitals.js)
// Uso: GA4_SA_JSON=... node scripts/medicion/ga4-promedios.mjs <propertyId>  (fechas en dateRanges)
import { createSign } from "node:crypto";
const sa = JSON.parse(process.env.GA4_SA_JSON); const prop = process.argv[2];
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url"); const t = Math.floor(Date.now() / 1000);
const s = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/analytics.readonly", aud: "https://oauth2.googleapis.com/token", iat: t, exp: t + 600 })}`;
const tok = (await (await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${s}.${createSign("RSA-SHA256").update(s).sign(sa.private_key, "base64url")}` }) })).json()).access_token;
const r = await (await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${prop}:runReport`, { method: "POST", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" }, body: JSON.stringify({
  dateRanges: [{ startDate: "2026-10-23", endDate: "today" }],
  dimensions: [{ name: "date" }, { name: "eventName" }, { name: "pagePath" }],
  metrics: [{ name: "eventCount" }, { name: "eventValue" }],
  dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: ["LCP", "FCP", "TTFB", "INP", "CLS"] } } },
  limit: 10000 }) })).json();
if (r.error) { console.log(r.error.message); process.exit(1); }
const acc = {};
for (const f of r.rows ?? []) {
  const [fecha, ev, ruta] = f.dimensionValues.map((d) => d.value);
  const pag = ruta === "/" ? "home" : ruta.startsWith("/guia") ? "guía" : ruta.startsWith("/resultado") ? "resultado" : "otra";
  const k = `${fecha}|${ev}|${pag}`; acc[k] ??= [0, 0]; acc[k][0] += +f.metricValues[0].value; acc[k][1] += +f.metricValues[1].value;
}
console.log("fecha     métrica página     eventos  promedio");
for (const [k, [n, v]] of Object.entries(acc).sort()) {
  const [fecha, ev, pag] = k.split("|"); if (pag === "otra" || n < 20) continue;
  const prom = ev === "CLS" ? (v / n / 1000).toFixed(3) : `${Math.round(v / n)} ms`;
  console.log(`${fecha}  ${ev.padEnd(5)}   ${pag.padEnd(10)} ${String(n).padStart(6)}   ${prom}`);
}
