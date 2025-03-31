import React, { useState, useEffect } from "react";
import "../styles/History.css";

const History = ({ isVisible, onClose }) => {
  const [history, setHistory] = useState([]);
  const [showSummary, setShowSummary] = useState(false);

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

  const TrashIcon = () => (
    <svg
      className="svg-history-icon"
      aria-hidden="true"
      focusable="false"
      data-prefix="fas"
      data-icon="trash"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
    >
      <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
    </svg>
  );

  useEffect(() => {
    if (isVisible) {
      const savedHistory = JSON.parse(localStorage.getItem("history")) || [];
      setHistory(savedHistory.reverse());
    } else {
      setHistory([]);
      setShowSummary(false);
    }
  }, [isVisible]);

  const toggleView = () => {
    setShowSummary(!showSummary);
  };

  const clearHistory = () => {
    localStorage.setItem("history", JSON.stringify([]));
    setHistory([]);
    setShowSummary(false);
  };

  const getHistoryItemClass = (entry) => {
    return `history-item ${entry.team === "NOSOTROS" ? "nosotros" : "ellos"}`;
  };

  const renderHistoryEntry = (entry) => {
    const pointsDisplay = entry.currentPoints;
    const stageDisplay = entry.maxPoints === 30 ? ` (${entry.stage})` : "";
    const actionSymbol = entry.action === "SUMA" ? "+" : "-";

    return (
      <div className={getHistoryItemClass(entry)} key={entry.timestamp}>
        <div className="team-indicator">{entry.team === "NOSOTROS" ? "N" : "E"}</div>
        <div className="action-info">
          <span className="action">{entry.action}</span>
          <span className={`points ${entry.action === "SUMA" ? "positive" : "negative"}`}>
            {actionSymbol}{Math.abs(entry.points)} → {pointsDisplay}{stageDisplay}
          </span>
        </div>
        <div className="timestamp">{entry.timestamp}</div>
      </div>
    );
  };

  const calculateSummary = () => {
    const savedHistory = JSON.parse(localStorage.getItem("history")) || [];
    const summary = {
      NOSOTROS: { sumas: 0, restas: 0 },
      ELLOS: { sumas: 0, restas: 0 }
    };

    savedHistory.forEach(entry => {
      if (entry.action === "SUMA") {
        summary[entry.team].sumas++;
      } else if (entry.action === "RESTA") {
        summary[entry.team].restas++;
      }
    });

    return summary;
  };

  const SummaryView = () => {
    const summary = calculateSummary();
    return (
      <div className="summary-container">
        {Object.entries(summary).map(([team, stats]) => (
          <div key={team} className={`summary-team ${team.toLowerCase()}`}>
            <h3>{team}</h3>
            <p>
              <span>Sumas</span>
              <span>{stats.sumas}</span>
            </p>
            <p>
              <span>Restas</span>
              <span>{stats.restas}</span>
            </p>
            <p>
              <span>Total de cambios</span>
              <span>{stats.sumas + stats.restas}</span>
            </p>
          </div>
        ))}
      </div>
    );
  };

  const HistoryView = () => (
    <div className="history-content">
      {history.map(renderHistoryEntry)}
    </div>
  );

  return (
    <div className={`history-overlay ${isVisible ? "visible" : ""}`}>
      <div className="history-modal">
        <div className="history-header">
          <h2>{showSummary ? "RESUMEN" : "HISTORIAL"}</h2>
          <div className="history-actions">
            <button 
              className="summary-button"
              onClick={toggleView}
            >
              {showSummary ? "Movimientos" : "Resumen"}
            </button>
            <button className="clear-button" onClick={clearHistory}>
              <TrashIcon />
            </button>
            <button className="close-button" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
        </div>
        
        {showSummary ? <SummaryView /> : <HistoryView />}
      </div>
    </div>
  );
};

export default History;