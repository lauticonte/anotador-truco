import React from "react";

const Header = React.memo(({ toggleMaxPoints, maxPoints }) => {
  return (
    <div className="header">
      <div className="header-left"></div>
      <div className="header-center">
        <img src="/main_logo.svg" alt="Main Logo" className="logo" />
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
