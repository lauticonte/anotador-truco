// Pestañas de la guía: el contenido de todas ya está en el HTML. Solo se alterna cuál se ve.
export const activarPestanas = (contenedor) => {
  if (!contenedor) return;
  const pestanas = [...contenedor.querySelectorAll('[role="tab"]')];
  pestanas.forEach((pestana) => {
    pestana.addEventListener("click", () => {
      pestanas.forEach((otra) => {
        const activa = otra === pestana;
        otra.setAttribute("aria-selected", String(activa));
        otra.classList.toggle("guia-tab-active", activa);
        contenedor.querySelector(`#${otra.getAttribute("aria-controls")}`).hidden = !activa;
      });
    });
  });
};
