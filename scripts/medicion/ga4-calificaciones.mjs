// Distribución de metric_rating por métrica, separando CRA y 2.0.x por hora. Uso: GA4_SA_JSON=... node scripts/medicion/ga4-calificaciones.mjs <propertyId>
import { createSign } from "node:crypto";
// Primera hora (AAAAMMDDHH, hora de la propiedad) de la versión nueva. 2026102416 = primera hora completa de la 2.0.x
const CORTE = process.env.CORTE ?? "2026102416";
const sa = JSON.parse(process.env.GA4_SA_JSON); const prop = process.argv[2];
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url"); const t = Math.floor(Date.now() / 1000);
const s = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/analytics.readonly", aud: "https://oauth2.googleapis.com/token", iat: t, exp: t + 600 })}`;
const tok = (await (await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${s}.${createSign("RSA-SHA256").update(s).sign(sa.private_key, "base64url")}` }) })).json()).access_token;
const r = await (await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${prop}:runReport`, { method: "POST", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" }, body: JSON.stringify({
  dateRanges: [{ startDate: "2026-10-23", endDate: "today" }],
  dimensions: [{ name: "dateHour" }, { name: "eventName" }, { name: "customEvent:metric_rating" }],
  metrics: [{ name: "eventCount" }],
  dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: ["LCP", "INP", "CLS", "FCP", "TTFB"] } } },
  limit: 10000 }) })).json();
if (r.error) { console.log(r.error.message); process.exit(1); }
console.log("zona horaria de la propiedad:", r.metadata?.timeZone);
// CRA: hasta el 24/10 15 h (hora de la propiedad); 2.0.x: desde el 24/10 16 h
const grupo = (dh) => (dh < CORTE ? "CRA" : "2.0.x");
const acc = {};
for (const f of r.rows ?? []) {
  const [dh, ev, rating] = f.dimensionValues.map((d) => d.value); const n = +f.metricValues[0].value;
  if (dh.slice(0, 10) === "2026102415") continue; // hora del cambio: se descarta
  const k = `${ev}|${grupo(dh)}`; acc[k] ??= {}; acc[k][rating] = (acc[k][rating] ?? 0) + n;
}
for (const ev of ["LCP", "FCP", "INP", "CLS", "TTFB"]) for (const g of ["CRA", "2.0.x"]) {
  const a = acc[`${ev}|${g}`] ?? {}; const tot = Object.values(a).reduce((x, y) => x + y, 0);
  const pct = (k) => (tot ? Math.round((100 * (a[k] ?? 0)) / tot) : 0);
  console.log(`${ev.padEnd(5)} ${g.padEnd(6)} n=${String(tot).padStart(4)}  bueno ${pct("good")}%  mejorable ${pct("needs-improvement")}%  malo ${pct("poor")}%`);
}
