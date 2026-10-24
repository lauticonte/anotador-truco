// Posición diaria de "anotador de truco" en Search Console (solo lectura). Uso: GA4_SA_JSON=... node scripts/medicion/gsc-posicion.mjs
import { createSign } from "node:crypto";
const sa = JSON.parse(process.env.GA4_SA_JSON);
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url"); const t = Math.floor(Date.now() / 1000);
const s = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/webmasters.readonly", aud: "https://oauth2.googleapis.com/token", iat: t, exp: t + 600 })}`;
const tok = (await (await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${s}.${createSign("RSA-SHA256").update(s).sign(sa.private_key, "base64url")}` }) })).json()).access_token;
const h = { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" };
const sitios = await (await fetch("https://www.googleapis.com/webmasters/v3/sites", { headers: h })).json();
const sitio = (sitios.siteEntry ?? []).map((x) => x.siteUrl).find((u) => u.includes("truco") || u.includes("contelautaro"));
console.log("propiedad:", sitio);
const q = async (cuerpo) => (await (await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(sitio)}/searchAnalytics/query`, { method: "POST", headers: h, body: JSON.stringify(cuerpo) })).json());
const r = await q({ startDate: "2026-10-01", endDate: "2026-10-24", dimensions: ["date"], dimensionFilterGroups: [{ filters: [{ dimension: "query", operator: "equals", expression: "anotador de truco" }] }], rowLimit: 50 });
if (r.error) { console.log(r.error.message); process.exit(1); }
for (const f of r.rows ?? []) console.log(f.keys[0], "posición", f.position.toFixed(1), "CTR", (100 * f.ctr).toFixed(0) + "%", "clics", f.clicks, "impr", f.impressions);
