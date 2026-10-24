# Changelog

Todas las versiones de Truqito. Sigue [Semantic Versioning](https://semver.org/). Lo que ven los usuarios está en **Novedades** dentro de la app (`src/components/Changelog.jsx`).

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
