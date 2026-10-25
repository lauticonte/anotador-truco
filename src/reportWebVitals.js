import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals/attribution";

// Manda las Core Web Vitals de cada visita a GA4 como eventos (LCP, INP, CLS, FCP, TTFB),
// con la calificación y el elemento responsable para saber qué arreglar.
// Receta de Google: https://github.com/GoogleChrome/web-vitals#send-the-results-to-google-analytics
const send = ({ name, value, delta, id, rating, navigationType, attribution = {} }) => {
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
    }
    if (attribution.longAnimationFrameEntries?.length) {
      params.inp_style_layout = Math.round(attribution.totalStyleAndLayoutDuration || 0);
      params.inp_paint = Math.round(attribution.totalPaintDuration || 0);
      params.inp_unattributed = Math.round(attribution.totalUnattributedDuration || 0);
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
  onCLS(send);
  onFCP(send);
  onINP(send);
  onLCP(send);
  onTTFB(send);
};

export default reportWebVitals;
