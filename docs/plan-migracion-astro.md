# Plan: migrar Truqito de CRA a Astro + React (islas) en Vercel

> **Histórico.** El estado actual, los pendientes y las lecciones aprendidas están en [`HANDOFF.md`](HANDOFF.md) (actualizado el 2026-10-24).

> **Estado al 2026-10-23: lista para producción, falta el OK del dueño.** Rama `feat/astro`, versión 2.0.0.
> - Hecho: pasos 0 a 7 (línea base, andamiaje, componentes, store, layout, guía, resultado y limpieza), parte del 8 (contrato SEO y `comparar-urls`) y la verificación manual del 9.
> - Pendiente: CI en GitHub Actions con e2e de Playwright, PageSpeed sobre el preview y la ventana de web vitals en GA4 antes del merge. Ver "Cambios respecto del plan" al final.


## Contexto

Truqito perdió el puesto 1 en "anotador de truco" en mayo de 2026 frente a trucogame.com (Next.js). Usuarios reales en mobile (CrUX, p75): **LCP 4,7 s e INP 312 ms en Truqito, contra 2,6 s y 182 ms del rival**. La causa medida: React reemplaza `#root` y el LCP espera al JS. Además, la guía se prerenderiza con un script casero (`scripts/prerender-guia.mjs`) que no escala a páginas nuevas (reglas, señas, `/pt`).

**Objetivo:** cada página llega con su HTML completo desde el build (SSG). React solo monta lo interactivo, en islas. El foco es **SEO**: mismas URLs, mismo head por página, todo el texto en el HTML inicial, LCP en HTML estático.

**Sin cambios:** publicidad (Moneytizer + CMP de InMobi: mismo código, mismo orden, mismo `.ad-slot`), GA4 `G-KZNCYNPR7L`, UX (app no-scroll, idéntica), URLs y metadatos.

**Decisiones tomadas por el dueño:**
- Supabase **no se migra**: está muerto en el front y los archivos de `api/` que lo nombraban están vacíos.
- Guía: **todas las pestañas en el HTML inicial**, las inactivas con `hidden`. Un script chico solo alterna `hidden` y `aria-selected`. No se genera contenido desde JS.
- `seo-tecnico` va a producción antes que esto. Ojo: hoy `origin/master` ya apunta a `e9d0773`, igual que `seo-tecnico`. Se confirma en el paso 0 que producción lo tiene desplegado.

## Recomendación sobre navegación y anuncios

**Recomiendo páginas separadas, con navegación normal y sin ClientRouter.** Motivos:

1. **El riesgo para tus ingresos es que el anuncio se rompa, no que se recargue.**
   - Para emular una SPA, ClientRouter tiene que mantener vivo el iframe de Moneytizer entre páginas (`transition:persist`).
   - Además vuelve a ejecutar scripts en cada navegación: gtag, el stub del CMP y `window.si`.
   - Ninguno de esos scripts de terceros está pensado para eso. Una falla silenciosa (banner vacío, CMP duplicado) puede pasar días sin que nadie la note.
2. **Con páginas separadas, cada página vista es una subasta nueva.** Moneytizer y el CMP funcionan así en la enorme mayoría de los sitios. En el flujo ganar → resultado → revancha → home hay más impresiones, no menos.
3. **Mientras se juega, nada cambia.** Sumar puntos, el menú y los modales no navegan. La sesión media de 8 minutos en la home sigue siendo una sola carga de página. Solo navegan "ganar → resultado", "revancha → home" y "menú → guía".
4. **Se mide y hay vuelta atrás.**
   - El dueño mira en el panel de Moneytizer los ingresos, las impresiones y el RPM, 14 días antes contra 14 días después.
   - Si el ingreso por sesión cae más de 15 % sostenido una semana, se hace rollback inmediato en Vercel y se evalúa ClientRouter como segunda etapa.

## Estructura final

