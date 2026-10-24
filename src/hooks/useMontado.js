import { useEffect, useState } from "react";

// false en el build y en el primer render del navegador; true después de hidratar.
// Para lo que solo se puede dibujar en el navegador sin que la hidratación difiera del HTML del build.
export const useMontado = () => {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  return montado;
};
