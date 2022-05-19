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
                title="Nosotros"
                onWin={ () => { this.handleWin('Nosotros') } }
              />

              <Counter
                title="Ellos"
                onWin={ () => { this.handleWin('Ellos') } }
              />
            </>
          }
        </div>
        <div className="footer">
        <span className="footer__copy">
                    &#169;Copyright, <script>document.write(new Date().getFullYear())</script>
                     <span className="footer__title"><b><a href='https://github.com/lauticonte' target='_blank' rel='noreferrer'>Conte</a></b></span>. All rights reserved.
                </span>
        </div>
      </div>
    )
  }
}

export default App;