```
astro.config.mjs        integrations: [react()], output 'static', build.format 'file',
                        trailingSlash 'never', site 'https://truco.contelautaro.com.ar'
vercel.json             + "framework": "astro", "outputDirectory": "dist" (por deploy:
                        no toca el preset del proyecto en el panel)
src/layouts/Base.astro  <head> por props + header estático + #root/.app/main/.ad-slot/footer
src/pages/index.astro         <Board client:tras-dibujo> renderizado en 0-0 en el build
src/pages/guia-truco.astro    contenido estático + <script> de pestañas + JSON-LD propio
src/pages/resultado.astro     <ResultPage client:tras-dibujo>, head de la home + noindex
src/directivas/tras-dibujo.js  directiva propia: hidrata después del primer dibujo
src/reportWebVitals.js  igual que en master (web-vitals a GA4)
src/components/Footer.astro   incluye el <details> "Sobre el anotador" (bloque SEO permanente)
src/components/*.jsx    Menu (ex Header), Board, Counter, ResultPage, History, EditNames,
                        Changelog, SheetCloseButton, Ads
src/data/guia.js        TABS, CARD_RANKING, CANTOS, FAQ (sacados de GuiaTruco.js)
src/stores/partida.js   nanostores: maxPoints, teamNames + acciones
src/styles/             igual (App.css, Icons.css, index.css, por componente)
public/                 igual, sin index.html; Magnifika y MBF en woff2
api/                    ads-text.js, not-found.js, sendFeedback.js sin cambios
tests/                  unit/ (Vitest), contrato/ (sobre dist), e2e/ (Playwright, solo en CI)
scripts/                capturar-contrato.mjs, comparar-urls.mjs, psi.mjs
.github/workflows/ci.yml
```

### Layout (`Base.astro`)

- **Props:** `title`, `description`, `canonical`, `ogTitle`/`ogDescription` (por defecto iguales a title/description), `jsonLd`, `robots?`, `contentUnderAd?`.
- **`<head>`:** se copia de `public/index.html` tal cual, en el mismo orden y con `<script is:inline>`:
  - meta, preload del logo y de Outfit, `@font-face` de Outfit;
  - gtag `defer`, `<title>`, stub de InMobi y JSON-LD;
  - `window.si` va en el body, como hoy.
- **Body:**
  - `header#app-header` estático con el logo (`fetchpriority="high"`, 141×38) y `<Menu client:tras-dibujo />` adentro, sin `createPortal`.
  - `div#root > div.app[.app-content-under-ad]`, que contiene `main` con `<slot/>`, `div.ad-slot` estático con `<Ads client:tras-dibujo …ids actuales/>` y `<Footer/>`.
  - Astro envuelve las islas en `<astro-island>` con `display: contents`, así que el flex no-scroll de `App.css` no cambia.
- **`ResizeObserver` de `--ad-slot-height`:** pasa de `App.js` a un `<script is:inline>` del layout, con la misma lógica.
- **`Footer.astro`:** versión importada de `package.json`. El año se escribe en el build y un script inline de una línea lo corrige, para que no quede viejo si no hay deploys por meses.

### Islas

| Isla | Directiva | Motivo |
|---|---|---|
| `Board` (+2 `Counter`) | `client:tras-dibujo` (renderizado en el build) | En el build sale el tablero en 0-0 con los valores por defecto (modo 30, MALAS, NOSOTROS/ELLOS): se ve desde el primer dibujo, también sin JS. `localStorage` se lee recién al montar (ver "Tablero renderizado en el build"). Nada borra contenido del DOM. |
| `Menu` (sidebar + `History`/`EditNames`/`Changelog` con `lazy()`) | `client:tras-dibujo` (renderizado en el build) | El botón hamburguesa viene en el HTML. El único dato de `localStorage` es la etiqueta "JUGAR A 15/30", dentro del menú cerrado: se completa al montar (flag `mounted`) y así se evita el desajuste de hidratación. Los timers del tooltip y del deslizamiento del logo quedan igual. |
| `Ads` | `client:tras-dibujo` | Es el mismo componente: carga los scripts 100 ms después de montar, igual que hoy, que también monta después del primer dibujo. |
| `ResultPage` | `client:tras-dibujo` + `useMontado` | Lee `teamNames` de `localStorage` y el ganador de `location.pathname`. |
| Guía | Ninguna | `.astro` estático más un script de pestañas. |

### Después del primer dibujo y web vitals (vienen de `master`: 2fad0c8 y 2001a1f)

- **Directiva `client:tras-dibujo`** (`addClientDirective` en `astro.config.mjs`): es la lógica de `src/index.js` de master, pasada a Astro. Si la pestaña está visible, hidrata en `requestAnimationFrame(() => setTimeout(hidratar, 0))`; si está oculta, hidrata directo.
  - **Por qué no `client:only` ni `client:load`:** montan apenas llega el JS, que puede ser antes del primer dibujo. En producción eso atrasaba el primer dibujo hasta 2,3 s.
  - La usan todas las islas.
