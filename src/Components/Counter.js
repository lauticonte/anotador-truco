import React, { Component } from 'react';
import './Counter.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

class Counter extends Component {
    constructor(props) {
        super(props);

        this.state = {
            points: 0,
        };

        this.stage = 'Malas';
        this.lineLength = 90;
        this.offsetX = 5;
        this.offsetY = 7;

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

    addPoint = () => {
        this.setState(prevState => {
            let nextPoints = prevState.points + 1;
            let nextStage = this.stage;

            if (this.stage === 'Buenas' && nextPoints > 15) return null;

            if (nextPoints === 16) {
                nextStage = 'Buenas';
                nextPoints = 1;
            }

            if (nextPoints === 15 && nextStage === 'Buenas') {
                setTimeout(this.props.onWin, 200);
            }

            this.updatePoints(nextPoints, nextStage);
            return null;
        });
    };

    subtractPoint = () => {
        this.setState(prevState => {
            let nextPoints = prevState.points - 1;
            let nextStage = this.stage;

            if (this.stage === 'Malas' && nextPoints < 0) return null;

            if (nextPoints < 1 && this.stage === 'Buenas') {
                nextStage = 'Malas';
                nextPoints = 15;
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
            y1={y1 + this.offsetY + box * (this.offsetY + this.lineLength)}
            x2={x2 + this.offsetX}
            y2={y2 + this.offsetY + box * (this.offsetY + this.lineLength)}
            stroke="#ECDBBA"
            strokeWidth="5"
            strokeLinecap="round"
        />
    );

    render() {
        const { title } = this.props;
        const stageIndicatorStyle = {
            background: this.stage === 'Buenas' ? '#4287f5' : '#C84B31',
            color: '#ECDBBA',
        };

        const titleClassName = title === 'NOSOTROS' ? 'counter-body-nos' : 'counter-body-ellos';

        return (
            <div className={titleClassName}>
                <div className="counter-title">
                    <h2>{title}</h2>
                </div>
                <div className="stage-indicator">
                    <h3 style={stageIndicatorStyle}>{this.stage}</h3>
                </div>
                <svg className="svg-canvas" viewBox="0 0 100 300" width="100px" height="300px">
                    {this.renderLines()}
                </svg>
                <div className="counter-points">
                    <h1 style={{ color: stageIndicatorStyle.background }}>{this.state.points}</h1>
                </div>
                <div className="counter-buttons-container">
                    <button aria-label='Suma' className="counter-button" onClick={this.addPoint}>
                        <FontAwesomeIcon icon={faPlus} />
                    </button>
                    <button aria-label='Resta' className="counter-button" onClick={this.subtractPoint}>
                        <FontAwesomeIcon icon={faMinus} className="awesome-text" />
                    </button>
                </div>
            </div>
        );
    }
}

export default Counter;
