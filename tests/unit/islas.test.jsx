// Islas que usan el store: tablero, menú y resultado
import React from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Board from "../../src/components/Board.jsx";
import Menu from "../../src/components/Menu.jsx";
import ResultPage from "../../src/components/ResultPage.jsx";
import { cargarPartida, maxPoints, teamNames } from "../../src/stores/partida.js";
import { reiniciarStore } from "./partida.test.js";

vi.mock("@vercel/analytics/react", () => ({ Analytics: () => null }));
// Las páginas se cambian con ClientRouter (sin recargar, el anuncio queda vivo)
const asignar = vi.hoisted(() => vi.fn());
vi.mock("astro:transitions/client", () => ({ navigate: asignar }));

beforeEach(() => {
  reiniciarStore();
  localStorage.setItem("tapHintSessions", "10");
  asignar.mockReset();
  vi.stubGlobal("location", { ...window.location, pathname: window.location.pathname });
  document.documentElement.className = "";
});

const puntosDe = (container, equipo) =>
  Number(container.querySelector(`.counter-body-${equipo} .counter-points h1`).textContent);

describe("Board", () => {
  it("en el build sale 0-0 con los nombres por defecto aunque haya una partida guardada", () => {
    localStorage.setItem("points-NOSOTROS", "7");
    localStorage.setItem("teamNames", JSON.stringify({ NOSOTROS: "PIBES", ELLOS: "TÍOS" }));
    const html = renderToString(<Board />);
    expect(html).toContain("NOSOTROS");
    expect(html).not.toContain("PIBES");
    expect(html).toContain('aria-label="Sumar punto a ELLOS"');
  });

  it("al montar restaura modo, nombres y puntos, y saca la marca de partida guardada", () => {
    document.documentElement.classList.add("partida-guardada");
    localStorage.setItem("maxPoints", "15");
    localStorage.setItem("teamNames", JSON.stringify({ NOSOTROS: "PIBES", ELLOS: "TÍOS" }));
    localStorage.setItem("points-NOSOTROS", "9");
    localStorage.setItem("stage-NOSOTROS", "a 15");
    localStorage.setItem("points-ELLOS", "4");
    localStorage.setItem("stage-ELLOS", "a 15");
    const { container } = render(<Board />);
    expect(puntosDe(container, "nos")).toBe(9);
    expect(puntosDe(container, "ellos")).toBe(4);
    expect(screen.getAllByText("a 15")).toHaveLength(2);
    expect(screen.getByText("PIBES")).toBeInTheDocument();
    expect(document.documentElement).not.toHaveClass("partida-guardada");
    expect(localStorage.getItem("points-NOSOTROS")).toBe("9");
  });

  it("al cambiar el modo desde el menú los dos contadores vuelven a 0", () => {
    localStorage.setItem("points-NOSOTROS", "5");
    const { container } = render(<Board />);
    expect(puntosDe(container, "nos")).toBe(5);
    act(() => maxPoints.set(15));
    expect(puntosDe(container, "nos")).toBe(0);
    expect(localStorage.getItem("points-NOSOTROS")).toBeNull();
  });

  it("al volver al tablero sin recargar hidrata igual que el build y después muestra la partida", () => {
    // HTML del build (store con valores por defecto)
    const contenedor = document.createElement("div");
    contenedor.innerHTML = renderToString(<Board />);
    // El store quedó cargado de la página anterior (ClientRouter no recarga los módulos)
    localStorage.setItem("points-NOSOTROS", "7");
    localStorage.setItem("teamNames", JSON.stringify({ NOSOTROS: "PIBES", ELLOS: "TÍOS" }));
    cargarPartida();
    document.body.appendChild(contenedor);
    const desajustes = vi.fn();
    const errores = vi.spyOn(console, "error").mockImplementation(() => {});
    act(() => hydrateRoot(contenedor, <Board />, { onRecoverableError: desajustes }));
    expect(desajustes).not.toHaveBeenCalled();
    expect(screen.getByText("PIBES")).toBeInTheDocument();
    expect(puntosDe(contenedor, "nos")).toBe(7);
    errores.mockRestore();
    contenedor.remove();
  });

  it("muestra los nombres nuevos al editarlos", () => {
    render(<Board />);
    act(() => teamNames.set({ NOSOTROS: "PIBES", ELLOS: "ELLOS" }));
    expect(screen.getByText("PIBES")).toBeInTheDocument();
  });

  it("al ganar va a la página de resultado y deja el tablero como está, sin aceptar más toques", () => {
    localStorage.setItem("maxPoints", "15");
    localStorage.setItem("points-ELLOS", "14");
    localStorage.setItem("stage-ELLOS", "a 15");
    vi.useFakeTimers();
    const { container } = render(<Board />);
    fireEvent.click(screen.getByRole("button", { name: "Sumar punto a ELLOS" }));
    // Primero se ve el último fósforo y se precarga el resultado; después se navega
    expect(puntosDe(container, "ellos")).toBe(15);
    expect(document.head.querySelector('link[rel="prefetch"][href="/resultado/ellos"]')).not.toBeNull();
    expect(asignar).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1400));
    expect(asignar).toHaveBeenCalledWith("/resultado/ellos");
    // Sin pantalla intermedia: siguen los dos tableros (antes se veía "GANARON ELLOS" cruzado por la línea)
    expect(container.querySelectorAll(".counter-points")).toHaveLength(2);
    expect(container.querySelector(".finished-message")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Sumar punto a NOSOTROS" }));
    expect(puntosDe(container, "nos")).toBe(0);
  });
});

