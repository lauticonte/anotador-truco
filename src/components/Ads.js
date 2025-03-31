import React, { useEffect } from "react";

const AdComponent = ({ adId, type, siteId, formatId }) => {
  useEffect(() => {
    const loadAdScripts = async () => {
      const adContainer = document.getElementById(adId);

      if (!adContainer) {
        console.warn(`El contenedor del anuncio con ID "${adId}" no fue encontrado en el DOM. Asegúrate de que el elemento existe antes de cargar los anuncios.`);
        return; // Detener si el contenedor no existe
      }

      try {
        // Finaliza cualquier temporizador previo
        console.timeEnd(`Carga completa de anuncios (${adId})`);
        console.time(`Carga completa de anuncios (${adId})`); // Reinicia el temporizador

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

    // Retrasar la carga para garantizar que el DOM esté listo
    const timeout = setTimeout(() => {
      loadAdScripts();
    }, 100); // Retraso breve para sincronizar con el renderizado

    return () => {
      clearTimeout(timeout); // Limpiar el temporizador si el componente se desmonta
    };
  }, [adId, type, siteId, formatId]);

  return <div id={adId} className="ad-container"></div>;
};

export default AdComponent;
