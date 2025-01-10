import React, { useState, useEffect } from "react";
import "./History.css";

const History = ({ isVisible, onClose }) => {
  const [history, setHistory] = useState([]);

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
        <button className="close-button" onClick={onClose}>
          Cerrar
        </button>
      </div>
      <div className="history-list">
        {history.length > 0 ? (
          history.map((entry, index) => (
            <div key={index} className="history-item">
              <span>{entry.action}</span>
              {entry.points !== null && (
                <span style={{ color: entry.points > 0 ? "green" : "red" }}>
                  {entry.points > 0 ? `+${entry.points}` : entry.points}
                </span>
              )}
              {/* <span className="history-team">{entry.team}</span>{" "}
              Mostrar el equipo */}
              <span className="history-date">{entry.timestamp}</span> {/* Mostrar directamente el texto */}
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
