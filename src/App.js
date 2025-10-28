import React, { useState, useCallback, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import "./styles/App.css";
import Header from "./components/Header.js";
import Footer from "./components/Footer.js";
import Board from "./components/Board.js";
import ResultPage from "./components/ResultPage.js";
import AdComponent from "./components/Ads.js";
import NotFound from "./components/NotFound.js";
import { AuthProvider } from "./context/AuthContext.js";

// 🚀 LAZY LOADING - Solo cargan cuando se necesitan
const History = lazy(() => import("./components/History.js"));
const EditNames = lazy(() => import("./components/EditNames.js"));
const Changelog = lazy(() => import("./components/Changelog.js"));
const GuiaTruco = lazy(() => import("./components/pages/GuiaTruco.js"));

const App = () => {
  const [finished, setFinished] = useState(false);
  const [winner, setWinner] = useState("");
  const [maxPoints, setMaxPoints] = useState(() => {
    const savedMaxPoints = parseInt(localStorage.getItem("maxPoints"), 10);
    return savedMaxPoints || 30;
  });
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [isEditNamesVisible, setIsEditNamesVisible] = useState(false);
  const [isChangelogVisible, setIsChangelogVisible] = useState(false);
  const [teamNames, setTeamNames] = useState(() => {
    const savedNames = localStorage.getItem("teamNames");
    return savedNames ? JSON.parse(savedNames) : { NOSOTROS: "NOSOTROS", ELLOS: "ELLOS" };
  });

  const toggleHistory = () => {
    console.log("Toggle history triggered");
    setIsHistoryVisible((prev) => !prev);
  };

  const toggleEditNames = () => {
    setIsEditNamesVisible((prev) => !prev);
  };

  const toggleChangelog = () => {
    setIsChangelogVisible((prev) => !prev);
  };

  const toggleMaxPoints = useCallback(() => {
    const newMaxPoints = maxPoints === 30 ? 15 : 30;
    // 1) Forzar flush del historial buffered antes de limpiar
    try {
      window.dispatchEvent(new Event("flushHistory"));
    } catch (_) {}

    // 2) Resetear historial VAR completamente al cambiar el modo
    try {
      localStorage.setItem("history", JSON.stringify([]));
    } catch (_) {}

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

  const handleNameChange = (newNames) => {
    setTeamNames(newNames);
    localStorage.setItem("teamNames", JSON.stringify(newNames));
  };

  return (
    <AuthProvider>
      <div className="app">
        <Header
          toggleMaxPoints={toggleMaxPoints}
          maxPoints={maxPoints}
          toggleHistory={toggleHistory}
          toggleEditNames={toggleEditNames}
          toggleChangelog={toggleChangelog}
        />
        <main>
          <Routes>
            <Route
              path="/"
              element={
                <Board
                  finished={finished}
                  winner={winner}
                  maxPoints={maxPoints}
                  handleWin={handleWin}
                  toggleMaxPoints={toggleMaxPoints}
                  resetGame={resetGame}
                  teamNames={teamNames}
                />
              }
            />
            <Route
              path="/resultado/:winner"
              element={<ResultPage resetGame={resetGame} teamNames={teamNames} />}
            />
            <Route 
              path="/guia-truco" 
              element={
                <Suspense fallback={<div>Cargando...</div>}>
                  <GuiaTruco />
                </Suspense>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        {/* Oculto Intersitial <AdComponent adId="127560-15" type="15" siteId="127560" formatId="15" /> */}
        <AdComponent adId="127560-6" type="6" siteId="127560" formatId="6" />
        
        {/* 🎯 SUSPENSE - Carga modales solo cuando se necesitan */}
        <Suspense fallback={null}>
          <History isVisible={isHistoryVisible} onClose={toggleHistory} teamNames={teamNames} />
          <EditNames
            isVisible={isEditNamesVisible}
            onClose={toggleEditNames}
            teamNames={teamNames}
            onSave={handleNameChange}
          />
          <Changelog
            isVisible={isChangelogVisible}
            onClose={toggleChangelog}
          />
        </Suspense>
      </div>
    </AuthProvider>
  );
};

export default App;