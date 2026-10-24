// Contrato SEO: el HTML del build de Astro tiene que decir lo mismo que producción (tests/contrato/esperado.json).
// Correr después de `npm run build`: npm run test:contrato
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";
import { PAGINAS, extraerCabecera, extraerContrato } from "../../scripts/lib/contrato.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "../..");
const dist = join(raiz, "dist");
const esperado = JSON.parse(readFileSync(join(raiz, "tests/contrato/esperado.json"), "utf8"));
const lineaBase = JSON.parse(readFileSync(join(raiz, "tests/contrato/linea-base.json"), "utf8"));
const html = (archivo) => readFileSync(join(dist, archivo), "utf8");

for (const [ruta, { archivo, contenido }] of Object.entries(PAGINAS)) {
  describe(`contrato de ${ruta}`, () => {
    const actual = extraerContrato(html(archivo), contenido);
    const prod = esperado.paginas[ruta];

    for (const campo of ["title", "description", "canonical", "openGraph", "twitter", "jsonLd", "h1", "h2", "enlaces", "textoPrincipal"]) {
      it(`${campo} igual a producción`, () => assert.deepEqual(actual[campo], prod[campo]));
    }

    it("robots", () => {
      // El resultado ahora también lleva noindex en el HTML (antes lo ponía React)
      assert.equal(actual.robots, ruta.startsWith("/resultado/") ? "noindex" : prod.robots);
    });

    it("cabecera: logo como LCP, preloads, GA4 y anuncio", () => {
      const cabecera = extraerCabecera(html(archivo));
      assert.deepEqual(cabecera.logo, { src: "/images/main_logo.webp", width: "141", height: "38", fetchpriority: "high" });
      assert.deepEqual(cabecera.preloads, ["/images/main_logo.webp", "/fonts/outfit-latin.woff2"]);
      assert.ok(cabecera.scriptsExternos.includes("https://www.googletagmanager.com/gtag/js?id=G-KZNCYNPR7L"));
      assert.ok(cabecera.adSlot);
      const pagina = html(archivo);
      assert.ok(pagina.includes('id="127560-28"'), "contenedor del anuncio en el HTML");
      assert.ok(pagina.indexOf("G-KZNCYNPR7L") < pagina.indexOf("6Fv0cGNfc_bw8"), "GA4 antes del CMP de InMobi, como antes");
      assert.ok(!/clarity\.ms|unpkg\.com|fonts\.googleapis/.test(pagina), "sin Clarity, unpkg ni Google Fonts");
    });

    it("el bloque 'Sobre el anotador' está en el HTML", () => {
      assert.ok(parse(html(archivo)).querySelector("details.sobre-anotador #contenido-seo"));
    });
  });
}

describe("guía: todas las pestañas en el HTML", () => {
  const doc = parse(html("guia-truco.html"));
  const paneles = doc.querySelectorAll('[role="tabpanel"]');

  it("los tres paneles, con la primera pestaña visible y las otras con hidden", () => {
    assert.deepEqual(paneles.map((p) => p.id), ["panel-cartas", "panel-puntos", "panel-anotador"]);
    assert.deepEqual(paneles.map((p) => p.hasAttribute("hidden")), [false, true, true]);
    assert.deepEqual(doc.querySelectorAll('[role="tab"]').map((t) => t.getAttribute("aria-selected")), ["true", "false", "false"]);
  });

  it("las 14 cartas, la tabla de cantos y las 4 preguntas frecuentes", () => {
    assert.equal(doc.querySelectorAll(".guia-ranking li").length, 14);
    assert.equal(doc.querySelectorAll(".guia-table tbody tr").length, 11);
    assert.equal(doc.querySelectorAll(".guia-faq details").length, 4);
  });

  it("sin 'Cargando...'", () => assert.ok(!html("guia-truco.html").includes("Cargando")));
});

describe("home", () => {
  it("el tablero sale renderizado en 0-0", () => {
    const doc = parse(html("index.html"));
    assert.equal(doc.querySelectorAll(".board .counter-points h1").map((h) => h.textContent).join("-"), "0-0");
    assert.equal(doc.querySelectorAll(".board .counter-title h2").map((h) => h.textContent).join("/"), "NOSOTROS/ELLOS");
  });

  it("pasa de página con un fundido (view transitions), sin cambiar la publicidad", () => {
    assert.ok(html("index.html").includes("@view-transition"));
  });

  it("marca la partida guardada antes del primer dibujo", () => {
    const head = parse(html("index.html")).querySelector("head").toString();
    assert.ok(head.includes('classList.add("partida-guardada")'));
  });
});

describe("resultado", () => {
  for (const [archivo, mensaje, imagen] of [
    ["resultado/nosotros.html", "¡GANAMOS NOSOTROS!", "happy.webp"],
    ["resultado/ellos.html", "¡GANARON ELLOS!", "sadge.webp"],
  ]) {
    it(`${archivo} sale renderizado (sin cuadro en blanco al terminar la partida)`, () => {
      const doc = parse(html(archivo));
      assert.equal(doc.querySelector(".finished-message .winner p").textContent, mensaje);
      assert.ok(doc.querySelector(`.winner img[src="/images/${imagen}"]`));
      assert.equal(doc.querySelector('meta[name="robots"]').getAttribute("content"), "noindex");
    });
  }

  it("resultado.html (cualquier otro /resultado/:winner) sigue existiendo con noindex", () => {
    assert.equal(parse(html("resultado.html")).querySelector('meta[name="robots"]').getAttribute("content"), "noindex");
  });
});

describe("archivos públicos", () => {
  for (const archivo of ["robots.txt", "sitemap.xml", "llms.txt", "404.html", "meta/manifest.json", "favicon/favicon.ico"]) {
    it(`${archivo} igual a public/`, () => {
      assert.ok(readFileSync(join(dist, archivo)).equals(readFileSync(join(raiz, "public", archivo))));
    });
  }
});

describe("JavaScript", () => {
  const js = readdirSync(join(dist, "_astro")).filter((f) => f.endsWith(".js"));

  it("sin Supabase", () => {
    for (const f of js) assert.ok(!/supabase/i.test(readFileSync(join(dist, "_astro", f), "utf8")), f);
  });

  it("la home no carga más JS que la versión CRA (presupuesto de la línea base)", () => {
    // Todo lo que la home puede pedir al cargar: los módulos de sus islas y sus imports estáticos,
    // sin los paneles diferidos (VAR, nombres, novedades) ni web-vitals, que cargan después.
    const diferidos = /^(History|EditNames|Changelog|reportWebVitals|onCLS|attribution)/i;
    const total = js.filter((f) => !diferidos.test(f))
      .reduce((suma, f) => suma + gzipSync(readFileSync(join(dist, "_astro", f)), { level: 9 }).length, 0);
    assert.ok(total <= lineaBase.jsInicialGzip["/"], `${total} bytes gzip > ${lineaBase.jsInicialGzip["/"]}`);
  });
});
