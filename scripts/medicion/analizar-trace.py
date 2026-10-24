# Qué hizo el navegador entre el inicio de la navegación y el primer dibujo, según el trace de Lighthouse.
# Uso: python3 -I scripts/medicion/analizar-trace.py <archivo.trace.json> [<archivo.trace.json> ...]
import json
import sys
from collections import Counter


def cargar(ruta):
    datos = json.load(open(ruta))
    return datos["traceEvents"] if isinstance(datos, dict) else datos


def analizar(ruta):
    ev = cargar(ruta)
    # Hilo principal del renderer de la página: el que tiene navigationStart del frame principal
    nav = next(e for e in ev if e.get("name") == "navigationStart" and e.get("args", {}).get("data", {}).get("isLoadingMainFrame"))
    pid, tid, t0 = nav["pid"], nav["tid"], nav["ts"]
    ms = lambda e: (e["ts"] - t0) / 1000

    def marca(nombre):
        c = [e for e in ev if e.get("name") == nombre and e["pid"] == pid and e["ts"] >= t0]
        return round(ms(c[0])) if c else None

    fp = marca("firstPaint")
    fcp = marca("firstContentfulPaint")
    carga = marca("loadEventEnd")
    dcl = marca("domContentLoadedEventEnd")
    print(f"\n=== {ruta.split('/')[-1]}\n  DCL {dcl} · load {carga} · firstPaint {fp} · FCP {fcp}")
    if fp is None:
        return
    fin = t0 + fp * 1000
    hilo = [e for e in ev if e["pid"] == pid and e["tid"] == tid and t0 <= e["ts"] <= fin]
    # Tareas del hilo principal antes del primer dibujo
    tareas = [e for e in hilo if e.get("name") in ("RunTask", "ThreadControllerImpl::RunTask") and e.get("dur", 0) > 0]
    ocupado = sum(e["dur"] for e in tareas) / 1000
    print(f"  hilo principal ocupado antes del primer dibujo: {round(ocupado)} ms en {len(tareas)} tareas")
    for e in sorted(tareas, key=lambda x: -x["dur"])[:6]:
        dentro = [x for x in hilo if e["ts"] <= x["ts"] <= e["ts"] + e["dur"] and x.get("dur", 0) > e["dur"] * 0.3 and x is not e]
        print(f"   tarea @{round(ms(e))} ms, {round(e['dur'] / 1000)} ms: " + ", ".join(sorted({x['name'] for x in dentro}))[:160])
    # Eventos con nombre del hilo, agrupados (sin los de bajo nivel)
    nombres = Counter(e.get("name") for e in hilo if e.get("ph") in ("X", "B", "I", "i", "R", "n"))
    print("  eventos más frecuentes antes del primer dibujo:", ", ".join(f"{n}×{c}" for n, c in nombres.most_common(14)))
    # Pistas de render retenido: frames que no se dibujan, holding, transiciones, timers, rAF
    pistas = [e for e in ev if e["pid"] == pid and t0 <= e["ts"] <= fin and any(p in e.get("name", "") for p in (
        "Paint", "Commit", "BeginMainThreadFrame", "Holding", "Deferr", "Defer", "ViewTransition", "RenderBlocking",
        "TimerFire", "FireAnimationFrame", "ScheduleStyleRecalculation", "Layout", "HitTest", "ParseHTML", "EvaluateScript", "v8.compile"))]
    lineas = Counter((e["name"]) for e in pistas)
    print("  pistas:", ", ".join(f"{n}×{c}" for n, c in sorted(lineas.items())))
    primeros = sorted({round(ms(e)) for e in pistas if e["name"] in ("BeginMainThreadFrame", "FireAnimationFrame", "Commit", "Paint")})
    print("  frames/commits/paints (ms):", primeros[:25])
    # Scripts evaluados antes del primer dibujo, con su duración
    scripts = [e for e in hilo if e.get("name") in ("EvaluateScript", "v8.evaluateModule", "FunctionCall") and e.get("dur", 0) > 2000]
    for e in scripts[:15]:
        d = e.get("args", {}).get("data", {})
        print(f"   script @{round(ms(e))} {round(e['dur'] / 1000)} ms {d.get('url', d.get('functionName', ''))[:100]}")


for ruta in sys.argv[1:]:
    analizar(ruta)
