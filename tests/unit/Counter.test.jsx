// Tests de caracterización del contador: fijan cómo se comporta hoy para que la migración no lo cambie.
import React from "react";
import { renderToString } from "react-dom/server";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Counter from "../../src/components/Counter.jsx";

// Las sesiones del aviso "Tocá para sumar" ya cumplidas, salvo que el test diga lo contrario
const sinAviso = () => localStorage.setItem("tapHintSessions", "10");

const renderContador = (props = {}) => {
  const onWin = vi.fn();
  const utils = render(
    <Counter title="NOSOTROS" displayName="NOSOTROS" maxPoints={30} cargada onWin={onWin} {...props} />
  );
  return { ...utils, onWin };
};

const tablero = () => screen.getByRole("button", { name: /Sumar punto a/ });
const puntos = (container) => Number(container.querySelector(".counter-points h1").textContent);
const etapa = (container) => container.querySelector(".stage-indicator h3").textContent;
// Cada fósforo se dibuja en dos capas (palito y cabeza)
const fosforos = (container) => container.querySelectorAll("svg.svg-canvas > g > use.match-place").length / 2;
const tocar = (veces) => {
  for (let i = 0; i < veces; i++) fireEvent.click(tablero());
};

describe("Counter: sumar y restar", () => {
  it("arranca en 0, en malas, sin fósforos", () => {
    sinAviso();
    const { container } = renderContador();
    expect(puntos(container)).toBe(0);
    expect(etapa(container)).toBe("Malas");
    expect(fosforos(container)).toBe(0);
  });

  it("suma tocando el tablero y con el botón +, y dibuja un fósforo por punto", () => {
    sinAviso();
    const { container } = renderContador();
    tocar(2);
    fireEvent.click(screen.getByRole("button", { name: "Suma" }));
    expect(puntos(container)).toBe(3);
    expect(fosforos(container)).toBe(3);
  });

  it("resta con el botón − y no baja de 0", () => {
    sinAviso();
    const { container } = renderContador();
    tocar(1);
    const resta = screen.getByRole("button", { name: "Resta" });
    fireEvent.click(resta);
    fireEvent.click(resta);
    expect(puntos(container)).toBe(0);
  });

  it("muestra el nombre del equipo y lo usa en la etiqueta del tablero", () => {
    sinAviso();
    renderContador({ displayName: "LOS PIBES" });
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("LOS PIBES");
    expect(tablero()).toHaveAccessibleName("Sumar punto a LOS PIBES");
  });
});

describe("Counter: partida a 30 (malas y buenas)", () => {
  it("llega a 15 malas y la suma siguiente pasa a Buenas 1", () => {
    sinAviso();
    const { container } = renderContador();
    tocar(15);
    expect([puntos(container), etapa(container)]).toEqual([15, "Malas"]);
    tocar(1);
    expect([puntos(container), etapa(container)]).toEqual([1, "Buenas"]);
  });

  it("restar en Buenas 1 vuelve a Malas 15", () => {
    sinAviso();
    const { container } = renderContador();
    tocar(16);
    fireEvent.click(screen.getByRole("button", { name: "Resta" }));
    expect([puntos(container), etapa(container)]).toEqual([15, "Malas"]);
  });

  it("gana al llegar a 15 buenas: llama a onWin y no suma", () => {
    sinAviso();
    const { container, onWin } = renderContador();
    tocar(29); // 15 malas + 14 buenas
    expect([puntos(container), etapa(container)]).toEqual([14, "Buenas"]);
    expect(onWin).not.toHaveBeenCalled();
    tocar(1);
    expect(onWin).toHaveBeenCalledWith("NOSOTROS");
    expect(puntos(container)).toBe(14);
  });

  it("con la partida terminada no suma ni resta", () => {
    sinAviso();
    const { container } = renderContador({ finished: true });
    tocar(3);
    expect(puntos(container)).toBe(0);
  });
});

describe("Counter: partida a 15", () => {
  it("muestra 'a 15' y gana al llegar a 15", () => {
    sinAviso();
    const { container, onWin } = renderContador({ maxPoints: 15 });
    expect(etapa(container)).toBe("a 15");
    tocar(14);
    expect(puntos(container)).toBe(14);
    tocar(1);
    expect(onWin).toHaveBeenCalledWith("NOSOTROS");
    expect(puntos(container)).toBe(14);
  });
});

