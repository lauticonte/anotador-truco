import React, { useState, useEffect, useMemo } from "react";
import SheetCloseButton from "./SheetCloseButton.jsx";
import "../styles/Sheet.css";
import "../styles/History.css";

// Toques seguidos del mismo equipo dentro de esta ventana se muestran como una sola jugada (ej. un truco = +2)
const GROUP_WINDOW_SECONDS = 5;

const toSeconds = (timestamp) => {
  const [h = 0, m = 0, s = 0] = String(timestamp).split(":").map(Number);
  return h * 3600 + m * 60 + s;
};

const toHourMinute = (timestamp) => String(timestamp).slice(0, 5);

// Convierte el historial crudo (un registro por punto, en orden cronológico) en jugadas e hitos
export const buildTimeline = (entries) => {
  const items = [];
  const lastStage = {};

  entries.forEach((entry) => {
    const last = items[items.length - 1];
    const sameStage = lastStage[entry.team] === undefined || lastStage[entry.team] === entry.stage;
    const canGroup =
      last &&
      last.type === "play" &&
      last.team === entry.team &&
      last.action === entry.action &&
      sameStage &&
      toSeconds(entry.timestamp) - last.lastSeconds <= GROUP_WINDOW_SECONDS &&
      toSeconds(entry.timestamp) >= last.lastSeconds;

    if (lastStage[entry.team] !== undefined && !sameStage) {
      items.push({ type: "stage", team: entry.team, stage: entry.stage, timestamp: entry.timestamp });
    }
    lastStage[entry.team] = entry.stage;

    if (canGroup) {
      last.amount += Math.abs(entry.points);
      last.result = entry.currentPoints;
      last.stage = entry.stage;
      last.lastSeconds = toSeconds(entry.timestamp);
    } else {
      items.push({
        type: "play",
        team: entry.team,
        action: entry.action,
        amount: Math.abs(entry.points),
        result: entry.currentPoints,
        stage: entry.stage,
        maxPoints: entry.maxPoints,
        timestamp: entry.timestamp,
        lastSeconds: toSeconds(entry.timestamp),
      });
    }
  });

  return items;
};

const History = ({ isVisible, onClose, teamNames }) => {
  const [entries, setEntries] = useState([]);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Los puntos se guardan con un pequeño retraso: forzar el guardado para no perder la última jugada
      window.dispatchEvent(new Event("flushHistory"));
      setEntries(JSON.parse(localStorage.getItem("history")) || []);
    } else {
      setConfirmClear(false);
    }
  }, [isVisible]);

  // Más reciente arriba, con un separador de hora cada vez que cambia el minuto
  const timeline = useMemo(() => {
    const items = [];
    let lastMinute = null;
    buildTimeline(entries)
      .reverse()
      .forEach((item) => {
        const minute = toHourMinute(item.timestamp);
        if (minute !== lastMinute) {
          items.push({ type: "time", label: minute });
          lastMinute = minute;
        }
        items.push(item);
      });
    return items;
  }, [entries]);

  // Marcador actual según la última jugada de cada equipo
  const score = useMemo(() => {
    const current = {};
    entries.forEach((entry) => {
      current[entry.team] = { points: entry.currentPoints, stage: entry.stage, maxPoints: entry.maxPoints };
    });
    return current;
  }, [entries]);

  const nameOf = (team) => (team === "NOSOTROS" ? teamNames.NOSOTROS : teamNames.ELLOS);

  const clearHistory = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    localStorage.setItem("history", JSON.stringify([]));
    setEntries([]);
    setConfirmClear(false);
  };

  const renderScore = (team) => {
    const s = score[team];
    const showStage = s && s.maxPoints === 30;
    return (
      <div className={`var-score var-score-${team.toLowerCase()}`}>
        <span className="var-score-name">{nameOf(team)}</span>
        <span className="var-score-points">{s ? s.points : 0}</span>
        {showStage && <span className={`var-stage var-stage-${s.stage.toLowerCase()}`}>{s.stage}</span>}
      </div>
    );
  };

  const renderItem = (item, index) => {
    if (item.type === "time") {
      return (
        <li className="var-time" key={`time-${index}`}>
          <span>{item.label}</span>
        </li>
      );
    }

    if (item.type === "stage") {
      return (
        <li className="var-milestone" key={`stage-${index}`}>
          <span className={`var-stage var-stage-${item.stage.toLowerCase()}`}>
            {nameOf(item.team)} <span className="flecha flecha-der">→</span> {item.stage}
          </span>
        </li>
      );
    }

    const isAdd = item.action === "SUMA";
    const side = item.team === "NOSOTROS" ? "left" : "right";
    return (
      <li className={`var-play var-play-${side} ${isAdd ? "" : "var-play-correction"}`} key={`play-${index}`}>
        <div className="var-play-card">
          <span className="var-play-amount">
            {isAdd ? "+" : "−"}
            {item.amount}
          </span>
          <span className="var-play-detail">
            {!isAdd && <span className="sheet-sr-only">Corrección: </span>}<span className="flecha flecha-der">→</span> {item.result}
          </span>
        </div>
      </li>
    );
  };

  return (
    <div className={`sheet-overlay ${isVisible ? "visible" : ""}`} onClick={onClose}>
      <div className="sheet sheet-tall" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="VAR: revisión de la partida">
        <header className="sheet-header">
          <h2 className="sheet-title">
            <span className="sheet-badge">VAR</span>
            <span>Revisión de la partida</span>
          </h2>
          <SheetCloseButton onClick={onClose} />
        </header>

        <div className="var-scoreboard">
          {renderScore("NOSOTROS")}
          {renderScore("ELLOS")}
        </div>

        {timeline.length ? (
          <ol className="var-timeline">{timeline.map(renderItem)}</ol>
        ) : (
          <div className="var-empty">
            <p>Todavía no hay jugadas.</p>
            <p className="var-empty-hint">Cada punto que sumes o restes va a aparecer acá.</p>
          </div>
        )}

        {timeline.length > 0 && (
          <footer className="sheet-footer">
            <button
              className={`sheet-secondary ${confirmClear ? "sheet-secondary-danger" : ""}`}
              onClick={clearHistory}
              onBlur={() => setConfirmClear(false)}
            >
              {confirmClear ? "¿Seguro? Tocá de nuevo para borrar" : "Borrar historial"}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};

export default History;
