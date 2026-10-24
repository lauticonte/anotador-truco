# Truqito: análisis SEO y de velocidad

> **Histórico.** El estado actual, los pendientes y las lecciones aprendidas están en [`HANDOFF.md`](HANDOFF.md) (actualizado el 2026-10-24).

Sitio: `truco.contelautaro.com.ar` · Fecha: 2026-10-23
Fuentes: Search Console y GA4 (MCP), Lighthouse 12 y Chromium real (agent-browser), saliendo por la red de Oracle (a1) para que cargue la publicidad igual que para un usuario sin AdGuard.

> **Estado:** 🚧 cambios aplicados en la rama `seo-tecnico` y desplegados en preview. Midiendo el preview (sección 6).

## 1. Resumen

- El sitio vive de Google: el **94% de las sesiones** son de búsqueda orgánica.
- Perdiste el **puesto 1 en "anotador de truco"** entre el 8 y el 21 de mayo de 2026. Desde entonces estás **2°** y el CTR bajó de ~70% a ~21%. Te pasó **trucogame.com/anotador-truco**.
- La **guía** ya recibe más impresiones que la home (120 mil en 28 días), pero con **0,24% de CTR**.
- La velocidad en mobile es el punto débil: **LCP 4,7 s e INP 312 ms** en usuarios reales, contra 2,6 s y 182 ms del rival. La causa principal es **la publicidad más Clarity** (3 s de bloqueo del hilo) y **el logo, que espera a React** para dibujarse.
- La guía tiene **CLS 0,25** en usuarios reales por el salto del anuncio.

## 2. Datos de búsqueda y tráfico

### Search Console: últimas 4 semanas contra las 4 anteriores (23-sep a 21-oct)

| Página             | Clics          | Impresiones     | CTR     | Posición |
|--------------------|----------------|-----------------|---------|----------|
| Home `/`           | 19.283 (+28%)  | 115.817 (+40%)  | 16,7%   | 3,3      |
| Guía `/guia-truco` | 293 (+95%)     | 120.184 (+89%)  | 0,24% ❌ | 6,9      |
| `/?ref`            | 1              | 262             | —       | 13,1     |

### "anotador de truco": evolución

| Período                    | Posición    | CTR     |
|----------------------------|-------------|---------|
| Sep 2025 – 7 may 2026      | 1,0–1,1 ✅  | 65–80%  |
| Desde mediados de may 2026 | 2,0–2,3 ⚠️  | 20–25%  |
| 14 al 23 oct 2026          | 2,0 ⚠️      | 21%     |

No hubo commits entre enero y octubre de 2026: la caída fue por un competidor, no por un cambio tuyo.

### GA4: últimos 28 días contra los 28 anteriores

| Canal             | Sesiones       | Usuarios       | Duración media |
|-------------------|----------------|----------------|----------------|
| Búsqueda orgánica | 26.661 (+21%)  | 12.826 (+28%)  | 8,1 min        |
| Directo           | 1.383 (=)      | 781            | 5,7 min        |

## 3. Velocidad (mediciones reales)

### Cómo se midió

- **Usuarios reales (CrUX, Google):** el percentil 75 de las visitas reales en Chrome durante 28 días. Es lo que Google usa para posicionar.
- **Lighthouse 12, mobile** (CPU 4× más lenta y red 4G simulada): 3 corridas por página, mediana. Salida por a1, con publicidad.
- **Chromium real (agent-browser)** como iPhone 14, sin simulación, para identificar el elemento LCP y los saltos de diseño.

### Usuarios reales (CrUX, mobile, p75)

| Métrica | Home | Guía | trucogame.com (rival) | Umbral bueno |
|---|---|---|---|---|
| LCP | 4,7 s ❌ | 2,8 s ⚠️ | 2,6 s ⚠️ | < 2,5 s |
| INP | 312 ms ⚠️ | 295 ms ⚠️ | 182 ms ✅ | < 200 ms |
| CLS | 0,00 ✅ | 0,25 ❌ | 0,00 ✅ | < 0,1 |
| FCP | 2,4 s ⚠️ | 2,2 s ⚠️ | 2,4 s ⚠️ | < 1,8 s |
| TTFB | 0,72 s ✅ | 0,61 s ✅ | 0,77 s ✅ | < 0,8 s |

**El rival te gana en las dos métricas que más pesan: LCP (por 2 s) e INP.** El servidor no es el problema: el TTFB es igual o mejor que el suyo.

### Lighthouse mobile con publicidad (mediana de 3)

| | Home | Home **sin** publicidad | Guía |
|---|---|---|---|
| Performance | 51 | 58 | 26 ❌ |
| LCP | 3,1 s (una corrida 8,0 s) | 5,6 s* | 6,5 s ❌ |
| TBT (bloqueo del hilo) | **3.057 ms** ❌ | 631 ms | **3.229 ms** ❌ |
| CLS | 0,007 | 0,000 | **0,186** ❌ |
| Speed Index | **12,1 s** ❌ | 3,8 s | 9,6 s |
| Peso total | **1.783 KB** | 666 KB | 1.830 KB |
| Pedidos | **794** | 32 | 909 |