describe("Counter: guardado en localStorage", () => {
  it("guarda puntos y etapa 300 ms después del último toque", () => {
    vi.useFakeTimers();
    sinAviso();
    renderContador();
    tocar(16);
    expect(localStorage.getItem("points-NOSOTROS")).toBeNull();
    act(() => vi.advanceTimersByTime(300));
    expect(localStorage.getItem("points-NOSOTROS")).toBe("1");
    expect(localStorage.getItem("stage-NOSOTROS")).toBe("Buenas");
  });

  it("restaura una partida guardada", () => {
    sinAviso();
    localStorage.setItem("points-NOSOTROS", "7");
    localStorage.setItem("stage-NOSOTROS", "Buenas");
    const { container } = renderContador();
    expect([puntos(container), etapa(container)]).toEqual([7, "Buenas"]);
    expect(fosforos(container)).toBe(7);
  });

  it.each([
    ["a 15 guardado en una partida a 30", 30, "a 15", 5, "Malas"],
    ["Malas guardado en una partida a 15", 15, "Malas", 5, "a 15"],
    ["Buenas con 0 puntos en una partida a 30", 30, "Buenas", 0, "Malas"],
  ])("corrige la etapa guardada si no corresponde (%s)", (_, maxPoints, guardada, puntosGuardados, esperada) => {
    sinAviso();
    localStorage.setItem("points-NOSOTROS", String(puntosGuardados));
    localStorage.setItem("stage-NOSOTROS", guardada);
    const { container } = renderContador({ maxPoints });
    expect(etapa(container)).toBe(esperada);
  });

  it("al cambiar el modo de juego vuelve a 0 y borra lo guardado", () => {
    sinAviso();
    localStorage.setItem("points-NOSOTROS", "7");
    localStorage.setItem("stage-NOSOTROS", "Malas");
    const { container, rerender, onWin } = renderContador();
    rerender(<Counter title="NOSOTROS" displayName="NOSOTROS" maxPoints={15} cargada onWin={onWin} />);
    expect([puntos(container), etapa(container)]).toEqual([0, "a 15"]);
    expect(localStorage.getItem("points-NOSOTROS")).toBeNull();
    expect(localStorage.getItem("stage-NOSOTROS")).toBeNull();
  });
});

