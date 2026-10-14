import React, { useState, useEffect } from "react";
import SheetCloseButton from "./SheetCloseButton.js";
import "../styles/Sheet.css";
import "../styles/EditNames.css";

const MAX_LENGTH = 10;
const DEFAULT_NAMES = { NOSOTROS: "NOSOTROS", ELLOS: "ELLOS" };

const FIELDS = [
  { team: "NOSOTROS", label: "Tu equipo" },
  { team: "ELLOS", label: "Rivales" },
];

const EditNames = ({ isVisible, onClose, teamNames, onSave }) => {
  const [names, setNames] = useState(teamNames);

  useEffect(() => {
    if (isVisible) {
      setNames(teamNames);
    }
  }, [isVisible, teamNames]);

  const handleChange = (team, value) => {
    setNames((prev) => ({ ...prev, [team]: value.toUpperCase() }));
  };

  // Vacío vuelve al nombre por defecto
  const handleSave = () => {
    onSave({
      NOSOTROS: names.NOSOTROS.trim() || DEFAULT_NAMES.NOSOTROS,
      ELLOS: names.ELLOS.trim() || DEFAULT_NAMES.ELLOS,
    });
    onClose();
  };

  const handleReset = () => {
    onSave(DEFAULT_NAMES);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
  };

  return (
    <div className={`sheet-overlay ${isVisible ? "visible" : ""}`} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Nombres de los equipos">
        <header className="sheet-header">
          <h2 className="sheet-title">Nombres de los equipos</h2>
          <SheetCloseButton onClick={onClose} />
        </header>

        <div className="names-fields">
          {FIELDS.map(({ team, label }) => (
            <label className="names-field" key={team} htmlFor={`name-${team}`}>
              <span className="names-label">{label}</span>
              <input
                id={`name-${team}`}
                className="names-input"
                type="text"
                value={names[team]}
                onChange={(e) => handleChange(team, e.target.value)}
                onFocus={(e) => e.target.select()}
                onKeyDown={handleKeyDown}
                placeholder={DEFAULT_NAMES[team]}
                maxLength={MAX_LENGTH}
                autoComplete="off"
                autoCapitalize="characters"
                enterKeyHint="done"
              />
              <span className="names-count">
                {names[team].length}/{MAX_LENGTH}
              </span>
            </label>
          ))}
        </div>

        <footer className="sheet-footer">
          <button className="sheet-primary" onClick={handleSave}>
            Guardar
          </button>
          <button className="sheet-secondary" onClick={handleReset}>
            Restaurar nombres
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EditNames;
