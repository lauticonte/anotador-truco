# Scripts de medición

Herramientas para medir Truqito sin adivinar. Antes de usarlas, leé las lecciones de [`docs/HANDOFF.md`](../../docs/HANDOFF.md#lecciones-aprendidas): **PageSpeed no sirve para comparar versiones con pocas corridas.**

Todo corre con Node 24 sin dependencias extra (`fetch`, `WebSocket` y `node:crypto` nativos), salvo `analizar-trace.py` (Python 3, sin dependencias).

## Credenciales

Están en el gestor de contraseñas del dueño (cuenta de servicio de Google con acceso a GA4 y Search Console, y clave de la API de PageSpeed). Se pasan **por variable de entorno**, nunca en el texto del comando ni en archivos:

```bash
export GA4_SA_JSON='<json de la cuenta de servicio>'   # leído del gestor, por ejemplo con `bw get item ... | jq`
export PSI_KEY='<clave de PageSpeed>'
```

Cada script pide el token con el permiso mínimo que necesita (`analytics.readonly`, `analytics.edit` o `webmasters.readonly`). Propiedad GA4: `451539738`. Los detalles operativos (qué ítem, qué rol tiene la cuenta) están en las notas privadas del dueño, fuera del repo.

## Laboratorio: Chrome real manejado por DevTools (CDP)

Usan un solo Chromium, el de `agent-browser`. No corras Lighthouse en la notebook (ya la trabó una vez).

```bash
export AGENT_BROWSER_SESSION="$(agent-browser session id --scope worktree --prefix medir)"
agent-browser open about:blank
WS=$(agent-browser get cdp-url | tail -1)
```

| Script | Qué hace |
|---|---|
| `carga-cdp.mjs "$WS" 5 cra=<url> nueva=<url>` | FCP, LCP, DCL y `load` con CPU 4× y 4G lento (los valores de Lighthouse mobile). Mediana de N cargas por URL, cada una con 30 s de límite. **Es la forma confiable de comparar dos versiones.** |
| `[CPU=15] [PAUSA=250] toques-cdp.mjs "$WS" <url> sin\|con [toques]` | Toques reales (eventos de mouse de CDP) en + y −, leídos con Event Timing y agrupados por interacción como web-vitals: duración y fases (entrada, procesamiento, presentación), más el desglose de los frames largos (LoAF) por script e invocador. `sin` bloquea publicidad, CMP y analítica para medir solo el código propio. `CPU=15` se parece a un celular de gama baja; mirar el **máximo** (el INP es el peor toque). |
| `perfil-cdp.mjs "$WS" <url> [toques]` | Perfil de CPU de los toques en +: tiempo propio por función. Así se encontró `toLocaleTimeString` en la 2.0.5. |

## Lighthouse con trace (en un servidor aparte, nunca en la notebook)

La misma versión que PageSpeed (ver `lighthouseVersion` en su JSON), en un contenedor temporal y limitado. El host concreto está en las notas privadas:

```bash
sudo mkdir -p /tmp/lh && sudo podman run --rm --cpus 2 --memory 3g --shm-size 1g -v /tmp/lh:/out:Z docker.io/library/node:24-alpine sh -c "apk add --no-cache chromium >/dev/null && npm i -g lighthouse@13.5.0 >/dev/null && lighthouse <url> --only-categories=performance --output=json --output-path=/out/r.json --save-assets --chrome-flags=\"--headless=new --no-sandbox --disable-dev-shm-usage\" --quiet"
# traer /tmp/lh/r-0.trace.json, analizarlo y borrar /tmp/lh
python3 -I scripts/medicion/analizar-trace.py r-0.trace.json
```

`analizar-trace.py` muestra qué hizo el hilo principal antes del primer dibujo: tareas largas, scripts, frames y commits.

## Usuarios reales

| Script | Qué hace |
|---|---|
| `ga4-eventos.mjs 451539738` | Cuántos eventos de web vitals llegan por día y en tiempo real, y qué parámetros están registrados |
| `ga4-promedios.mjs 451539738` | Promedio real por métrica, día y página (con `eventValue`, el `value` que manda cada evento) |
| `ga4-calificaciones.mjs 451539738` | % de visitas bueno/mejorable/malo por métrica, separando antes y después de `CORTE` (`CORTE=AAAAMMDDHH`) |
| `ga4-inp.mjs 451539738` | INP por elemento tocado (`debug_target`) y por versión |
| `ga4-definiciones.mjs 451539738 [--crear]` | Lista o crea las métricas y dimensiones personalizadas de web vitals |
| `ga4-calculadas.mjs 451539738` | Crea las métricas calculadas de promedio para ver en Exploraciones (idempotente) |
| `gsc-posicion.mjs` | Posición, CTR, clics e impresiones diarias de "anotador de truco" en Search Console |

PageSpeed: `scripts/psi.mjs` (en la carpeta de arriba), con `PSI_KEY`.
