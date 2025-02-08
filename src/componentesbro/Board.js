import React, { useEffect } from "react";
import Counter from "./Counter.js";
import WinnerDisplay from "./WinnerDisplay.js";
import FeedbackSection from "./FeedbackSection.js";
import { Analytics } from "@vercel/analytics/react";

const Board = ({
  finished,
  winner,
  maxPoints,
  handleWin,
  toggleMaxPoints,
  resetGame,
}) => {
  // Pre-cargar imágenes
  useEffect(() => {
    const preloadImages = ["/images/happy.png", "/images/sadge.png"];
    preloadImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  return (
    <div className="board">
      {finished ? (
        <div className="finished-message">
          <h3>
            <WinnerDisplay winner={winner} />
          </h3>
          <div className="revancha-buttons">
            <button className="restart-button" onClick={() => resetGame(15)}>
              REVANCHA 1️⃣5️⃣
            </button>
            <button className="restart-button" onClick={() => resetGame(30)}>
              REVANCHA 3️⃣0️⃣
            </button>
          </div>
          <FeedbackSection />
        </div>
      ) : (
        <>
          <Analytics />
          <Counter
            title="NOSOTROS"
            maxPoints={maxPoints}
            onWin={() => handleWin("NOSOTROS")}
          />
          <Counter
            title="ELLOS"
            maxPoints={maxPoints}
            onWin={() => handleWin("ELLOS")}
          />
        </>
      )}
    </div>
  );
};

export default Board;