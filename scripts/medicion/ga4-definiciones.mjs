// GA4 Admin API: lista y (con --crear) crea las métricas y la dimensión personalizadas de web vitals.
// Uso: GA4_SA_JSON=... node scripts/medicion/ga4-definiciones.mjs <propertyId> [--crear]
import { createSign } from "node:crypto";
const sa = JSON.parse(process.env.GA4_SA_JSON); const prop = process.argv[2]; const crear = process.argv.includes("--crear");
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url"); const t = Math.floor(Date.now() / 1000);
const s = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/analytics.edit", aud: "https://oauth2.googleapis.com/token", iat: t, exp: t + 600 })}`;
const tok = (await (await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${s}.${createSign("RSA-SHA256").update(s).sign(sa.private_key, "base64url")}` }) })).json()).access_token;
const base = `https://analyticsadmin.googleapis.com/v1beta/properties/${prop}`;
const api = async (ruta, cuerpo) => { const r = await fetch(base + ruta, { method: cuerpo ? "POST" : "GET", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" }, body: cuerpo && JSON.stringify(cuerpo) }); const j = await r.json(); if (!r.ok) throw new Error(`${r.status} ${j.error?.message}`); return j; };

const METRICAS = [
  { parameterName: "inp_input_delay", displayName: "INP demora de entrada", description: "Web vitals: demora de entrada del INP (ms)" },
  { parameterName: "inp_processing", displayName: "INP procesamiento", description: "Web vitals: procesamiento del INP (ms)" },
  { parameterName: "inp_presentation", displayName: "INP presentación", description: "Web vitals: presentación del INP (ms)" },
  { parameterName: "lcp_render_delay", displayName: "LCP demora de dibujo", description: "Web vitals: demora entre la descarga del elemento LCP y su dibujo (ms)" },
  { parameterName: "inp_script_ms", displayName: "INP script más largo", description: "Web vitals: duración del script más largo dentro del INP (ms, Long Animation Frames)" },
  { parameterName: "inp_style_layout", displayName: "INP estilos y layout", description: "Web vitals: estilos y layout en los frames del INP (ms)" },
  { parameterName: "inp_paint", displayName: "INP pintado", description: "Web vitals: pintado en los frames del INP (ms)" },
  { parameterName: "inp_unattributed", displayName: "INP sin atribuir", description: "Web vitals: tiempo del INP sin script, estilos ni pintado atribuidos: otro proceso, GPU o iframes (ms)" },
];
const DIMENSIONES = [
  { parameterName: "load_state", displayName: "Estado de carga", description: "Web vitals: estado de la página en la interacción o el salto (loading, dom-interactive, dom-content-loaded, complete)" },
  { parameterName: "inp_script", displayName: "INP origen del script", description: "Web vitals: fase, origen (propio o dominio) y tipo del script más largo del INP" },
];

const metricas = (await api("/customMetrics")).customMetrics ?? [];
const dimensiones = (await api("/customDimensions")).customDimensions ?? [];
if (crear) {
  for (const m of METRICAS) if (!metricas.some((x) => x.parameterName === m.parameterName)) { await api("/customMetrics", { ...m, scope: "EVENT", measurementUnit: "MILLISECONDS" }); console.log("creada métrica", m.parameterName); }
  for (const d of DIMENSIONES) if (!dimensiones.some((x) => x.parameterName === d.parameterName)) { await api("/customDimensions", { ...d, scope: "EVENT" }); console.log("creada dimensión", d.parameterName); }
}
console.log("== Métricas personalizadas");
for (const m of (await api("/customMetrics")).customMetrics ?? []) console.log(`  ${m.parameterName} · ${m.displayName} · ${m.scope} · ${m.measurementUnit}`);
console.log("== Dimensiones personalizadas");
for (const d of (await api("/customDimensions")).customDimensions ?? []) console.log(`  ${d.parameterName} · ${d.displayName} · ${d.scope}`);
