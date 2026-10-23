// Genera build/guia-truco.html con el contenido de la guía ya renderizado,
// para que los buscadores lo lean sin ejecutar JavaScript.
// Renderiza el mismo componente de React que usa la app: no hay una segunda copia del contenido.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const buildDir = join(root, "build");
const componentPath = join(root, "src/components/pages/GuiaTruco.js");
const SITE_URL = "https://truco.contelautaro.com.ar";

// Babel viene con react-scripts: se resuelve desde ahí para funcionar con npm y con pnpm
const require = createRequire(import.meta.url);
const fromReactScripts = createRequire(require.resolve("react-scripts/package.json"));
const fromPresetApp = createRequire(fromReactScripts.resolve("babel-preset-react-app/package.json"));
const babel = fromReactScripts("@babel/core");
const presetReact = fromPresetApp.resolve("@babel/preset-react");

const fail = (message) => {
  console.error(`prerender-guia: ${message}`);
  process.exit(1);
};

// 1. Compilar el componente (JSX → JS), sin el import de CSS
const source = readFileSync(componentPath, "utf8").replace(/^import\s+["'][^"']+\.css["'];?\s*$/m, "");
const { code } = babel.transformSync(source, {
  filename: componentPath,
  babelrc: false,
  configFile: false,
  presets: [[presetReact, { runtime: "automatic" }]],
});
// Se escribe junto al original para que sus imports relativos sigan funcionando
const tempModule = join(dirname(componentPath), ".prerender-GuiaTruco.mjs");
writeFileSync(tempModule, code);

// React Router usa useLayoutEffect, que en el servidor solo genera un aviso: se silencia ese aviso puntual
const consoleError = console.error;
console.error = (...args) => {
  if (String(args[0]).includes("useLayoutEffect does nothing on the server")) return;
  consoleError(...args);
};

let markup;
try {
  const [{ default: GuiaTruco }, reactModule, serverModule, { MemoryRouter }] = await Promise.all([
    import(pathToFileURL(tempModule).href),
    import("react"),
    import("react-dom/server"),
    import("react-router-dom"),
  ]);
  const React = reactModule.default ?? reactModule;
  const { renderToStaticMarkup } = serverModule.default ?? serverModule;
  markup = renderToStaticMarkup(
    React.createElement(MemoryRouter, { initialEntries: ["/guia-truco"] }, React.createElement(GuiaTruco))
  );
} finally {
  unlinkSync(tempModule);
  console.error = consoleError;
}

// Si cambia la guía y ya no aparece lo esperado, mejor que el build falle a publicar una página vacía
for (const marker of ["guia-ranking", "guia-table", "guia-faq"]) {
  if (!markup.includes(marker)) fail(`no se encontró "${marker}" en el HTML de la guía`);
}

// 2. Armar la página a partir del index.html del build
let html = readFileSync(join(buildDir, "index.html"), "utf8");
const title = "Valores del truco: tabla de cartas, envido y puntos | Truqito";
const description =
  "Tabla de valores del truco argentino: el orden de las cartas de la más alta a la más baja, cómo se calcula el envido y cuántos puntos vale cada canto.";
const url = `${SITE_URL}/guia-truco`;

const replaceOrFail = (pattern, replacement, label) => {
  if (!pattern.test(html)) fail(`no se encontró ${label} en index.html`);
  html = html.replace(pattern, replacement);
};
replaceOrFail(/<title>[^<]*<\/title>/, `<title>${title}</title>`, "<title>");
replaceOrFail(/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`, "la descripción");
replaceOrFail(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`, "el canonical");
replaceOrFail(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`, "og:url");
replaceOrFail(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`, "og:title");
replaceOrFail(/(<meta property="og:description" content=")[^"]*(")/, `$1${description}$2`, "og:description");
html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`);
html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${description}$2`);

// Datos estructurados de la guía (index.html trae los de la home: WebApplication con la URL de la home)
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: title,
      description,
      inLanguage: "es",
      isPartOf: { "@type": "WebSite", name: "Anotador de Truco", url: `${SITE_URL}/` },
      breadcrumb: { "@id": `${url}#breadcrumb` },
      author: { "@type": "Person", name: "Lautaro Conte", url: "https://contelautaro.com.ar" },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Anotador de truco", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Guía del truco", item: url },
      ],
    },
  ],
};
replaceOrFail(
  /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
  () => `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`,
  "el JSON-LD"
);

// Estilos de la guía (vienen en un chunk aparte) para que el contenido no se vea sin estilo antes de que cargue React
const cssDir = join(buildDir, "static/css");
const guideCss = readdirSync(cssDir).find(
  (file) => file.endsWith(".css") && readFileSync(join(cssDir, file), "utf8").includes(".guia-tabs")
);
if (!guideCss) fail("no se encontró el CSS de la guía");
html = html.replace("</head>", `<link href="/static/css/${guideCss}" rel="stylesheet"></head>`);

// Contenido de la guía dentro de #root (React lo reemplaza al cargar)
replaceOrFail(/<div id="root">[\s\S]*<\/div>(?=\s*<\/body>)/, `<div id="root"><main>${markup}</main></div>`, "#root");

writeFileSync(join(buildDir, "guia-truco.html"), html);
console.log(`prerender-guia: build/guia-truco.html generado (${markup.length} caracteres de contenido)`);
