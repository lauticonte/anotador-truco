// Guarda el contrato SEO de un sitio (por defecto, producción) en tests/contrato/esperado.json.
// Uso: node scripts/capturar-contrato.mjs [url-base]
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PAGINAS, SITE_URL, extraerContrato } from "./lib/contrato.mjs";

const base = (process.argv[2] ?? SITE_URL).replace(/\/$/, "");
const destino = join(dirname(fileURLToPath(import.meta.url)), "../tests/contrato/esperado.json");

const contrato = { capturado: new Date().toISOString(), base, paginas: {} };
for (const ruta of Object.keys(PAGINAS)) {
  const respuesta = await fetch(`${base}${ruta}`);
  if (!respuesta.ok) throw new Error(`${ruta} respondió ${respuesta.status}`);
  contrato.paginas[ruta] = extraerContrato(await respuesta.text());
}

mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, `${JSON.stringify(contrato, null, 2)}\n`);
console.log(`Contrato de ${base} guardado en tests/contrato/esperado.json`);
