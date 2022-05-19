import './App.css';
import React from 'react';
import Counter from './Components/Counter';

class App extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      finished: false,
      winner: ''
    }
  }

  handleWin (winner) {
    this.setState({ finished: true, winner });
  }

  render () {
    return (
      <div className="app">
        <div className="title">
          <h1> Anotador de Truco </h1>
        </div>
        <div className="board">
          { this.state.finished ?
            <div className="finished-message">
              <h3>{ `Ganador: ${ this.state.winner }` }</h3>
              <button
                className="restart-button"
                onClick={ () => { this.setState({ finished: false }) } }
              >
                Reiniciar
              </button>
            </div>
            :
            <>
              <Counter
                title="NOSOTROS"
                onWin={ () => { this.handleWin('NOSOTROS') } }
              />

              <Counter
                title="ELLOS"
                onWin={ () => { this.handleWin('ELLOS') } }
              />
            </>
          }
        </div>
        <div className="footer">
        <span className="footer__copy">
                    &#169; Copyright {(new Date().getFullYear())} - <span className="footer__title"><a href='https://github.com/lauticonte' target='_blank' rel='noreferrer'> Conte</a></span>.</span>
        </div>
      </div>
    )
  }
}

export default App;
