// Store de la partida: misma lógica que tenía App.js
import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_NAMES,
  cargarPartida,
  maxPoints,
  partidaCargada,
  resetGame,
  saveNames,
  teamNames,
  toggleMaxPoints,
} from "../../src/stores/partida.js";

export const reiniciarStore = () => {
  maxPoints.set(30);
  teamNames.set(DEFAULT_NAMES);
  partidaCargada.set(false);
};

describe("store partida", () => {
  beforeEach(reiniciarStore);

  it("arranca con los valores por defecto sin leer localStorage (igual que el build)", () => {
    localStorage.setItem("maxPoints", "15");
    expect(maxPoints.get()).toBe(30);
    expect(teamNames.get()).toEqual({ NOSOTROS: "NOSOTROS", ELLOS: "ELLOS" });
    expect(partidaCargada.get()).toBe(false);
  });

  it("cargarPartida lee el modo y los nombres guardados", () => {
    localStorage.setItem("maxPoints", "15");
    localStorage.setItem("teamNames", JSON.stringify({ NOSOTROS: "PIBES", ELLOS: "TÍOS" }));
    cargarPartida();
    expect(maxPoints.get()).toBe(15);
    expect(teamNames.get()).toEqual({ NOSOTROS: "PIBES", ELLOS: "TÍOS" });
    expect(partidaCargada.get()).toBe(true);
  });

  it("cargarPartida sin nada guardado deja los valores por defecto", () => {
    cargarPartida();
    expect(maxPoints.get()).toBe(30);
    expect(teamNames.get()).toEqual(DEFAULT_NAMES);
  });

  it("cargarPartida corre una sola vez", () => {
    cargarPartida();
    localStorage.setItem("maxPoints", "15");
    cargarPartida();
    expect(maxPoints.get()).toBe(30);
  });

  it("toggleMaxPoints guarda el historial pendiente, lo vacía y alterna 30 ↔ 15", () => {
    const orden = [];
    window.addEventListener("flushHistory", () => orden.push(localStorage.getItem("history")), { once: true });
    localStorage.setItem("history", JSON.stringify([{ action: "SUMA" }]));
    toggleMaxPoints();
    expect(orden).toEqual([JSON.stringify([{ action: "SUMA" }])]);
    expect(localStorage.getItem("history")).toBe("[]");
    expect(maxPoints.get()).toBe(15);
    expect(localStorage.getItem("maxPoints")).toBe("15");
    toggleMaxPoints();
    expect(maxPoints.get()).toBe(30);
  });

  it("resetGame borra los puntos, deja solo los registros de partidas ganadas y fija el modo", () => {
    localStorage.setItem("points-NOSOTROS", "7");
    localStorage.setItem("points-ELLOS", "3");
    localStorage.setItem("stage-NOSOTROS", "Buenas");
    localStorage.setItem("stage-ELLOS", "Malas");
    localStorage.setItem("history", JSON.stringify([{ action: "SUMA" }, { action: "GANAMOS NOSOTROS" }]));
    resetGame(15);
    for (const clave of ["points-NOSOTROS", "points-ELLOS", "stage-NOSOTROS", "stage-ELLOS"]) {
      expect(localStorage.getItem(clave)).toBeNull();
    }
    expect(JSON.parse(localStorage.getItem("history"))).toEqual([{ action: "GANAMOS NOSOTROS" }]);
    expect(maxPoints.get()).toBe(15);
    expect(localStorage.getItem("maxPoints")).toBe("15");
  });

  it("saveNames guarda los nombres", () => {
    saveNames({ NOSOTROS: "PIBES", ELLOS: "ELLOS" });
    expect(teamNames.get()).toEqual({ NOSOTROS: "PIBES", ELLOS: "ELLOS" });
    expect(JSON.parse(localStorage.getItem("teamNames"))).toEqual({ NOSOTROS: "PIBES", ELLOS: "ELLOS" });
  });
});
