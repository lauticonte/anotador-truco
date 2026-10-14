import { useEffect } from 'react';

const SITE_URL = 'https://truco.contelautaro.com.ar';

// Busca un <meta>/<link> del head, o lo crea si no existe
const ensureTag = (selector, create) => {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
};

/**
 * Actualiza título, descripción, canonical y robots de la página, y al salir
 * restaura los valores anteriores (los de la home definidos en index.html).
 * @param {Object} params
 * @param {string} [params.title]
 * @param {string} [params.description]
 * @param {string} [params.path] - Ruta para el canonical (ej. "/guia-truco")
 * @param {string} [params.robots] - Ej. "noindex"
 */
export const usePageMeta = ({ title, description, path, robots }) => {
  useEffect(() => {
    const restore = [];
    const setAttr = (el, attr, value) => {
      const previous = el.getAttribute(attr);
      el.setAttribute(attr, value);
      restore.push(() => (previous === null ? el.removeAttribute(attr) : el.setAttribute(attr, previous)));
    };

    if (title) {
      const previousTitle = document.title;
      document.title = title;
      restore.push(() => (document.title = previousTitle));
    }

    if (description) {
      const meta = document.head.querySelector('meta[name="description"]');
      if (meta) setAttr(meta, 'content', description);
    }

    if (path) {
      const link = ensureTag('link[rel="canonical"]', () => {
        const el = document.createElement('link');
        el.setAttribute('rel', 'canonical');
        return el;
      });
      setAttr(link, 'href', `${SITE_URL}${path}`);
    }

    if (robots) {
      const hadTag = !!document.head.querySelector('meta[name="robots"]');
      const meta = ensureTag('meta[name="robots"]', () => {
        const el = document.createElement('meta');
        el.setAttribute('name', 'robots');
        return el;
      });
      setAttr(meta, 'content', robots);
      if (!hadTag) restore.push(() => meta.remove());
    }

    return () => restore.reverse().forEach((fn) => fn());
  }, [title, description, path, robots]);
};
