import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Counter from "./Counter.js";
import { Analytics } from "@vercel/analytics/react";

const Board = ({
  finished,
  winner,
  maxPoints,
  handleWin,
  toggleMaxPoints,
  resetGame,
  teamNames,
}) => {
  const navigate = useNavigate();

  // Pre-cargar imágenes para ResultPage
  useEffect(() => {
    const preloadImages = ["/images/happy.webp", "/images/sadge.webp"];
    preloadImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Redirigir a la página de resultado cuando termine la partida
  useEffect(() => {
    if (finished && winner) {
      navigate(`/resultado/${winner.toLowerCase()}`);
    }
  }, [finished, winner, navigate]);

  return (
    <div className="board">
      {finished ? (
        <div className="finished-message">
          <h3>
            <div className="winner">
              <p>{winner === "NOSOTROS" ? `GANAMOS ${teamNames.NOSOTROS}` : `GANARON ${teamNames.ELLOS}`}</p>
              {/* Imagen eliminada - se muestra solo en ResultPage */}
            </div>
          </h3>
        </div>
      ) : (
        <>
          <Analytics />
          <Counter
            title="NOSOTROS"
            displayName={teamNames.NOSOTROS}
            maxPoints={maxPoints}
            onWin={() => handleWin("NOSOTROS")}
          />
          <Counter
            title="ELLOS"
            displayName={teamNames.ELLOS}
            maxPoints={maxPoints}
            onWin={() => handleWin("ELLOS")}
          />
        </>
      )}
    </div>
  );
};

export default Board;