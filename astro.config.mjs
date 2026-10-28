import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import directivas from "./src/directivas/integracion.js";

// Sitio 100 % estático: cada página sale con su HTML completo del build.
// Las funciones de api/ y las reglas de vercel.json siguen funcionando como en la versión CRA.
export default defineConfig({
  site: "https://truco.contelautaro.com.ar",
  output: "static",
  // guia-truco.html y no guia-truco/index.html: así /guia-truco no redirige y vercel.json no cambia
  // inlineStylesheets: el CSS va dentro del HTML, sin una hoja aparte que bloquee el primer dibujo
  build: { format: "file", inlineStylesheets: "always" },
  trailingSlash: "never",
  integrations: [react(), directivas()],
  // Vite compila por defecto para navegadores modernos: con ??= y ||= (Chrome 85+), en Chrome 81 y Samsung
  // Internet viejos no hidrataba ninguna isla. Esto cubre más o menos lo mismo que el browserslist de la CRA.
  vite: { build: { target: ["chrome80", "edge88", "firefox78", "safari14"] } },
});
