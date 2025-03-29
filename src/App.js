import React, { useState, useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./styles/App.css";
import Header from "./components/Header.js";
import Footer from "./components/Footer.js";
import Board from "./components/Board.js";
import ResultPage from "./components/ResultPage.js";
import AdComponent from "./components/Ads.js";
import History from "./components/History.js";
import NotFound from "./components/NotFound.js";
import { AuthProvider } from "./context/AuthContext.js";

const App = () => {
  const [finished, setFinished] = useState(false);
  const [winner, setWinner] = useState("");
  const [maxPoints, setMaxPoints] = useState(() => {
    const savedMaxPoints = parseInt(localStorage.getItem("maxPoints"), 10);
    return savedMaxPoints || 30;
  });
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  const toggleHistory = () => {
    console.log("Toggle history triggered");
    setIsHistoryVisible((prev) => !prev);
  };

  const toggleMaxPoints = useCallback(() => {
    const newMaxPoints = maxPoints === 30 ? 15 : 30;
    setMaxPoints(newMaxPoints);
    localStorage.setItem("maxPoints", newMaxPoints);
    setFinished(false);
  }, [maxPoints]);

  const handleWin = useCallback((winner) => {
    setWinner(winner);
    setFinished(true);
  }, []);

  const resetGame = useCallback((points) => {
    const history = JSON.parse(localStorage.getItem("history")) || [];
    const filteredHistory = history.filter(
      (entry) =>
        entry.action.includes("GANAMOS") || entry.action.includes("GANARON")
    );
    localStorage.setItem("history", JSON.stringify(filteredHistory));
  
    localStorage.removeItem("points-NOSOTROS");
    localStorage.removeItem("points-ELLOS");
    localStorage.removeItem("stage-NOSOTROS");
    localStorage.removeItem("stage-ELLOS");
  
    setWinner("");
    setFinished(false);
    setMaxPoints(points);
    localStorage.setItem("maxPoints", points);
  }, []);

  return (
    <AuthProvider>
      <div className="app">
        <Header
          toggleMaxPoints={toggleMaxPoints}
          maxPoints={maxPoints}
          toggleHistory={toggleHistory}
        />
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <Board
                  finished={finished}
                  winner={winner}
                  maxPoints={maxPoints}
                  handleWin={handleWin}
                  resetGame={resetGame}
                />
              }
            />
            <Route
              path="/resultado/:winner"
              element={<ResultPage resetGame={resetGame} />}
            />
            <Route path="/result" element={<Navigate to="/" replace />} />
            <Route path="/result/:winner" element={<Navigate to="/resultado/:winner" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <History isVisible={isHistoryVisible} onClose={toggleHistory} />
        <AdComponent adId="127560-15" type="15" siteId="127560" formatId="15" />
        <AdComponent adId="127560-6" type="6" siteId="127560" formatId="6" />
      </div>
    </AuthProvider>
  );
};

export default App;