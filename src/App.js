import React, { useState, useCallback } from "react";
import "./App.css";
import Header from "./Components/Header.js";
import Footer from "./Components/Footer.js";
import Board from "./Components/Board.js";
import AdComponent from "./Components/Ads.js";
import History from "./Components/History.js";

const App = () => {
  const [finished, setFinished] = useState(false);
  const [winner, setWinner] = useState("");
  const [maxPoints, setMaxPoints] = useState(30);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  const toggleHistory = () => {
    console.log("Toggle history triggered");

    setIsHistoryVisible((prev) => !prev);
  };

  // Alterna entre 15 y 30 puntos
  const toggleMaxPoints = useCallback(() => {
    setMaxPoints((prev) => (prev === 30 ? 15 : 30));
    setFinished(false);
  }, []);

  const handleWin = useCallback(
    (winner) => {
      if (finished) return; // Si el juego ya terminó, no registrar más.
  
      const history = JSON.parse(localStorage.getItem("history")) || [];
      const lastEntry = history[history.length - 1];
  
      // Verificar si el último registro ya es el ganador
      if (
        lastEntry &&
        (lastEntry.action === "GANARON" || lastEntry.action === "GANAMOS") &&
        lastEntry.team === winner
      ) {
        return;
      }
  
      // Generar la hora local con formato AM/PM
      const currentTime = new Date();
      const formattedTime = currentTime.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
  
      const result = {
        action: winner === "NOSOTROS" ? "GANAMOS" : "GANARON", // Mensajes simplificados
        points: null,
        team: winner,
        timestamp: formattedTime, // Guardar el string formateado
      };
  
      history.push(result);
      localStorage.setItem("history", JSON.stringify(history));
  
      // Limpiar puntos de los equipos
      localStorage.removeItem("points-NOSOTROS");
      localStorage.removeItem("points-ELLOS");
  
      // Finalizar partida
      setWinner(winner);
      setFinished(true);
    },
    [finished]
  );
  
  
  const resetGame = useCallback((points) => {
    // Guardar solo el último ganador
    const history = JSON.parse(localStorage.getItem("history")) || [];
    const filteredHistory = history.filter(
      (entry) =>
        entry.action.includes("GANAMOS") || entry.action.includes("GANARON")
    );
    localStorage.setItem("history", JSON.stringify(filteredHistory));

    // Reiniciar puntos y estado del juego
    localStorage.removeItem("points-NOSOTROS");
    localStorage.removeItem("points-ELLOS");

    setWinner("");
    setFinished(false);
    setMaxPoints(points);
  }, []);

  return (
    <div className="app">
      <Header
        toggleMaxPoints={toggleMaxPoints}
        maxPoints={maxPoints}
        toggleHistory={toggleHistory}
      />
      <Board
        finished={finished}
        winner={winner}
        maxPoints={maxPoints}
        handleWin={handleWin}
        resetGame={resetGame}
      />
      <Footer />
      <History isVisible={isHistoryVisible} onClose={toggleHistory} />
      <AdComponent adId="127560-15" type="15" siteId="127560" formatId="15" />
      <AdComponent adId="127560-6" type="6" siteId="127560" formatId="6" />
    </div>
  );
};

export default App;
