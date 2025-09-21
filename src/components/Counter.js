import React, { Component } from "react";
import "../styles/Counter.css";


// Utilidad simple de debounce para evitar escrituras síncronas frecuentes en localStorage
// Mantiene los últimos argumentos para permitir un flush inmediato antes de desmontar
const debounce = (fn, delay) => {
  let timerId = null;
  let lastArgs = [];
  const debounced = (...args) => {
    lastArgs = args;
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      fn(...lastArgs);
    }, delay);
  };
  debounced.flush = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
      fn(...lastArgs);
    }
  };
  return debounced;
};


class Counter extends Component {
  constructor(props) {
    super(props);
    const savedPoints = parseInt(localStorage.getItem(`points-${props.title}`), 10) || 0;
    const defaultStage = props.maxPoints === 15 ? "a 15" : "Malas";
    const savedStage = localStorage.getItem(`stage-${props.title}`);
    
    // Si no hay stage guardado o si cambiamos de modo de juego, usar el default
    // También asegurarnos que en modo 30, si los puntos son 0, el estado sea "Malas"
    const initialStage = !savedStage || 
      (props.maxPoints === 15 && savedStage !== "a 15") || 
      (props.maxPoints === 30 && savedStage === "a 15") ||
      (props.maxPoints === 30 && savedPoints === 0 && savedStage === "Buenas")
      ? defaultStage 
      : savedStage;
    
    this.state = {
      points: savedPoints,
      stage: initialStage,
    };

    this.stage = initialStage;
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

    // Escritores debounced para evitar bloquear la UI en cada click
    this.debouncedSavePoints = debounce((points) => {
      try {
        localStorage.setItem(`points-${this.props.title}`, points);
      } catch (_) {}
    }, 300);

    this.debouncedSaveStage = debounce((stage) => {
      try {
        localStorage.setItem(`stage-${this.props.title}`, stage);
      } catch (_) {}
    }, 300);

    // Buffer para historial: preserva todas las entradas y reduce escrituras
    this.historyBuffer = [];
    this.flushHistoryBuffer = () => {
      if (!this.historyBuffer.length) return;
      try {
        const history = JSON.parse(localStorage.getItem("history")) || [];
        history.push(...this.historyBuffer);
        localStorage.setItem("history", JSON.stringify(history));
        this.historyBuffer = [];
      } catch (_) {
        // En caso de error, intentar al menos limpiar el buffer para evitar crecimiento infinito
        this.historyBuffer = [];
      }
    };
    this.debouncedFlushHistory = debounce(this.flushHistoryBuffer, 300);

    // Asegurar que el buffer se persista si se cierra/recarga la página
    window.addEventListener("beforeunload", this.flushHistoryBuffer);
    // Permitir a otros componentes forzar un flush inmediato del historial
    window.addEventListener("flushHistory", this.flushHistoryBuffer);
  }

  updatePoints = (newPoints, stage) => {
    this.setState({ points: newPoints, stage: stage });
    this.stage = stage;
    this.debouncedSaveStage(stage);
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.points !== this.state.points) {
      this.debouncedSavePoints(this.state.points);
    }
  
    if (prevProps.maxPoints !== this.props.maxPoints) {
      const newStage = this.props.maxPoints === 15 ? "a 15" : "Malas";
      
      // Limpiar el localStorage para este equipo
      localStorage.removeItem(`points-${this.props.title}`);
      localStorage.removeItem(`stage-${this.props.title}`);
      
      this.setState({
        points: 0,
        stage: newStage,
      });
    }
  }
  
  componentWillUnmount() {
    // Forzar escritura de cualquier cambio pendiente
    try {
      this.debouncedSavePoints.flush();
      this.debouncedSaveStage.flush();
      this.flushHistoryBuffer();
    } catch (_) {}
    window.removeEventListener("beforeunload", this.flushHistoryBuffer);
    window.removeEventListener("flushHistory", this.flushHistoryBuffer);
  }


  // Nueva función para reiniciar puntos desde el componente padre
  resetPoints = () => {
    const newStage = this.props.maxPoints === 15 ? "a 15" : "Malas";
    
    // Limpiar el localStorage para este equipo
    localStorage.removeItem(`points-${this.props.title}`);
    localStorage.removeItem(`stage-${this.props.title}`);
    
    // Asegurarnos que el estado sea "Malas" en modo 30
    const finalStage = this.props.maxPoints === 30 ? "Malas" : newStage;
    
    this.setState({ 
      points: 0,
      stage: finalStage
    });
    this.stage = finalStage;
  };

  addPoint = () => {
    if (this.props.finished) return;
  
    this.setState(
      (prevState) => {
        let nextPoints = prevState.points + 1;
        let nextStage = prevState.stage;
  
        if (this.props.maxPoints === 30) {
          if (nextPoints === 16 && prevState.stage === "Malas") {
            nextStage = "Buenas";
            nextPoints = 1;
          } else if (nextPoints === 15 && nextStage === "Buenas") {
            this.props.onWin(this.props.title);
            return prevState;
          }
        } else if (nextPoints === 15) {
          this.props.onWin(this.props.title);
          return prevState;
        }
  
        return { points: nextPoints, stage: nextStage };
      },
      () => {
        if (!this.props.finished) {
          this.registerHistory("SUMA", 1);
          this.debouncedSaveStage(this.state.stage);
        }
      }
    );
  };
  
  subtractPoint = () => {
    if (this.props.finished) return;
  
    this.setState((prevState) => {
      if (prevState.points <= 0) {
        return null;
      }
  
      let nextPoints = prevState.points - 1;
      let nextStage = prevState.stage;
  
      if (this.props.maxPoints === 30) {
        if (nextPoints === 0 && prevState.stage === "Buenas") {
          nextStage = "Malas";
          nextPoints = 15;
        }
      }
  
      return { points: nextPoints, stage: nextStage };
    }, () => {
      this.registerHistory("RESTA", -1);
      this.debouncedSaveStage(this.state.stage);
    });
  };
  

  registerHistory = (action, points) => {
    if (this.props.finished) return;
  
    const currentTime = new Date();
    const formattedTime = currentTime.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  
    const entry = {
      action,
      points,
      team: this.props.title,
      timestamp: formattedTime,
      currentPoints: this.state.points,
      stage: this.state.stage,
      maxPoints: this.props.maxPoints
    };
    // Acumular en buffer y escribir de forma debounced
    this.historyBuffer.push(entry);
    this.debouncedFlushHistory();
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
    const { title, displayName } = this.props;
  
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
          <h2>{displayName || title}</h2>
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
              <i className='bx bx-minus bx-md'></i>
            </button>
  
            <button
              aria-label="Suma"
              className="counter-button"
              onClick={this.addPoint}
            >
              <i className='bx bx-plus bx-md'></i>
            </button>
          </div>
        </div>
      </div>
    );
  }
  
}

export default Counter;
