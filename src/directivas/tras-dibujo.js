// client:tras-dibujo — hidrata la isla después del primer dibujo del navegador.
// Es la misma lógica que tenía src/index.js en la versión CRA: si React corre antes del primer dibujo,
// ocupa el hilo y atrasa el primer dibujo (y el LCP). El HTML de la isla ya viene renderizado del build,
// así que se ve igual; solo se demora el momento en que React toma el control.
// El JS se empieza a descargar enseguida; lo que espera es la hidratación.
// En una pestaña oculta requestAnimationFrame no corre, así que ahí se hidrata directo.
const trasDibujo = (load) => {
  const listo = load();
  const hidratar = async () => {
    const hydrate = await listo;
    await hydrate();
  };
  if (document.visibilityState === "visible") {
    requestAnimationFrame(() => setTimeout(hidratar, 0));
  } else {
    hidratar();
  }
};

export default trasDibujo;
