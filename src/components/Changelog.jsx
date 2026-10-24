import React from "react";
import SheetCloseButton from "./SheetCloseButton.jsx";
import "../styles/Sheet.css";
import "../styles/Changelog.css";

const Changelog = ({ isVisible, onClose }) => {
  const changelog = [
    {
      version: "1.5.0",
      date: "14/10/2026",
      changes: [
        "Nuevo VAR: el marcador arriba y la partida jugada por jugada, con los puntos de cada equipo de su lado.",
        "Editar nombres y Novedades con nuevo diseño.",
        "Nueva Guía del truco: valores de las cartas, envido y cuánto vale cada canto, en tres pestañas.",
        "Borrar el historial del VAR ahora pide confirmación.",
        "Arreglo del menú en pantallas chicas y de la barra blanca al abrir el teclado."
      ]
    },
    {
      version: "1.4.6",
      date: "14/10/2026",
      changes: [
        "Nuevos fósforos realistas en el marcador.",
        "Nueva guía para mostrar que se puede tocar el tablero para sumar.",
        "Animación al sumar un punto.",
        "Arreglo de la pantalla de resultado: el botón Enviar ya no queda tapado por la publicidad.",
        "Footer más compacto."
      ]
    },
    {
      version: "1.4.5",
      date: "14/10/2026",
      changes: [
        "La publicidad ahora tiene su propio espacio abajo y ya no tapa los botones de sumar y restar.",
        "Arreglo de los palitos que se veían cortados en pantallas chicas.",
        "Corrección del logo en la pantalla de resultado."
      ]
    },
    {
      version: "1.4.4",
      date: "02/01/2026",
      changes: [
        "Corrección del scroll en modales y menús.",
        "Arreglo del botón 'REVISÁ' que no se mostraba correctamente en todos los dispositivos."
      ]
    },
    {
      version: "1.4.3",
      date: "09/12/2025",
      changes: [
        "Tocá los palitos para sumar puntos directamente.",
        "Mejoras en la interacción táctil del marcador."
      ]
    },
    {
      version: "1.4.2",
      date: "28/10/2025",
      changes: [
        "Nueva Guía del Truco: valores de cartas, reglas y tutorial completo.",
        "Diseño profesional UX/UI con gradientes y micro-interacciones.",
        "Sección de preguntas frecuentes (FAQ) interactiva.",
        "Tabla completa de valores del truco argentino.",
        "Tutoriales sobre envido, flor y cómo usar el contador.",
        "Mejoras en SEO y navegación interna."
      ]
    },
    {
      version: "1.4.1",
      date: "21/09/2025",
      changes: [
        "Optimización de carga inicial con carga diferida.",
        "Imágenes optimizadas y eliminación de duplicados.",
        "VAR guardado en lote.",
        "Ajustes menores de rendimiento y estabilidad."
      ]
    },
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
    <div className={`sheet-overlay ${isVisible ? "visible" : ""}`} onClick={onClose}>
      <div className="sheet sheet-tall" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Novedades">
        <header className="sheet-header">
          <h2 className="sheet-title">
            <span className="sheet-badge">v{changelog[0].version}</span>
            <span>Novedades</span>
          </h2>
          <SheetCloseButton onClick={onClose} />
        </header>

        <ol className="releases">
          {changelog.map((release, index) => (
            <li key={release.version} className={`release ${index === 0 ? "release-current" : ""}`}>
              <div className="release-heading">
                <span className="release-version">Versión {release.version}</span>
                {index === 0 && <span className="release-tag">Actual</span>}
                <span className="release-date">{release.date}</span>
              </div>
              <ul className="release-changes">
                {release.changes.map((change, changeIndex) => (
                  <li key={changeIndex}>{change}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <footer className="sheet-footer">
          <a
            className="sheet-secondary"
            href="https://github.com/lauticonte/anotador-truco"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver el código en GitHub
          </a>
        </footer>
      </div>
    </div>
  );
};

export default Changelog;
