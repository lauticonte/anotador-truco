import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

async function enviarFeedback(feedback) {
  try {
    const response = await fetch("/api/sendFeedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ feedback }),
    });

    console.log("Estado de la respuesta:", response.status);
    console.log("Texto de la respuesta:", await response.text());

    if (response.ok) {
      alert("Feedback enviado correctamente 😁");
    } else {
      alert("Error al enviar el feedback ⚠️ ");
    }
  } catch (error) {
    console.error("Error al enviar el feedback:", error);
    alert("Error al enviar el feedback");
  }
}

const ResultPage = ({ resetGame, teamNames }) => {
  const { winner } = useParams();
  const navigate = useNavigate();
  const [selectedPoints, setSelectedPoints] = useState(null);

  const handleStartGame = () => {
    if (selectedPoints) {
      resetGame(selectedPoints);
      navigate('/');
    }
  };

  const handleSubmit = () => {
    const feedbackText = document.querySelector(
      ".feedback-section textarea"
    ).value;
    if (feedbackText) {
      enviarFeedback(feedbackText);
      document.querySelector(".feedback-section textarea").value = "";
    } else {
      alert("Por favor, escribe un comentario antes de enviar.");
    }
  };

  const winnerName = winner.toUpperCase() === "NOSOTROS" ? teamNames.NOSOTROS : teamNames.ELLOS;
  const isDefaultName = winnerName === "NOSOTROS" || winnerName === "ELLOS" || !winnerName.trim();
  const winnerMessage = isDefaultName 
    ? (winner.toUpperCase() === "NOSOTROS" ? "¡GANAMOS NOSOTROS!" : "¡GANARON ELLOS!")
    : `¡${winnerName} HA GANADO!`;

  return (
    <div className="finished-message">
      <h3>
        <div className="winner">
          <p>{winnerMessage}</p>
          <img
            className="img-lost"
            src={winner.toUpperCase() === "NOSOTROS" ? "/images/happy.webp" : "/images/sadge.webp"}
            alt={winner.toUpperCase() === "NOSOTROS" ? "happy" : "sadge"}
            loading="lazy"
          />
        </div>
      </h3>

      <section className="next-game-section">
        <h4 className="next-game-title">¿A cuánto la revancha?</h4>
        <div className="game-options">
          <div 
            className={`game-option ${selectedPoints === 15 ? 'selected' : ''}`}
            onClick={() => setSelectedPoints(15)}
          >
            <span className="game-option-points">15</span>
            <span className="game-option-text">Puntos</span>
          </div>
          <div 
            className={`game-option ${selectedPoints === 30 ? 'selected' : ''}`}
            onClick={() => setSelectedPoints(30)}
          >
            <span className="game-option-points">30</span>
            <span className="game-option-text">Puntos</span>
          </div>
        </div>
        <button 
          className="start-game-button"
          onClick={handleStartGame}
          disabled={!selectedPoints}
        >
          <i className='bx bx-play'></i>
          Comenzar Juego
        </button>
      </section>

      <div className="feedback-section">
        <h4>Dejá tus sugerencias:</h4>
        <textarea
          placeholder="Escribí tus comentarios acá..."
          rows="4"
          cols="50"
        />
        <button
          aria-label="Enviar sugerencias"
          className="submit-feedback-button"
          onClick={handleSubmit}
        >
          Enviar
        </button>
      </div>
    </div>
  );
};

export default ResultPage; 