\* El LCP sin publicidad varía mucho entre corridas (1,9 a 7,3 s) porque **el logo espera a React**: ver más abajo.

### Qué ocupa el hilo principal (home, con publicidad)

| Origen | Tiempo de CPU | Peso |
|---|---|---|
| Scripts de publicidad dentro de la página (subastas, iframes) | ~22 s acumulados | — |
| **Microsoft Clarity** | **3,1 s** ❌ | 28 KB |
| Onfocus / Adagio (subasta de anuncios) | 1,2 s | 32 KB |
| Moneytizer | 1,1 s | 229 KB |
| Google Tag Manager (GA4) | 0,8 s | 192 KB |
| Smart AdServer | 0,7 s | 37 KB |
| InMobi (banner de consentimiento) | 0,4 s | 197 KB |
| Código propio de Truqito (`main.js`) | 0,9 s | — |

**Conclusión:** la publicidad y Clarity explican el ~80% del bloqueo (TBT de 3,0 s → 0,6 s sin ellos). Eso es lo que empuja el **INP a 312 ms**: cuando alguien toca "+" mientras cargan las subastas, el navegador está ocupado.

### Elemento LCP y qué lo demora

- **Home:** el LCP es el logo `<img src="/images/main_logo.webp">` del header. Lighthouse lo desglosa así: TTFB 0,26 s → descarga 0,19 s → **espera para dibujarse 0,97 a 3,75 s**. La imagen llega rápido, pero no se dibuja hasta que **React arranca** y monta el `Header`.
- **Guía:** el LCP es un párrafo de texto (`<p>` del envido). Está prerenderizado, pero **espera las 3 hojas que bloquean el render**.
- **Lo que bloquea el render en las dos:** Google Fonts (`@import` de Outfit, ~1,0–2,1 s estimados), **Boxicons desde unpkg** (~0,9–1,2 s) y `main.css`.

### CLS de la guía (0,19 en laboratorio, 0,25 en usuarios reales)

En la guía el contenido sigue por debajo del anuncio (`contentUnderAd` en `App.js`) y el alto del bloque de publicidad se calcula con `ResizeObserver` **después** de que carga el anuncio (`--ad-slot-height`). Cuando llega el banner, la página salta. En la home el anuncio está en un bloque aparte y el salto es mínimo (0,007).

### Hallazgos en el código (confirmados)

| Hallazgo | Detalle | Impacto |
|---|---|---|
| Logo gigante | `public/images/main_logo.webp` mide **3936×1063 px** (57 KB) y se muestra a 38 px de alto (~141 px de ancho). Es candidato a elemento LCP | ⚠️ Alto: bajarlo a ~300×81 px (2x) deja unos 3–5 KB |
| Logo dibujado por React | El `<img>` está en `Header.js`; no existe hasta que React carga, así que el LCP espera al JS | ⚠️ Alto |
| Fuente Outfit por `@import` | Va dentro de `main.css` y bloquea el render: CSS → CSS de Google → fuente | ⚠️ Medio |
| Boxicons desde unpkg | Una hoja externa entera (CSS + fuente de íconos) para **7 íconos** (`Header.js`, `Counter.js`, `ResultPage.js`) | ⚠️ Medio |
| Fuentes Magnifika y MBF | Las empaqueta el build en `/static/media/` y funcionan. Pesan 69 KB y 49 KB y no tienen `preload` | 🟢 Bajo |

## 4. Competidor: trucogame.com/anotador-truco

- Sitio completo de truco hecho con Next.js: juego online, app, reglas y reglamento.
- Debajo del tablero tiene un bloque de texto de ~120 palabras con todas las variantes de búsqueda (contador, planilla, tanteador, a 15 y a 30, buenas y malas, porotos o fósforos) y 4 links internos grandes.
- Ofrece porotos y fósforos. Truqito solo tiene fósforos.

## 5. Recomendaciones, por impacto

Todo sin migrar de stack (CRA). Cada fila dice qué métrica mueve y dónde se toca.

### Fase A: velocidad (para pelear el puesto 1)

| # | Cambio | Mueve | Dónde | Esfuerzo |
|---|---|---|---|---|
| A1 | **Sacar Microsoft Clarity**, o cargarlo solo para un % de visitas y después de la primera interacción | INP, TBT −3 s | `public/index.html` | Bajo |
| A2 | **Diferir la publicidad y el CMP de InMobi** hasta después del primer dibujo o de la primera interacción (`requestIdleCallback` / `load` + 2–3 s) | INP, TBT, LCP | `public/index.html`, `src/components/Ads.js` | Medio |
| A3 | **Logo en el HTML inicial**: header estático en `index.html` (mismo markup) para que el LCP no espere a React, con `fetchpriority="high"` | LCP −1 a −3 s | `public/index.html`, `Header.js` | Medio |
| A4 | **Achicar el logo** de 3936×1063 a ~300×81 px (2x), unos 4 KB | LCP | `public/images/main_logo.webp` | Bajo |
| A5 | **Outfit servida desde el propio sitio** (woff2 + `preload`), sin `@import` | FCP, LCP −1 s | `src/styles/App.css`, `public/index.html` | Bajo |
| A6 | **Reemplazar Boxicons** (7 íconos) por SVG inline y sacar la hoja de unpkg | FCP, LCP −1 s | `Header.js`, `Counter.js`, `ResultPage.js` | Bajo |
| A7 | **Reservar el alto del anuncio en la guía** desde el inicio (alto fijo del megabanner) para eliminar el salto | CLS 0,25 → ~0 | `src/styles/App.css`, `App.js` | Bajo |

