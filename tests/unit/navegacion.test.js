// Navegación con ClientRouter: entre páginas cambia solo el <main>; header, anuncio y footer son los mismos nodos
import { beforeEach, describe, expect, it, vi } from "vitest";

const swapFunctions = vi.hoisted(() => ({
  deselectScripts: vi.fn(),
  swapRootAttributes: vi.fn(),
  swapHeadElements: vi.fn(),
  swapBodyElement: vi.fn(),
  saveFocus: vi.fn(() => () => {}),
}));
vi.mock("astro:transitions/client", () => ({ swapFunctions }));

await import("../../src/scripts/navegacion.js");

const pagina = (claseApp, contenido) => `
  <header id="app-header"><img class="logo"></header>
  <div id="root">
    <div class="${claseApp}">
      <main>${contenido}</main>
      <div class="ad-slot" id="ad-slot"><div id="127560-28" class="ad-container"><iframe></iframe></div></div>
      <div class="footer"></div>
    </div>
  </div>`;

const navegarA = (html) => {
  const newDocument = new DOMParser().parseFromString(`<!doctype html><html><head></head><body>${html}</body></html>`, "text/html");
  const evento = new Event("astro:before-swap");
  Object.assign(evento, { newDocument, swap: () => {} });
  document.dispatchEvent(evento);
  evento.swap();
};

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = pagina("app", '<div class="board">tablero</div>');
});

describe("swap de ClientRouter", () => {
  it("cambia el <main> y deja el mismo anuncio, header y footer", () => {
    const anuncio = document.getElementById("ad-slot");
    const iframe = anuncio.querySelector("iframe");
    const header = document.getElementById("app-header");
    const footer = document.querySelector(".footer");

    navegarA(pagina("app app-content-under-ad", '<div class="guia">guía</div>'));

    expect(document.querySelector("main").textContent).toBe("guía");
    expect(document.getElementById("ad-slot")).toBe(anuncio);
    expect(document.querySelector("iframe")).toBe(iframe);
    expect(document.getElementById("app-header")).toBe(header);
    expect(document.querySelector(".footer")).toBe(footer);
    expect(document.querySelector("#root > .app")).toHaveClass("app-content-under-ad");
    expect(swapFunctions.swapHeadElements).toHaveBeenCalled();
    expect(swapFunctions.swapBodyElement).not.toHaveBeenCalled();
  });

  it("los scripts del anuncio quedan marcados como ejecutados (ClientRouter no los vuelve a correr)", () => {
    // Como hacen Ads.jsx y Moneytizer: scripts agregados en el navegador, sin data-astro-exec
    const contenedor = document.getElementById("127560-28");
    const gen = document.createElement("script");
    gen.src = "//ads.themoneytizer.com/s/gen.js?type=28";
    contenedor.appendChild(gen);
    navegarA(pagina("app", "guía"));
    expect(document.getElementById("127560-28").querySelector("script")).toBe(gen);
    expect(gen.dataset.astroExec).toBe("");
  });

  it("vuelve a la página anterior con el mismo anuncio", () => {
    const iframe = document.querySelector("iframe");
    navegarA(pagina("app app-content-under-ad", "guía"));
    navegarA(pagina("app", "tablero"));
    expect(document.querySelector("iframe")).toBe(iframe);
    expect(document.querySelector("#root > .app").className).toBe("app");
  });

  it("si la página nueva no tiene este layout, cambia el body entero", () => {
    navegarA("<p>otra cosa</p>");
    expect(swapFunctions.swapBodyElement).toHaveBeenCalled();
  });
});

describe("pestañas de la guía", () => {
  it("se activan en cada llegada a la guía", () => {
    document.body.innerHTML = `
      <div class="guia">
        <button role="tab" aria-controls="panel-a" aria-selected="true"></button>
        <button role="tab" aria-controls="panel-b" aria-selected="false"></button>
        <section id="panel-a"></section><section id="panel-b" hidden></section>
      </div>`;
    document.dispatchEvent(new Event("astro:page-load"));
    document.querySelectorAll('[role="tab"]')[1].click();
    expect(document.getElementById("panel-b").hidden).toBe(false);
    expect(document.getElementById("panel-a").hidden).toBe(true);
  });
});

describe("partida entre páginas", () => {
  it("la página nueva vuelve a leer la partida guardada", async () => {
    const { partidaCargada, cargarPartida, teamNames } = await import("../../src/stores/partida.js");
    cargarPartida();
    localStorage.setItem("teamNames", JSON.stringify({ NOSOTROS: "PIBES", ELLOS: "TÍOS" }));
    navegarA(pagina("app", "tablero"));
    expect(partidaCargada.get()).toBe(false);
    cargarPartida();
    expect(teamNames.get()).toEqual({ NOSOTROS: "PIBES", ELLOS: "TÍOS" });
  });
});
