// Consulta GA4 (Data API, solo lectura) por los eventos de web vitals de Truqito.
// Uso: GA4_SA_JSON='<json de la cuenta de servicio>' node scripts/medicion/ga4-eventos.mjs <propertyId>
import { createSign } from "node:crypto";

const sa = JSON.parse(process.env.GA4_SA_JSON);
const propiedad = process.argv[2];
const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
const ahora = Math.floor(Date.now() / 1000);
const sinFirma = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
  iss: sa.client_email,
  scope: "https://www.googleapis.com/auth/analytics.readonly",
  aud: "https://oauth2.googleapis.com/token",
  iat: ahora,
  exp: ahora + 600,
})}`;
const firma = createSign("RSA-SHA256").update(sinFirma).sign(sa.private_key, "base64url");
const token = (
  await (
    await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${sinFirma}.${firma}` }),
    })
  ).json()
).access_token;

const api = async (ruta, cuerpo) => {
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propiedad}${ruta}`, {
    method: cuerpo ? "POST" : "GET",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`${ruta}: ${JSON.stringify(j.error?.message ?? j)}`);
  return j;
};
const VITALS = ["LCP", "INP", "CLS", "FCP", "TTFB"];
const filtro = { filter: { fieldName: "eventName", inListFilter: { values: VITALS } } };
const filas = (j) => (j.rows ?? []).map((r) => [...(r.dimensionValues ?? []).map((d) => d.value), ...r.metricValues.map((m) => m.value)]);

console.log("== Eventos de web vitals por día (últimos 7 días)");
const diario = await api(":runReport", {
  dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
  dimensions: [{ name: "date" }, { name: "eventName" }],
  metrics: [{ name: "eventCount" }],
  dimensionFilter: filtro,
  orderBys: [{ dimension: { dimensionName: "date" } }],
});
console.log(filas(diario).map((f) => f.join("  ")).join("\n") || "(sin filas)");

console.log("\n== Tiempo real (últimos 30 min)");
const vivo = await api(":runRealtimeReport", {
  dimensions: [{ name: "eventName" }],
  metrics: [{ name: "eventCount" }],
  dimensionFilter: filtro,
});
console.log(filas(vivo).map((f) => f.join("  ")).join("\n") || "(sin filas)");

console.log("\n== Parámetros registrados como dimensiones/métricas personalizadas");
const meta = await api("/metadata");
const propias = [...(meta.dimensions ?? []), ...(meta.metrics ?? [])].filter((x) => x.apiName.startsWith("customEvent:"));
console.log(propias.map((x) => x.apiName).join("\n") || "(ninguno)");
