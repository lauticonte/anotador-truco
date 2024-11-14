import "./App.css";
import React from "react";
import Counter from "./Components/Counter.js";
import packageInfo from "../package.json";
import { Analytics } from "@vercel/analytics/react";

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
      maxPoints: 30, // Puntaje máximo
    };
  }

  toggleMaxPoints = () => {
    this.setState((prevState) => ({
      maxPoints: prevState.maxPoints === 30 ? 15 : 30,
      finished: false, // Reinicia el estado para una nueva partida
    }));
  };

  handleWin(winner) {
    this.setState({ finished: true, winner });
  }

  showWinner() {
    if (this.state.winner === "NOSOTROS") {
      return (
        <>
          <div className="winner">
            <p>GANAMOS NOSOTROS</p>
            <img
              className="img-lost"
              src="/images/happy.png"
              alt="happy"
              loading="lazy"
            />
          </div>
        </>
      );
    } else {
      return (
        <>
          <div className="winner">
            <p>GANARON ELLOS</p>
            <img
              className="img-lost"
              src="/images/sadge.png"
              alt="sadge"
              loading="lazy"
            />
          </div>
        </>
      );
    }
  }

  render() {
    return (
      <div className="app">
        <div className="header">
          <div className="header-left"></div>
          <div className="header-center">
            <h1>Anotador de Truco</h1>
          </div>
          <div className="header-right">
            <button onClick={this.toggleMaxPoints} className="points-button">
              a {this.state.maxPoints === 30 ? 15 : 30}
            </button>
          </div>
        </div>
        <div className="board">
          {this.state.finished ? (
            <div className="finished-message">
              <h3>{this.showWinner()}</h3>
              <div className="revancha-buttons">
                <button
                  className="restart-button"
                  onClick={() => {
                    this.setState({
                      finished: false,
                      maxPoints: 15, // Inicia una revancha a 15 puntos
                    });
                  }}
                >
                  REVANCHA 3️⃣0️⃣
                </button>

                <button
                  className="restart-button"
                  onClick={() => {
                    this.setState({
                      finished: false,
                      maxPoints: 30, // Inicia una revancha a 30 puntos
                    });
                  }}
                >
                  REVANCHA 1️⃣5️⃣
                </button>
              </div>

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
              <Analytics />
              <Counter
                title="NOSOTROS"
                maxPoints={this.state.maxPoints} // Pasar maxPoints como prop
                onWin={() => this.handleWin("NOSOTROS")}
              />
              <Counter
                title="ELLOS"
                maxPoints={this.state.maxPoints} // Pasar maxPoints como prop
                onWin={() => this.handleWin("ELLOS")}
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
