# Handoff: Truqito

Actualizado: **2026-10-27, ~22 h**. Producción: **v2.0.6** (`master` = `bc59d12`, PR #9, publicada el 27/10 ~21:40), en https://truco.contelautaro.com.ar. Lo que sigue del INP está en la [sección 3](#3-inp-v205-y-v206).

Este documento alcanza para retomar el trabajo. El detalle histórico está en los documentos de la [tabla del final](#documentos).

## 1. Qué hay en producción

| Versión | Fecha | Qué cambió |
|---|---|---|
| 2.0.0 | 24/10 04:30 | Migración de CRA a **Astro 7 + React 18 en islas** (SSG). La desplegó sola el timer `truqito-despliegue` de a1. **Se sacó a los 3 min:** cada cambio de página recargaba el anuncio y lo volvía a subastar |
| 2.0.1 | 24/10 | **`ClientRouter` con swap propio** (`src/scripts/navegacion.js`): entre páginas cambian solo el `<head>` y el `<main>`; header, anuncio y footer son siempre los mismos nodos. OG nuevo (`/images/og-truqito.png`) |
| 2.0.2 | 24/10 | Los scripts del anuncio se marcan con `data-astro-exec` antes del swap: sin anuncio duplicado ni subasta extra al navegar |
| 2.0.3 | 24/10 | Sin `view-transition-name` en el header: el menú lateral volvía a quedar tapado por el tablero |
| 2.0.4 | 24/10 | `title="Publicidad"` en los iframes de Moneytizer (accesibilidad) |
| 2.0.5 | 25/10 | INP: el formateador de la hora del historial se crea una vez (era ~800 ms el primer toque con CPU 15×). GA4 recibe el desglose de Long Animation Frames del INP |
| 2.0.6 | 27/10 | Corrige ese desglose: `inp_style_layout` llegaba con valores imposibles por un error de `web-vitals` (sección 3). `inp_script` distingue `sin script largo` y `sin loaf`. No va en Novedades: los usuarios no ven nada |

Releases en GitHub: v2.0.0 a v2.0.5. **Falta el de v2.0.6** (el auto mode lo bloquea, pendiente 9). `CHANGELOG.md` y Novedades (`src/components/Changelog.jsx`) están al día.

## 2. Números de referencia (línea base)

**Usuarios reales, GA4, home, 23–24/10, con la versión CRA ya optimizada.** Google aprueba una métrica con ≥ 75 % de visitas en verde.

| Métrica | Visitas en verde | Promedio | ¿Aprueba? |
|---|---|---|---|
| LCP | 94 % | 1,04 s | ✅ |
| FCP | 89 % | 1,04 s | ✅ |
| CLS | 97 % | 0,01 | ✅ |
| TTFB | 88 % | 0,47 s | ✅ |
| **INP** | **71 %** | ~0,12 s | ❌ |

- **INP por elemento:** botón **+** 28 % de toques lentos (397 toques), botón **−** 38 % (149). Tocar el tablero: 18–28 %.
- **CrUX (p75, 28 días, el que muestra PageSpeed arriba):** LCP 4,6 s, INP 316 ms, CLS 0,01, FCP 2,4 s, TTFB 0,72 s. Arrastra los días anteriores al 23/10; el LCP debería verse en verde a mediados de noviembre.
- **Search Console, "anotador de truco":** posición **2,0** estable en octubre, CTR 20–24 %, ~300–600 clics por día.
- **Laboratorio, Chrome real con CPU 4× y 4G** (`carga-cdp.mjs`, mediana de 5): CRA FCP 0,61 / LCP 0,61 s · 2.0.0 0,45 / 0,66 · 2.0.3 0,46 / 0,76. El tablero sale antes que en la CRA; **el logo, ~0,1 s más tarde**.
- **Toques en el laboratorio** (`toques-cdp.mjs`, CPU 4×): mediana 24–32 ms sin publicidad y 48 ms con publicidad; ningún toque pasó de 200 ms. Nuestro código no es lo lento.

### Usuarios reales con la 2.0.x (medido el 25/10)

% en verde **solo sobre eventos calificados** (en la CRA hay ~15 % de eventos sin calificación; el script `ga4-calificaciones.mjs` los cuenta en el total y baja los porcentajes). CRA = hasta el 24/10 16 h; 2.0.x = 24/10 16 h al 25/10 ~17 h. Ojo: la 2.0.x se midió en fin de semana (otro público y otras redes; el TTFB malo también subió, y eso no depende del código).

| Métrica | CRA | 2.0.x | |
|---|---|---|---|
| LCP | 94 % | 91–92 % | ✅ un poco peor (pendiente 5: `lcp_render_delay` en celulares ~270 ms) |
| FCP | 89 % | 83–85 % | no cuenta para Google |
| CLS | 97 % | 99–100 % | ✅ mejor |
| TTFB | 86–90 % | 86 % | ✅ igual |
| **INP** | **72 %** | **69–70 %** | ❌ igual que antes |

- **CrUX (25/10):** LCP 4,52 s, INP 317 ms, FCP 2,4 s, CLS 0,01, TTFB 0,72 s. Casi no se movió (ventana de 28 días). Se consulta sin la API de CrUX: `runPagespeed` con `PSI_KEY` trae `loadingExperience`.
- **Search Console:** datos hasta el 23/10 (2 días de atraso), posición 2,0 sin cambios.
- **Fases del INP** (toques lentos con `load_state=complete`, n=369): **presentación ~430 ms**, demora de entrada ~250 ms, procesamiento ~105 ms. La columna "valor" del INP en GA4 es la suma de `delta`, no el valor final: no sirve para promedios por calificación (da números negativos).

### El INP es un problema de Android (medido el 27/10)

Cada evento INP es **una visita** (su peor toque), no un toque. Del 24/10 al 27/10, por sistema operativo y navegador:

| Dispositivo | Visitas | INP en verde | Demora de entrada en las lentas |
|---|---|---|---|
| **Android · Chrome** | 2369 | **46 %** | 205 ms |
| iPhone · Safari | 1494 | 97 % | 94 ms |
| iPhone · Chrome | 400 | 95 % | 119 ms |
| Windows · Chrome | 304 | 79 % | 863 ms |
| Windows · Edge | 84 | 77 % | 106 ms |

- En iPhone ya aprueba. Chrome en iPhone usa el motor de Safari y da casi lo mismo: no es el navegador, son los teléfonos (Android baratos, CPU lenta, publicidad y nuestro código compitiendo por el mismo hilo).
- Con iPhone igual, **Android tiene que pasar de 46 % a ~57 %** para que el total llegue a 75 %.
- Ojo: Safari no tiene Long Animation Frames y mide el INP hace poco; su 97 % puede ser algo optimista.
- **Android, por estado de carga en el peor toque:** `complete` 1456 visitas (44 % en verde, 815 lentas), `dom-content-loaded` 435 (49 %, 223 lentas), sin dato 505 (47 %). **~60 % de las visitas lentas tienen su peor toque con la página ya cargada**, cuando la publicidad solo rota y resubasta.
- **Android, visitas lentas del 26–27/10 por `inp_script`** (las únicas filas confiables de la 2.0.5): 70 `processing-duration: propio` (nuestro handler del botón), ~45 de publicidad en `input-delay` (Moneytizer, sascdn, js7k, adsafeprotected), 13 `input-delay: propio`. Sin atribuir: 193 (`(not set)` y vacío; desde la 2.0.6 se separan en `sin script largo` y `sin loaf`).

## 3. INP: v2.0.5 y v2.0.6

### v2.0.6: el desglose de la 2.0.5 venía roto (27/10)

A las 48 h de la 2.0.5, `inp_style_layout` traía promedios de 60 000 a 1 100 000 ms e `inp_unattributed` salía negativo. **Es un error de `web-vitals` 6.2.3** (la última; no hay issue abierto): por cada frame largo suma `startTime + duration - styleAndLayoutStart`, y un frame que no dibuja tiene `styleAndLayoutStart = 0`, así que suma su hora de fin desde que cargó la página. Pasa justo cuando el toque cae encima de una tarea de la subasta. En la 2.0.5 no se vio porque `toques-cdp.mjs` calcula el desglose por su cuenta y nadie miró lo que se mandaba a GA4 (lección 19).

- `reportWebVitals.js` calcula estilos y layout con `estilosYLayout` (sin esos frames) y el tiempo sin atribuir con ese valor. Test en `tests/unit/reportWebVitals.test.js`.
- Probado en Chromium con toques por CDP sobre tareas de 250 ms que no dibujan: la 2.0.5 manda estilos 5853 ms y sin atribuir −5841; la 2.0.6, 0 y 12 (las partes suman exacto el INP).
- **Datos del 25/10 ~18:40 al 27/10 ~21:40:** `inp_style_layout` e `inp_unattributed` no sirven. `inp_script`, `inp_script_ms` e `inp_paint` sí.
- Verificado en producción por el túnel a a1: versión 2.0.6, un solo `div#sas_30012` de 100 px, mismo iframe y mismo `.ad-slot` al ir a la guía y volver, menú arriba con `elementFromPoint`.

### v2.0.5 (publicada el 25/10)

PR #7 (`perf/inp-dibujo`), mergeado el 25/10 ~18:40. **Verificado en producción** (por el túnel a a1): versión 2.0.5, un solo `div#sas_30012` de 100 px (iPhone) que sigue siendo el mismo nodo al ir a la guía y volver, el menú queda arriba según `elementFromPoint`, y el evento INP sale con `inp_script`, `inp_script_ms`, `inp_style_layout`, `inp_paint` e `inp_unattributed`. Desde Oracle no gana ningún anuncio pagado: no hubo iframe para comparar.

**Qué se encontró en el laboratorio** (`toques-cdp.mjs` con `CPU=15 PAUSA=250`, sin publicidad, y `perfil-cdp.mjs`):
- `registerHistory` era **más de la mitad del JS de cada toque**: `toLocaleTimeString("es-AR", …)` arma un `Intl.DateTimeFormat` nuevo. El primero de la partida costaba **~800 ms con CPU 15×**, y como el INP es el peor toque de la visita, pesa directo en la métrica.
- El resto del procesamiento es el render de React del `Counter` (~3–4 ms por toque sin limitar).
- La presentación en el laboratorio es ~50 ms con CPU 15×. En usuarios reales es ~430 ms: la diferencia no está en nuestro dibujo sin publicidad. Sospecha: publicidad y GPU de celulares lentos. **Se va a confirmar con los datos de LoAF** (ver abajo).

**Cambios:**
1. El `Intl.DateTimeFormat` se crea una vez, en `requestIdleCallback` después de montar, y se reutiliza (mismo texto, lo cubre el test del historial).
2. Los `<defs>` del SVG se arman una vez por tablero (React ya no los compara).
3. `reportWebVitals.js` manda, en el INP: `inp_script` (fase, origen `propio`/dominio y tipo del script más largo), `inp_script_ms`, `inp_style_layout`, `inp_paint` e `inp_unattributed`. **Registrados en GA4 el 25/10** (`ga4-definiciones.mjs --crear`).

**Resultado en laboratorio** (CPU 15×, 20 toques, 2 corridas): peor toque **~820 → ~180 ms**; procesamiento promedio 100 → 57 ms; JS por toque sin limitar 10,4 → 4,5 ms. La mediana casi no cambia: lo que mejora es el primer toque.

**Con publicidad real, desde fuera de casa (25/10).** Túnel SOCKS por SSH a a1 (DNS de Oracle, sin AdGuard), Chromium con `--disable-site-isolation-trials` (los iframes de los anuncios en el mismo proceso, como en la mayoría de los Android), CPU 15×, 60 toques cada 600 ms, 3 corridas de cada versión alternadas. La 2.0.5 se sirvió **en el dominio real** con `DIST=dist` (ver `toques-cdp.mjs`), así la publicidad la trata igual que a producción. Desde la IP de Oracle corre toda la subasta (~35 bidders), pero no gana ningún anuncio pagado.

| | 2.0.4 | 2.0.5 |
|---|---|---|
| JS del clic de React (total de la sesión) | 1,8–1,9 s | 0,5–0,8 s (**−60 %**) |
| Procesamiento promedio por toque | 77–82 ms | 48–63 ms |
| Demora de entrada promedio | 83–97 ms | 88–111 ms |
| Mediana / p75 | 128–136 / 151–164 ms | 112–131 / 140–159 ms |
| **Peor toque** | **2,8–3,3 s** | **2,9–3,3 s** |

- **Prebid de Moneytizer (`cdn.themoneytizer.fr/…/prebid.js`, `setTimeout`) es ~2/3 de todo el JS de los frames largos:** 5,2–5,7 s por sesión, contra 1,4–2,9 s de todo lo nuestro. El peor toque de cada sesión (~3 s con CPU 15×, unos 200 ms en un celular normal) es igual en las dos versiones: es un toque que cae encima de una tarea de la subasta. **Ese es el INP de las visitas largas, y no depende de nuestro código.**
- Sin publicidad, la demora de entrada era ~20 ms; con publicidad, ~90–110 ms. La presentación da ~55 ms en las dos versiones: este laboratorio **no** reproduce los ~430 ms de presentación de GA4 (sin anuncio gráfico pagado ni GPU de celular barato). Eso lo va a decir `inp_script`/`inp_unattributed` en GA4.
- Fallas del método: con 45 sumas y 15 restas la partida termina cerca del toque 40 y los últimos toques caen en `/resultado` (aparece `ViewTransitionCallback`). Les pasa igual a las dos versiones. Para la próxima: más restas o menos toques.
- **Conclusión:** la 2.0.5 baja nuestro costo por toque a menos de la mitad y elimina el primer toque lento, pero **el peor toque con publicidad es de Prebid**. Para que el INP pase el 75 % casi seguro hay que hablar con Moneytizer (menos bidders, `timeout`/refresco más largo, o pausar el refresco mientras se toca). Es decisión del dueño, por ingresos.

### Siguiente paso: desde el 29/10 ~22 h

Son 48 h después de la 2.0.6. En GA4, filtrar `INP` con calificación mejorable o mala y **Sistema operativo = Android**. Abrir por `inp_script` y mirar `inp_style_layout`, `inp_paint` e `inp_unattributed`:
- **`processing-duration: propio`** sigue siendo lo más común: perfilar el handler del botón + en Android lento. Medir el procesamiento completo, no solo el JS: con CPU 15×, `perfil-cdp.mjs` más un trace. Candidatos: el render de `Counter`, los fósforos (animación `match-place` en SVG, que no se compone en GPU), los gradientes de las cabezas y la llama.
- **`input-delay` con un dominio de publicidad**, o `sin script largo` con `inp_unattributed` alto: es la subasta. Lo que sirve es pausar o espaciar el refresco mientras se toca (ver la pregunta de la publicidad diferida, pendiente 6). Es decisión del dueño, por ingresos.
- **`sin loaf`** en Android sería raro: Chrome tiene LoAF desde la 123.

## 4. Pendientes, por prioridad

| # | Qué | Cómo | Quién |
|---|---|---|---|
| 1 | **Seguridad:** borrar la copia de la clave de la cuenta de servicio que quedó en el servidor del despliegue automático, y apagar ese timer | Comando en las notas privadas (`truqito-operacion.md`, en la carpeta de la doc de la red) | Dueño (el auto mode lo bloquea) |
| 2 | **Seguridad:** CVE-2026-111497 (Brotli) | Plan en la carpeta de la doc de la red (pendiente #41) | Con OK del dueño |
| 3 | ~~Comparar CRA contra 2.0.x~~ | Hecho el 25/10, ver la sección 2 | — |
| 4 | **INP en Android: leer LoAF en GA4 desde el 29/10 ~22 h** | El problema es Android (46 % en verde; iPhone 97 %, sección 2). Con los datos limpios de la 2.0.6, abrir las visitas lentas de Android por `inp_script` (sección 3). Si es nuestro handler, perfilarlo. Si es la subasta, preparar el pedido a Moneytizer con esos números (decisión del dueño por ingresos) | Agente y dueño |
| 5 | **LCP +0,1 s en celulares lentos** | Confirmar con `lcp_render_delay` en GA4. Si se confirma: cargar el JS del router después del logo (prioridad baja o `import()` diferido) | Agente |
| 6 | **Publicidad diferida** (rama `release/2.0.1`, sobre la 2.0.0: carga los anuncios 2,5 s después del `load`) | **Sola no alcanza para el INP** (27/10): ~60 % de las visitas lentas de Android tienen su peor toque con la página ya cargada, cuando el anuncio rota y resubasta cada ~10 s durante toda la visita (~8 min). Diferir la primera carga solo ayuda a las que tocan durante la carga (~20 % de las lentas) y cuesta impresiones. Lo que movería el INP es **no subastar mientras se toca** (pausar el refresco unos segundos después de cada toque, o espaciarlo), y eso depende de lo que permita Moneytizer. Decidir con los datos del 29/10. Si se hace, hay que rehacerla sobre `master` | Dueño decide |
| 7 | **Search Console:** solicitar indexación de `/` y `/guia-truco` (el contenido cambió) | Solo desde la web: Inspeccionar URL → Solicitar indexación. No hay API para páginas comunes | Dueño |
| 8 | **CrUX History** (p75 semanal) | Sumar "Chrome UX Report API" a las restricciones de la clave en Google Cloud → Credenciales | Dueño |
| 9 | **Release `v2.0.6`** | `gh release create v2.0.6 --target master --title "Versión 2.0.6" --notes-file <(awk '/^## \[2.0.6\]/{f=1;next} /^## \[/{f=0} f' CHANGELOG.md)` (el auto mode lo bloquea) | Dueño |
| 10 | Limpieza | Borrar las ramas ya mergeadas (el auto mode lo bloquea): `R="docs/handoff docs/handoff-2.0.5 docs/handoff-2.0.6 feat/astro fix/inp-estilos fix/primer-dibujo fix/titulo-iframe-anuncio perf/inp-dibujo seo-tecnico"; git push origin --delete ${=R}; git branch -D ${=R}`. **No borrar `release/2.0.1`** (pendiente 6). En Vercel → Settings → General, cambiar Node.js de 20.x a 24.x (es solo para que no aparezca el aviso: `engines` ya fuerza 24.x) | Dueño |
| 11 | Siguientes mejoras de SEO | B1: guía como "Tabla de valores del truco" (CTR 0,24 % sobre 120 mil impresiones). A7: alto reservado del anuncio en la guía (CLS 0,25). Páginas nuevas: reglas, señas, truco uruguayo, `/pt`. CI con e2e | Agente |

## 5. Cómo desplegar (decisión del dueño: desde la notebook, no con a1)

1. Rama desde `origin/master` → commits con gitmoji → `npm test`, `npm run build`, `npm run test:contrato`.
2. Subir la versión (`npm version X.Y.Z --no-git-tag-version`), con su entrada en `CHANGELOG.md` y en Novedades.
3. PR → esperar el preview de Vercel en verde → `gh pr merge <n> --merge --match-head-commit <sha>`. Vercel publica `master` solo (la asignación automática del dominio está activa).
4. **Verificar en producción**, no solo en tests:
   - `curl -s https://truco.contelautaro.com.ar/ | grep -o 'versión 2.0.[0-9]'`
   - anuncio: un solo `div#sas_30012`, alto 90 px (escritorio) o 100 px (iPhone), y el iframe tiene que ser **el mismo nodo** después de navegar (ver lección 2)
   - menú: abrirlo y comprobar con `document.elementFromPoint` que el sidebar es lo que queda arriba, no solo que tenga la clase `open`
   - `node scripts/comparar-urls.mjs <deploy-anterior> https://truco.contelautaro.com.ar`. Ojo: si la base es un `*.vercel.app`, todas las URLs muestran `x-robots-tag: noindex` en la base; es ruido de Vercel
5. **Vuelta atrás:** `vercel promote <url-del-deploy-anterior>` (el auto mode lo bloquea: que lo corra el dueño con `!`) o revertir el PR.

## 6. Ver los datos en GA4 (web)

**Exploraciones → En blanco**:
- **Dimensiones:** Nombre del evento, Calificación web vital, Elemento web vital, Estado de carga, INP origen del script (desde la 2.0.5), **Sistema operativo** (el INP malo es casi todo Android), Ruta de la página, Fecha y hora.
- **Métricas:** Recuento de eventos y las métricas calculadas creadas el 24/10 (todas en ms):
  - "Web vital: valor promedio (ms)"
  - "INP: demora de entrada promedio (ms)"
  - "INP: procesamiento promedio (ms)"
  - "INP: presentación promedio (ms)"
  - "LCP: demora de dibujo promedio (ms)"
- **Filtro:** Nombre del evento = `INP` (o `LCP`). Las métricas calculadas dividen por la cantidad de eventos, así que sin el filtro el promedio mezcla todos los eventos del sitio.
- **Ejemplos:** filas = Elemento web vital, columnas = Calificación web vital, valores = Recuento de eventos (qué botones fallan). O filas = Estado de carga, valores = las 3 fases del INP.
- Los informes procesados tardan **24–48 h**. En Tiempo real los eventos aparecen enseguida, pero sin los parámetros.

## 7. Lecciones aprendidas

Para no repetir los errores de esta semana:

1. **PageSpeed/Lighthouse mide el primer dibujo en escalones de ~1 s** (~0,3, ~1,4 o ~2,4 s), porque su Chrome headless de servidor genera frames de a uno por segundo. Con 2 o 3 corridas no se pueden comparar versiones: el LCP salta de ~3 a ~5 o ~9 s por azar. Para comparar, usar `carga-cdp.mjs` (Chrome real, muchas corridas). Para ver el porqué, Lighthouse con trace en un servidor aparte (nunca en la notebook). La verdad son GA4 y CrUX.
2. **`transition:persist` no sirve para el anuncio.** Sin `moveBefore()` (Safari e iOS no lo tienen), Astro mueve el iframe y lo recarga, y su propia documentación lo advierte. Por eso el swap propio no mueve nunca el anuncio.
3. **`ClientRouter` re-ejecuta todo `<script>` sin `data-astro-exec`** después de cada swap, también los que agregan terceros en el `<body>`. Los de Moneytizer volvían a correr, pedían otro anuncio y dejaban un `div#sas_*` vacío. `navegacion.js` los marca antes del swap: no sacarlo.
4. **`view-transition-name` crea un contexto de apilamiento:** el menú, que está adentro del header, quedó tapado por el tablero. Comprobar visibilidad con `elementFromPoint`, no con clases.
5. **Con `ClientRouter`, los módulos y los stores sobreviven a la navegación.** Las islas nuevas tienen que hidratar con los valores del build (`useStoreTrasMontar`) y releer la partida (`partidaCargada.set(false)` en el swap). Hay un test que falla si no.
6. **Promover un preview a producción lo reconstruye con sus meta:** el deploy de prueba de `preview/og`, con `og:url` apuntando al preview, quedó en producción desde las 04:33 hasta la 2.0.1. Los commits "solo preview" no van en ramas que alguien pueda promover; mejor hacer un preview aparte.
7. **Las automatizaciones despliegan aunque nadie mire:** el timer de despliegue automático mergeó la 2.0.0 de madrugada y nadie revisó los anuncios antes. Los cambios que tocan la publicidad se verifican en producción con el anuncio real, navegando.
8. **"TRY OUR BANNER / AD UNITS" de Moneytizer no es un error:** es su anuncio de relleno cuando no hay anuncio pago para esa visita o esa IP. Con la VPN de casa (DNS en AdGuard) no se ve ningún anuncio. Para probar anuncios: celular con datos móviles, o desde un servidor fuera de casa.
9. **El INP de una visita es su peor toque de toda la sesión** (las sesiones duran ~8 min y el anuncio rota cada ~10 s). Una prueba de 12 toques no lo reproduce; hacen falta datos reales por fase (pendiente 4) o un trace de varios minutos.
10. **Rol no es scope:** "solo lectura" era el scope con el que se pedía el token, no el rol de la cuenta de servicio. Verificar el rol real (GA4 → Gestión de accesos) antes de decirle al dueño que algo no se puede.
11. **Un efecto chico puede ser real aunque el método sea ruidoso:** la 2.0.3 cayó 5 de 5 veces en el escalón alto de PSI. Era ruido amplificado de un +0,1 s real en el LCP. Cruzar siempre con un método preciso antes de decir "no cambió nada".
12. **Shell:** en zsh, `set -- $var` no separa palabras (usar arrays). `pkill -f '<patrón>'` mata también el propio comando si el patrón aparece en él (usar el PID).
13. **Medir desde casa:** AdGuard bloquea los anuncios. Para ver la página como un usuario real, usar datos móviles o un servidor fuera de casa.
14. **Event Timing: agrupar por interacción.** La versión vieja de `toques-cdp.mjs` tomaba la entrada más larga (`pointerup`), cuyo procesamiento termina antes del `click`: el trabajo de React aparecía como "presentación". web-vitals junta todas las entradas del toque; el script ahora también.
15. **CPU 4× esconde lo que pasa en celulares lentos:** con 4× el peor toque era ~200 ms y "nuestro código no es lo lento". Con 15× apareció el primer toque de ~800 ms. Medir el **máximo** con `CPU=15` y perfilar con `perfil-cdp.mjs` antes de culpar a terceros.
16. **`pgrep -f`/`pkill -f` con el patrón en la misma línea de comandos se encuentran a sí mismos.** Usar `pgrep -f '[a]stro preview'`, o guardar el PID al lanzar.
17. **GA4: el nombre visible de una dimensión no puede repetir el de una métrica** (409 "already exists").
18. **Para probar con publicidad desde casa:** `ssh -f -N -D 127.0.0.1:1088 -i ~/.ssh/oracle-free ubuntu@10.10.210.2` y `agent-browser --proxy socks5://127.0.0.1:1088 --args "--disable-site-isolation-trials"`. Con SOCKS5 el DNS también se resuelve en a1. Para cerrarlo, matar el PID del `ssh` (no `pkill -f`). **El 27/10 `agent-browser --proxy` dejó la pestaña en `about:blank`.** Lo que anduvo fue Chromium directo: `chromium-browser --headless=new --proxy-server=socks5://127.0.0.1:1088 --disable-site-isolation-trials --user-data-dir=<carpeta temporal> --remote-debugging-port=9333`, manejado por CDP como en `toques-cdp.mjs`.
19. **Validar en un navegador real lo que se manda a GA4, no solo lo que mide el laboratorio.** En la 2.0.5, `toques-cdp.mjs` calculaba el desglose del INP por su cuenta y los números daban bien, pero el `web-vitals` que corre en la página mandaba valores imposibles. Se perdieron dos días de datos. Antes de publicar un parámetro nuevo: reemplazar `window.gtag` en la página, provocar el caso real (toques por CDP encima de tareas largas que no dibujan) y comprobar que las partes sumen el valor total.
20. **Un evento de web vitals es una visita, no un toque.** El INP de cada visita es su peor toque; "1456 visitas" no son 1456 toques.
21. **Abrir siempre por sistema operativo antes de buscar la causa.** El 69 % total escondía 46 % en Android y 97 % en iPhone.

## 8. Accesos y herramientas

- **Credenciales:** en el gestor de contraseñas del dueño (con la sesión abierta, `BW_SESSION=$(cat ~/.config/bw-mcp/session)` y `bw get item` pasan la clave a la variable de entorno sin mostrarla) (cuenta de servicio de Google y clave de PageSpeed). Cómo pasarlas a los scripts: [`scripts/medicion/README.md`](../scripts/medicion/README.md). Los detalles operativos (servidores, cuenta de servicio, Telegram) están en las notas privadas `truqito-operacion.md`, fuera del repo.
- **MCP `ga4` y `gsc`:** fallan al conectar (`CONNECTION_CLOSED`). Mientras tanto, los scripts de `scripts/medicion/` hacen lo mismo con la cuenta de servicio.
- **Navegador:** `agent-browser`, una sola sesión con nombre propio. Recomendado instalar el MCP oficial `chrome-devtools-mcp` (`/plugin marketplace add ChromeDevTools/chrome-devtools-mcp` y `/plugin install chrome-devtools-mcp@chrome-devtools-plugins`, con `--no-usage-statistics --no-performance-crux`) para traces con análisis de DevTools.

## Documentos

| Documento | Qué tiene |
|---|---|
| `docs/HANDOFF.md` | Este: estado y cómo seguir |
| `docs/documentacion-truqito.html` | Documento A4 de 11 páginas: design system, análisis SEO, migración, mediciones y usuarios reales. Se exporta a PDF con `chromium-browser --headless --no-pdf-header-footer --print-to-pdf=...` |
| `docs/analisis-seo.md` | Análisis de Search Console, GA4 y velocidad del 23/10 (histórico) |
| `docs/plan-migracion-astro.md` | Plan y decisiones de la migración (histórico; la decisión de "páginas separadas" quedó reemplazada por la 2.0.1) |
| `docs/migracion-astro.md` | Brief original de la migración (histórico) |
| `docs/mediciones/` | JSON de PageSpeed: CRA y 2.0.3 |
| `scripts/medicion/README.md` | Cómo medir: laboratorio, Lighthouse en a1, GA4 y Search Console |
| `CHANGELOG.md` | Todas las versiones |