- **Las islas se renderizan en el build** (la directiva propia, como cualquier `client:*` salvo `client:only`, renderiza en el servidor) y solo se **hidratan** después del primer dibujo. Así el HTML del tablero se ve desde el milisegundo 0 y el JS de React no compite con el primer dibujo.
- **`useMontado()`:** hook de 3 líneas (`useState(false)` + `useEffect`). Solo lo usa `ResultPage`: el ganador sale de la URL, que no se conoce en el build (es una sola página para cualquier `/resultado/*`, y además lleva `noindex`).
- **`src/reportWebVitals.js`** se conserva tal cual, con `web-vitals` 6.2.3 y atribución. Lo carga un `<script>` del layout con `import()` dinámico después del `load`, como `src/index.js`, en todas las páginas.
- **Mediciones:** PageSpeed tiene mucho ruido (mismo código: primer dibujo de 0,18 s a 2,3 s), así que nunca se decide con una sola corrida.
  - La referencia son los eventos de web vitals en GA4: LCP, INP, CLS, FCP y TTFB, con `metric_rating` y `debug_target`, consultados con el MCP `ga4`.
  - **Antes y después del deploy:** distribución de `metric_rating` y mediana de `metric_value` por página.
- **Tests nuevos:**
  - **Unitario:** la directiva espera `requestAnimationFrame` + `setTimeout` con la pestaña visible e hidrata directo con la pestaña oculta.
  - **Contrato:** el layout carga `reportWebVitals` y el bloque SEO está en el HTML de la home.
  - **E2E:** con la publicidad bloqueada, `gtag` recibe eventos `LCP`/`FCP`/`TTFB` (stub de `window.gtag`).

### Tablero renderizado en el build (decisión del dueño, 2026-10-23)

Investigado en fuentes oficiales antes de decidir:
- Desde Chrome 88, un elemento borrado del DOM **sigue** siendo candidato a LCP.
- Los `<svg>` en línea (los fósforos) no son candidatos a LCP.
- Google indexa el HTML renderizado, después del JS.

Conclusión: el texto SEO no se puede borrar al montar, porque en ese caso Google no lo indexa. El tablero va renderizado para que se vea en el primer dibujo.

- **Patrón de React para evitar desajustes:** el primer render en el navegador es igual al del build (0-0), y `localStorage` se lee después de hidratar.
  - **Store:** los átomos arrancan con los valores por defecto también en el navegador. `cargarPartida()` lee `maxPoints` y `teamNames` de `localStorage`; la llama `Board` en un `useEffect`, y también `Menu` en la guía y en el resultado.
  - **`Counter`:** el constructor usa los valores por defecto. La lectura de `points-*`, `stage-*` y `tapHintSessions` pasa del constructor a `componentDidMount`, con la misma lógica de validación de etapa. Los `addEventListener` del constructor también pasan a `componentDidMount`.
- **Riesgo crítico que hay que cubrir:** hoy `componentDidUpdate` borra los puntos cuando cambia `maxPoints`. Si al cargar la partida el store pasa de 30 (valor por defecto) a 15 (guardado), el contador **borraría la partida guardada**.
  - El reinicio solo puede ocurrir por una acción del usuario (`toggleMaxPoints` o `resetGame`), no por la carga inicial.
  - Se resuelve con un átomo `partidaCargada`: `Counter` lee su `localStorage` recién cuando `partidaCargada` es `true`, e ignora el cambio de `maxPoints` que llega con la carga.
  - Tiene tests unitarios y e2e específicos.
- **Sin parpadeo de 0-0 para quien vuelve con una partida:**
  - Un `<script is:inline>` de 3 líneas en el `<head>`, que bloquea pero es instantáneo, revisa antes del primer dibujo si hay `points-*` mayor que 0, `maxPoints` igual a 15 o `teamNames` guardados. Si hay, agrega `partida-guardada` a `<html>`.
  - Con esa clase, el CSS oculta (`visibility: hidden`, sin cambiar el tamaño, así que no hay CLS) los fósforos, los puntos, la etapa y los nombres. Cuando `cargarPartida()` termina, la clase se quita.
  - Una visita nueva ve el tablero 0-0 al instante; quien vuelve ve el marco del tablero y, al hidratar, su partida. Hoy ve fondo vacío hasta que monta React.
- **Bloque SEO permanente:** es el bloque que hoy está en `#root` de `public/index.html` (h1, párrafo, lista y link a la guía), con el mismo texto.
  - Va dentro de un `<details class="sobre-anotador">` con `<summary>Sobre el anotador</summary>` en la franja del footer, en todas las páginas que usan el layout.
  - Al abrirlo, el contenido se ve encima del tablero con el estilo de las hojas de VAR y Novedades, y no hay scroll de página.
  - Funciona sin JS (`<details>` nativo), React no lo toca y queda en el HTML renderizado.
  - El `<h1>` de la home es el de este bloque, como hoy.
  - El texto de `<noscript>` queda igual.
