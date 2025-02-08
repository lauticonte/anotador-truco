import React from "react";

const WinnerDisplay = ({ winner }) => {
  return (
    <div className="winner">
      <p>{winner === "NOSOTROS" ? "GANAMOS NOSOTROS" : "GANARON ELLOS"}</p>
      <img
        className="img-lost"
        src={winner === "NOSOTROS" ? "/images/happy.png" : "/images/sadge.png"}
        alt={winner === "NOSOTROS" ? "happy" : "sadge"}
        loading="lazy"
      />
    </div>
  );
};

export default WinnerDisplay;
