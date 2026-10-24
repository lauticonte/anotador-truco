// Extrae de un HTML lo que importa para SEO: el "contrato" que cada página tiene que cumplir.
// Lo usan scripts/capturar-contrato.mjs, scripts/comparar-urls.mjs y los tests de tests/contrato/.
import { parse } from "node-html-parser";

export const SITE_URL = "https://truco.contelautaro.com.ar";

// Páginas HTML del contrato: ruta pública → archivo que genera el build de Astro
export const PAGINAS = {
  "/": "index.html",
  "/guia-truco": "guia-truco.html",
  "/resultado/nosotros": "resultado.html",
};

const normalizar = (texto) => texto.replace(/\s+/g, " ").trim();

const textoVisible = (nodo) => {
  if (!nodo) return "";
  const copia = parse(nodo.toString());
  copia.querySelectorAll("script, style, template").forEach((el) => el.remove());
  return normalizar(copia.textContent);
};

export const extraerContrato = (html) => {
  const doc = parse(html, { comment: false });
  const head = doc.querySelector("head");
  const meta = (selector) => head?.querySelector(selector)?.getAttribute("content") ?? null;
  const metasPorPrefijo = (atributo, prefijo) =>
    Object.fromEntries(
      (head?.querySelectorAll(`meta[${atributo}]`) ?? [])
        .filter((el) => el.getAttribute(atributo).startsWith(prefijo))
        .map((el) => [el.getAttribute(atributo), el.getAttribute("content")])
    );

  // El contenido principal es el primer <main>: el bloque SEO en la home y la guía en /guia-truco
  const main = doc.querySelector("main");

  return {
    title: normalizar(head?.querySelector("title")?.textContent ?? ""),
    description: meta('meta[name="description"]'),
    canonical: head?.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
    robots: meta('meta[name="robots"]'),
    openGraph: metasPorPrefijo("property", "og:"),
    twitter: metasPorPrefijo("name", "twitter:"),
    jsonLd: (head?.querySelectorAll('script[type="application/ld+json"]') ?? []).map((el) =>
      JSON.parse(el.textContent)
    ),
    h1: (main?.querySelectorAll("h1") ?? []).map((el) => normalizar(el.textContent)),
    h2: (main?.querySelectorAll("h2") ?? []).map((el) => normalizar(el.textContent)),
    enlaces: (main?.querySelectorAll("a[href]") ?? []).map((el) => el.getAttribute("href")),
    textoPrincipal: textoVisible(main),
  };
};

// Detalles del <head> y del header que no forman parte del contrato SEO pero no pueden perderse
export const extraerCabecera = (html) => {
  const doc = parse(html, { comment: false });
  const head = doc.querySelector("head");
  const logo = doc.querySelector("#app-header img.logo");
  return {
    preloads: (head?.querySelectorAll('link[rel="preload"]') ?? []).map((el) => el.getAttribute("href")),
    scriptsExternos: doc.querySelectorAll("script[src]").map((el) => el.getAttribute("src")),
    logo: logo
      ? {
          src: logo.getAttribute("src"),
          width: logo.getAttribute("width"),
          height: logo.getAttribute("height"),
          fetchpriority: logo.getAttribute("fetchpriority"),
        }
      : null,
    adSlot: !!doc.querySelector(".ad-slot"),
  };
};
