// Métricas calculadas de promedio para los web vitals (GA4 Admin API v1alpha)
// Uso: GA4_SA_JSON=... node scripts/medicion/ga4-calculadas.mjs <propertyId>  (idempotente: no recrea las que existen)
import { createSign } from "node:crypto";
const sa = JSON.parse(process.env.GA4_SA_JSON); const prop = process.argv[2];
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url"); const t = Math.floor(Date.now() / 1000);
const s = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/analytics.edit", aud: "https://oauth2.googleapis.com/token", iat: t, exp: t + 600 })}`;
const tok = (await (await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${s}.${createSign("RSA-SHA256").update(s).sign(sa.private_key, "base64url")}` }) })).json()).access_token;
const base = `https://analyticsadmin.googleapis.com/v1alpha/properties/${prop}/calculatedMetrics`;
const h = { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" };
const CALC = [
  { id: "webVitalPromedio", displayName: "Web vital: valor promedio (ms)", formula: "eventValue / eventCount", description: "Promedio del valor del evento (LCP, FCP, TTFB, INP en ms; CLS × 1000). Filtrar por nombre de evento." },
  { id: "inpEntradaPromedio", displayName: "INP: demora de entrada promedio (ms)", formula: "customEvent:inp_input_delay / eventCount", description: "Filtrar por evento INP. Teléfono ocupado al tocar (publicidad, carga)." },
  { id: "inpProcesoPromedio", displayName: "INP: procesamiento promedio (ms)", formula: "customEvent:inp_processing / eventCount", description: "Filtrar por evento INP. Tiempo de nuestro código." },
  { id: "inpPresentacionPromedio", displayName: "INP: presentación promedio (ms)", formula: "customEvent:inp_presentation / eventCount", description: "Filtrar por evento INP. Tiempo de dibujar la respuesta." },
  { id: "lcpDibujoPromedio", displayName: "LCP: demora de dibujo promedio (ms)", formula: "customEvent:lcp_render_delay / eventCount", description: "Filtrar por evento LCP. Espera entre la descarga del logo y su dibujo." },
];
const existentes = (await (await fetch(base, { headers: h })).json()).calculatedMetrics ?? [];
for (const c of CALC) {
  if (existentes.some((x) => x.name?.endsWith(`/${c.id}`))) { console.log("ya existe", c.id); continue; }
  const r = await fetch(`${base}?calculatedMetricId=${c.id}`, { method: "POST", headers: h, body: JSON.stringify({ displayName: c.displayName, formula: c.formula, metricUnit: "MILLISECONDS", description: c.description }) });
  const j = await r.json(); console.log(r.ok ? `creada ${c.id}` : `ERROR ${c.id}: ${j.error?.message}`);
}
for (const c of (await (await fetch(base, { headers: h })).json()).calculatedMetrics ?? []) console.log(`  ${c.displayName} = ${c.formula}`);
