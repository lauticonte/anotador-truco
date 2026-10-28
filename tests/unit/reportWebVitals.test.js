// Web vitals: el desglose del INP que llega a GA4 tiene que ser una duración posible
import { afterEach, describe, expect, it, vi } from "vitest";

let alINP;
vi.mock("web-vitals/attribution", () => ({
  onCLS: () => {}, onFCP: () => {}, onLCP: () => {}, onTTFB: () => {},
  onINP: (cb) => { alINP = cb; },
}));
const { default: reportWebVitals, estilosYLayout } = await import("../../src/reportWebVitals.js");

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
