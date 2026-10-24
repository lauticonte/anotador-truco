// Contenido de la guía del truco (antes en src/components/pages/GuiaTruco.js)

export const TABS = [
  { id: "cartas", label: "Cartas" },
  { id: "puntos", label: "Puntos" },
  { id: "anotador", label: "El anotador" },
];

// De la más alta a la más baja
export const CARD_RANKING = [
  { card: "1 de espada", name: "Ancho de espada" },
  { card: "1 de basto", name: "Ancho de basto" },
  { card: "7 de espada", name: "Siete de espada" },
  { card: "7 de oro", name: "Siete de oro" },
  { card: "3", name: "Los tres", any: true },
  { card: "2", name: "Los dos", any: true },
  { card: "1 de copa y de oro", name: "Anchos falsos" },
  { card: "12", name: "Los reyes", any: true },
  { card: "11", name: "Los caballos", any: true },
  { card: "10", name: "Las sotas", any: true },
  { card: "7 de copa y de basto", name: "Sietes falsos" },
  { card: "6", name: "Los seis", any: true },
  { card: "5", name: "Los cinco", any: true },
  { card: "4", name: "Los cuatro", any: true },
];

export const CANTOS = [
  { group: "Envido" },
  { name: "Envido", wanted: "2", notWanted: "1" },
  { name: "Real envido", wanted: "3", notWanted: "1" },
  { name: "Falta envido", wanted: "Lo que falta", notWanted: "1" },
  { group: "Truco" },
  { name: "Sin cantar", wanted: "1", notWanted: "—" },
  { name: "Truco", wanted: "2", notWanted: "1" },
  { name: "Retruco", wanted: "3", notWanted: "2" },
  { name: "Vale cuatro", wanted: "4", notWanted: "3" },
  { group: "Flor" },
  { name: "Flor", wanted: "3", notWanted: "—" },
];

export const FAQ = [
  {
    q: "¿Se guardan los puntos si cierro el navegador?",
    a: "Sí. La partida se guarda en tu dispositivo y sigue donde la dejaste cuando volvés a entrar.",
  },
  {
    q: "¿Cómo empiezo una partida nueva?",
    a: "Desde el menú, elegí jugar a 15 o a 30: el marcador vuelve a cero. Cuando un equipo gana, también podés arrancar la revancha desde la pantalla de resultado.",
  },
  {
    q: "¿Me equivoqué al sumar, cómo lo corrijo?",
    a: "Tocá el botón − del equipo. La corrección queda registrada en el VAR.",
  },
  {
    q: "¿Funciona en la computadora?",
    a: "Sí, funciona en celular, tablet o computadora.",
  },
];

export const GUIA = {
  title: "Valores del truco: tabla de cartas, envido y puntos | Truqito",
  description:
    "Tabla de valores del truco argentino: el orden de las cartas de la más alta a la más baja, cómo se calcula el envido y cuántos puntos vale cada canto.",
  path: "/guia-truco",
};