describe("Counter: historial (VAR)", () => {
  const historial = () => JSON.parse(localStorage.getItem("history")) || [];

  it("registra cada suma y resta, y las guarda 300 ms después", () => {
    vi.useFakeTimers();
    sinAviso();
    renderContador();
    tocar(2);
    fireEvent.click(screen.getByRole("button", { name: "Resta" }));
    expect(historial()).toEqual([]);
    act(() => vi.advanceTimersByTime(300));
    expect(historial().map(({ action, points, team, currentPoints, stage, maxPoints }) => ({
      action, points, team, currentPoints, stage, maxPoints,
    }))).toEqual([
      { action: "SUMA", points: 1, team: "NOSOTROS", currentPoints: 1, stage: "Malas", maxPoints: 30 },
      { action: "SUMA", points: 1, team: "NOSOTROS", currentPoints: 2, stage: "Malas", maxPoints: 30 },
      { action: "RESTA", points: -1, team: "NOSOTROS", currentPoints: 1, stage: "Malas", maxPoints: 30 },
    ]);
    expect(historial()[0].timestamp).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it.each(["flushHistory", "beforeunload"])("guarda el historial pendiente al recibir '%s'", (evento) => {
    vi.useFakeTimers();
    sinAviso();
    renderContador();
    tocar(1);
    act(() => window.dispatchEvent(new Event(evento)));
    expect(historial()).toHaveLength(1);
  });

  it("al ir a otra página (pagehide) guarda puntos, etapa e historial pendientes", () => {
    vi.useFakeTimers();
    sinAviso();
    renderContador();
    tocar(16);
    act(() => window.dispatchEvent(new Event("pagehide")));
    expect(localStorage.getItem("points-NOSOTROS")).toBe("1");
    expect(localStorage.getItem("stage-NOSOTROS")).toBe("Buenas");
    expect(historial()).toHaveLength(16);
  });

  it("agrega al historial existente sin pisarlo", () => {
    sinAviso();
    localStorage.setItem("history", JSON.stringify([{ action: "SUMA", team: "ELLOS" }]));
    renderContador();
    tocar(1);
    act(() => window.dispatchEvent(new Event("flushHistory")));
    expect(historial().map((e) => e.team)).toEqual(["ELLOS", "NOSOTROS"]);
  });
});

describe("Counter: aviso 'Tocá para sumar'", () => {
  it("en las primeras 10 sesiones aparece a los 600 ms en NOSOTROS y cuenta la sesión", () => {
    vi.useFakeTimers();
    localStorage.setItem("tapHintSessions", "3");
    const { container } = renderContador();
    expect(container.querySelector(".tap-hint")).toBeNull();
    act(() => vi.advanceTimersByTime(600));
    expect(container.querySelector(".tap-hint")).not.toBeNull();
    expect(screen.getByText("Tocá")).toBeInTheDocument();
    expect(localStorage.getItem("tapHintSessions")).toBe("4");
  });

  it("no aparece en ELLOS", () => {
    vi.useFakeTimers();
    const { container } = renderContador({ title: "ELLOS", displayName: "ELLOS" });
    act(() => vi.advanceTimersByTime(600));
    expect(container.querySelector(".tap-hint")).toBeNull();
  });

  it("no aparece después de 10 sesiones", () => {
    vi.useFakeTimers();
    sinAviso();
    const { container } = renderContador();
    act(() => vi.advanceTimersByTime(600));
    expect(container.querySelector(".tap-hint")).toBeNull();
  });

  it("se va al tocar el tablero", () => {
    vi.useFakeTimers();
    const { container } = renderContador();
    act(() => vi.advanceTimersByTime(600));
    tocar(1);
    expect(container.querySelector(".tap-hint")).toBeNull();
  });

  it("?reset-hint reinicia el contador de sesiones", () => {
    vi.useFakeTimers();
    sinAviso();
    window.history.replaceState({}, "", "/?reset-hint");
    const { container } = renderContador();
    act(() => vi.advanceTimersByTime(600));
    expect(container.querySelector(".tap-hint")).not.toBeNull();
    expect(window.location.search).toBe("");
  });
});

describe("Counter: render en el build e hidratación", () => {
  const props = { title: "NOSOTROS", displayName: "NOSOTROS", onWin: () => {} };

  it("el primer render es 0 en malas aunque haya una partida guardada (igual al HTML del build)", () => {
    localStorage.setItem("points-NOSOTROS", "7");
    localStorage.setItem("stage-NOSOTROS", "Buenas");
    const html = renderToString(<Counter {...props} maxPoints={30} cargada={false} />);
    expect(html).toContain(">Malas</h3>");
    expect(html).toMatch(/<h1[^>]*>0<\/h1>/);
    expect(html).not.toContain("match-place");
  });

  it("restaura la partida guardada recién cuando la partida está cargada", () => {
    sinAviso();
    localStorage.setItem("points-NOSOTROS", "7");
    localStorage.setItem("stage-NOSOTROS", "Buenas");
    const { container, rerender } = render(<Counter {...props} maxPoints={30} cargada={false} />);
    expect(puntos(container)).toBe(0);
    rerender(<Counter {...props} maxPoints={30} cargada />);
    expect([puntos(container), etapa(container)]).toEqual([7, "Buenas"]);
  });

  it("no borra una partida guardada a 15 cuando el modo pasa de 30 (por defecto) a 15 al cargar", () => {
    sinAviso();
    localStorage.setItem("maxPoints", "15");
    localStorage.setItem("points-NOSOTROS", "9");
    localStorage.setItem("stage-NOSOTROS", "a 15");
    const { container, rerender } = render(<Counter {...props} maxPoints={30} cargada={false} />);
    // El modo cambia antes de que la partida figure como cargada, y también en el mismo render
    rerender(<Counter {...props} maxPoints={15} cargada={false} />);
    rerender(<Counter {...props} maxPoints={15} cargada />);
    expect([puntos(container), etapa(container)]).toEqual([9, "a 15"]);
    expect(localStorage.getItem("points-NOSOTROS")).toBe("9");
  });

  it("tampoco la borra si el modo y la carga llegan en el mismo render", () => {
    sinAviso();
    localStorage.setItem("points-NOSOTROS", "9");
    localStorage.setItem("stage-NOSOTROS", "a 15");
    const { container, rerender } = render(<Counter {...props} maxPoints={30} cargada={false} />);
    rerender(<Counter {...props} maxPoints={15} cargada />);
    expect([puntos(container), etapa(container)]).toEqual([9, "a 15"]);
    expect(localStorage.getItem("points-NOSOTROS")).toBe("9");
  });

  it("no registra listeners de window hasta montar (se puede renderizar en el servidor)", () => {
    const espia = vi.spyOn(window, "addEventListener");
    renderToString(<Counter {...props} maxPoints={30} cargada={false} />);
    expect(espia).not.toHaveBeenCalled();
  });
});
