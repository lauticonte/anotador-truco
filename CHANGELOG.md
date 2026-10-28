# Changelog

Todas las versiones de Truqito. Sigue [Semantic Versioning](https://semver.org/). Lo que ven los usuarios está en **Novedades** dentro de la app (`src/components/Changelog.jsx`).

## [2.0.8] - 2026-10-28

### Para los usuarios
- Nada visible: más datos de velocidad en Analytics para encontrar qué frena a los celulares lentos. No va en Novedades.

### Técnico
- Cada web vital manda `app_version` (para separar versiones sin cortar por hora), `ram_gb` y `nucleos` (`navigator.deviceMemory` y `hardwareConcurrency`, para separar los Android baratos) y `experimento` (`ninguno` hasta el A/B de animaciones; se registra antes porque GA4 no guarda los parámetros previos a registrarlos).
- El INP manda `inp_franja` (`0-6 s`, `6-60 s` con el tooltip del menú latiendo, `1-5 min`, `5+ min`) e `inp_desde_carga` (ms): en qué momento de la visita fue el peor toque.
- `inp_script` separa `sin frames largos` (toque rápido: ningún frame pasó de 50 ms) de `sin loaf` (el navegador no tiene Long Animation Frames). En la 2.0.6 y la 2.0.7 los dos casos salían como `sin loaf`.
- GA4: registradas las dimensiones `inp_franja`, `app_version`, `ram_gb`, `nucleos`, `experimento` y `navigation_type`, y las métricas `inp_desde_carga` y `metric_value` (el valor real de cada métrica; hasta ahora solo estaba la suma de `delta`).
- `scripts/medicion/validar-vitals.mjs`: valida en Chrome real lo que se mandaría a GA4 (toques normales, sobre tareas largas que no dibujan y con handler lento; con `DIST`, en el dominio real con publicidad). Comprueba tipos, rangos y que las fases sumen el INP. Detecta el error de la 2.0.5 si se lo vuelve a meter.

## [2.0.7] - 2026-10-28

### Para los usuarios
- Arreglo: el anotador vuelve a andar en celulares y navegadores viejos, donde desde la 2.0.0 se veía pero los botones no respondían.

### Técnico
- Vite compila por defecto para navegadores modernos, y el bundle traía `??=` y `||=` (Chrome 85+) del cliente de Astro, de `ClientRouter` y de `web-vitals`. En Chrome 81 (el último de Android 4.4) y Samsung Internet viejo no parseaba: `SyntaxError: Unexpected token '='`, ninguna isla hidrataba y no andaban ni los botones ni el menú. La CRA compilaba con `browserslist >0.2%, not dead`. Ahora `vite.build.target` es `chrome80, edge88, firefox78, safari14`: el JS crece ~3 KB (1,4 %). Afectaba a ~0,2–0,4 % de las sesiones. Probado en un Moto G de 2013 (Chrome 81).
- `web-vitals` usa funciones de Chrome 92–97 (`Array.prototype.at`, `findLast`), y el `target` traduce sintaxis pero no agrega funciones. En Chrome 81 cada métrica tiraba un `TypeError`. `reportWebVitals.js` ahora no mide en navegadores sin `findLast`: tampoco reportan INP (no tienen `interactionId`) y son ~0,2 % de las visitas.

## [2.0.6] - 2026-10-27

### Para los usuarios
- Nada visible: corrige la medición de velocidad que se manda a Analytics. No va en Novedades.

### Técnico
- `inp_style_layout` llegaba a GA4 con valores imposibles (promedios de 60 000 a 1 100 000 ms) y por eso `inp_unattributed` salía negativo. Es un error de `web-vitals` 6.2.3 (la última): suma `startTime + duration - styleAndLayoutStart` por cada frame largo, y un frame que no dibuja tiene `styleAndLayoutStart = 0`, así que suma su hora de fin. Pasa justo en el caso que se quería medir: un toque que cae encima de una tarea de la subasta. Ahora `reportWebVitals.js` calcula estilos y layout sin esos frames, y el tiempo sin atribuir con ese valor. Probado en Chromium con toques sobre tareas largas que no dibujan: la 2.0.5 manda estilos 5855 ms y sin atribuir −5835; la 2.0.6, 0 y 12 (suman exacto el INP).
- `inp_script` dice `sin script largo` (hubo frames largos pero ningún script) o `sin loaf` (el navegador no tiene Long Animation Frames), en vez de `(not set)` o vacío. Eran el 60 % de los toques lentos del 26 y 27/10.
- Los datos de `inp_style_layout` e `inp_unattributed` del 25 al 27/10 no sirven; `inp_script`, `inp_script_ms` e `inp_paint` sí.

## [2.0.5] - 2026-10-25

### Para los usuarios
- Los botones responden más rápido en celulares lentos, sobre todo el primer toque de la partida.

### Técnico
- INP: cada toque guardaba la hora en el historial con `toLocaleTimeString("es-AR", …)`, que arma un formateador de fechas nuevo. Era más de la mitad del JS de cada toque y, en el primero, ~800 ms con CPU 15×. Ahora el `Intl.DateTimeFormat` se crea una vez, en un momento libre después de montar, y se reutiliza (mismo texto). Peor toque en laboratorio (CPU 15×, sin publicidad): ~820 → ~180 ms; JS por toque sin limitar: 10,4 → 4,5 ms.
- Los `<defs>` del SVG de cada tablero se arman una sola vez: React ya no los vuelve a comparar en cada toque.
- Web vitals: el evento INP manda también `inp_script` (fase, origen y tipo del script más largo, de Long Animation Frames), `inp_script_ms`, `inp_style_layout`, `inp_paint` e `inp_unattributed`, para separar el dibujo propio de la publicidad. Dimensión y métricas registradas en GA4 el 25/10.

## [2.0.4] - 2026-10-24

### Para los usuarios
- Accesibilidad: el anuncio de abajo se anuncia como "Publicidad" en los lectores de pantalla.

### Técnico
- Los iframes que crea y rota Moneytizer no traen `title` (Lighthouse lo marca en Accesibilidad: "frame-title"). `Ads.jsx` observa el contenedor y les pone `title="Publicidad"` si no tienen uno.

## [2.0.3] - 2026-10-24

### Para los usuarios
- Arreglo: el menú vuelve a abrirse por encima del tablero.

### Técnico
- La 2.0.1 le puso `view-transition-name` a `#app-header` y a `.ad-slot` para que no se fundieran al navegar. Eso hace del header un contexto de apilamiento propio: el menú lateral, que está adentro, quedaba debajo del tablero (se abría, pero no se veía). Se sacó; header y anuncio igual no cambian al navegar porque son los mismos nodos. Test de contrato nuevo.

## [2.0.2] - 2026-10-24

### Para los usuarios
- Arreglo: el anuncio de abajo ya no se duplica al cambiar de pantalla.

### Técnico
- Después de cada swap, `ClientRouter` vuelve a ejecutar todo `<script>` sin `data-astro-exec`. Los que agregan `Ads.jsx` y Moneytizer dentro del anuncio (`gen.js`, `requestform.js`, `sas_script_*`) no la tenían: corrían de nuevo, pedían otro anuncio (otra subasta) y dejaban un segundo `div#sas_*` vacío que duplicaba el alto del bloque. Ahora `navegacion.js` marca como ejecutado todo script que ya está en la página antes de cambiarla.

## [2.0.1] - 2026-10-24

La 2.0.0 se desplegó el 2026-10-24 a las 04:30 y se volvió a la versión CRA a los 3 minutos: cada cambio de página recargaba el anuncio y lo volvía a subastar. Esta versión corrige eso.

### Para los usuarios
- Pasar del anotador al resultado o a la guía es más rápido: la página ya no se recarga entera.

### Técnico
- **El anuncio queda vivo entre páginas**, como en la SPA de la versión CRA. `ClientRouter` de Astro con un swap propio (`src/scripts/navegacion.js`): cambia el `<head>` y el `<main>`; header, `.ad-slot` y footer son siempre los mismos nodos, así que el iframe de Moneytizer no se recarga ni vuelve a subastar. No se usa `transition:persist`: sin `moveBefore()` (Safari e iOS no lo tienen) mueve el iframe y lo recarga, y la documentación de Astro lo advierte.
- GA4 y el CMP de InMobi se cargan una sola vez por visita. Las páginas vistas las cuenta la medición mejorada de GA4 por cambios del historial, como en la versión CRA.
- Las islas nuevas hidratan con los valores del build (`useStoreTrasMontar`) y la partida se vuelve a leer de `localStorage` en cada navegación. El menú se cierra al cambiar de página y volver atrás con el menú abierto no trae la página de nuevo.
- **OG nuevo** (logo, tablero con fósforos y truqito.dev.ar) con nombre propio, `og-truqito.png`: `/images/*` es `immutable` por un año.

## [2.0.0] - 2026-10-23

Migración de Create React App a **Astro + React (islas)**. El objetivo es SEO y velocidad: cada página llega con su HTML completo y React solo activa lo interactivo.

### Para los usuarios
- La app carga mucho más rápido y el tablero aparece apenas se abre la página.
- Al ganar, el último fósforo se coloca y se enciende (chispazo y llama) antes de pasar al resultado. Antes el toque ganador no lo dibujaba.
- Pasar del anotador a la guía o al resultado es un fundido corto, sin cortes ni pantallas a medio dibujar.
- "Sobre el anotador": al tocar el © del pie se abre el texto que explica la app.
- Arreglo de las flechas del VAR y de la guía: Outfit no trae los glifos → y ←, y se dibujaban con otra fuente.
- Arreglo: el último punto se guarda aunque se cambie de página justo después de sumar (`pagehide`).

### Técnico
- **Astro 7** con salida estática (`build.format: "file"`) y **React 18.3** como islas. La directiva propia `client:tras-dibujo` renderiza las islas en el build y las hidrata después del primer dibujo, como hacía `src/index.js` en la versión CRA.
- **Tablero renderizado en 0-0 en el build**. `localStorage` se lee después de hidratar (`cargarPartida()` en `src/stores/partida.js`). Quien vuelve con una partida guardada no ve el 0-0: un script inline marca `<html class="partida-guardada">` antes del primer dibujo. Cargar una partida a 15 no la borra: el contador espera a `partidaCargada`.
- **Estado compartido entre islas** con nanostores; la lógica de `App.js` pasó tal cual al store.
- **Texto SEO permanente** en un `<details>` del footer. Antes estaba en `#root` y React lo borraba al montar, así que Google, que indexa el HTML renderizado, no lo veía.
- **Guía** en `.astro`, con las tres pestañas en el HTML. Las inactivas llevan `hidden` y un script solo alterna `hidden` y `aria-selected`. Se borró `scripts/prerender-guia.mjs`.
- `/resultado/nosotros` y `/resultado/ellos` salen del build; cualquier otro `/resultado/:winner` usa `resultado.html`. Siguen con `noindex`, que ahora también está en el HTML.
- **Navegación con páginas separadas** (sin router SPA) y fundido con `@view-transition` (solo CSS). Publicidad y GA4 sin cambios de código ni de orden.
- CSS inline, Magnifika y MBF en woff2 (69 → 46 KB y 49 → 14 KB). JavaScript inicial de la home: 108,8 KB → ~55 KB gzip.
- Sin Supabase (el login estaba apagado), sin `react-router-dom` y sin `react-scripts`. `npm audit` sin vulnerabilidades.
- **Pruebas:** tests unitarios con Vitest, contrato SEO del build contra producción y `scripts/comparar-urls.mjs` para comparar deploys URL por URL.

## [1.5.0] - 2026-10-14
- Nuevo VAR: marcador arriba y la partida jugada por jugada, con los puntos de cada equipo de su lado.
- Editar nombres y Novedades con nuevo diseño.
- Nueva Guía del truco: valores de las cartas, envido y cuánto vale cada canto, en tres pestañas.
- Borrar el historial del VAR pide confirmación.
- Arreglo del menú en pantallas chicas y de la barra blanca al abrir el teclado.
- SEO: robots.txt, canonical, 404 real, sitemap y llms.txt.

## [1.4.6] - 2026-10-14
- Fósforos realistas en el marcador.
- Guía para mostrar que se puede tocar el tablero para sumar.
- Animación al sumar un punto.
- Arreglo de la pantalla de resultado: el botón Enviar ya no queda tapado por la publicidad.
- Footer más compacto.

## [1.4.5] - 2026-10-14
- La publicidad tiene su propio espacio abajo y ya no tapa los botones de sumar y restar.
- Arreglo de los palitos que se veían cortados en pantallas chicas.
- Corrección del logo en la pantalla de resultado.

## [1.4.4] - 2026-01-02
- Corrección del scroll en modales y menús.
- Arreglo del botón "REVISÁ" que no se mostraba bien en todos los dispositivos.

## [1.4.3] - 2025-12-09
- Tocá los palitos para sumar puntos directamente.
- Mejoras en la interacción táctil del marcador.

## [1.4.2] - 2025-10-28
- Nueva Guía del Truco: valores de cartas, reglas y tutorial.
- Preguntas frecuentes y tabla de valores del truco argentino.
- Mejoras en SEO y navegación interna.

## [1.4.1] - 2025-09-21
- Carga inicial más rápida con carga diferida.
- Imágenes optimizadas y VAR guardado en lote.

## [1.4.0] - 2025-03-31
- Nombres personalizados para los equipos.
- VAR con animaciones y diseño renovado.
- Nueva pantalla de resultados con opciones de revancha.

## [1.3.0] - 2025-01-13
- VAR de puntos con acciones detalladas.
- Menú lateral con historial y cambio de modo de juego.

## [1.1.0] - 2024-11-14
- Botón para alternar entre 15 y 30 puntos.
- Revancha a 15 o a 30 al terminar la partida.
- Nueva fuente principal y header rediseñado.

## [1.0.1] - 2024-11-05
- Revancha.
- Sugerencias en tiempo real por Telegram.
- Compatibilidad con desktop y mobile.

## [1.0.0] - 2022-05-18
- Lanzamiento oficial de la aplicación.