- **Ajuste del contrato:** el texto SEO de la home se compara contra `#contenido-seo` (el contenido del `<details>`) en lugar del primer `<main>`. El resto de las páginas no cambia.

### Estado (`src/stores/partida.js`)

- **Átomos:** `maxPoints`, `teamNames` y `partidaCargada`. Arrancan con los valores por defecto y se leen de `localStorage` recién en `cargarPartida()`, después de hidratar. Las claves y los valores por defecto son los de hoy (30; NOSOTROS/ELLOS).
- **Acciones:** se mueven tal cual desde `src/App.js`.
  - `toggleMaxPoints`: despacha `flushHistory`, vacía `history`, alterna 30↔15 y lo persiste.
  - `resetGame(points)`: mismo filtro de `history`, borra `points-*` y `stage-*`, guarda `maxPoints`.
  - `saveNames`.
- **Lo que queda local en cada componente:**
  - `Counter.js` no cambia su lógica de juego (solo mueve la lectura inicial a `componentDidMount`, ver arriba): `points-*`, `stage-*`, `history`, `tapHintSessions`, debounce, buffer, `beforeunload`/`flushHistory`.
  - `finished` y `winner` quedan en `Board`. Al ganar: `location.assign('/resultado/' + winner.toLowerCase())`.
  - `ResultPage`: `resetGame(n)` y después `location.assign('/')`.
  - Los `<Link>` pasan a `<a href>`.
- **Compatibilidad:** las mismas claves de `localStorage` hacen que una partida guardada con la versión CRA se restaure intacta. Hay test e2e para eso.

### Guía (`guia-truco.astro`)

- Mismo markup, clases, ids y `aria-*` que `GuiaTruco.js`, generado desde `src/data/guia.js`.
- Los tres paneles (Cartas, Puntos, El anotador) van en el HTML. Los inactivos llevan `hidden`, como hace hoy el prerender.
- El `<script>` (unas 20 líneas) alterna `hidden`, `aria-selected` y `guia-tab-active`. No crea nodos. El texto no cambia: las páginas nuevas (reglas, señas) quedan para después.
- `<a href="/" class="guia-back">`.
- Head:
  - title, description y canonical que hoy pone `prerender-guia.mjs`;
  - JSON-LD `WebPage` + `BreadcrumbList` (el mismo objeto que arma el script);
  - `contentUnderAd` activado.

### Resultado y 404

- **`/resultado/:winner`:** el rewrite de `vercel.json` pasa de `/index.html` a `/resultado.html`. Cualquier valor sigue dando 200 y se conserva `X-Robots-Tag: noindex`.
  - El head es el de la home, como hoy, más `<meta name="robots" content="noindex">` estático. Reemplaza al `usePageMeta`.
- **404:** sin cambios (`api/not-found.js` + `public/404.html` + regla catch-all).

### `vercel.json`

- Rewrites: `/` → `/index.html`, `/guia-truco` → `/guia-truco.html`, `/resultado/:winner` → `/resultado.html`, `/ads.txt`, catch-all.
- Headers: el cache inmutable pasa de `/static/(.*)` a `/_astro/(.*)`. El resto queda igual.
- **Sin `@astrojs/vercel`:** la salida estática con preset Astro mantiene `api/` y `vercel.json` como en CRA. Se valida en el paso 1.

### Se borra (recién cuando el reemplazo funciona)

- **Código CRA:** `public/index.html`, `src/index.js`, `src/App.js`, `src/hooks/usePageMeta.js`, `scripts/prerender-guia.mjs`, `src/components/NotFound.js`, `src/components/pages/GuiaTruco.js`.
- **Supabase:** `src/config/supabaseClient.js`, `src/context/AuthContext.js`, `src/components/Auth.js` y el modal de perfil de `Header.js`.
- **Archivos vacíos:** `src/context/ScoreContext.js`, `src/hooks/useAuth.js`, `src/hooks/useScore.js`, `api/auth.js`, `api/history.js`, `api/supabase.js`.
- **Dependencias:** `react-scripts`, `react-router-dom`, `@supabase/supabase-js`, `@fortawesome/*` (sin uso), `terser-webpack-plugin`, `source-map-explorer`, `eslintConfig`, `browserslist`.
- `.gitignore`: se agregan `dist/` y `.astro/`.

## Pasos (un commit gitmoji por paso, push solo a `feat/astro`)

