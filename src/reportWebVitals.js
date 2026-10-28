import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals/attribution";

// Manda las Core Web Vitals de cada visita a GA4 como eventos (LCP, INP, CLS, FCP, TTFB),
// con la calificación y el elemento responsable para saber qué arreglar.
// Receta de Google: https://github.com/GoogleChrome/web-vitals#send-the-results-to-google-analytics

// Estilos y layout del toque, como totalStyleAndLayoutDuration de web-vitals 6.2.3 pero sin su error:
// un frame que no llega a dibujar tiene styleAndLayoutStart = 0 y la librería sumaba su hora de fin
// (cientos de miles de ms en GA4). El layout forzado por los scripts se reparte igual que en la librería.
export const estilosYLayout = ({ longAnimationFrameEntries = [], interactionTime }) => {
  let total = 0;
  for (const frame of longAnimationFrameEntries) {
    if (frame.styleAndLayoutStart > 0) total += frame.startTime + frame.duration - frame.styleAndLayoutStart;
    for (const script of frame.scripts) {
      const fin = script.startTime + script.duration;
      if (fin < interactionTime || !script.duration) continue;
      total += ((fin - Math.max(interactionTime, script.startTime)) / script.duration) * script.forcedStyleAndLayoutDuration;
    }
  }
  return total;
};

const send =({ name, value, delta, id, rating, navigationType, attribution = {} }) => {
  if (typeof window.gtag !== "function") return;

  const params = {
    // GA4 suma "value": CLS se multiplica por 1000 para no perder decimales
    value: Math.round(name === "CLS" ? delta * 1000 : delta),
    metric_id: id,
    metric_value: name === "CLS" ? Number(value.toFixed(4)) : Math.round(value),
    metric_rating: rating,
    navigation_type: navigationType,
    non_interaction: true,
  };

  if (name === "LCP") {
    params.debug_target = attribution.target;
    params.lcp_render_delay = Math.round(attribution.elementRenderDelay || 0);
  } else if (name === "INP") {
    params.debug_target = attribution.interactionTarget;
    params.inp_input_delay = Math.round(attribution.inputDelay || 0);
    params.inp_processing = Math.round(attribution.processingDuration || 0);
    params.inp_presentation = Math.round(attribution.presentationDelay || 0);
    params.load_state = attribution.loadState;
    // Long Animation Frames (solo Chrome): qué script alargó el toque y en qué se fue el resto del frame,
    // para separar el dibujo propio de la publicidad
    const script = attribution.longestScript;
    if (script) {
      const { sourceURL, invokerType } = script.entry;
      let origen = "sin url";
      try {
        const host = new URL(sourceURL).hostname;
        origen = host === location.hostname ? "propio" : host;
      } catch (_) {}
      params.inp_script = `${script.subpart}: ${origen} (${invokerType})`;
      params.inp_script_ms = Math.round(script.intersectingDuration);
    } else {
      // Sin esto GA4 mezcla "no hubo script largo" con "el navegador no tiene LoAF" en (not set)
      params.inp_script = attribution.longAnimationFrameEntries?.length ? "sin script largo" : "sin loaf";
    }
    if (attribution.longAnimationFrameEntries?.length) {
      const estilos = estilosYLayout(attribution);
      params.inp_style_layout = Math.round(estilos);
      params.inp_paint = Math.round(attribution.totalPaintDuration || 0);
      params.inp_unattributed = Math.round(
        attribution.nextPaintTime - attribution.interactionTime -
        (attribution.totalScriptDuration || 0) - estilos - (attribution.totalPaintDuration || 0)
      );
    }
  } else if (name === "CLS") {
    params.debug_target = attribution.largestShiftTarget;
    params.load_state = attribution.loadState;
  }

  // GA4 corta los parámetros de texto a 100 caracteres
  if (params.debug_target) params.debug_target = String(params.debug_target).slice(0, 100);

  window.gtag("event", name, params);
};

const reportWebVitals = () => {
  // web-vitals usa funciones de Chrome 92–97 (at, findLast) que el target del build no agrega: en Chrome 81 y
  // Samsung Internet viejo cada métrica tiraba un TypeError. Esos navegadores tampoco reportan INP (sin
  // interactionId) y son ~0,2 % de las visitas: no se miden
  if (!Array.prototype.findLast) return;
  onCLS(send);
  onFCP(send);
  onINP(send);
  onLCP(send);
  onTTFB(send);
};

export default reportWebVitals;
