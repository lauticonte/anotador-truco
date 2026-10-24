# Brief: migrar Truqito de CRA a Astro + React (islas) en Vercel

> **Histórico.** El estado actual, los pendientes y las lecciones aprendidas están en [`HANDOFF.md`](HANDOFF.md) (actualizado el 2026-10-24).

Fecha: 2026-10-23. Rama de trabajo: `feat/astro`, creada desde `seo-tecnico`. Worktree: `~/projects/anotador-truco-astro`.

## Objetivo

Que cada página llegue con su HTML completo desde el build (SSG) y React solo "active" lo interactivo, sin reemplazar el HTML. Motivos medidos:

- El LCP de la home salta entre 2,5 s y 11 s en PageSpeed (mobile): si React reemplaza `#root` antes del primer dibujo, el LCP pasa a ser un elemento de React y espera a todo el JS más la publicidad. Usuarios reales (CrUX, p75 mobile): **LCP 4,7 s, INP 312 ms**. El competidor `trucogame.com/anotador-truco` (Next.js) tiene LCP 2,6 s e INP 182 ms y nos sacó el puesto 1 en "anotador de truco" en mayo de 2026.
- Hoy la guía se prerenderiza con un script casero (`scripts/prerender-guia.mjs`) que no escala a páginas nuevas (reglas, envido, señas, truco uruguayo, `/pt` para Brasil).

Contexto completo de SEO y velocidad: `docs/analisis-seo.md` en `seo-tecnico`.

## Estado actual (rama `seo-tecnico`, todavía no en producción)

Ya aplicado y que **hay que conservar**:

- Sin Microsoft Clarity.
- Logo `public/images/main_logo.webp` 422×114 px; header fijo en `public/index.html` (`#app-header`) y `Header.js` dibuja el menú adentro con `createPortal`. En Astro esto se resuelve naturalmente: header en el layout `.astro`, menú como isla.
- Outfit servida desde `/fonts/outfit-latin.woff2` con `preload` (sin `@import` de Google Fonts).
- Íconos Boxicons como máscaras SVG locales: `src/styles/Icons.css` (mismas clases `bx bx-*`).
- `api/not-found.js` responde 404 real con `public/404.html`; `vercel.json` con `trailingSlash: false`, `X-Robots-Tag: noindex` en `/resultado/*`, rewrite de `/ads.txt` a `api/ads-text.js`.
- JSON-LD propio de la guía (`WebPage` + `BreadcrumbList`) y `WebApplication` en la home.

## Lo que NO se toca

