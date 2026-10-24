import { useEffect, useState } from "react";

// false en el build y en el primer render del navegador; true después de hidratar.
// Para lo que solo se puede dibujar en el navegador sin que la hidratación difiera del HTML del build.
export const useMontado = () => {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  return montado;
};

// Valor de un store para el render, pero el del build hasta que la isla monta. Entre páginas (ClientRouter)
// los stores conservan la partida ya cargada, y la isla nueva tiene que hidratar igual que su HTML del build.
export const useStoreTrasMontar = (valor, valorBuild) => (useMontado() ? valor : valorBuild);