-1. **Copiar este plan a `docs/plan-migracion-astro.md`**, sin commit hasta que el dueño lo pida.
0. **Línea base (sin tocar código).**
   - Confirmar que producción tiene `seo-tecnico`: `/no-existe` responde 404 y `/guia-truco/` responde 308.
   - `scripts/capturar-contrato.mjs https://truco.contelautaro.com.ar` genera `tests/contrato/esperado.json` con, por URL: status, title, description, canonical, og:*, twitter:*, robots, JSON-LD parseado, h1/h2 y texto visible sin JS normalizado.
   - Anotar el peso gzip del JS de producción (`main.*.js` + chunks) como presupuesto.
   - Correr PSI (3 corridas mobile) sobre `/` y `/guia-truco`.
1. **Andamiaje y spike de plataforma.**
   - `npm i astro @astrojs/react nanostores @nanostores/react` y, como dev: `vitest @testing-library/react @testing-library/user-event jsdom @playwright/test`. Node 24, npm, versiones vigentes al instalar (hoy Astro 7.4, `@astrojs/react` acepta React 18). React se queda en 18.
   - `astro.config.mjs`, `vercel.json` con `framework: astro` y una página mínima.
   - Push y preview.
   - **Puerta:** en el preview andan `/ads.txt`, `/api/sendFeedback` (405 por GET), `/no-existe` (404) y los rewrites. Si `api/` no convive, se pasan a endpoints de Astro sin cambiar su lógica, y recién ahí entra el adapter.
2. **Portar los componentes sin cambios** (`.js` → `.jsx`, imports con la extensión nueva).
   - Escribir los **tests de caracterización** de Counter, History y EditNames sobre este código, antes de refactorizar.
3. **Store y navegación:** `stores/partida.js`, `Menu` (ex `Header`, sin portal ni Supabase), `Board` y `ResultPage` usando el store y `location.assign`, más sus tests.
4. **Layout y home:** `Base.astro`, `index.astro`, `Footer.astro`, CSS global en el layout.
   - Magnifika y MBF a woff2: con `fonttools` + `brotli` en un venv del scratchpad, no como dependencia del proyecto. `@font-face` con `/fonts/*.woff2` y `swap`, sin preload. Se borran el `.otf` y el `.ttf`.
5. **Guía:** `src/data/guia.js`, `guia-truco.astro`, script de pestañas y sus tests.
6. **Resultado y `vercel.json`.**
7. **Limpieza de CRA y Supabase** (lista de arriba). Actualizar el README: comandos y estructura.
8. **Tests de contrato, scripts de comparación y CI.**
9. **Verificación en el preview** (ver abajo).
   - Versión `1.6.0`: `package.json` y una entrada en Novedades ("La app carga más rápido"). **Pedir OK del texto al dueño.**
10. **Merge y deploy:** solo con OK explícito del dueño, en un día de semana a la mañana (fuera del horario fuerte de juego). Después, controles posteriores y monitoreo.

## Tests

### 1. Unitarios y de componentes: Vitest + Testing Library + jsdom (`npm test`, corre en la notebook)

`vitest.config.mjs` usa `getViteConfig()` de `astro/config`. Cada test arranca con `localStorage` limpio y timers falsos donde haya debounce.

- **Counter**
  - Suma con toque en el SVG y con "+"; "−" resta y no baja de 0.
  - A 30: la suma 16 en malas pasa a Buenas 1; restar en Buenas 1 vuelve a Malas 15; la suma que llega a 15 buenas llama a `onWin` y no suma.
  - A 15: llega a 15 → `onWin`.
  - Persiste `points-*` y `stage-*` después de 300 ms.
  - Restaura una partida guardada (Buenas 7).
  - Una etapa inválida para el modo vuelve al valor por defecto.
  - Historial: escribe `SUMA`/`RESTA` con `currentPoints`, `stage` y `maxPoints`, y hace flush con el evento `flushHistory` y con `beforeunload`.
  - Indicación de toque: con menos de 10 sesiones aparece a los 600 ms; con 10 o más, no; `?reset-hint` la reinicia.
  - Cambiar `maxPoints` por acción del usuario reinicia a 0 y borra las claves.
  - **Carga de una partida guardada en modo 15:** cuando el store pasa de 30 a 15 al cargar, los puntos guardados **no** se borran (riesgo crítico).
  - El render inicial, antes de `componentDidMount`, es idéntico al del build (0-0, MALAS): `renderToString` comparado con el primer render en jsdom.
- **History:** se exporta `buildTimeline`.
  - Agrupa toques del mismo equipo dentro de 5 s y no agrupa entre equipos ni con cambio de etapa.
  - Muestra el hito de etapa y el marcador actual.
  - "Borrar" pide confirmación.
