// Estado de la partida compartido entre islas (menú, tablero, resultado).
// Las islas se renderizan en el build con los valores por defecto; lo guardado en localStorage
// se lee recién en el navegador, después de hidratar (cargarPartida), para que el primer render
// del navegador sea igual al HTML del build.
import { atom } from "nanostores";

export const DEFAULT_NAMES = { NOSOTROS: "NOSOTROS", ELLOS: "ELLOS" };

export const maxPoints = atom(30);
export const teamNames = atom(DEFAULT_NAMES);
// true cuando ya se leyó localStorage: los contadores esperan esto para restaurar sus puntos
export const partidaCargada = atom(false);

export const cargarPartida = () => {
  if (partidaCargada.get()) return;
  const savedMaxPoints = parseInt(localStorage.getItem("maxPoints"), 10);
  maxPoints.set(savedMaxPoints || 30);
  const savedNames = localStorage.getItem("teamNames");
  teamNames.set(savedNames ? JSON.parse(savedNames) : DEFAULT_NAMES);
  partidaCargada.set(true);
};

export const toggleMaxPoints = () => {
  const newMaxPoints = maxPoints.get() === 30 ? 15 : 30;
  // 1) Forzar flush del historial buffered antes de limpiar
  try {
    window.dispatchEvent(new Event("flushHistory"));
  } catch (_) {}

  // 2) Resetear historial VAR completamente al cambiar el modo
  try {
    localStorage.setItem("history", JSON.stringify([]));
  } catch (_) {}

  maxPoints.set(newMaxPoints);
  localStorage.setItem("maxPoints", newMaxPoints);
};

export const resetGame = (points) => {
  const history = JSON.parse(localStorage.getItem("history")) || [];
  const filteredHistory = history.filter(
    (entry) => entry.action.includes("GANAMOS") || entry.action.includes("GANARON")
  );
  localStorage.setItem("history", JSON.stringify(filteredHistory));

  localStorage.removeItem("points-NOSOTROS");
  localStorage.removeItem("points-ELLOS");
  localStorage.removeItem("stage-NOSOTROS");
  localStorage.removeItem("stage-ELLOS");

  maxPoints.set(points);
  localStorage.setItem("maxPoints", points);
};

export const saveNames = (newNames) => {
  teamNames.set(newNames);
  localStorage.setItem("teamNames", JSON.stringify(newNames));
};
