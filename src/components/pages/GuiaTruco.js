import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta.js";
import "../../styles/GuiaTruco.css";

const GuiaTruco = () => {
  usePageMeta({
    title:
      "Guía Completa del Truco Argentino - Valores, Reglas y Cómo Usar el Contador",
    description:
      "Aprende los valores del truco argentino, cómo contar los puntos y usar nuestro contador online. Tabla completa de cartas, reglas y tutorial paso a paso.",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="guia-container">
      {/* Botón sticky para volver */}
      <nav className="guia-sticky-back">
        <Link to="/" className="back-chip">
          ← Volver
        </Link>
      </nav>

      <header className="guia-header">
        <h1>Guía del Truco Argentino</h1>
        <p className="guia-subtitle">
          Valores, puntos y cómo usar el contador. <br /> Rápido y claro.
        </p>
        <span className="guia-underline" />
      </header>

      {/* Índice de navegación */}
      <nav className="guia-index">
        <h2>Contenidos</h2>
        <ul>
          <li>
            <a className="guia-card" href="#valores">
              <p className="guia-card-title">Valores del Truco</p>
              <p className="guia-card-desc">
                Tabla completa de cartas, envido y flor
              </p>
            </a>
          </li>
          <li>
            <a className="guia-card" href="#puntos-reglas">
              <p className="guia-card-title">Puntos y Reglas</p>
              <p className="guia-card-desc">
                Malas y buenas, puntajes y diferencias
              </p>
            </a>
          </li>
          <li>
            <a className="guia-card" href="#como-usar">
              <p className="guia-card-title">Cómo Usar el Contador</p>
              <p className="guia-card-desc">
                Funciones del menú y tips rápidos
              </p>
            </a>
          </li>
        </ul>
      </nav>

      {/* Sección 1: Valores del Truco */}
      <section id="valores" className="guia-section">
        <h2>Valores del Truco Argentino</h2>

        <h3>Tabla de Valores de las Cartas</h3>
        <p>
          En el truco argentino, no todas las cartas tienen el mismo valor. Acá
          te mostramos la escala completa de valores, desde la carta más alta
          hasta la más baja:
        </p>

        <div className="valores-table">
          <table>
            <thead>
              <tr>
                <th>Pos.</th>
                <th>Carta</th>
                <th>Nombre Popular</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1°</td>
                <td>1 de Espada</td>
                <td>Ancho de Espada</td>
              </tr>
              <tr>
                <td>2°</td>
                <td>1 de Basto (As de Basto)</td>
                <td>Ancho de Basto</td>
              </tr>
              <tr>
                <td>3°</td>
                <td>7 de Espada</td>
                <td>La Espada</td>
              </tr>
              <tr>
                <td>4°</td>
                <td>7 de Oros</td>
                <td>El Oro / La Moneda</td>
              </tr>
              <tr>
                <td>5°</td>
                <td>3 de cualquier palo</td>
                <td>Los Tres</td>
              </tr>
              <tr>
                <td>6°</td>
                <td>2 de cualquier palo</td>
                <td>Los Dos</td>
              </tr>
              <tr>
                <td>7°</td>
                <td>1 de Copa o 1 de Oros (Falsos)</td>
                <td>Anchos Falsos</td>
              </tr>
              <tr>
                <td>8°</td>
                <td>12 (Rey) de cualquier palo</td>
                <td>Los Reyes</td>
              </tr>
              <tr>
                <td>9°</td>
                <td>11 (Caballo) de cualquier palo</td>
                <td>Los Caballos</td>
              </tr>
              <tr>
                <td>10°</td>
                <td>10 (Sota) de cualquier palo</td>
                <td>Las Sotas</td>
              </tr>
              <tr>
                <td>11°</td>
                <td>7 de Copa o 7 de Basto</td>
                <td>Sietes Falsos</td>
              </tr>
              <tr>
                <td>12°</td>
                <td>6 de cualquier palo</td>
                <td>Los Seis</td>
              </tr>
              <tr>
                <td>13°</td>
                <td>5 de cualquier palo</td>
                <td>Los Cinco</td>
              </tr>
              <tr>
                <td>14°</td>
                <td>4 de cualquier palo</td>
                <td>Los Cuatro</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Envido y Real Envido</h3>
        <p>
          El envido se juega con las cartas del mismo palo. Los valores para el
          envido son:
        </p>
        <ul>
          <li>
            <strong>7, 6, 5, 4, 3, 2, 1:</strong> Valen su número
          </li>
          <li>
            <strong>Rey (12), Caballo (11), Sota (10):</strong> Valen 0 puntos
          </li>
        </ul>
        <p>
          Para calcular el envido, se suman los valores de las dos cartas más
          altas del mismo palo y se le agregan 20 puntos. Por ejemplo: si tenés
          un 7 y un 6 de Espada, tu envido es 33 (7 + 6 + 20 = 33).
        </p>

        <div className="envido-ejemplos">
          <h4>Ejemplos de Envido</h4>
          <ul>
            <li>
              7 de Oro + 6 de Oro = <strong>33 puntos</strong> (el máximo)
            </li>
            <li>
              5 de Copa + 4 de Copa = <strong>29 puntos</strong>
            </li>
            <li>
              Rey + 7 de Espada = <strong>27 puntos</strong> (0 + 7 + 20)
            </li>
            <li>Sin dos cartas del mismo palo = La carta más alta + 20</li>
          </ul>
        </div>

        <h3>La Flor</h3>
        <p>
          La flor se da cuando tenés tres cartas del mismo palo. Se canta "Flor"
          antes que el envido. El valor de la flor es la suma de las tres cartas
          más 20 puntos.
        </p>

        <h3>Truco, Retruco y Vale Cuatro</h3>
        <div className="truco-valores">
          <ul>
            <li>
              <strong>Truco:</strong> Vale 2 puntos
            </li>
            <li>
              <strong>Retruco:</strong> Vale 3 puntos
            </li>
            <li>
              <strong>Vale Cuatro:</strong> Vale 4 puntos
            </li>
            <li>
              <strong>Queremos Ver:</strong> También vale 4 puntos (si se canta
              después de Vale Cuatro)
            </li>
          </ul>
        </div>

        <p className="nota">
          <strong>Nota:</strong> En el truco uruguayo, los valores pueden
          cambiar ligeramente. Nuestro anotador está optimizado para el truco
          argentino tradicional.
        </p>
      </section>

      {/* Sección 2: Puntos y Reglas */}
      <section id="puntos-reglas" className="guia-section">
        <h2>Puntos y Reglas: Cómo Contar los Tantos</h2>

        <h3>Malas y Buenas</h3>
        <p>
          Una partida de truco se divide en dos etapas según los puntos que
          tenga cada equipo:
        </p>
        <ul>
          <li>
            <strong>Malas:</strong> De 0 a 15 puntos
          </li>
          <li>
            <strong>Buenas:</strong> De 16 a 30 puntos
          </li>
        </ul>
        <p>
          En nuestro anotador, vas a ver un indicador visual que muestra si
          estás en "Malas" o "Buenas". Cuando llegás a los 16 puntos, el
          contador cambia automáticamente a la etapa de Buenas.
        </p>

        <h3>Cómo se Suman los Puntos</h3>
        <p>Los puntos se suman de la siguiente manera:</p>

        <div className="puntos-tabla">
          <h4>Puntos por Envido</h4>
          <ul>
            <li>
              <strong>Envido:</strong> 2 puntos
            </li>
            <li>
              <strong>Real Envido:</strong> 3 puntos
            </li>
            <li>
              <strong>Falta Envido:</strong> Los puntos que le faltan al que va
              ganando para llegar a 30, o 30 si va perdiendo
            </li>
          </ul>

          <h4>Puntos por Truco</h4>
          <ul>
            <li>
              <strong>Truco no cantado:</strong> 1 punto (si ganás la mano)
            </li>
            <li>
              <strong>Truco querido:</strong> 2 puntos
            </li>
            <li>
              <strong>Retruco querido:</strong> 3 puntos
            </li>
            <li>
              <strong>Vale Cuatro querido:</strong> 4 puntos
            </li>
          </ul>

          <h4>Puntos por Flor</h4>
          <ul>
            <li>
              <strong>Flor:</strong> 3 puntos
            </li>
            <li>
              <strong>Contraflor:</strong> 6 puntos
            </li>
            <li>
              <strong>Contraflor al resto:</strong> Los puntos que faltan para
              ganar
            </li>
          </ul>
        </div>

        <h3>Partidas a 15 o a 30</h3>
        <p>El truco se puede jugar de dos maneras:</p>
        <ul>
          <li>
            <strong>A 15 puntos:</strong> Partidas más rápidas, ideales para
            cuando tenés poco tiempo
          </li>
          <li>
            <strong>A 30 puntos:</strong> Partidas completas, tradicionales, con
            Malas y Buenas
          </li>
        </ul>
        <p>
          En nuestro anotador, podés cambiar entre estos dos modos desde el
          menú. Los puntos se ajustan automáticamente.
        </p>

        <h3>Diferencias con el Truco Uruguayo</h3>
        <p>El truco uruguayo tiene algunas diferencias con el argentino:</p>
        <ul>
          <li>
            Las cartas "negras" (4 de Basto, 4 de Espada, 5 de Basto, 5 de
            Espada) tienen valores especiales
          </li>
          <li>Hay diferentes cantos y valores de puntos</li>
          <li>Se juega con reglas de descarte diferentes</li>
        </ul>
        <p>
          Nuestro contador funciona para ambas variantes, pero está optimizado
          para el truco argentino.
        </p>
      </section>

      {/* Sección 3: Cómo Usar el Contador */}
      <section id="como-usar" className="guia-section">
        <h2>Cómo Usar el Contador de Truco</h2>

        <h3>Interfaz Principal</h3>
        <p>
          El anotador de truco está diseñado para ser simple y rápido de usar.
          En la pantalla principal vas a ver:
        </p>
        <ul>
          <li>
            <strong>Dos contadores:</strong> Uno para "Nosotros" y otro para
            "Ellos"
          </li>
          <li>
            <strong>Botones + y -:</strong> Para sumar o restar puntos
          </li>
          <li>
            <strong>Indicador de etapa:</strong> Muestra si estás en Malas
            (hasta 15) o Buenas (16 a 30)
          </li>
          <li>
            <strong>Puntos visuales:</strong> Las líneas que ves representan los
            puntos al estilo anotador clásico
          </li>
        </ul>

        <h3>Funcionalidades del Menú</h3>
        <p>
          Desde el menú (las tres rayitas arriba a la derecha) podés acceder a:
        </p>

        <div className="funcionalidades">
          <h4>🎥 IR AL VAR</h4>
          <p>
            Como en el fútbol, tenemos nuestro propio VAR (Video Asistencia al
            Referee). Acá podés ver el historial completo de la partida: quién
            sumó puntos, cuándo, y cuánto. Perfecto para resolver discusiones
            sobre el puntaje.
          </p>

          <h4>🔄 JUGAR A 15 o A 30</h4>
          <p>
            Cambiá rápidamente entre partidas a 15 puntos o a 30 puntos. Cuando
            cambias el modo, el juego se reinicia automáticamente.
          </p>

          <h4>✏️ EDITAR NOMBRES</h4>
          <p>
            ¿Cansado de "Nosotros" y "Ellos"? Cambiá los nombres de los equipos
            para personalizar tu partida. Los nombres se guardan
            automáticamente.
          </p>

          <h4>ℹ️ NOVEDADES</h4>
          <p>
            Mirá las últimas actualizaciones y mejoras que le fuimos haciendo al
            anotador.
          </p>
        </div>

        <h3>Tips y Trucos de Uso</h3>
        <div className="tips">
          <ul>
            <li>
              <strong>Agregá la app al inicio:</strong> Desde el navegador,
              seleccioná "Agregar a pantalla de inicio" para tener el anotador
              como una app en tu celular. Consume menos batería y carga más
              rápido.
            </li>
            <li>
              <strong>Funciona sin internet:</strong> Una vez cargada, la app
              funciona offline. Ideal para esas reuniones en lugares sin señal.
            </li>
            <li>
              <strong>El VAR es tu amigo:</strong> Si hay dudas sobre el
              puntaje, revisá el VAR. Ahí está todo registrado con hora y
              acción.
            </li>
          </ul>
        </div>

        <h3>Preguntas Frecuentes</h3>
        <div className="faq">
          <details>
            <summary>¿Se guardan los puntos si cierro el navegador?</summary>
            <p>
              Sí, los puntos se guardan automáticamente en tu dispositivo. Podés
              cerrar el navegador y cuando vuelvas a entrar, la partida sigue
              donde la dejaste.
            </p>
          </details>

          <details>
            <summary>¿Puedo usar el anotador en mi computadora?</summary>
            <p>
              Sí, el anotador funciona en cualquier dispositivo: celular, tablet
              o computadora. El diseño se adapta automáticamente al tamaño de
              pantalla.
            </p>
          </details>

          <details>
            <summary>¿Cómo reseteo una partida?</summary>
            <p>
              Cuando una partida termina (alguien llega a 30 puntos), aparece
              una pantalla de victoria donde podés elegir jugar la revancha a 15
              o a 30 puntos.
            </p>
          </details>
        </div>
      </section>

      {/* Footer de la guía */}
      <footer className="guia-footer">
        <p>
          ¿Falta algo en esta guía?{" "}
          <a href="mailto:lauticonte@gmail.com">Escribinos</a> y lo agregamos.
        </p>
      </footer>
    </div>
  );
};

export default GuiaTruco;
