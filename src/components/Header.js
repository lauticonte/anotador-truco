import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { supabase } from "../config/supabaseClient.js";

const Header = React.memo(
  ({ toggleMaxPoints, maxPoints, toggleHistory }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { user } = useAuth();

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

    const toggleProfile = () => {
      setIsProfileOpen(!isProfileOpen);
    };

    // INICIAR SESION
    // const handleLogin = async () => {
    //   const { error } = await supabase.auth.signInWithOAuth({
    //     provider: "google",
    //   });
    //   if (error) console.error("Error en login:", error.message);
    // };

    const handleLogout = async () => {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Error en logout:", error.message);
      setIsProfileOpen(false); // Cerrar perfil después de cerrar sesión
    };

    return (
      <div className="header">
        <div className="logo-container">
          <img
            src="./images/main_logo.webp"
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
            {/* INICIAR SESION JEJOX */}
            {/* <li className="sidebar-item" onClick={toggleProfile}>
              <div className="sidebar-content">
                <div className="sidebar-icon">
                  {user && user.user_metadata.picture ? (
                    <img
                      src={user.user_metadata.picture}
                      alt="Avatar"
                      className="user-avatar"
                    />
                  ) : (
                    <i className="bx bx-user bx-sm"></i>
                  )}
                </div>
                <div className="auth-section">
                  {user ? (
                    <div className="user-info">
                      <span onClick={toggleProfile}>
                        VER MI PERFIL
                      </span>
                    </div>
                  ) : (
                    <span className="login" onClick={handleLogin}>
                      INICIAR SESION
                    </span>
                  )}
                </div>
              </div>
            </li> */}

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
                  <i className="bx bx-transfer-alt bx-sm"></i>
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

        {/* PERFIL DEL USUARIO */}
        {isProfileOpen && (
          <div className="overlay visible profile-overlay" onClick={toggleProfile}>
            <div className="profile" onClick={(e) => e.stopPropagation()}>
              <span className="close-profile" onClick={toggleProfile}>
                <i className="bx bx-x"></i>
              </span>
              
              <div className="profile-header">
              <img src={user.user_metadata.picture} alt="Avatar" className="user-avatar-large" />
              <h3>Hola, {user.user_metadata.name} 👋</h3>
              </div>

              

              <button className="logout-button" onClick={handleLogout}>
                CERRAR SESIÓN
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.maxPoints === nextProps.maxPoints;
  }
);

export default Header;
