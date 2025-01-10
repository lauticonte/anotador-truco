import React, { useState, useEffect } from "react";
import "./History.css";

const History = ({ isVisible, onClose }) => {
  const [history, setHistory] = useState([]);

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

  const BroomIcon = () => (
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
      <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" />
    </svg>
  );

  // Cargar historial desde localStorage
  useEffect(() => {
    if (isVisible) {
      const savedHistory = JSON.parse(localStorage.getItem("history")) || [];
      setHistory(savedHistory.reverse());
    }
  }, [isVisible]);

  return (
    <div className={`history-container ${isVisible ? "visible" : ""}`}>
      <div className="history-header">
        <h3>Historial de Puntos</h3>

        <button
          className="clean-button"
          onClick={() => {
            localStorage.removeItem("history"); // Elimina el historial del localStorage
            setHistory([]); // Limpia el estado local del historial
          }}
        >
          <BroomIcon /> {/* Ícono de escoba */}
        </button>
        <button className="close-button" onClick={onClose}>
          <CloseIcon /> {/* Ícono de cruz */}
        </button>
        
      </div>

      <div className="history-list">
        {history.length > 0 ? (
          history.map((entry, index) => (
            <div key={index} className="history-item">
              <span className="history-team">
                {entry.team === "NOSOTROS" ? "N" : "E"}
              </span>
              <span className="history-action">{entry.action}</span>
              {entry.points !== null && (
                <span
                  className="history-points"
                  style={{ color: entry.points > 0 ? "green" : "red" }}
                >
                  {entry.points > 0 ? `+${entry.points}` : entry.points}
                </span>
              )}
              <span className="history-date">{entry.timestamp}</span>
            </div>
          ))
        ) : (
          <p className="no-history">No hay acciones registradas.</p>
        )}
      </div>
    </div>
  );
};

export default History;
