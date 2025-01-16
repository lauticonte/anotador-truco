import React, { useEffect, useState } from "react";

const Header = React.memo(
  ({ toggleMaxPoints, maxPoints, toggleHistory }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
      // Prioridad alta para la imagen
      const logoImage = document.querySelector(".logo");
      if (logoImage) {
        logoImage.setAttribute("fetchpriority", "high");
      }
    }, []);

    const toggleMenu = () => {
      setIsSidebarOpen(!isSidebarOpen);
    };

    return (
      <div className="header">
        <div className="logo-container">
          <img
            src="/main_logo.webp"
            alt="Main Logo"
            className="logo"
            width="auto"
            height="38"
            decoding="async"
            loading="eager"
          />
        </div>

        <div className="menu-container">
          <div
            className={`btn ${isSidebarOpen ? "active" : "not-active"}`}
            onClick={toggleMenu}
          >
            <span className="btn-line"></span>
            <span className="btn-line"></span>
            <span className="btn-line"></span>
          </div>
        </div>

        <div
          className={`overlay ${isSidebarOpen ? "visible" : ""}`}
          onClick={toggleMenu}
        ></div>
        <div id="sidebar" className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
          <ul className="sidebar-list">
            <li className="sidebar-item" onClick={toggleMenu}>
              <div className="sidebar-content" onClick={toggleHistory}>
                <div className="sidebar-icon">
                  <img src="./images/var.svg" alt="History Icon" />
                </div>
                <span>IR AL VAR</span>
              </div>
            </li>
            <li className="sidebar-item" onClick={toggleMenu}>
              <div className="sidebar-content" onClick={toggleMaxPoints}>
                <div className="sidebar-icon">
                  <i class="bx bx-transfer-alt bx-sm"></i>
                </div>
                <span>JUGAR A {maxPoints === 30 ? "15" : "30"}</span>
              </div>
            </li>
          </ul>
          <div className="sidebar-footer">
            <span>¡Ayudanos a mantener la app!</span>
            <a href='https://cafecito.app/truqito' rel='noreferrer' target='_blank'><img srcset='https://cdn.cafecito.app/imgs/buttons/button_5.png 1x, https://cdn.cafecito.app/imgs/buttons/button_5_2x.png 2x, https://cdn.cafecito.app/imgs/buttons/button_5_3.75x.png 3.75x' src='https://cdn.cafecito.app/imgs/buttons/button_5.png' alt='Invitame un café en cafecito.app' /></a>
          </ div>      
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.maxPoints === nextProps.maxPoints;
  }
);

export default Header;
