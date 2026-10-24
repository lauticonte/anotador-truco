// Temporal (spike del paso 1): comprueba que una isla se renderiza en el build y se hidrata después.
import React, { useEffect, useState } from "react";

const SpikeIsla = () => {
  const [hidratada, setHidratada] = useState(false);
  useEffect(() => setHidratada(true), []);
  return <p id="spike-isla">{hidratada ? "isla hidratada" : "isla renderizada en el build"}</p>;
};

export default SpikeIsla;
