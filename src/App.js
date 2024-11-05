import "./App.css";
import React from "react";
import Counter from "./Components/Counter.js";
import packageInfo from "../package.json";

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

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      finished: false,
      winner: "",
    };
  }

  handleWin(winner) {
    this.setState({ finished: true, winner });
  }

  showWinner() {
    if (this.state.winner === "NOSOTROS") {
      return (
        <>
          <p>
            GANAMOS <br /> NOSOTROS :D
          </p>
          <img
            className="img-lost"
            src="/images/happy.png"
            alt="happy"
            loading="lazy"
          />
        </>
      );
    } else
      return (
        <>
          <p>GANARON ELLOS :(</p>
          <img
            className="img-lost"
            src="/images/sadge.png"
            alt="sadge"
            loading="lazy"
          />
        </>
      );
  }

  render() {
    return (
      <div className="app">
        <div className="title">
          <h1> Anotador de Truco </h1>
        </div>
        <div className="board">
          {this.state.finished ? (
            <div className="finished-message">
              <h3>{this.showWinner()}</h3>
              <button
                aria-label="Revancha"
                className="restart-button"
                onClick={() => {
                  this.setState({ finished: false });
                }}
              >
                REVANCHA
              </button>

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
                  onClick={() => {
                    const feedbackText = document.querySelector(
                      ".feedback-section textarea"
                    ).value;
                    if (feedbackText) {
                      enviarFeedback(feedbackText);
                      document.querySelector(
                        ".feedback-section textarea"
                      ).value = ""; // Limpia el campo después de enviar
                    } else {
                      alert(
                        "Por favor, escribe un comentario antes de enviar."
                      );
                    }
                  }}
                >
                  Enviar
                </button>
              </div>
            </div>
          ) : (
            <>
              <Counter
                title="NOSOTROS"
                onWin={() => {
                  this.handleWin("NOSOTROS");
                }}
              />

              <Counter
                title="ELLOS"
                onWin={() => {
                  this.handleWin("ELLOS");
                }}
              />
            </>
          )}
        </div>
        <div className="footer">
          <span className="footer__copy">
            &#169; Copyright {new Date().getFullYear()}{" "}
            <span className="footer__title">
              <a
                href="https://contelautaro.com.ar"
                target="_blank"
                rel="noreferrer"
              >
                Conte
              </a>
            </span>
            <span className="footer__version">
            <p>versión {packageInfo.version} 🚀</p>
          </span>
          </span>

        </div>
      </div>
    );
  }
}

export default App;
