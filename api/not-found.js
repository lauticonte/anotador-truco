import { readFileSync } from "node:fs";
import { join } from "node:path";

// Las rutas inexistentes llegan acá por la regla final de vercel.json.
// Un rewrite directo a /404.html responde 200 (soft 404); esta función responde 404 con la misma página.
// public/404.html viaja con la función por "includeFiles" en vercel.json.
const page = readFileSync(join(process.cwd(), "public/404.html"), "utf8");

export default function handler(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.status(404).send(page);
}