- **EditNames:** convierte a mayúsculas y respeta el máximo de 10; vacío vuelve al valor por defecto; "Restaurar" vuelve a NOSOTROS/ELLOS; Enter guarda.
- **Store `partida`:** valores por defecto; lectura desde `localStorage`; `toggleMaxPoints` (despacha `flushHistory` antes de vaciar, alterna y persiste); `resetGame` (filtro de `history`, borra claves, setea el modo); `saveNames`.
- **Board:** muestra los nombres del store; con un cambio de modo desde el store, los dos contadores vuelven a 0; al ganar llama a `location.assign('/resultado/nosotros')` (mock).
- **Menu:**
  - Abre y cierra (overlay incluido).
  - Cada ítem dispara su acción o abre su modal.
  - La etiqueta dice "JUGAR A 15" en modo 30 y al revés.
  - "Guía" es `<a href="/guia-truco">`.
  - `?menu=open` en `pushState` se conserva.
  - No hay referencias a Supabase.
- **ResultPage:**
  - Mensaje con nombre por defecto ("¡GANAMOS NOSOTROS!" / "¡GANARON ELLOS!") y con nombre propio ("¡X HA GANADO!").
  - "Comenzar" está deshabilitado hasta elegir; con 15 → `resetGame(15)` + `location.assign('/')`.
  - El feedback hace POST a `/api/sendFeedback` (fetch mock) y el texto vacío muestra el aviso.
- **Script de pestañas** (jsdom con el HTML de la guía compilado): un clic alterna `hidden`, `aria-selected` y la clase; los tres paneles siguen en el DOM.

### 2. Contrato SEO sobre `dist/` (`npm run test:contrato`, después de `astro build`, sin navegador)

Lee `dist/index.html`, `dist/guia-truco.html` y `dist/resultado.html` y los compara con `tests/contrato/esperado.json`:

- title, description, canonical, og:*, twitter:*, robots y JSON-LD **idénticos** por página.
- **Guía:** están en el HTML todos los h2 de los tres paneles, las 14 cartas del ranking, todas las filas de la tabla de cantos y las 4 preguntas frecuentes. Los paneles inactivos tienen `hidden`. No aparece "Cargando...".
- **Home:** está el bloque SEO completo (h1, lista y link a la guía); también el logo con `fetchpriority="high"` y tamaño 141×38, y `.ad-slot` con `#127560-28` en el HTML estático.
- **Head:**
  - preload del logo y de Outfit;
  - gtag `G-KZNCYNPR7L` antes del stub de InMobi `6Fv0cGNfc_bw8`;
  - sin Clarity, unpkg ni fonts.googleapis;
  - sin `supabase` en ningún JS de `dist/`.
- `robots.txt`, `sitemap.xml`, `llms.txt`, `404.html`, `manifest.json` y favicons idénticos byte a byte a `public/`.
- **Presupuesto de JS:** el gzip de la home no supera la línea base del paso 0. La guía no carga JS fuera de las islas del menú y del anuncio.

### 3. Comparación de URLs entre deploys (`scripts/comparar-urls.mjs <base> <candidato>`)

