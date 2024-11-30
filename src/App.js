import React, { useState, useCallback } from "react";
import "./App.css";
import Header from "./components/Header.js";
import Footer from "./components/Footer.js";
import Board from "./components/Board.js";
import AdComponent from "./components/Ads.js";

const App = () => {
  const [finished, setFinished] = useState(false);
  const [winner, setWinner] = useState("");
  const [maxPoints, setMaxPoints] = useState(30);

  // Alterna entre 15 y 30 puntos
  const toggleMaxPoints = useCallback(() => {
    setMaxPoints((prev) => (prev === 30 ? 15 : 30));
    setFinished(false);
  }, []);

  // Maneja el ganador
  const handleWin = useCallback((winner) => {
    setWinner(winner);
    setFinished(true);
  }, []);

  // Reinicia el juego
  const resetGame = useCallback((points) => {
    setFinished(false);
    setMaxPoints(points);
  }, []);

  return (
    <div className="app">
      <Header toggleMaxPoints={toggleMaxPoints} maxPoints={maxPoints} />
      <Board
        finished={finished}
        winner={winner}
        maxPoints={maxPoints}
        handleWin={handleWin}
        resetGame={resetGame}
      />
      <Footer />
      <AdComponent adId="127560-15" type="15" siteId="127560" formatId="15" />
      <AdComponent adId="127560-6" type="6" siteId="127560" formatId="6" />
    </div>
  );
};

export default App;
