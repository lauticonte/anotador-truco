// INP por elemento tocado (debug_target) y calificación, más el corte CRA / 2.0.x por hora si ya está procesado
// Uso: GA4_SA_JSON=... node scripts/medicion/ga4-inp.mjs <propertyId>  (CORTE = primera hora de la versión nueva, AAAAMMDDHH)
import { createSign } from "node:crypto";
// Primera hora (AAAAMMDDHH, hora de la propiedad) de la versión nueva. 2026102416 = primera hora completa de la 2.0.x
const CORTE = process.env.CORTE ?? "2026102416";
const sa = JSON.parse(process.env.GA4_SA_JSON); const prop = process.argv[2];
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url"); const t = Math.floor(Date.now() / 1000);
const s = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/analytics.readonly", aud: "https://oauth2.googleapis.com/token", iat: t, exp: t + 600 })}`;
const tok = (await (await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${s}.${createSign("RSA-SHA256").update(s).sign(sa.private_key, "base64url")}` }) })).json()).access_token;
const q = async (cuerpo) => { const r = await (await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${prop}:runReport`, { method: "POST", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) })).json(); if (r.error) throw new Error(r.error.message); return r.rows ?? []; };
const soloINP = { filter: { fieldName: "eventName", stringFilter: { value: "INP" } } };

const filas = await q({ dateRanges: [{ startDate: "2026-10-23", endDate: "today" }], dimensions: [{ name: "customEvent:debug_target" }, { name: "customEvent:metric_rating" }], metrics: [{ name: "eventCount" }, { name: "eventValue" }], dimensionFilter: soloINP, limit: 1000 });
const por = {};
for (const f of filas) { const [el, rating] = f.dimensionValues.map((d) => d.value); const [n, v] = f.metricValues.map((m) => +m.value); por[el] ??= { n: 0, v: 0, malo: 0, mejorable: 0 }; por[el].n += n; por[el].v += v; if (rating === "poor") por[el].malo += n; if (rating === "needs-improvement") por[el].mejorable += n; }
console.log("== INP por elemento (23/10 en adelante), ordenado por toques lentos");
console.log("toques  lentos  %lentos  prom    elemento");
for (const [el, x] of Object.entries(por).sort((a, b) => (b[1].malo + b[1].mejorable) - (a[1].malo + a[1].mejorable)).slice(0, 12))
  console.log(`${String(x.n).padStart(6)}  ${String(x.malo + x.mejorable).padStart(6)}  ${String(Math.round(100 * (x.malo + x.mejorable) / x.n)).padStart(5)}%  ${String(Math.round(x.v / x.n)).padStart(4)}ms  ${el.slice(0, 90)}`);

const horas = await q({ dateRanges: [{ startDate: "2026-10-24", endDate: "today" }], dimensions: [{ name: "dateHour" }, { name: "customEvent:metric_rating" }], metrics: [{ name: "eventCount" }], dimensionFilter: soloINP, limit: 1000 });
const g = { CRA: {}, "2.0.x": {} };
for (const f of horas) { const [dh, r] = f.dimensionValues.map((d) => d.value); const n = +f.metricValues[0].value; if (dh === "2026102415") continue; const k = dh < CORTE ? "CRA" : "2.0.x"; g[k][r] = (g[k][r] ?? 0) + n; }
console.log("\n== INP 24/10 por versión (hora de Buenos Aires)");
for (const [k, a] of Object.entries(g)) { const tot = (a.good ?? 0) + (a["needs-improvement"] ?? 0) + (a.poor ?? 0); console.log(`${k.padEnd(6)} calificados=${tot}  verde ${tot ? Math.round(100 * (a.good ?? 0) / tot) : "-"}%`); }