**Objetivo medible:** home con LCP < 2,5 s e INP < 200 ms en Lighthouse, y después en CrUX (tarda 28 días en reflejarse por completo).

### Fase B: contenido (CTR y relevancia)

| # | Cambio | Mueve | Dónde |
|---|---|---|---|
| B1 | **Guía como "Tabla de valores del truco"**: title y H1 alineados, tabla visible de entrada, todo el contenido visible (sin pestañas ocultas), imágenes de cartas con texto alternativo, FAQ con schema | CTR de 120 mil impresiones (hoy 0,24%) | `GuiaTruco.js`, `prerender-guia.mjs` |
| B2 | **Bloque de texto debajo del tablero** en la home: el tablero sigue a pantalla completa y el texto queda abajo, como hace el rival | Relevancia para "anotador de truco" | `index.html` (texto estático) |
| B3 | **Links internos visibles** de la home a la guía | Autoridad de la guía | Home |
| B4 | **Modo porotos** además de fósforos | Paridad con el rival | Opción en el menú |

### Fase C: técnico (ya hecho en la rama `seo-tecnico`, falta preview)

404 real, redirección de `/guia-truco/`, `noindex` en `/resultado/*`, schema propio de la guía y limpieza del `<head>`.

### Fase D: después de medir

Migración a Vite con prerender de todo, páginas nuevas (reglas, envido, señas, truco uruguayo), versión `/pt` para Brasil y conseguir enlaces externos.

### Decisión que tenés que tomar vos

- **Publicidad diferida (A2):** puede bajar algo el ingreso por anuncios en visitas muy cortas, a cambio de velocidad. Se mide con el panel de Moneytizer antes y después.
- **Clarity (A1):** ¿lo usás? Si no lo mirás, conviene sacarlo: es el script que más CPU consume.

## 6. Cambios aplicados (rama `seo-tecnico`, commit `072df92`)

Preview: https://anotador-truco-416hqxabq-lauticontes-projects.vercel.app

| # | Cambio | Estado |
|---|---|---|
| A1 | Microsoft Clarity eliminado | ✅ |
| A2 | Publicidad diferida | ⏳ Rama `release/2.0.1` lista (Moneytizer 2,5 s después del `load`). Sale 7 días después de la 2.0.0 para medirla por separado: ver `docs/plan-migracion-astro.md` |
| A3 | Logo en el HTML inicial (se dibuja sin esperar a React) | ✅ |
| A4 | Logo 3936×1063 → 422×114 px (57 KB → 15 KB), `fetchpriority="high"`, `alt="Truqito"` | ✅ |
| A5 | Outfit servida desde el sitio (`/fonts/outfit-latin.woff2`, 32 KB) con `preload`; se sacó el `@import` | ✅ |
| A6 | Boxicons reemplazado por máscaras SVG locales (`src/styles/Icons.css`), mismas clases | ✅ |
| A7 | Alto reservado para el anuncio en la guía | ⏸️ Toca el bloque de publicidad: queda para después |
| B4 | Modo porotos | ❌ Descartado por ahora |
| C | 404 real, `/guia-truco/` → 308, `noindex` en `/resultado/*`, schema de la guía | ✅ |

### Verificación en el preview

| Ruta | Antes (producción) | Preview |
|---|---|---|
| `/no-existe` | 200 ❌ | **404** ✅ |
| `/guia-truco/` | 200 con página de error ❌ | **308 → `/guia-truco`** ✅ |
| `/resultado/ELLOS` | sin `noindex` en el header | `x-robots-tag: noindex` ✅ |
| Guía: JSON-LD | `WebApplication` de la home | `WebPage` + `BreadcrumbList` ✅ |
| Íconos del menú y botones +/− | Boxicons de unpkg | Iguales, servidos localmente ✅ |

### Lighthouse del preview

⏳ En curso (3 corridas mobile por página, por a1).

> Nota: la publicidad de Moneytizer puede no servir en el dominio del preview (`*.vercel.app`), así que la comparación justa es contra la columna "Home sin publicidad" de la sección 3. El efecto real con anuncios se ve recién en producción.

### Pendiente

- ✅ Ramas mergeadas borradas en GitHub (2026-10-23): `dev`, `feat/fosforos-realistas`, `feat/var-rediseno`, `fix/ads-megabanner-layout`, `fix/ads-txt-lineas`, `fix/palitos-viewbox-v1.4.5`. Quedan `master` y `seo-tecnico`.
- Pasar a producción (merge a `master`) después de revisar el preview.
