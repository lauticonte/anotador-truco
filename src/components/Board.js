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
}) => {
  const navigate = useNavigate();

  // Pre-cargar imágenes
  useEffect(() => {
    const preloadImages = ["/images/happy.png", "/images/sadge.png"];
    preloadImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Redirigir a la página de resultado cuando termine la partida
  useEffect(() => {
    if (finished && winner) {
      navigate(`/result/${winner}`);
    }
  }, [finished, winner, navigate]);

  return (
    <div className="board">
      {finished ? (
        <div className="finished-message">
          <h3>
            <div className="winner">
              <p>{winner === "NOSOTROS" ? "GANAMOS NOSOTROS" : "GANARON ELLOS"}</p>
              <img
                className="img-lost"
                src={winner === "NOSOTROS" ? "/images/happy.png" : "/images/sadge.png"}
                alt={winner === "NOSOTROS" ? "happy" : "sadge"}
                loading="lazy"
              />
            </div>
          </h3>
          <div className="revancha-buttons">
            <button className="restart-button" onClick={() => resetGame(15)}>
              REVANCHA 1️⃣5️⃣
            </button>
            <button className="restart-button" onClick={() => resetGame(30)}>
              REVANCHA 3️⃣0️⃣
            </button>
          </div>
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