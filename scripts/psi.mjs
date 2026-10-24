// Mide con la API de PageSpeed Insights (mobile, 3 corridas por URL, mediana).
// No corre Lighthouse en la notebook: lo corre Google.
// Uso: PSI_KEY=... node scripts/psi.mjs <url> [url...] [--corridas=3] [--json=archivo]
import { writeFileSync } from "node:fs";

const clave = process.env.PSI_KEY;
if (!clave) {
  console.error("Falta PSI_KEY (Bitwarden: 'Google Cloud SEO truco', campo pagespeed_api_key)");
  process.exit(1);
}

const opcion = (nombre) => process.argv.find((a) => a.startsWith(`--${nombre}=`))?.split("=")[1];
const corridas = Number(opcion("corridas") ?? 3);
const salidaJson = opcion("json");
const urls = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!urls.length) {
  console.error("Uso: node scripts/psi.mjs <url> [url...]");
  process.exit(1);
}

const mediana = (valores) => {
  const ordenados = [...valores].sort((a, b) => a - b);
  return ordenados[Math.floor(ordenados.length / 2)];
};

const medir = async (url) => {
  const api = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  api.searchParams.set("url", url);
  api.searchParams.set("strategy", "mobile");
  api.searchParams.set("category", "performance");
  api.searchParams.set("key", clave);
  const respuesta = await fetch(api);
  if (!respuesta.ok) throw new Error(`PSI ${respuesta.status} para ${url}: ${await respuesta.text()}`);
  return respuesta.json();
};

const resultados = {};
for (const url of urls) {
  const lab = [];
  let campo = null;
  for (let i = 0; i < corridas; i++) {
    const datos = await medir(url);
    const auditorias = datos.lighthouseResult.audits;
    // Lighthouse 12+ informa el elemento LCP dentro del insight de desglose
    const lcpElemento = auditorias["lcp-breakdown-insight"]?.details?.items?.find((item) => item.type === "node");
    lab.push({
      performance: Math.round(datos.lighthouseResult.categories.performance.score * 100),
      lcp: auditorias["largest-contentful-paint"].numericValue,
      fcp: auditorias["first-contentful-paint"].numericValue,
      tbt: auditorias["total-blocking-time"].numericValue,
      cls: auditorias["cumulative-layout-shift"].numericValue,
      si: auditorias["speed-index"].numericValue,
      bytes: auditorias["total-byte-weight"].numericValue,
      lcpElemento: lcpElemento ? `${lcpElemento.selector} ${lcpElemento.snippet}` : "(sin elemento: no se pintó)",
    });
    campo ??= datos.loadingExperience?.metrics ?? null;
  }
  const resumen = Object.fromEntries(
    ["performance", "lcp", "fcp", "tbt", "cls", "si", "bytes"].map((m) => [m, mediana(lab.map((r) => r[m]))])
  );
  resultados[url] = {
    mediana: resumen,
    lcpElementos: [...new Set(lab.map((r) => r.lcpElemento))],
    campo: campo && {
      lcp: campo.LARGEST_CONTENTFUL_PAINT_MS?.percentile,
      inp: campo.INTERACTION_TO_NEXT_PAINT?.percentile,
      cls: campo.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile / 100,
      fcp: campo.FIRST_CONTENTFUL_PAINT_MS?.percentile,
      ttfb: campo.EXPERIMENTAL_TIME_TO_FIRST_BYTE?.percentile,
    },
    corridas: lab,
  };

  const s = (ms) => `${(ms / 1000).toFixed(2)} s`;
  console.log(`\n${url}`);
  console.log(
    `  Lab (mediana de ${corridas}): perf ${resumen.performance} · LCP ${s(resumen.lcp)} · FCP ${s(resumen.fcp)} · ` +
      `TBT ${Math.round(resumen.tbt)} ms · CLS ${resumen.cls.toFixed(3)} · SI ${s(resumen.si)} · ${Math.round(resumen.bytes / 1024)} KB`
  );
  console.log(`  Elemento LCP: ${resultados[url].lcpElementos.join(" | ")}`);
  if (resultados[url].campo) {
    const c = resultados[url].campo;
    console.log(`  Usuarios reales (p75): LCP ${c.lcp} ms · INP ${c.inp} ms · CLS ${c.cls} · FCP ${c.fcp} ms · TTFB ${c.ttfb} ms`);
  }
}

if (salidaJson) writeFileSync(salidaJson, `${JSON.stringify({ fecha: new Date().toISOString(), resultados }, null, 2)}\n`);
