import React, { Component } from "react";
import "./Counter.css";

// Inline SVG como reemplazo
const PlusIcon = () => (
<svg className="svg-icon" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="plus" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M432 256c0 17.69-14.33 32.01-32 32.01H256v144c0 17.69-14.33 31.99-32 31.99s-32-14.3-32-31.99v-144H48c-17.67 0-32-14.32-32-32.01s14.33-31.99 32-31.99H192v-144c0-17.69 14.33-32.01 32-32.01s32 14.32 32 32.01v144h144C417.7 224 432 238.3 432 256z"></path></svg>
);

const MinusIcon = () => (
<svg className="svg-icon" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="minus" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M400 288h-352c-17.69 0-32-14.32-32-32.01s14.31-31.99 32-31.99h352c17.69 0 32 14.3 32 31.99S417.7 288 400 288z"></path></svg>
);

class Counter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      points: 0,
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

  componentDidUpdate(prevProps) {
    if (prevProps.maxPoints !== this.props.maxPoints) {
      this.setState({ points: 0 });
      this.stage = this.props.maxPoints === 15 ? "a 15" : "Malas";
    }
  }

  addPoint = () => {
    this.setState((prevState) => {
      let nextPoints = prevState.points + 1;
      let nextStage = this.stage;

      if (this.props.maxPoints === 30) {
        if (this.stage === "Buenas" && nextPoints > 15) return null;

        if (nextPoints === 16) {
          nextStage = "Buenas";
          nextPoints = 1;
        }

        if (nextPoints === 15 && nextStage === "Buenas") {
          setTimeout(this.props.onWin, 200);
        }
      } else {
        if (nextPoints === 15) {
          setTimeout(this.props.onWin, 200);
        }
      }

      this.updatePoints(nextPoints, nextStage);
      return null;
    });
  };

  subtractPoint = () => {
    this.setState((prevState) => {
      let nextPoints = prevState.points - 1;
      let nextStage = this.stage;

      if (this.props.maxPoints === 30) {
        if (this.stage === "Malas" && nextPoints < 0) return null;

        if (nextPoints < 1 && this.stage === "Buenas") {
          nextStage = "Malas";
          nextPoints = 15;
        }
      } else {
        if (nextPoints < 0) return null;
      }

      this.updatePoints(nextPoints, nextStage);
      return null;
    });
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

    const stageText = this.props.maxPoints === 15 ? "a 15" : this.stage;
    const stageIndicatorStyle = {
      background:
        this.props.maxPoints === 15
          ? "#6A9F58"
          : this.stage === "Buenas"
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
              {this.state.points}
            </h1>
          </div>
          <div className="buttons-row">
            <button
              aria-label="Suma"
              className="counter-button"
              onClick={this.addPoint}
            >
              <PlusIcon />
            </button>
            <button
              aria-label="Resta"
              className="counter-button"
              onClick={this.subtractPoint}
            >
              <MinusIcon />
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default Counter;
