// Tests de caracterización de "Editar nombres"
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EditNames from "../../src/components/EditNames.jsx";

const renderNombres = (teamNames = { NOSOTROS: "NOSOTROS", ELLOS: "ELLOS" }) => {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(<EditNames isVisible onClose={onClose} onSave={onSave} teamNames={teamNames} />);
  return { onSave, onClose, tuyo: screen.getByLabelText(/Tu equipo/), rivales: screen.getByLabelText(/Rivales/) };
};

describe("EditNames", () => {
  it("pasa a mayúsculas lo que se escribe y limita a 10 caracteres", () => {
    const { tuyo } = renderNombres();
    fireEvent.change(tuyo, { target: { value: "los pibes" } });
    expect(tuyo).toHaveValue("LOS PIBES");
    expect(tuyo).toHaveAttribute("maxLength", "10");
    expect(screen.getByText("9/10")).toBeInTheDocument();
  });

  it("guarda los nombres y cierra", () => {
    const { tuyo, rivales, onSave, onClose } = renderNombres();
    fireEvent.change(tuyo, { target: { value: "pibes" } });
    fireEvent.change(rivales, { target: { value: "  tíos " } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onSave).toHaveBeenCalledWith({ NOSOTROS: "PIBES", ELLOS: "TÍOS" });
    expect(onClose).toHaveBeenCalled();
  });

  it("un nombre vacío vuelve al nombre por defecto", () => {
    const { tuyo, onSave } = renderNombres({ NOSOTROS: "PIBES", ELLOS: "TÍOS" });
    fireEvent.change(tuyo, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onSave).toHaveBeenCalledWith({ NOSOTROS: "NOSOTROS", ELLOS: "TÍOS" });
  });

  it("Enter guarda", () => {
    const { rivales, onSave } = renderNombres();
    fireEvent.change(rivales, { target: { value: "tíos" } });
    fireEvent.keyDown(rivales, { key: "Enter" });
    expect(onSave).toHaveBeenCalledWith({ NOSOTROS: "NOSOTROS", ELLOS: "TÍOS" });
  });

  it("Restaurar vuelve a NOSOTROS y ELLOS", () => {
    const { onSave, onClose } = renderNombres({ NOSOTROS: "PIBES", ELLOS: "TÍOS" });
    fireEvent.click(screen.getByRole("button", { name: "Restaurar nombres" }));
    expect(onSave).toHaveBeenCalledWith({ NOSOTROS: "NOSOTROS", ELLOS: "ELLOS" });
    expect(onClose).toHaveBeenCalled();
  });
});
