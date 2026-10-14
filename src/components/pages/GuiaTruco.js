import React, { useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta.js";
import "../../styles/GuiaTruco.css";

const TABS = [
  { id: "cartas", label: "Cartas" },
  { id: "puntos", label: "Puntos" },
  { id: "anotador", label: "El anotador" },
];

// De la más alta a la más baja
const CARD_RANKING = [
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

const CANTOS = [
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

const FAQ = [
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

const GuiaTruco = () => {
  usePageMeta({
    title: "Valores del truco: tabla de cartas, envido y puntos | Truqito",
    description:
      "Tabla de valores del truco argentino: el orden de las cartas de la más alta a la más baja, cómo se calcula el envido y cuántos puntos vale cada canto.",
    path: "/guia-truco",
  });

  const [tab, setTab] = useState("cartas");

  return (
    <div className="guia">
      <header className="guia-bar">
        <Link to="/" className="guia-back" aria-label="Volver al anotador">
          ←
        </Link>
        <h1 className="guia-title">Guía del truco</h1>
      </header>

      <nav className="guia-tabs" role="tablist" aria-label="Secciones de la guía">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            className={`guia-tab ${tab === id ? "guia-tab-active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="guia-panels">
        {/* Cartas */}
        <section
          id="panel-cartas"
          role="tabpanel"
          aria-labelledby="tab-cartas"
          className="guia-panel"
          hidden={tab !== "cartas"}
        >
          <h2 className="guia-h2">Valores de las cartas del truco</h2>
          <p className="guia-lead">De la más alta a la más baja. Se juega con mazo español de 40 cartas (sin 8 ni 9).</p>
          <ol className="guia-ranking">
            {CARD_RANKING.map(({ card, name, any }, i) => (
              <li key={card} className={i < 4 ? "guia-ranking-top" : ""}>
                <span className="guia-ranking-pos">{i + 1}</span>
                <span className="guia-ranking-name">{name}</span>
                <span className="guia-ranking-card">{any ? `${card} de cualquier palo` : card}</span>
              </li>
            ))}
          </ol>

          <h2 className="guia-h2">Envido</h2>
          <p>
            Con dos cartas del mismo palo, se suman sus valores más 20. Las figuras (10, 11 y 12) valen 0.
          </p>
          <ul className="guia-examples">
            <li>
              <span>7 y 6 de oro</span>
              <span className="guia-math">7 + 6 + 20 = <strong>33</strong></span>
            </li>
            <li>
              <span>12 y 7 de espada</span>
              <span className="guia-math">0 + 7 + 20 = <strong>27</strong></span>
            </li>
            <li>
              <span>Sin dos del mismo palo</span>
              <span className="guia-math">la más alta: 7 → <strong>7</strong></span>
            </li>
          </ul>
          <p className="guia-note">El envido más alto posible es 33.</p>

          <h2 className="guia-h2">Flor</h2>
          <p>
            Tres cartas del mismo palo. Se canta antes que el envido y vale la suma de las tres más 20. Solo se juega si
            se acordó antes de empezar.
          </p>
        </section>

        {/* Puntos */}
        <section
          id="panel-puntos"
          role="tabpanel"
          aria-labelledby="tab-puntos"
          className="guia-panel"
          hidden={tab !== "puntos"}
        >
          <h2 className="guia-h2">Puntos del truco: cuánto vale cada canto</h2>
          <table className="guia-table">
            <thead>
              <tr>
                <th scope="col">Canto</th>
                <th scope="col">Quiero</th>
                <th scope="col">No quiero</th>
              </tr>
            </thead>
            <tbody>
              {CANTOS.map((row) =>
                row.group ? (
                  <tr key={`group-${row.group}`} className="guia-table-group">
                    <th scope="rowgroup" colSpan={3}>
                      {row.group}
                    </th>
                  </tr>
                ) : (
                  <tr key={row.name}>
                    <th scope="row">{row.name}</th>
                    <td>{row.wanted}</td>
                    <td>{row.notWanted}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
          <p className="guia-note">
            La falta envido vale los puntos que le faltan al que va ganando para terminar el partido.
          </p>
          <p className="guia-note">
            La contraflor y la contraflor al resto cambian según cómo se juegue: conviene acordarlas antes de empezar.
          </p>
          <p className="guia-note">
            Los cantos de envido se pueden encadenar (envido, envido, real envido…): si se quieren, se suman todos; si no,
            se cobra lo cantado hasta antes del último.
          </p>

          <h2 className="guia-h2">Malas y buenas</h2>
          <p>
            A 30 puntos, la partida se divide en dos mitades: las <strong>malas</strong> (del 1 al 15) y las{" "}
            <strong>buenas</strong> (del 16 al 30). Gana el primero que llega a 15 buenas.
          </p>

          <h2 className="guia-h2">A 15 o a 30</h2>
          <p>
            A 15 es una partida corta, sin malas ni buenas. A 30 es la partida completa. En el anotador lo elegís desde el
            menú.
          </p>

          <h2 className="guia-h2">Truco uruguayo</h2>
          <p>
            Se da vuelta una carta, la <strong>muestra</strong>. El 2, 4, 5, 10 y 11 de ese palo (las piezas) pasan a ser
            las cartas más altas y cambian el envido. El anotador sirve igual para contar los puntos.
          </p>
        </section>

        {/* El anotador */}
        <section
          id="panel-anotador"
          role="tabpanel"
          aria-labelledby="tab-anotador"
          className="guia-panel"
          hidden={tab !== "anotador"}
        >
          <h2 className="guia-h2">Cómo anotar</h2>
          <ul className="guia-list">
            <li>
              <strong>Tocá el tablero</strong> de un equipo para sumarle un punto: aparece un fósforo nuevo.
            </li>
            <li>
              <strong>Botones + y −</strong> para sumar o corregir.
            </li>
            <li>
              Arriba de cada tablero ves si el equipo está en <strong>malas</strong> o en <strong>buenas</strong>.
            </li>
          </ul>

          <h2 className="guia-h2">En el menú</h2>
          <dl className="guia-menu">
            <div>
              <dt>VAR</dt>
              <dd>Toda la partida jugada por jugada: quién sumó, cuánto y a qué hora. Para terminar las discusiones.</dd>
            </div>
            <div>
              <dt>Jugar a 15 / a 30</dt>
              <dd>Cambia el modo y empieza una partida nueva.</dd>
            </div>
            <div>
              <dt>Editar nombres</dt>
              <dd>Ponele nombre a cada equipo.</dd>
            </div>
            <div>
              <dt>Novedades</dt>
              <dd>Qué cambió en cada versión.</dd>
            </div>
          </dl>

          <h2 className="guia-h2">Tip</h2>
          <p>
            Desde el navegador, elegí <strong>Agregar a pantalla de inicio</strong> y vas a tener el anotador como una app.
          </p>

          <h2 className="guia-h2">Preguntas frecuentes</h2>
          <div className="guia-faq">
            {FAQ.map(({ q, a }) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>

          <p className="guia-contact">
            ¿Falta algo? <a href="mailto:lauticonte@gmail.com">Escribinos</a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default GuiaTruco;
