import React, { useEffect } from "react";

const AdComponent = ({ adId, type, siteId, formatId }) => {
  useEffect(() => {
    const loadAdScripts = () => {
      try {
        const scriptGen = document.createElement("script");
        scriptGen.src = `//ads.themoneytizer.com/s/gen.js?type=${type}`;
        scriptGen.async = true;
        scriptGen.onload = () => console.log(`Moneytizer script gen.js cargado (${adId})`);
        scriptGen.onerror = () => console.error(`Error al cargar gen.js (${adId})`);

        const scriptRequest = document.createElement("script");
        scriptRequest.src = `//ads.themoneytizer.com/s/requestform.js?siteId=${siteId}&formatId=${formatId}`;
        scriptRequest.async = true;
        scriptRequest.onload = () => console.log(`Moneytizer requestform.js cargado (${adId})`);
        scriptRequest.onerror = () => console.error(`Error al cargar requestform.js (${adId})`);

        const adContainer = document.getElementById(adId);
        if (adContainer) {
          adContainer.appendChild(scriptGen);
          adContainer.appendChild(scriptRequest);
        } else {
          console.error(`Contenedor del anuncio no encontrado: ${adId}`);
        }
      } catch (error) {
        console.error("Error cargando los anuncios:", error);
      }
    };

    loadAdScripts();
  }, [adId, type, siteId, formatId]);

  return <div id={adId} className="ad-container"></div>;
};

export default AdComponent;
