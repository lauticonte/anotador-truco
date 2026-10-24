// Compara dos deploys URL por URL: status, redirecciones, headers, contrato SEO y texto.
// Uso: node scripts/comparar-urls.mjs <base> <candidato>
// Sale con código 1 si hay diferencias que no estén en la lista de diferencias esperadas.
import { PAGINAS, extraerContrato } from "./lib/contrato.mjs";

const [base, candidato] = process.argv.slice(2).map((u) => u?.replace(/\/$/, ""));
if (!base || !candidato) {
  console.error("Uso: node scripts/comparar-urls.mjs <base> <candidato>");
  process.exit(1);
}

const URLS = [
  "/", "/guia-truco", "/guia-truco/", "/resultado/nosotros", "/resultado/ELLOS", "/resultado/cualquiera",
  "/no-existe", "/404", "/ads.txt", "/robots.txt", "/sitemap.xml", "/llms.txt", "/meta/manifest.json",
  "/images/main_logo.webp", "/fonts/outfit-latin.woff2", "/favicon/favicon.ico",
];
const HEADERS = ["x-robots-tag", "content-type", "cache-control"];

// Diferencias esperadas por la migración (todo lo demás tiene que ser igual)
const esperadas = [
  // El resultado ahora lleva noindex también en el HTML (antes lo agregaba React)
  (ruta, campo, a, b) => ruta.startsWith("/resultado/") && campo === "robots" && a === null && b === "noindex",
  // El texto SEO de la home y del resultado ya no está en el <main> sino en el <details> del footer:
  // se compara aparte, con el selector de cada versión
  (ruta, campo) => contenidoDe(ruta) === "#contenido-seo" && ["h1", "h2", "enlaces", "textoPrincipal"].includes(campo),
  // Vercel agrega X-Robots-Tag: noindex a todos los deploys que no son de producción
  (ruta, campo, a, b) => esPreview && campo === "x-robots-tag" && a === null && b === "noindex",
];

// Todas las URLs de /resultado/* son la misma página que /resultado/nosotros
const contenidoDe = (ruta) => (ruta.startsWith("/resultado/") ? "#contenido-seo" : PAGINAS[ruta]?.contenido);
const esPreview = new URL(candidato).hostname.endsWith(".vercel.app");

const pedir = (url) => fetch(url, { redirect: "manual" });
const diferencias = [];
const anotar = (ruta, campo, a, b) => {
  const igual = JSON.stringify(a) === JSON.stringify(b);
  if (igual) return;
  const esperada = esperadas.some((f) => f(ruta, campo, a, b));
  diferencias.push({ ruta, campo, base: a, candidato: b, esperada });
};

for (const ruta of URLS) {
  const [ra, rb] = await Promise.all([pedir(base + ruta), pedir(candidato + ruta)]);
  anotar(ruta, "status", ra.status, rb.status);
  anotar(ruta, "location", ra.headers.get("location")?.replace(base, ""), rb.headers.get("location")?.replace(candidato, ""));
  for (const h of HEADERS) anotar(ruta, h, ra.headers.get(h), rb.headers.get(h));

  const tipo = ra.headers.get("content-type") ?? "";
  if (tipo.includes("text/html") && ra.status === 200) {
    const [ha, hb] = await Promise.all([ra.text(), rb.text()]);
    const ca = extraerContrato(ha);
    const cb = extraerContrato(hb);
    for (const campo of Object.keys(ca)) anotar(ruta, campo, ca[campo], cb[campo]);
    if (contenidoDe(ruta) === "#contenido-seo") {
      // Texto SEO: el <main> de la versión CRA contra el <details> de la versión Astro
      const cbSeo = extraerContrato(hb, "#contenido-seo");
      for (const campo of ["h1", "h2", "enlaces", "textoPrincipal"]) anotar(`${ruta} (texto SEO)`, campo, ca[campo], cbSeo[campo]);
    }
  } else if (ruta === "/ads.txt") {
    // Las primeras líneas son las propias de la cuenta; el resto viene de Moneytizer
    const primeras = async (r) => (await r.text()).split("\n").slice(0, 7);
    anotar(ruta, "primeras líneas", await primeras(ra), await primeras(rb));
  } else if (ra.status === 200 && !tipo.startsWith("text/html")) {
    const [ba, bb] = await Promise.all([ra.arrayBuffer(), rb.arrayBuffer()]);
    anotar(ruta, "contenido", Buffer.from(ba).toString("base64"), Buffer.from(bb).toString("base64"));
  }
}

const corto = (v) => {
  const s = JSON.stringify(v);
  return s && s.length > 140 ? `${s.slice(0, 140)}…` : s;
};
const inesperadas = diferencias.filter((d) => !d.esperada);
console.log(`Comparando ${URLS.length} URLs\n  base:      ${base}\n  candidato: ${candidato}\n`);
for (const d of diferencias) {
  console.log(`${d.esperada ? "≈ esperada " : "✗ DIFIERE  "} ${d.ruta} · ${d.campo}\n      base:      ${corto(d.base)}\n      candidato: ${corto(d.candidato)}`);
}
console.log(`\n${inesperadas.length ? `✗ ${inesperadas.length} diferencias inesperadas` : "✓ Sin diferencias inesperadas"} (${diferencias.length - inesperadas.length} esperadas)`);
process.exit(inesperadas.length ? 1 : 0);
