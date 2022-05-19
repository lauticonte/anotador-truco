import React from 'react';
import './Counter.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

class Counter extends React.Component {
    
    constructor (props) {
        super(props);

        this.state = {
            points: 0
        }

        this.stage      = 'Malas';
        this.lineLength = 90;
        this.offsetX    = 5;
        this.offsetY    = 7;
        this.box        = 0;

        this.mask = [
            { 
                x1: 0, y1: 0, 
                x2: this.lineLength, y2: 0 
            },
            { 
                x1: 0, y1: 0, 
                x2: 0, y2: this.lineLength 
            },
            { 
                x1: 0, y1: this.lineLength, 
                x2: this.lineLength, y2: this.lineLength 
            },
            { 
                x1: this.lineLength, y1: 0, 
                x2: this.lineLength, y2: this.lineLength 
            },
            { 
                x1: 0, y1: 0, 
                x2: this.lineLength, y2: this.lineLength }
        ];

        this.renderLine     = this.renderLine.bind(this);
        this.renderLines    = this.renderLines.bind(this);
        this.addPoint       = this.addPoint.bind(this);
        this.subtractPoint  = this.subtractPoint.bind(this);
    }

    addPoint () {
        this.setState(state => {
            if (this.stage === 'Buenas' && state.points === 15) return null;

            let nextPoints = state.points + 1;

            if(nextPoints === 16) {
                this.stage = 'Buenas';
                nextPoints = 1;
            }   

            if (nextPoints === 15 && this.stage === 'Buenas') setTimeout(this.props.onWin, 200);

            return { points: nextPoints }
        });
    }

    subtractPoint () {
        this.setState(state => {
            if (this.stage === 'Malas' && state.points === 0) return null;

            let nextPoints = state.points - 1;

            if (nextPoints === 0 && this.stage === 'Buenas') {
                this.stage = 'Malas';
                nextPoints = 15;
            }

            return { points: nextPoints }
        });
    }

    renderLines () {
        const lines = [];
        let box = 0;
        for (let i = 0; i < this.state.points; i++) {
            if (i / 5 === ( 1 + box )) ++box;
            lines.push(this.renderLine(this.mask[i % 5], box, i));
        }

        return lines;
    }

    renderLine ({ x1, y1, x2, y2 }, box, key) {
        return <line 
        x1={ x1 + this.offsetX } 
        y1={ y1 + this.offsetY + (box * (this.offsetY + this.lineLength)) } 
        
        x2={ x2 + this.offsetX } 
        y2={ y2 + this.offsetY + (box * (this.offsetY + this.lineLength)) } 
        
        key={ key }
        stroke="#ECDBBA" 
        strokeWidth="5"
        strokeLinecap="round"
        />
    }


    render () {
        const stageIndicatorColorBg = { background: this.stage === 'Buenas' ? '#4287f5' : '#C84B31', color: '#ECDBBA' };

        const stageIndicatorColorFont = { color: this.stage === 'Buenas' ? '#4287f5' : '#C84B31' };

        const titleStyle = { className: this.props.title === 'NOSOTROS' ? 'counter-body-nos' : 'counter-body-ellos' };

        const string = titleStyle.className.toString();

        return (
            <div className={string}>
                <div className="counter-title">
                <h2>{ this.props.title }</h2>
                </div>
                <div className="stage-indicator">
                <h3 style={ stageIndicatorColorBg }>{ this.stage }</h3>
                </div>
                <svg
                className="svg-canvas"
                viewBox="0 0 100 300"
                width="100px" 
                height="300px"
                >
                    { this.renderLines() }
                </svg>
                <div className="counter-points">
                    <h1 style={stageIndicatorColorFont}>{ this.state.points }</h1>
                </div>
                <div
                className="counter-buttons-container">
                    <button 
                    className="counter-button"
                    onClick={ this.addPoint }
                    >  <FontAwesomeIcon icon={faPlus} /> </button>
                    <button 
                    className="counter-button"
                    onClick={ this.subtractPoint }
                    > <FontAwesomeIcon icon={faMinus} className='awesome-text' /> </button>
                </div>
            </div>
        );
    }
}

export default Counter;