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
    // El tablero se renderiza en el build: el primer render es siempre 0 puntos con la etapa por defecto,
    // igual al HTML del servidor. Lo guardado en localStorage se restaura después (restoreSavedGame).
    const initialStage = props.maxPoints === 15 ? "a 15" : "Malas";

    this.state = {
      points: 0,
      stage: initialStage,
      showTapHint: false,
      tapHintCompleted: false,
    };

    this.stage = initialStage;
    this.lineLength = 86; // Lado del cuadrado
    this.offsetX = 7;
    this.offsetY = 7;
    this.stackSpacing = 10; // Espaciado adicional entre cuadrados para que no choquen las cabezas

    // La cola arranca un poco antes de la esquina para pasar por debajo de la cabeza del fósforo anterior
    const overlap = 2;
    this.matchLength = this.lineLength + overlap * 2;
    // La diagonal va de esquina a esquina, dejando lugar para las cabezas de los lados
    const diagonalInset = 9;
    this.diagonalLength = (this.lineLength - diagonalInset * 2) * Math.SQRT2;

    // Posición de la cola y rotación de cada fósforo dentro del cuadrado.
    // Las cabezas van en sentido horario: arriba, izquierda, abajo, derecha y diagonal.
    this.mask = [
      { x: -overlap, y: 0, angle: 0 },
      { x: 0, y: this.lineLength + overlap, angle: -90 },
      { x: this.lineLength + overlap, y: this.lineLength, angle: 180 },
      { x: this.lineLength, y: -overlap, angle: 90 },
      { x: diagonalInset, y: diagonalInset, angle: 45, diagonal: true },
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
  }

  // Lee la partida guardada. Se llama recién cuando el estado de la partida (modo y nombres) ya se cargó,
  // porque la etapa válida depende del modo de juego.
  restoreSavedGame = () => {
    const { title, maxPoints } = this.props;
    const savedPoints = parseInt(localStorage.getItem(`points-${title}`), 10) || 0;
    const defaultStage = maxPoints === 15 ? "a 15" : "Malas";
    const savedStage = localStorage.getItem(`stage-${title}`);

    // Si no hay stage guardado o si cambiamos de modo de juego, usar el default
    // También asegurarnos que en modo 30, si los puntos son 0, el estado sea "Malas"
    const initialStage = !savedStage ||
      (maxPoints === 15 && savedStage !== "a 15") ||
      (maxPoints === 30 && savedStage === "a 15") ||
      (maxPoints === 30 && savedPoints === 0 && savedStage === "Buenas")
      ? defaultStage
      : savedStage;

    this.stage = initialStage;
    this.setState({ points: savedPoints, stage: initialStage });
  };

  componentDidMount() {
    // Asegurar que el buffer se persista si se cierra/recarga la página
    window.addEventListener("beforeunload", this.flushHistoryBuffer);
    // Permitir a otros componentes forzar un flush inmediato del historial
    window.addEventListener("flushHistory", this.flushHistoryBuffer);
    // Al ir a otra página (resultado, guía) se guarda lo pendiente: puntos, etapa e historial
    window.addEventListener("pagehide", this.flushPending);

    if (this.props.cargada) this.restoreSavedGame();

    // Reset hint si la URL tiene ?reset-hint (útil para testing en mobile)
    if (window.location.search.includes("reset-hint")) {
      localStorage.removeItem("tapHintSessions");
      // Limpiar el parámetro de la URL sin recargar
      window.history.replaceState({}, "", window.location.pathname);
      this.setState({ tapHintCompleted: false });
    }
    
    // Mostrar tap hint solo si no se completaron las 10 sesiones y es el primer counter (NOSOTROS)
    const tapHintCompleted = parseInt(localStorage.getItem("tapHintSessions"), 10) >= 10;
    
    if (!tapHintCompleted && this.props.title === "NOSOTROS") {
      // Incrementar contador de sesiones
      const sessions = parseInt(localStorage.getItem("tapHintSessions"), 10) || 0;
      localStorage.setItem("tapHintSessions", sessions + 1);
      
      // Mostrar hint después de un breve delay
      this.showHintTimer = setTimeout(() => {
        this.setState({ showTapHint: true });
      }, 600);
    }
  }

  updatePoints = (newPoints, stage) => {
    this.setState({ points: newPoints, stage: stage });
    this.stage = stage;
    this.debouncedSaveStage(stage);
  };

  componentDidUpdate(prevProps, prevState) {
    // Recién cargada la partida: restaurar lo guardado. El cambio de modo que llega con la carga
    // (por ejemplo, de 30 por defecto a 15 guardado) no es una partida nueva y no borra nada.
    if (!prevProps.cargada && this.props.cargada) {
      this.restoreSavedGame();
      return;
    }

    if (prevState.points !== this.state.points) {
      this.debouncedSavePoints(this.state.points);
    }

    if (prevProps.cargada && prevProps.maxPoints !== this.props.maxPoints) {
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
  
  // Forzar escritura de cualquier cambio pendiente
  flushPending = () => {
    try {
      this.debouncedSavePoints.flush();
      this.debouncedSaveStage.flush();
      this.flushHistoryBuffer();
    } catch (_) {}
  };

  componentWillUnmount() {
    this.flushPending();
    window.removeEventListener("beforeunload", this.flushHistoryBuffer);
    window.removeEventListener("flushHistory", this.flushHistoryBuffer);
    window.removeEventListener("pagehide", this.flushPending);
    
    // Limpiar timer del tap hint
    if (this.showHintTimer) clearTimeout(this.showHintTimer);
  }

  dismissTapHint = () => {
    this.setState({ showTapHint: false });
  };


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
    
    // Ocultar el tap hint cuando el usuario toca
    if (this.state.showTapHint) {
      this.dismissTapHint();
    }
  
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
  

  // Se dibujan en dos capas: primero todos los palitos y después todas las cabezas,
  // así cada cabeza queda por encima de la cola del fósforo que tiene al lado.
  renderLines = () => {
    const matches = Array.from({ length: this.state.points }, (_, i) => this.matchAt(i));
    return (
      <>
        {matches.map(({ variant, transform }, i) => (
          <g key={`stick-${i}`} transform={transform}>
            <use className="match-place" href={`#match-stick-${variant}`} />
          </g>
        ))}
        {matches.map(({ variant, transform }, i) => (
          <g key={`head-${i}`} transform={transform}>
            <use className="match-place" href={`#match-head-${variant}`} />
          </g>
        ))}
      </>
    );
  };

  matchAt = (i) => {
    const match = this.mask[i % 5];
    const { title } = this.props;
    return {
      match,
      variant: match.diagonal ? `diagonal-${title}` : title,
      transform: this.matchTransform(match, Math.floor(i / 5)),
    };
  };

  // Aviso de primeras sesiones: el próximo fósforo aparece como fantasma en su lugar,
  // con una onda de toque al lado (hacia adentro del cuadrado), para que se entienda que tocar el tablero suma.
  renderTapHint = () => {
    const next = this.state.points;
    if (next >= 15) return null;
    const { match, variant, transform } = this.matchAt(next);
    const length = match.diagonal ? this.diagonalLength : this.matchLength;
    const box = Math.floor(next / 5);
    const boxTop = this.offsetY + box * (this.offsetY + this.lineLength + this.stackSpacing);
    const centerX = this.offsetX + this.lineLength / 2;
    const centerY = boxTop + this.lineLength / 2;
    return (
      <g className="tap-hint" pointerEvents="none">
        <g className="match-ghost" transform={transform}>
          <use href={`#match-stick-${variant}`} />
          <use href={`#match-head-${variant}`} />
          <circle className="tap-ripple" cx={length / 2} cy="11" r="9" />
          <circle className="tap-ripple tap-ripple-delay" cx={length / 2} cy="11" r="9" />
        </g>
        {!match.diagonal && (
          <text className="tap-hint-label" x={centerX} y={centerY} textAnchor="middle">
            <tspan x={centerX} dy="-0.2em">Tocá</tspan>
            <tspan x={centerX} dy="1.2em">para sumar</tspan>
          </text>
        )}
      </g>
    );
  };

  matchTransform = ({ x, y, angle }, box) => {
    const tx = x + this.offsetX;
    const ty =
      y + this.offsetY + box * (this.offsetY + this.lineLength + this.stackSpacing);
    return `translate(${tx} ${ty}) rotate(${angle})`;
  };

  // Fósforo dibujado horizontal (cabeza a la derecha) y reutilizado con <use>.
  // Palito y cabeza son grupos separados para poder dibujarlos en capas distintas.
  renderMatchParts = (L, variant) => {
    const id = this.props.title;
    return (
      <React.Fragment key={variant}>
        <g id={`match-stick-${variant}`}>
          {/* Palito */}
          <rect
            x="0"
            y="-2.75"
            width={L - 8}
            height="5.5"
            rx="1"
            fill={`url(#match-wood-${id})`}
            stroke="#8A6232"
            strokeWidth="0.35"
          />
          {/* Vetas de la madera */}
          <path
            d={`M3 -1.1 L${L - 18} -0.8 M7 1.2 L${L - 22} 1.5`}
            stroke="#B98C52"
            strokeWidth="0.4"
            strokeLinecap="round"
            opacity="0.5"
          />
          {/* Corte de la cola */}
          <rect x="0" y="-2.75" width="1.3" height="5.5" rx="0.6" fill="#9C6E38" opacity="0.85" />
        </g>
        <g id={`match-head-${variant}`}>
          {/* Sombra de la cabeza sobre lo que pisa */}
          <path
            d={`M${L - 14} -2.2 C${L - 10} -4.6 ${L - 3} -4.9 ${L - 0.2} -2.2 C${L + 1.4} -0.4 ${L + 1.4} 2.4 ${L - 0.2} 4.2 C${L - 3} 6.9 ${L - 10} 6.6 ${L - 14} 3.8 Z`}
            fill="#000000"
            opacity="0.3"
          />
          {/* Cabeza */}
          <path
            d={`M${L - 15} -2.9 C${L - 11} -5.4 ${L - 4} -5.8 ${L - 1.2} -3 C${L + 0.5} -1.1 ${L + 0.5} 1.1 ${L - 1.2} 3 C${L - 4} 5.8 ${L - 11} 5.4 ${L - 15} 2.9 Z`}
            fill={`url(#match-head-fill-${id})`}
            stroke="#4A0E07"
            strokeWidth="0.45"
          />
          {/* Brillo de la cabeza */}
          <ellipse cx={L - 6.5} cy="-2.4" rx="3.4" ry="1.2" fill="#FFFFFF" opacity="0.38" />
        </g>
      </React.Fragment>
    );
  };

  // Los ids llevan el equipo para no repetirse entre los dos tableros.
  renderMatchDefs = () => {
    const id = this.props.title;
    return (
      <defs>
        <linearGradient id={`match-wood-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F8E6C0" />
          <stop offset="0.35" stopColor="#EBCB94" />
          <stop offset="0.75" stopColor="#D2A867" />
          <stop offset="1" stopColor="#A87A42" />
        </linearGradient>
        <radialGradient id={`match-head-fill-${id}`} cx="0.62" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#F2846A" />
          <stop offset="0.45" stopColor="#C4361F" />
          <stop offset="1" stopColor="#6B170C" />
        </radialGradient>
        {this.renderMatchParts(this.matchLength, id)}
        {this.renderMatchParts(this.diagonalLength, `diagonal-${id}`)}
      </defs>
    );
  };

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
        <div className="svg-canvas-wrapper">
          <svg
            className="svg-canvas"
            viewBox="0 0 100 310"
            onClick={this.addPoint}
            role="button"
            aria-label={`Sumar punto a ${displayName || title}`}
          >
            {this.renderMatchDefs()}
            {this.renderLines()}
            {this.state.showTapHint && this.renderTapHint()}
          </svg>
        </div>
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
