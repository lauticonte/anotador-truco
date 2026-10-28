// Web vitals: el desglose del INP que llega a GA4 tiene que ser una duración posible
import { afterEach, describe, expect, it, vi } from "vitest";

let alINP;
vi.mock("web-vitals/attribution", () => ({
  onCLS: () => {}, onFCP: () => {}, onLCP: () => {}, onTTFB: () => {},
  onINP: (cb) => { alINP = cb; },
}));
const { default: reportWebVitals, estilosYLayout, franja } = await import("../../src/reportWebVitals.js");
const { version } = await import("../../package.json");

// Toque a los 180 s de la visita: un frame largo de una subasta que no dibuja (styleAndLayoutStart = 0)
// y el frame del toque, que sí dibuja
const sinDibujo = { startTime: 180_000, duration: 120, styleAndLayoutStart: 0, scripts: [] };
const delToque = {
  startTime: 180_130, duration: 90, styleAndLayoutStart: 180_200,
  scripts: [{ startTime: 180_140, duration: 40, forcedStyleAndLayoutDuration: 10 }],
};
const attribution = {
  interactionTarget: "button.counter-button", inputDelay: 10, processingDuration: 40, presentationDelay: 190,
  interactionTime: 180_130, nextPaintTime: 180_370, loadState: "complete",
  longAnimationFrameEntries: [sinDibujo, delToque], longestScript: undefined,
  totalScriptDuration: 30, totalPaintDuration: 150,
  // Lo que calcula web-vitals 6.2.3 con estos frames
  totalStyleAndLayoutDuration: 180_000 + 120 + 20 + 10,
};

afterEach(() => { delete window.gtag; });

describe("estilosYLayout", () => {
  it("no suma los frames que no dibujan", () => {
    // 20 ms de estilos del frame del toque + 10 ms de layout forzado del script
    expect(estilosYLayout(attribution)).toBe(30);
  });

  it("reparte el layout forzado solo por la parte del script después del toque", () => {
    const frame = { ...delToque, scripts: [{ startTime: 180_110, duration: 40, forcedStyleAndLayoutDuration: 20 }] };
    expect(estilosYLayout({ longAnimationFrameEntries: [frame], interactionTime: 180_130 })).toBe(20 + 10);
  });
});

describe("evento INP", () => {
  it("manda estilos y tiempo sin atribuir dentro de la duración del toque", () => {
    window.gtag = vi.fn();
    reportWebVitals();
    alINP({ name: "INP", value: 240, delta: 240, id: "v5-1", rating: "needs-improvement", navigationType: "navigate", attribution });
    const params = window.gtag.mock.calls[0][2];
    expect(params.inp_style_layout).toBe(30);
    expect(params.inp_paint).toBe(150);
    expect(params.inp_unattributed).toBe(240 - 30 - 30 - 150);
    expect(params.inp_script).toBe("sin script largo");
  });

  it("un toque rápido en un navegador con LoAF no se confunde con uno sin LoAF", () => {
    window.gtag = vi.fn();
    const antes = PerformanceObserver.supportedEntryTypes;
    Object.defineProperty(PerformanceObserver, "supportedEntryTypes", { value: ["event", "long-animation-frame"], configurable: true });
    reportWebVitals();
    alINP({ name: "INP", value: 40, delta: 40, id: "v5-5", rating: "good", navigationType: "navigate",
      attribution: { ...attribution, longAnimationFrameEntries: [] } });
    expect(window.gtag.mock.calls[0][2].inp_script).toBe("sin frames largos");
    Object.defineProperty(PerformanceObserver, "supportedEntryTypes", { value: antes, configurable: true });
  });

  it("separa los navegadores sin Long Animation Frames", () => {
    window.gtag = vi.fn();
    reportWebVitals();
    alINP({ name: "INP", value: 240, delta: 240, id: "v5-2", rating: "poor", navigationType: "navigate",
      attribution: { ...attribution, longAnimationFrameEntries: [] } });
    const params = window.gtag.mock.calls[0][2];
    expect(params.inp_script).toBe("sin loaf");
    expect(params.inp_style_layout).toBeUndefined();
  });
});

describe("parámetros para segmentar", () => {
  it("franja: los límites caen del lado de la franja siguiente", () => {
    expect([0, 5999, 6000, 59999, 60000, 299999, 300000, 3_600_000].map(franja))
      .toEqual(["0-6 s", "0-6 s", "6-60 s", "6-60 s", "1-5 min", "1-5 min", "5+ min", "5+ min"]);
  });

  it("el INP manda versión, hardware, experimento y el momento del toque", () => {
    window.gtag = vi.fn();
    Object.defineProperty(navigator, "deviceMemory", { value: 2, configurable: true });
    Object.defineProperty(navigator, "hardwareConcurrency", { value: 8, configurable: true });
    reportWebVitals();
    alINP({ name: "INP", value: 240, delta: 240, id: "v5-3", rating: "needs-improvement", navigationType: "navigate", attribution });
    const params = window.gtag.mock.calls[0][2];
    expect(params).toMatchObject({ app_version: version, experimento: "ninguno", ram_gb: "2", nucleos: "8", inp_franja: "1-5 min", inp_desde_carga: 180_130 });
    delete navigator.deviceMemory;
  });

  it("sin deviceMemory (Safari, Firefox) dice 'sin dato', no queda vacío", () => {
    window.gtag = vi.fn();
    Object.defineProperty(navigator, "deviceMemory", { value: undefined, configurable: true });
    reportWebVitals();
    alINP({ name: "INP", value: 240, delta: 240, id: "v5-4", rating: "good", navigationType: "navigate", attribution });
    expect(window.gtag.mock.calls[0][2].ram_gb).toBe("sin dato");
  });
});
