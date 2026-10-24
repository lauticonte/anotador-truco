import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import Counter from "./Counter.jsx";
import { Analytics } from "@vercel/analytics/react";
import { cargarPartida, maxPoints as maxPointsStore, partidaCargada, teamNames as teamNamesStore } from "../stores/partida.js";

// En el build no hay layout: useLayoutEffect solo avisa. En el navegador corre antes del dibujo.
const useLayoutEffectEnNavegador = typeof window === "undefined" ? useEffect : useLayoutEffect;

const Board = () => {
  const maxPoints = useStore(maxPointsStore);
  const teamNames = useStore(teamNamesStore);
  const cargada = useStore(partidaCargada);
  const [finished, setFinished] = useState(false);
  const [winner, setWinner] = useState("");

  // La partida guardada se lee recién después de hidratar (el HTML del build es 0-0)
  useEffect(() => {
    cargarPartida();
  }, []);

  // Con la partida ya restaurada en los contadores, se muestra el tablero (ver el script de partida
  // guardada en index.astro). Corre antes del dibujo para que nunca se vea el 0-0 intermedio.
  useLayoutEffectEnNavegador(() => {
    if (cargada) document.documentElement.classList.remove("partida-guardada");
  }, [cargada]);

  // Pre-cargar imágenes para ResultPage
  useEffect(() => {
    const preloadImages = ["/images/happy.webp", "/images/sadge.webp"];
    preloadImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Al cambiar el modo de juego desde el menú la partida empieza de nuevo
  useEffect(() => {
    setFinished(false);
  }, [maxPoints]);

  // Ir a la página de resultado cuando termine la partida. Mientras carga, el tablero queda como está
  // (sin toques): la página nueva ya viene renderizada y el navegador pasa de una a otra con un fundido.
  useEffect(() => {
    if (finished && winner) {
      window.location.assign(`/resultado/${winner.toLowerCase()}`);
    }
  }, [finished, winner]);

  const handleWin = useCallback((winner) => {
    setWinner(winner);
    setFinished(true);
  }, []);

  return (
    <div className="board">
      <Analytics />
      <Counter
        title="NOSOTROS"
        displayName={teamNames.NOSOTROS}
        maxPoints={maxPoints}
        cargada={cargada}
        finished={finished}
        onWin={() => handleWin("NOSOTROS")}
      />
      <Counter
        title="ELLOS"
        displayName={teamNames.ELLOS}
        maxPoints={maxPoints}
        cargada={cargada}
        finished={finished}
        onWin={() => handleWin("ELLOS")}
      />
    </div>
  );
};

export default Board;