describe("Menu", () => {
  it("se renderiza en el build con el botón, las opciones y sin los paneles", () => {
    const html = renderToString(<Menu />);
    expect(html).toContain('class="btn not-active"');
    expect(html).toContain("JUGAR A <!-- -->15");
    expect(html).toContain('href="/guia-truco"');
    expect(html).not.toContain("sheet-overlay");
    expect(html).not.toMatch(/supabase/i);
  });

  it("abre y cierra el menú, y deja ?menu=open en la URL mientras está abierto", () => {
    // Conserva el estado de ClientRouter (índice del historial) en la entrada nueva
    window.history.replaceState({ index: 3 }, "");
    const pushState = vi.spyOn(window.history, "pushState");
    const { container } = render(<Menu />);
    fireEvent.click(container.querySelector(".menu-container .btn"));
    expect(container.querySelector("#sidebar")).toHaveClass("open");
    expect(pushState).toHaveBeenLastCalledWith({ index: 3 }, "", `${window.location.pathname}?menu=open`);
    fireEvent.click(container.querySelector(".overlay"));
    expect(container.querySelector("#sidebar")).not.toHaveClass("open");
    expect(pushState).toHaveBeenLastCalledWith({ index: 3 }, "", window.location.pathname);
  });

  it("se cierra al llegar a otra página (el header no se recarga)", () => {
    const { container } = render(<Menu />);
    fireEvent.click(container.querySelector(".menu-container .btn"));
    expect(container.querySelector("#sidebar")).toHaveClass("open");
    act(() => document.dispatchEvent(new Event("astro:after-swap")));
    expect(container.querySelector("#sidebar")).not.toHaveClass("open");
  });

  it("'Jugar a 15' cambia el modo, cierra el menú y la etiqueta pasa a 'Jugar a 30'", () => {
    const { container } = render(<Menu />);
    fireEvent.click(container.querySelector(".menu-container .btn"));
    fireEvent.click(screen.getByText("JUGAR A 15"));
    expect(maxPoints.get()).toBe(15);
    expect(container.querySelector("#sidebar")).not.toHaveClass("open");
    expect(screen.getByText("JUGAR A 30")).toBeInTheDocument();
  });

  it("muestra el modo guardado después de montar", () => {
    localStorage.setItem("maxPoints", "15");
    render(<Menu />);
    expect(screen.getByText("JUGAR A 30")).toBeInTheDocument();
  });

  it.each([
    ["IR AL VAR", "VAR: revisión de la partida"],
    ["EDITAR NOMBRES", "Nombres de los equipos"],
    ["NOVEDADES", "Novedades"],
  ])("'%s' abre su panel", async (opcion, panel) => {
    render(<Menu />);
    fireEvent.click(screen.getByText(opcion));
    await waitFor(() => expect(screen.getByRole("dialog", { name: panel }).parentElement).toHaveClass("visible"));
  });

  it("guardar nombres desde el panel los guarda en el store", async () => {
    render(<Menu />);
    fireEvent.click(screen.getByText("EDITAR NOMBRES"));
    const campo = await screen.findByLabelText(/Tu equipo/);
    fireEvent.change(campo, { target: { value: "pibes" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(teamNames.get()).toEqual({ NOSOTROS: "PIBES", ELLOS: "ELLOS" });
  });
});

describe("ResultPage", () => {
  const enResultado = (ganador) => vi.stubGlobal("location", { ...window.location, pathname: `/resultado/${ganador}` });

  it("sin ganador por prop, en el build sale vacía (el ganador está en la URL)", () => {
    expect(renderToString(<ResultPage />)).toBe("");
  });

  it("con ganador por prop sale renderizada en el build con los nombres por defecto", () => {
    localStorage.setItem("teamNames", JSON.stringify({ NOSOTROS: "PIBES", ELLOS: "TÍOS" }));
    const html = renderToString(<ResultPage ganador="NOSOTROS" />);
    expect(html).toContain("¡GANAMOS NOSOTROS!");
    expect(html).toContain("/images/happy.webp");
    expect(html).toContain("¿A cuánto la revancha?");
  });

  it("con ganador por prop muestra los nombres guardados al montar y saca la marca", () => {
    document.documentElement.classList.add("nombres-guardados");
    localStorage.setItem("teamNames", JSON.stringify({ NOSOTROS: "PIBES", ELLOS: "TÍOS" }));
    render(<ResultPage ganador="ELLOS" />);
    expect(screen.getByText("¡TÍOS HA GANADO!")).toBeInTheDocument();
    expect(document.documentElement).not.toHaveClass("nombres-guardados");
  });

  it.each([
    ["nosotros", undefined, "¡GANAMOS NOSOTROS!"],
    ["ellos", undefined, "¡GANARON ELLOS!"],
    ["NOSOTROS", { NOSOTROS: "PIBES", ELLOS: "ELLOS" }, "¡PIBES HA GANADO!"],
  ])("muestra el mensaje según el ganador (%s) y los nombres", (ganador, nombres, mensaje) => {
    enResultado(ganador);
    if (nombres) localStorage.setItem("teamNames", JSON.stringify(nombres));
    render(<ResultPage />);
    expect(screen.getByText(mensaje)).toBeInTheDocument();
  });

  it("la revancha se habilita al elegir los puntos y vuelve al anotador con ese modo", () => {
    enResultado("nosotros");
    localStorage.setItem("points-NOSOTROS", "14");
    render(<ResultPage />);
    const comenzar = screen.getByRole("button", { name: /Comenzar Juego/ });
    expect(comenzar).toBeDisabled();
    fireEvent.click(screen.getByText("15"));
    fireEvent.click(comenzar);
    expect(maxPoints.get()).toBe(15);
    expect(localStorage.getItem("points-NOSOTROS")).toBeNull();
    expect(asignar).toHaveBeenCalledWith("/");
  });

  it("manda las sugerencias a /api/sendFeedback", async () => {
    enResultado("ellos");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve("ok") });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const { container } = render(<ResultPage />);
    fireEvent.change(container.querySelector(".feedback-section textarea"), { target: { value: "Muy bueno" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar sugerencias" }));
    expect(fetchMock).toHaveBeenCalledWith("/api/sendFeedback", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ feedback: "Muy bueno" }),
    }));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Feedback enviado correctamente 😁"));
  });

  it("sin texto avisa y no manda nada", () => {
    enResultado("ellos");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<ResultPage />);
    fireEvent.click(screen.getByRole("button", { name: "Enviar sugerencias" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith("Por favor, escribe un comentario antes de enviar.");
  });
});
