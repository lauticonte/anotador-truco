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

  showWinner () {
    if (this.state.winner === 'NOSOTROS') {
      return <><p>GANAMOS <br /> NOSOTROS :D</p><img className='img-lost' src="/images/happy.png" alt="happy" loading="lazy" /></>
    } else
        return <><p>GANARON <br /> ELLOS :(</p><img className='img-lost' src="/images/sadge.png" alt="sadge" loading="lazy" /></>;
          
  };

  render () {
    return (
      <div className="app">
        <div className="title">
          <h1> Anotador de Truco </h1>
        </div>
        <div className="board">
          { this.state.finished ?
            <div className="finished-message">
              <h3>{ this.showWinner() }</h3>
              <button
                className="restart-button"
                onClick={ () => { this.setState({ finished: false }) } }
              >
                REINICIAR
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
                    &#169; Copyright {(new Date().getFullYear())} - <span className="footer__title"><a href='https://contelautaro.com.ar' target='_blank' rel='noreferrer'> Conte</a></span>.</span>
        </div>
      </div>
    )
  }
}

export default App;
