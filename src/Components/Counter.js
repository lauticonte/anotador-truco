import React, { Component } from "react";
import "./Counter.css";


class Counter extends Component {
  constructor(props) {
    super(props);
  const savedPoints =
    parseInt(localStorage.getItem(`points-${props.title}`), 10) || 0;
  this.state = {
    points: savedPoints,
    stage: this.props.maxPoints === 15 ? "a 15" : "Malas",
  };


    this.stage = this.props.maxPoints === 15 ? "a 15" : "Malas";
    this.lineLength = 90;
    this.offsetX = 5;
    this.offsetY = 7;
    this.stackSpacing = 6; // Espaciado adicional entre grupos de 5 líneas

    this.mask = [
      { x1: 0, y1: 0, x2: this.lineLength, y2: 0 },
      { x1: 0, y1: 0, x2: 0, y2: this.lineLength },
      { x1: 0, y1: this.lineLength, x2: this.lineLength, y2: this.lineLength },
      { x1: this.lineLength, y1: 0, x2: this.lineLength, y2: this.lineLength },
      { x1: 0, y1: 0, x2: this.lineLength, y2: this.lineLength },
    ];
  }

  updatePoints = (newPoints, stage) => {
    this.setState({ points: newPoints });
    this.stage = stage;
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.points !== this.state.points) {
      localStorage.setItem(`points-${this.props.title}`, this.state.points);
    }
  
    if (prevProps.maxPoints !== this.props.maxPoints) {
      this.setState({
        points: 0,
        stage: this.props.maxPoints === 15 ? "a 15" : "Malas",
      });
    }
  }
  

  // Nueva función para reiniciar puntos desde el componente padre
  resetPoints = () => {
    this.setState({ points: 0 });
    this.stage = this.props.maxPoints === 15 ? "a 15" : "Malas";
    localStorage.setItem(`points-${this.props.title}`, 0);
  };

  addPoint = () => {
    if (this.props.finished) return; // Bloquear acción si el juego terminó
  
    this.setState(
      (prevState) => {
        let nextPoints = prevState.points + 1;
        let nextStage = prevState.stage;
  
        // Manejar transición a "Buenas" para 30 puntos
        if (this.props.maxPoints === 30) {
          if (nextPoints === 16 && prevState.stage === "Malas") {
            nextStage = "Buenas";
            nextPoints = 1; // Reiniciar puntos en "Buenas"
          } else if (nextPoints === 15 && nextStage === "Buenas") {
            this.props.onWin(this.props.title); // Llamar al evento de victoria
            return prevState; // No registrar el último punto
          }
        } else if (nextPoints === 15) {
          this.props.onWin(this.props.title); // Llamar al evento de victoria
          return prevState; // No registrar el último punto
        }
  
        return { points: nextPoints, stage: nextStage }; // Actualizar estado
      },
      () => {
        if (!this.props.finished) {
          this.registerHistory("SUMA", 1); // Registrar solo si el juego no terminó
        }
      }
    );
  };
  
  
  
  
  
  
  subtractPoint = () => {
    if (this.props.finished) return; // Evitar restar puntos si el juego terminó
  
    this.setState((prevState) => {
      // Evitar valores negativos
      if (prevState.points <= 0) {
        return null;
      }
  
      let nextPoints = prevState.points - 1;
      let nextStage = prevState.stage;
  
      // Manejar transiciones entre "Buenas" y "Malas" para 30 puntos
      if (this.props.maxPoints === 30) {
        if (nextPoints === 0 && prevState.stage === "Buenas") {
          nextStage = "Malas";
          nextPoints = 15; // Volver a "Malas" con 15 puntos
        }
      }
  
      return { points: nextPoints, stage: nextStage }; // Actualizamos tanto puntos como stage
    }, () => {
      // Registrar el historial después de actualizar el estado
      this.registerHistory("RESTA", -1);
    });
  };
  
  

  
  

  registerHistory = (action, points) => {
    if (this.props.finished) return; // No registrar si el juego terminó
  
    const currentTime = new Date();
    const formattedTime = currentTime.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  
    const history = JSON.parse(localStorage.getItem("history")) || [];
    const entry = {
      action,
      points,
      team: this.props.title,
      timestamp: formattedTime,
    };
  
    history.push(entry);
    localStorage.setItem("history", JSON.stringify(history));
  };
  
  
  
  

  renderLines = () => {
    return Array.from({ length: this.state.points }, (_, i) => {
      const box = Math.floor(i / 5);
      const line = this.mask[i % 5];
      return this.renderLine(line, box, i);
    });
  };

  renderLine = ({ x1, y1, x2, y2 }, box, key) => (
    <line
      key={key}
      x1={x1 + this.offsetX}
      y1={
        y1 +
        this.offsetY +
        box * (this.offsetY + this.lineLength + this.stackSpacing)
      }
      x2={x2 + this.offsetX}
      y2={
        y2 +
        this.offsetY +
        box * (this.offsetY + this.lineLength + this.stackSpacing)
      }
      stroke="#ECDBBA"
      strokeWidth="5"
      strokeLinecap="round"
    />
  );

  render() {
    const { title } = this.props;
  
    // Calculamos el puntaje a mostrar, asegurándonos de que no sea negativo
    const displayedPoints = Math.max(this.state.points, 0);
  
    const stageText = this.state.stage; // Tomamos stage del estado
    const stageIndicatorStyle = {
      background:
        this.props.maxPoints === 15
          ? "#6A9F58"
          : this.state.stage === "Buenas"
          ? "#4287f5"
          : "#C84B31",
      color: "#ECDBBA",
    };
  
    const titleClassName =
      title === "NOSOTROS" ? "counter-body-nos" : "counter-body-ellos";
  
    return (
      <div className={titleClassName}>
        <div className="counter-title">
          <h2>{title}</h2>
        </div>
        <div className="stage-indicator">
          <h3 style={stageIndicatorStyle}>{stageText}</h3>
        </div>
        <svg className="svg-canvas" viewBox="0 0 100 300">
          {this.renderLines()}
        </svg>
        <div className="counter-buttons-container">
          <div className="counter-points">
            <h1 style={{ color: stageIndicatorStyle.background }}>
              {displayedPoints}
            </h1>
          </div>
          <div className="buttons-row">
            <button
              aria-label="Resta"
              className="counter-button"
              onClick={this.subtractPoint}
            >
              <i class='bx bx-minus bx-md'></i>
            </button>
  
            <button
              aria-label="Suma"
              className="counter-button"
              onClick={this.addPoint}
            >
              <i class='bx bx-plus bx-md '></i>
            </button>
          </div>
        </div>
      </div>
    );
  }
  
}

export default Counter;