- **Publicidad (Moneytizer) y el CMP de InMobi:** mismo código y mismo orden de carga. El dueño decidió no diferirla por ahora. Tampoco el alto del bloque del anuncio (`.ad-slot`).
- **GA4** `G-KZNCYNPR7L`: mismo tag.
- **Funcionalidad:** sin modo porotos ni cambios de UX. La app es **no-scroll** (single page) y tiene que verse idéntica.
- **URLs:** `/`, `/guia-truco`, `/resultado/:winner` (noindex), `/ads.txt`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/404`. Mismos title, description, canonical, Open Graph, Twitter y JSON-LD por página.

## Correcciones al plan que se pegó en el chat (leer antes de empezar)

Ese plan va en la dirección correcta (Astro + React + `@astrojs/vercel`), pero tiene supuestos que no son exactos:

1. **"Prerenderizar el tablero en 0-0 da LCP instantáneo":** el estado de la partida se guarda en `localStorage` (`points-*`, `stage-*`, `maxPoints`, `teamNames`, `history`) y se lee en los inicializadores de `useState` (`App.js`, contextos, `Counter.js`). Con SSR esos inicializadores fallan (`localStorage` no existe en el servidor) y, si un usuario vuelve con una partida guardada, la hidratación no coincide. Hay que elegir y justificar: (a) el tablero como `client:only="react"` y la parte estática (header, footer, contenido) en `.astro`, o (b) render inicial neutro y lectura de `localStorage` en `useEffect`. El LCP tiene que quedar en HTML estático (logo o texto), no en algo que dibuje React.
2. **`usePageMeta.js`:** la guía ya tiene title y meta en el HTML (los pone el script de prerender). Lo que sí queda resuelto en Astro es no tener que mantener ese script.
3. **Fuentes Magnifika y MBF:** el build de CRA ya las empaqueta en `/static/media/` y funcionan. Convertirlas a `woff2` es una mejora válida (69 KB y 49 KB hoy), con `font-display: swap`.
4. **Supabase:** es cierto que `supabaseClient.js` entra en el bundle inicial (lo importan `Header.js` y `AuthContext`) y que tira error si faltan `REACT_APP_SUPABASE_URL` / `REACT_APP_SUPABASE_ANON_KEY`. En Astro las variables públicas van con prefijo `PUBLIC_`: hay que crearlas en Vercel (Preview y Production) sin borrar las viejas hasta que se mergee. El login hoy está comentado; el cliente igual se usa en `api/` y en el contexto.
5. **`/api`:** las funciones de `api/` (`ads-text.js`, `auth.js`, `history.js`, `sendFeedback.js`, `supabase.js`, `not-found.js`) pueden quedar como Vercel Functions en la carpeta raíz `api/`. Verificá que convivan con el output de Astro; si no, pasarlas a endpoints de Astro sin cambiar su lógica.

## Plan sugerido

1. Leer el repo y el análisis; proponer al dueño la estructura (páginas `.astro`, islas, qué queda `client:load` / `client:idle` / `client:only`) **antes de escribir código**.
2. Andamiaje Astro en la misma raíz (`astro.config.mjs` con `@astrojs/react` y `@astrojs/vercel`, output estático salvo lo que necesite servidor), migrando `src/` y `public/`.
3. Home y guía primero; después `/resultado/:winner` y el 404.
4. Borrar `scripts/prerender-guia.mjs` y `usePageMeta.js` recién cuando su reemplazo funcione.
5. Preview en Vercel y **comparación URL por URL contra producción** antes de proponer el merge: código de estado, title, description, canonical, OG, JSON-LD, texto visible sin JS, headers (`X-Robots-Tag`) y `ads.txt`. Si algo difiere, no se mergea.
6. Medir con **PageSpeed Insights API** (clave en el gestor de contraseñas del dueño; pasarla por variable de entorno, nunca mostrarla) contra producción.

## Reglas de trabajo

- **No correr Lighthouse ni varios Chromium en la notebook:** ya trabó la PC una vez. Para medir, PageSpeed Insights API o, como mucho, una sola sesión de agent-browser.
- **npm, no pnpm** (Vercel instala con `package-lock.json`). Node 24.
- **Commits con gitmoji** como el historial (`⚡️`, `✨`, `🐛`, `♻️`, `🔧`, `🚀 vX.Y.Z: …`), títulos cortos en español, con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` en el cuerpo.
- Push solo a `feat/astro`. **Nada a `master`** ni a producción sin OK explícito del dueño.
- Credenciales: en el gestor de contraseñas del dueño. Nunca en `.env` ni en el chat. `vercel link` crea un `.env.local` con un token temporal de Vercel: no lo borres sin preguntar.
- Search Console y GA4 están disponibles como MCP (`gsc`, `ga4`) para verificar indexación y tráfico.

## Actualización 2026-10-23 (ya en producción, `master` = `2001a1f`)

- `2fad0c8` ⚡️ React se monta después del primer dibujo (`requestAnimationFrame` + `setTimeout(0)` en `src/index.js`). Sin hojas que bloqueen, `main.js` corría antes del primer dibujo y lo atrasaba hasta 2,3 s.
- `2001a1f` 📈 `src/reportWebVitals.js`: web-vitals 6.2.3 (attribution) manda LCP, INP, CLS, FCP y TTFB a GA4 como eventos (`metric_value`, `metric_rating`, `debug_target`). Se carga con `import()` después de `load`. **Conservarlo en la migración.**
- PageSpeed tiene mucho ruido (mismo código: primer dibujo de 0,18 a 2,3 s). La referencia pasan a ser los web vitals reales en GA4.
- Traer `origin/master` a `feat/astro` antes de seguir.
