// Tests de caracterización del VAR
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import History, { buildTimeline } from "../../src/components/History.jsx";

const NOMBRES = { NOSOTROS: "NOSOTROS", ELLOS: "ELLOS" };
const jugada = (team, action, currentPoints, timestamp, stage = "Malas", maxPoints = 30) => ({
  action,
  points: action === "SUMA" ? 1 : -1,
  team,
  timestamp,
  currentPoints,
  stage,
  maxPoints,
});

describe("buildTimeline", () => {
  it("agrupa los toques seguidos del mismo equipo dentro de 5 segundos (un truco = +2)", () => {
    const items = buildTimeline([
      jugada("NOSOTROS", "SUMA", 1, "21:00:00"),
      jugada("NOSOTROS", "SUMA", 2, "21:00:03"),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ type: "play", team: "NOSOTROS", action: "SUMA", amount: 2, result: 2 });
  });

  it("no agrupa si pasaron más de 5 segundos, si cambia el equipo o si cambia la acción", () => {
    const items = buildTimeline([
      jugada("NOSOTROS", "SUMA", 1, "21:00:00"),
      jugada("NOSOTROS", "SUMA", 2, "21:00:06"),
      jugada("ELLOS", "SUMA", 1, "21:00:07"),
      jugada("ELLOS", "RESTA", 0, "21:00:08"),
    ]);
    expect(items.map((i) => `${i.team} ${i.action} ${i.amount}`)).toEqual([
      "NOSOTROS SUMA 1",
      "NOSOTROS SUMA 1",
      "ELLOS SUMA 1",
      "ELLOS RESTA 1",
    ]);
  });

  it("marca el paso de malas a buenas como hito y no agrupa a través de él", () => {
    const items = buildTimeline([
      jugada("NOSOTROS", "SUMA", 15, "21:00:00", "Malas"),
      jugada("NOSOTROS", "SUMA", 1, "21:00:01", "Buenas"),
    ]);
    expect(items.map((i) => i.type)).toEqual(["play", "stage", "play"]);
    expect(items[1]).toMatchObject({ team: "NOSOTROS", stage: "Buenas" });
  });
});

describe("History", () => {
  const guardar = (entradas) => localStorage.setItem("history", JSON.stringify(entradas));

  it("sin jugadas muestra el aviso y no ofrece borrar", () => {
    render(<History isVisible onClose={() => {}} teamNames={NOMBRES} />);
    expect(screen.getByText("Todavía no hay jugadas.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Borrar/ })).toBeNull();
  });

  it("muestra el marcador con la última jugada de cada equipo y los nombres propios", () => {
    guardar([
      jugada("NOSOTROS", "SUMA", 15, "21:00:00", "Malas"),
      jugada("NOSOTROS", "SUMA", 1, "21:00:10", "Buenas"),
      jugada("ELLOS", "SUMA", 4, "21:00:20"),
    ]);
    const { container } = render(
      <History isVisible onClose={() => {}} teamNames={{ NOSOTROS: "LOS PIBES", ELLOS: "ELLOS" }} />
    );
    const nos = container.querySelector(".var-score-nosotros");
    expect(within(nos).getByText("LOS PIBES")).toBeInTheDocument();
    expect(nos.querySelector(".var-score-points")).toHaveTextContent("1");
    expect(nos.querySelector(".var-stage")).toHaveTextContent("Buenas");
    expect(container.querySelector(".var-score-ellos .var-score-points")).toHaveTextContent("4");
    expect(screen.getByText("LOS PIBES → Buenas")).toBeInTheDocument();
  });

  it("al abrirse fuerza el guardado pendiente con el evento flushHistory", () => {
    let recibido = false;
    window.addEventListener("flushHistory", () => (recibido = true), { once: true });
    render(<History isVisible onClose={() => {}} teamNames={NOMBRES} />);
    expect(recibido).toBe(true);
  });

  it("borrar pide confirmación y después vacía el historial", () => {
    guardar([jugada("NOSOTROS", "SUMA", 1, "21:00:00")]);
    render(<History isVisible onClose={() => {}} teamNames={NOMBRES} />);
    fireEvent.click(screen.getByRole("button", { name: "Borrar historial" }));
    expect(JSON.parse(localStorage.getItem("history"))).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /¿Seguro\?/ }));
    expect(JSON.parse(localStorage.getItem("history"))).toEqual([]);
    expect(screen.getByText("Todavía no hay jugadas.")).toBeInTheDocument();
  });
});
