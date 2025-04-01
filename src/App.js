import React, { useState, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import "./styles/App.css";
import Header from "./components/Header.js";
import Footer from "./components/Footer.js";
import Board from "./components/Board.js";
import ResultPage from "./components/ResultPage.js";
import AdComponent from "./components/Ads.js";
import History from "./components/History.js";
import EditNames from "./components/EditNames.js";
import Changelog from "./components/Changelog.js";
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <AdComponent adId="127560-15" type="15" siteId="127560" formatId="15" />
        <AdComponent adId="127560-6" type="6" siteId="127560" formatId="6" />
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
      </div>
    </AuthProvider>
  );
};

export default App;