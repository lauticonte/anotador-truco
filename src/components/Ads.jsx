import React, { useEffect } from "react";

// Publicidad diferida (v2.0.1): los scripts de Moneytizer se cargan 2,5 s después del evento load, así la
// subasta no compite con el primer dibujo ni con los primeros toques. El disparador es solo el tiempo:
// cargarla con el primer toque empeoraría justo esa interacción (INP).
export const AD_DELAY_MS = 2500;

const AdComponent = ({ adId, type, siteId, formatId }) => {
  useEffect(() => {
    const loadAdScripts = async () => {
      const adContainer = document.getElementById(adId);

      if (!adContainer) {
        console.warn(`El contenedor del anuncio con ID "${adId}" no fue encontrado en el DOM. Asegúrate de que el elemento existe antes de cargar los anuncios.`);
        return; // Detener si el contenedor no existe
      }

      try {
        console.time(`Carga completa de anuncios (${adId})`);

        // Función para cargar scripts de forma segura
        const loadScript = (src, label) => {
          return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.async = true;

            script.onload = () => {
              console.log(`Script ${label} cargado (${adId})`);
              resolve();
            };

            script.onerror = (error) => {
              console.error(`Error al cargar el script ${label} (${adId}):`, error);
              reject(error);
            };

            adContainer.appendChild(script);
          });
        };

        // Carga los scripts en paralelo
        await Promise.all([
          loadScript(`//ads.themoneytizer.com/s/gen.js?type=${type}`, "gen.js"),
          loadScript(
            `//ads.themoneytizer.com/s/requestform.js?siteId=${siteId}&formatId=${formatId}`,
            "requestform.js"
          ),
        ]);

        console.timeEnd(`Carga completa de anuncios (${adId})`); // Finaliza el temporizador
      } catch (error) {
        console.error(`Error cargando los anuncios (${adId}):`, error);
      }
    };

    let timeout;
    const scheduleAds = () => {
      timeout = setTimeout(loadAdScripts, AD_DELAY_MS);
    };
    if (document.readyState === "complete") scheduleAds();
    else window.addEventListener("load", scheduleAds, { once: true });

    return () => {
      clearTimeout(timeout); // Limpiar el temporizador si el componente se desmonta
      window.removeEventListener("load", scheduleAds);
    };
  }, [adId, type, siteId, formatId]);

  return <div id={adId} className="ad-container"></div>;
};

export default AdComponent;
