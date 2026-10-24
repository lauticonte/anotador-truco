import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import Counter from "./Counter.jsx";
import { Analytics } from "@vercel/analytics/react";
import { navigate } from "astro:transitions/client";
import { useStoreTrasMontar } from "../hooks/useMontado.js";
import { cargarPartida, DEFAULT_NAMES, maxPoints as maxPointsStore, partidaCargada, teamNames as teamNamesStore } from "../stores/partida.js";

// Cuánto se ve el fósforo ganador antes de pasar al resultado (chispazo y llama de Counter.css)
const DURACION_FINAL = 1400;
const DURACION_FINAL_SIN_ANIMACION = 300;

// En el build no hay layout: useLayoutEffect solo avisa. En el navegador corre antes del dibujo.
const useLayoutEffectEnNavegador = typeof window === "undefined" ? useEffect : useLayoutEffect;

const Board = () => {
  // Hasta montar, los valores del build: al volver al tablero sin recargar, el store ya tiene la partida
  const maxPoints = useStoreTrasMontar(useStore(maxPointsStore), 30);
  const teamNames = useStoreTrasMontar(useStore(teamNamesStore), DEFAULT_NAMES);
  const cargada = useStoreTrasMontar(useStore(partidaCargada), false);
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

  // Partida terminada: el último fósforo se coloca y se prende (Counter.css) y después se pasa al resultado
  // con un fundido. La página del resultado se precarga mientras dura la animación, así no hay espera extra.
  useEffect(() => {
    if (!finished || !winner) return;
    const url = `/resultado/${winner.toLowerCase()}`;
    const precarga = document.createElement("link");
    precarga.rel = "prefetch";
    precarga.href = url;
    document.head.appendChild(precarga);
    const sinAnimacion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => navigate(url), sinAnimacion ? DURACION_FINAL_SIN_ANIMACION : DURACION_FINAL);
    return () => clearTimeout(timer);
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
