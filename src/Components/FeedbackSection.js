import React from "react";


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

const FeedbackSection = () => {
  const handleSubmit = () => {
    const feedbackText = document.querySelector(
      ".feedback-section textarea"
    ).value;
    if (feedbackText) {
      enviarFeedback(feedbackText);
      document.querySelector(".feedback-section textarea").value = ""; // Limpia el campo después de enviar
    } else {
      alert("Por favor, escribe un comentario antes de enviar.");
    }
  };

  return (
    <div className="feedback-section">
      <h4>¡Dejanos tus sugerencias!</h4>
      <textarea
        placeholder="Escribe tus comentarios aquí..."
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
  );
};

export default FeedbackSection;
