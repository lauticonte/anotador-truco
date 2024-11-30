import React, { useEffect } from "react";

const Header = React.memo(({ toggleMaxPoints, maxPoints }) => {
  useEffect(() => {
    // Prioridad alta para la imagen
    const logoImage = document.querySelector(".logo");
    if (logoImage) {
      logoImage.setAttribute("fetchpriority", "high");
    }
  }, []);

  return (
    <div className="header">
      <div className="header-left"></div>
      <div className="header-center">
        <img
          src="/main_logo.webp"
          alt="Main Logo"
          className="logo"
          width="150"
          height="42"
          decoding="async"
          loading="eager"
        />
      </div>
      <div className="header-right">
        <div className="points-container">
          <button onClick={toggleMaxPoints} className="points-button">
            a {maxPoints === 30 ? 15 : 30}
          </button>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.maxPoints === nextProps.maxPoints;
});

export default Header;
