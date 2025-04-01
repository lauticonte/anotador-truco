import React from "react";
import "../styles/Changelog.css";

const Changelog = ({ isVisible, onClose }) => {
  const CloseIcon = () => (
    <svg
      className="svg-history-icon"
      aria-hidden="true"
      focusable="false"
      data-prefix="fas"
      data-icon="times"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 352 512"
    >
      <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
    </svg>


  );

  const changelog = [
    {
        version: "1.4.0",
        date: "31/03/2025",
        changes: [
          "Nuevo sistema de personalización de nombres para equipos.",
          "Mejoras en el sistema VAR con animaciones y diseño renovado.",
          "Opciones de revancha mejoradas al finalizar la partida.",
          "Nuevo diseño de la pantalla de resultados.",
          "Optimización del rendimiento general de la aplicación.",
          "Corrección de errores en el conteo de puntos."
        ]
      },
    {
        version: "1.3.0",
        date: "13/01/2025",
        changes: [
          "Implementación VAR de puntos con acciones detalladas.",
          "Menú lateral interactivo con acceso al historial y cambio de modo de juego.",
          "Rediseño del menú: botones estilizados, efectos hover y transiciones suaves.",
          "Indicadores de estado en el historial para puntos ganados o perdidos.",
          "Fix de duplicación de mensaje 'GANAMOS/GANARON'.",
          "Mejoras en transiciones de 'Malas' y 'Buenas' en el marcador."
        ]
      },
      {
        version: "1.1.0",
        date: "14/11/2024",
        changes: [
          "Botón en header para alternar entre 15 o 30 puntos.",
          "Dos nuevos botones de revancha (15 y 30 puntos) al finalizar la partida.",
          "Nueva fuente principal.",
          "Rediseño del header para una mejor distribución.",
          "Mejoras en el marcador a 15 puntos.",
          "Ajustes para mejorar la alineación visual."
        ]
      },
      {
        version: "1.0.1",
        date: "05/11/2024",
        changes: [
          "Implementación de la funcionalidad de 'Revancha'.",
          "Envío de feedback en tiempo real integrado con Telegram.",
          "Compatibilidad multidispositivo: desktop y mobile.",
          "Optimización de rendimiento general."
        ]
      },
    {
      version: "1.0.0",
      date: "18/05/2022",
      changes: [
        "Lanzamiento oficial de la aplicación."
      ]
    }
  ];
  
  

  return (
    <div className={`changelog-overlay ${isVisible ? "visible" : ""}`}>
      <div className="changelog-modal">
        <div className="changelog-header">
          <h2>NOVEDADES</h2>
          <div className="changelog-actions">
            <a className="github-button" href="https://github.com/lauticonte/anotador-truco/releases" target="_blank" rel="noopener noreferrer">
                <i class='bx bxl-github bx-md' ></i>
            </a>
            <button className="close-button" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
        </div>
        
        <div className="changelog-content">
          {changelog.map((release, index) => (
            <div key={index} className="changelog-release">
              <div className="release-header">
                <h3>Versión {release.version}</h3>
                <span className="release-date">{release.date}</span>
              </div>
              <ul className="release-changes">
                {release.changes.map((change, changeIndex) => (
                  <li key={changeIndex}>{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Changelog; 