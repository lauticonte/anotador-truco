import React, { lazy, Suspense, useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { useMontado } from "../hooks/useMontado.js";
import {
  cargarPartida,
  maxPoints as maxPointsStore,
  saveNames,
  teamNames as teamNamesStore,
  toggleMaxPoints,
} from "../stores/partida.js";

// 🚀 LAZY LOADING - Solo cargan cuando se necesitan
const History = lazy(() => import("./History.jsx"));
const EditNames = lazy(() => import("./EditNames.jsx"));
const Changelog = lazy(() => import("./Changelog.jsx"));

// Menú lateral. Va dentro del header fijo del layout (el logo es HTML estático) y se renderiza en el build:
// el botón ya está en el HTML. Los paneles (VAR, nombres, novedades) se cargan recién en el navegador.
const Menu = () => {
  const maxPoints = useStore(maxPointsStore);
  const teamNames = useStore(teamNamesStore);
  const montado = useMontado();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [logoSlide, setLogoSlide] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [isEditNamesVisible, setIsEditNamesVisible] = useState(false);
  const [isChangelogVisible, setIsChangelogVisible] = useState(false);

  // En la guía y en el resultado no hay tablero: el menú carga la partida para mostrar el modo y los nombres
  useEffect(() => {
    cargarPartida();
  }, []);

  useEffect(() => {
    // Secuencia de animación
    const slideTimer = setTimeout(() => {
      setLogoSlide(true);
    }, 6500);

    const tooltipTimer = setTimeout(() => {
      setShowTooltip(true);
    }, 6500);

    // Revertir la animación
    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
      setTimeout(() => setLogoSlide(false), 100);
    }, 60000);

    return () => {
      clearTimeout(slideTimer);
      clearTimeout(tooltipTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // El header no se recarga entre páginas (ClientRouter): al llegar a otra página, el menú se cierra
  useEffect(() => {
    const cerrar = () => setIsSidebarOpen(false);
    document.addEventListener("astro:after-swap", cerrar);
    return () => document.removeEventListener("astro:after-swap", cerrar);
  }, []);

  // El logo es HTML estático del header: acá solo se le aplica el desplazamiento
  useEffect(() => {
    document.querySelector("#app-header .logo-container")?.classList.toggle("slide", logoSlide);
  }, [logoSlide]);

  const toggleMenu = () => {
    setIsSidebarOpen(!isSidebarOpen);
    setShowTooltip(false);
    setLogoSlide(false);

    if (!isSidebarOpen) {
      // Cuando se abre el menú
      window.history.pushState(window.history.state, '', window.location.pathname + '?menu=open');
    } else {
      // Cuando se cierra el menú
      window.history.pushState(window.history.state, '', window.location.pathname);
    }
  };

  const toggleHistory = () => setIsHistoryVisible((prev) => !prev);
  const toggleEditNames = () => setIsEditNamesVisible((prev) => !prev);
  const toggleChangelog = () => setIsChangelogVisible((prev) => !prev);

  return (
    <>
      {showTooltip && (
        <div className={`menu-tooltip ${isSidebarOpen ? 'hide' : 'show'}`}>
          <img src="/images/var.svg" alt="VAR Icon" style={{ width: '30px', height: '20px', verticalAlign: 'top', marginRight: '1.25px' }}  /> REVISÁ 
        </div>
      )}

      <div className="menu-container">
        <div
          className={`btn ${isSidebarOpen ? "active" : "not-active"}`}
          onClick={toggleMenu}
          data-clarity-tag="menu-toggle"
        >
          <span className="btn-line"></span>
          <span className="btn-line"></span>
          <span className="btn-line"></span>
        </div>
      </div>

      <div
        className={`overlay ${isSidebarOpen ? "visible" : ""}`}
        onClick={toggleMenu}
        data-clarity-tag="menu-overlay"
      ></div>

      <div id="sidebar" className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <ul className="sidebar-list">
          <li className="sidebar-item" onClick={toggleMenu} data-clarity-tag="menu-history">
            <div className="sidebar-content" onClick={toggleHistory}>
              <div className="sidebar-icon">
                <img src="/images/var.svg" alt="History Icon" />
              </div>
              <span>IR AL VAR</span>
            </div>
          </li>
          <li className="sidebar-item" onClick={toggleMenu} data-clarity-tag="menu-points">
            <div className="sidebar-content" onClick={toggleMaxPoints}>
              <div className="sidebar-icon">
                <i className="bx bx-transfer-alt bx-sm"></i>
              </div>
              <span>JUGAR A {maxPoints === 30 ? "15" : "30"}</span>
            </div>
          </li>
          <li className="sidebar-item" onClick={toggleMenu} data-clarity-tag="menu-edit-names">
            <div className="sidebar-content" onClick={toggleEditNames}>
              <div className="sidebar-icon">
                <i className="bx bx-edit-alt bx-sm"></i>
              </div>
              <span>EDITAR NOMBRES</span>
            </div>
          </li>
          <li className="sidebar-item" onClick={toggleMenu} data-clarity-tag="menu-guia">
            <a href="/guia-truco" className="sidebar-content">
              <div className="sidebar-icon">
                <i className="bx bx-book-open bx-sm"></i>
              </div>
              <span>GUÍA DEL TRUCO</span>
            </a>
          </li>
          <li className="sidebar-item" onClick={toggleMenu} data-clarity-tag="menu-changelog">
            <div className="sidebar-content" onClick={toggleChangelog}>
              <div className="sidebar-icon">
                <i className='bx bx-info-circle bx-sm' ></i>
              </div>
              <span>NOVEDADES</span>
            </div>
          </li>
        </ul>
        <div className="sidebar-footer">
          <span>¡Ayudame a mantener la app!</span>
          <a href='https://cafecito.app/truqito' rel='noreferrer' target='_blank'><img srcSet='https://cdn.cafecito.app/imgs/buttons/button_5.png 1x, https://cdn.cafecito.app/imgs/buttons/button_5_2x.png 2x, https://cdn.cafecito.app/imgs/buttons/button_5_3.75x.png 3.75x' src='https://cdn.cafecito.app/imgs/buttons/button_5.png' alt='Invitame un café en cafecito.app' loading='lazy' /></a>
        </div>
      </div>

      {/* 🎯 SUSPENSE - Carga modales solo cuando se necesitan (y nunca en el HTML del build) */}
      {montado && (
        <Suspense fallback={null}>
          <History isVisible={isHistoryVisible} onClose={toggleHistory} teamNames={teamNames} />
          <EditNames
            isVisible={isEditNamesVisible}
            onClose={toggleEditNames}
            teamNames={teamNames}
            onSave={saveNames}
          />
          <Changelog
            isVisible={isChangelogVisible}
            onClose={toggleChangelog}
          />
        </Suspense>
      )}
    </>
  );
};

export default Menu;
