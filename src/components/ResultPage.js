import React from 'react';
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

const ResultPage = ({ resetGame }) => {
  const { winner } = useParams();
  const navigate = useNavigate();

  const handleRevancha = (points) => {
    resetGame(points);
    navigate('/');
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

  return (
    <div className="finished-message">
      <h3>
        <div className="winner">
          <p>{winner === "NOSOTROS" ? "GANAMOS NOSOTROS" : "GANARON ELLOS"}</p>
          <img
            className="img-lost"
            src={winner === "NOSOTROS" ? "/images/happy.png" : "/images/sadge.png"}
            alt={winner === "NOSOTROS" ? "happy" : "sadge"}
            loading="lazy"
          />
        </div>
      </h3>
      <div className="revancha-buttons">
        <button className="restart-button" onClick={() => handleRevancha(15)}>
          REVANCHA 1️⃣5️⃣
        </button>
        <button className="restart-button" onClick={() => handleRevancha(30)}>
          REVANCHA 3️⃣0️⃣
        </button>
      </div>
      <div className="feedback-section">
        <h4>¡Dejanos tus sugerencias!</h4>
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