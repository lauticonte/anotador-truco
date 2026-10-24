// Navegación entre páginas sin recargar el anuncio.
// ClientRouter trae cada página nueva por fetch y, en lugar de cambiar todo el <body>, este swap cambia solo
// el <main> (y el <head>). Header, anuncio y footer son siempre los mismos nodos: el iframe de Moneytizer nunca
// se saca del DOM, así que no se recarga ni vuelve a subastar, en ningún navegador. (transition:persist no sirve:
// sin moveBefore(), que Safari no tiene, mueve el iframe y lo recarga.)
import { swapFunctions } from "astro:transitions/client";
import { activarPestanas } from "./pestanas.js";
import { partidaCargada } from "../stores/partida.js";

const { deselectScripts, swapRootAttributes, swapHeadElements, swapBodyElement, saveFocus } = swapFunctions;

document.addEventListener("astro:before-swap", (evento) => {
  // Los stores sobreviven a la navegación: la página nueva vuelve a leer la partida de localStorage,
  // como cuando se recargaba (por ejemplo, si se cambió en otra pestaña)
  partidaCargada.set(false);
  evento.swap = () => {
    const doc = evento.newDocument;
    const app = document.querySelector("#root > .app");
    const appNueva = doc.querySelector("#root > .app");
    const main = app?.querySelector(":scope > main");
    const mainNuevo = appNueva?.querySelector(":scope > main");
    deselectScripts(doc);
    swapRootAttributes(doc);
    swapHeadElements(doc);
    if (!main || !mainNuevo) {
      // Una página sin este layout: swap normal
      const restaurarFoco = saveFocus();
      swapBodyElement(doc.body, document.body);
      restaurarFoco();
      return;
    }
    app.className = appNueva.className;
    main.replaceWith(mainNuevo);
  };
});

// Lo que antes corría una vez por carga de página ahora corre en cada navegación
document.addEventListener("astro:page-load", () => {
  activarPestanas(document.querySelector(".guia"));
});
