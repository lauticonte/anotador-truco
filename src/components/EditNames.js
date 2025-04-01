import React, { useState, useEffect } from "react";
import "../styles/EditNames.css";

const EditNames = ({ isVisible, onClose, teamNames, onSave }) => {
  const [names, setNames] = useState(teamNames);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setNames(teamNames);
      setIsSubmitting(false);
    }
  }, [isVisible, teamNames]);

  const handleInputFocus = (e) => {
    e.target.select(); // Select all text when focused
  };

  const handleInputChange = (e, team) => {
    const value = e.target.value;
    setNames(prev => ({ ...prev, [team]: value }));
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Validar y establecer valores por defecto si están vacíos
    const formattedNames = {
      NOSOTROS: names.NOSOTROS.trim() || "NOSOTROS",
      ELLOS: names.ELLOS.trim() || "ELLOS"
    };

    // Convertir a mayúsculas
    formattedNames.NOSOTROS = formattedNames.NOSOTROS.toUpperCase();
    formattedNames.ELLOS = formattedNames.ELLOS.toUpperCase();

    // Simular un pequeño delay para la animación
    await new Promise(resolve => setTimeout(resolve, 300));
    
    onSave(formattedNames);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  const handleReset = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Establecer nombres por defecto
    const defaultNames = {
      NOSOTROS: "NOSOTROS",
      ELLOS: "ELLOS"
    };

    // Simular un pequeño delay para la animación
    await new Promise(resolve => setTimeout(resolve, 300));
    
    onSave(defaultNames);
    onClose();
  };

  const CloseIcon = () => (
    <svg
      className="svg-history-icon"
      aria-hidden="true"
      focusable="false"
      data-prefix="fas"
      data-icon="times"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 352 512"
    >
      <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
    </svg>
  );

  return (
    <div className={`edit-names-overlay ${isVisible ? "visible" : ""}`}>
      <div className="edit-names-modal">
        <div className="edit-names-header">
          <h2>EDITAR NOMBRES</h2>
          <div className="edit-names-actions">
            <button 
              className="close-button" 
              onClick={onClose}
              aria-label="Cerrar"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
        
        <div className="edit-names-form">
          <div className="edit-name-input nosotros">
            <label htmlFor="nosotros-input">Modificá tu nombre...</label>
            <input
              id="nosotros-input"
              type="text"
              value={names.NOSOTROS}
              onChange={(e) => handleInputChange(e, "NOSOTROS")}
              onFocus={handleInputFocus}
              onKeyPress={handleKeyPress}
              placeholder="NOSOTROS"
              maxLength={10}
              disabled={isSubmitting}
            />
            <span className="character-count">
              {names.NOSOTROS.length}/10
            </span>
          </div>
          <div className="edit-name-input ellos">
            <label htmlFor="ellos-input">Modificá el nombre del rival...</label>
            <input
              id="ellos-input"
              type="text"
              value={names.ELLOS}
              onChange={(e) => handleInputChange(e, "ELLOS")}
              onFocus={handleInputFocus}
              onKeyPress={handleKeyPress}
              placeholder="ELLOS"
              maxLength={10}
              disabled={isSubmitting}
            />
            <span className="character-count">
              {names.ELLOS.length}/10
            </span>
          </div>
        </div>

        <div className="edit-names-buttons">
          <button 
            className="save-button" 
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? "GUARDANDO..." : "GUARDAR"}
          </button>
          <button 
            onClick={handleReset}
            disabled={isSubmitting}
          >
            RESTAURAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditNames; 