- **URLs:** `/`, `/guia-truco`, `/guia-truco/`, `/resultado/nosotros`, `/resultado/ELLOS`, `/resultado/cualquiera`, `/no-existe`, `/404`, `/ads.txt`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/meta/manifest.json`, `/images/main_logo.webp`, `/fonts/outfit-latin.woff2`.
- **Qué compara:** status, `Location`, `X-Robots-Tag`, `Content-Type`, `Cache-Control`, el head completo, el texto visible sin JS y las primeras líneas de `ads.txt` (las propias de la cuenta).
- **Diferencias esperadas** (lista explícita de permitidas): hashes de assets, `/static/` → `/_astro/`, `meta robots` agregada en resultado. Cualquier otra diferencia hace que el script salga con código 1 y **no se mergea**.
- **Si el preview tiene Deployment Protection:** se usa la skill `access-protected-vercel-deployment` (`vercel curl` o token de bypass).

### 4. E2E: Playwright, **solo en GitHub Actions** (1 worker, nunca en la notebook)

- **Dónde corre:** contra la URL del preview (evento `deployment_status` de Vercel), en iPhone 14 emulado y en escritorio.
- **Publicidad bloqueada:** las rutas de themoneytizer, inmobi, googletagmanager y google-analytics se bloquean con `page.route` para no generar impresiones falsas en Moneytizer y para que los tests no fallen al azar.
- **Escenarios:**
  1. **Primera visita:** 0-0, MALAS, indicación "Tocá para sumar".
  2. **Persistencia:** 3 toques + 1 "+" − 1 "−" = 3; al recargar sigue en 3.
  3. **Partida completa a 30 para NOSOTROS** (30 toques): pasa a Buenas en la suma 16, navega a `/resultado/nosotros` y muestra "¡GANAMOS NOSOTROS!". Revancha a 15 → home en "a 15" y 0-0.
  4. **Menú:** Jugar a 15 reinicia; el VAR lista las jugadas; Editar nombres se refleja en el tablero y sigue tras recargar; Novedades muestra la versión actual; Guía navega.
  5. **Guía:** cambiar de pestaña; ← vuelve a `/`. **Con JavaScript desactivado:** el texto de los tres paneles está en el DOM y la primera pestaña se ve.
  6. **Home sin JS:** se ven el logo y el tablero 0-0, y el `<details>` "Sobre el anotador" abre con el bloque SEO.
  7. **No-scroll:** `scrollHeight <= innerHeight` en la home (mobile y escritorio), con menú y modales abiertos.
  8a. **Sin parpadeo:** con partida guardada, en el primer dibujo `<html>` tiene `partida-guardada` y los puntos están ocultos; después de hidratar se ve la partida exacta. Sin partida guardada, el tablero 0-0 se ve sin JS.
  8b. **`<details>` "Sobre el anotador":** abre y cierra sin JS, no genera scroll y su texto es igual al del contrato.
  8. **Partida guardada por la versión CRA** (se inyectan las claves actuales: Buenas 7, modo 30, nombres propios, historial): se restaura exacta, VAR incluido.
  9. `/no-existe` responde 404 con su página; `/resultado/x` lleva el header `noindex`.
  10. **Regresión visual contra producción:** capturas de la home (vacía y con partida), el menú abierto, cada modal, las 3 pestañas de la guía y el resultado, con `.ad-slot` enmascarado. Tolerancia baja; las diferencias se revisan a mano.

### 5. CI (`.github/workflows/ci.yml`)

- **En cada push a `feat/astro` y en los PR:** `npm ci`, `npm test`, `astro build`, `npm run test:contrato`.
- **En `deployment_status` exitoso de preview:** e2e y `comparar-urls` contra producción.
- El check en rojo bloquea el merge.

## Verificación final en el preview (paso 9, antes de pedir el merge)

1. CI completo en verde: unitarios, contrato, e2e y `comparar-urls` sin diferencias fuera de la lista de permitidas.
2. **Una sola sesión de agent-browser** (sin Lighthouse ni varios Chromium) como iPhone 14, revisando a mano contra producción:
   - fósforos, fuentes Magnifika y MBF, íconos, animación del logo y del tooltip a los 6,5 s;
   - el sidebar y el botón de cafecito.
3. **PSI API** (`scripts/psi.mjs`, clave del gestor de contraseñas del dueño, pasada por variable de entorno): 3 corridas mobile por URL, mediana, preview contra producción.
   - **El elemento LCP** tiene que ser el logo o texto estático en las dos páginas.
   - **Preview contra producción:** LCP menor o igual, CLS menor o igual, y menos JS transferido.
   - **Aviso:** en `*.vercel.app` puede no servirse publicidad, así que la comparación justa es contra "sin publicidad".
4. **Informe al dueño:** tabla de URLs, métricas y diferencias. **Sin OK explícito no hay merge.**

## Después del deploy

- **Día 0:**
  - `comparar-urls` contra la línea base del paso 0.
  - Inspección de `/` y `/guia-truco` con el MCP `gsc` (`inspect_url_enhanced`).
  - Una sesión de agent-browser saliendo por a1 (como en el análisis) para ver que los anuncios cargan en la home, la guía y el resultado.
  - PSI de producción.
- **Semanas 1 a 4:**
  - CrUX por PSI API una vez por semana: LCP y TTFB objetivo < 2,5 s; INP mejora poco, porque lo domina la publicidad.
  - Posición y CTR de "anotador de truco" y de la guía con el MCP `gsc`; sesiones orgánicas con el MCP `ga4`.
  - **Ingresos de Moneytizer** (los mira el dueño): 14 días antes contra 14 días después, comparando los mismos días de la semana.
- **Rollback:** promover en Vercel el deploy anterior (segundos) y después revertir el merge en `master`.
  - **Disparadores:** cualquier diferencia de SEO en producción, anuncios que no cargan, o ingreso por sesión 15 % abajo sostenido una semana.

## Después de la migración (PR aparte)

- **Pasar a pnpm** cuando Astro esté estable en producción:
  - generar `pnpm-lock.yaml` y agregar `packageManager` en `package.json`;
  - borrar `package-lock.json`;
  - CI con pnpm y prueba en el preview.
- No va en esta migración, para no mezclar dos cambios en el diagnóstico.

## Archivos críticos

- **A mover o reescribir:** `src/App.js` (lógica → `stores/partida.js`), `src/components/Header.js` → `Menu.jsx`, `src/components/Board.js`, `src/components/ResultPage.js`, `src/components/pages/GuiaTruco.js` → `guia-truco.astro` + `data/guia.js`, `public/index.html` → `Base.astro`.
- **Se reutiliza tal cual:** `Counter.js`, `History.js` (se exporta `buildTimeline`), `EditNames.js`, `Changelog.js`, `SheetCloseButton.js`, `Ads.js`, todo `src/styles/`, `api/*` con código, `public/404.html`.
- **Fuentes del contrato:** el head de `public/index.html` y el título, la descripción y el JSON-LD de `scripts/prerender-guia.mjs`.


## Cambios respecto del plan (decididos durante la implementación)

- **Islas renderizadas en el build e hidratadas después del primer dibujo** (`client:tras-dibujo`), en lugar de `client:only`.
  - Se investigó en fuentes oficiales. Desde Chrome 88, un elemento borrado del DOM sigue siendo candidato a LCP. Google indexa el HTML renderizado, después del JS. Los `<svg>` en línea no son candidatos a LCP.
  - Conclusión: el texto SEO no puede borrarse al montar.
- **Texto SEO permanente** en un `<details>` "Sobre el anotador" en el footer, que se abre tocando el ©. La app sigue sin scroll.
- **`/resultado/nosotros` y `/resultado/ellos` se renderizan en el build** (`src/pages/resultado/[ganador].astro`), para que al terminar la partida no haya un cuadro en blanco. `resultado.html` queda para cualquier otro `/resultado/:winner`.
- **Final de partida:**
  - el fósforo ganador se dibuja (antes nunca se veía) y se enciende con chispazo y llama, en SVG y CSS;
  - después hay un fundido entre páginas con `@view-transition`, solo CSS, sin ClientRouter;
  - el resultado se precarga mientras dura la animación (1,4 s).
- **Arreglos que aparecieron en el camino:**
  - flechas → y ← dibujadas con la fuente del sistema (Outfit no trae esos glifos), un bug que venía desde la v1.5.0;
  - el último punto podía perderse si se navegaba antes de 300 ms (se agregó el guardado en `pagehide`).
- **Dependencias:** React 18.1 → 18.3.1, `@vercel/analytics` 1.3 → 1.6, sin Supabase; `npm audit` sin vulnerabilidades. React 19 y pnpm quedan para PRs aparte.
- **Versión 2.0.0**, con entrada en Novedades, `CHANGELOG.md` y README actualizados.

## Publicidad diferida: v2.0.1 (decidido 2026-10-23)

- **Qué:** los scripts de Moneytizer se cargan 2,5 s después del evento `load` (`AD_DELAY_MS` en `src/components/Ads.jsx`), en lugar de 100 ms después de hidratar. El disparador es solo el tiempo: cargarlos con el primer toque empeoraría justo esa interacción. El CMP de InMobi y GA4 no cambian.
- **Por qué va separada de la 2.0.0:** si salen juntas, no se puede saber qué mejoró cada métrica ni a qué se debe una caída de ingresos. En los previews (`*.vercel.app`) Moneytizer no sirve anuncios, así que solo se puede medir en producción.
- **Qué esperar:**
  - mejora clara en LCP y FCP de las visitas que llegan desde Google;
  - mejora parcial en INP: el INP toma casi la peor interacción de toda la visita y los refrescos de banners durante la partida siguen pesando.
- **Riesgo de ingresos:** bajo en la home (las sesiones duran unos 8 min). En `/resultado/*` sí se pierde la impresión de quien elige la revancha en menos de 3 s.
- **Orden:**
  1. 2.0.0 en producción.
  2. 7 días de datos (GA4: eventos de web vitals por página; Moneytizer: ingresos por sesión, impresiones, RPM).
  3. Merge de la rama `release/2.0.1`, que ya está lista, con 91 tests en verde y su entrada en Novedades. Antes de mergear, actualizar la fecha de la entrada (hoy dice 30/10/2026).
  4. 7 días más y comparar contra los mismos días de la semana.
- **Vuelta atrás:** si el ingreso por sesión cae más de 15 % sostenido, rollback en Vercel a la 2.0.0.
- **Posible paso siguiente (2.0.2):** diferir también el CMP de InMobi (0,4 s de CPU y 197 KB al inicio), solo si la 2.0.1 confirma que diferir no afecta los ingresos.
