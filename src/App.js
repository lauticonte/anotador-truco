import React, { useState, useCallback } from "react";
import "./styles/App.css";
import Header from "./components/Header.js";
import Footer from "./components/Footer.js";
import Board from "./components/Board.js";
import AdComponent from "./components/Ads.js";
import History from "./components/History.js";
import { AuthProvider } from "./context/AuthContext.js";

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
      if (finished) return; // Bloquear si el juego ya terminó
  
      setFinished(true); // Bloquea cualquier acción adicional
  
      const history = JSON.parse(localStorage.getItem("history")) || [];
      const lastEntry = history[history.length - 1];
  
      // Verificar si ya hay un registro de victoria
      if (
        lastEntry &&
        (lastEntry.action === "GANARON" || lastEntry.action === "GANAMOS") &&
        lastEntry.team === winner
      ) {
        return;
      }
  
      // Retrasar el registro del evento GANAMOS/GANARON
      setTimeout(() => {
        const currentTime = new Date();
        const formattedTime = currentTime.toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
  
        const result = {
          action: winner === "NOSOTROS" ? "GANAMOS" : "GANARON",
          points: "-",
          team: winner,
          timestamp: formattedTime,
        };
  
        // Limpiar los puntos del localStorage antes de registrar la victoria
        localStorage.removeItem("points-NOSOTROS");
        localStorage.removeItem("points-ELLOS");
  
        history.push(result);
        localStorage.setItem("history", JSON.stringify(history));
  
        setWinner(winner); // Establece el ganador
      }, 200); // Retrasar 200ms (puedes ajustar este valor según lo necesario)
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
    <AuthProvider>
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
    </AuthProvider>
  );
};

export default App;