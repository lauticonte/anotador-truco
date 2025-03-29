import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="finished-message">
      <h3>
        <div className="winner">
          <p>¡Página no encontrada! 😅</p>
        </div>
      </h3>
      <div className="revancha-buttons">
        <button className="restart-button" onClick={() => navigate('/')}>
          Volver al Juego
        </button>
      </div>
    </div>
  );
};

export default NotFound; 