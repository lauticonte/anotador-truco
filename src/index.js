import React from 'react';
import { createRoot } from 'react-dom/client'; // Importar la nueva API
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './styles/Icons.css';
import App from './App.js';

// Obtener el elemento del DOM donde se montará la aplicación
const rootElement = document.getElementById('root');

const mount = () => {
  // Crear el "root" con la nueva API
  const root = createRoot(rootElement);

  // Renderizar la aplicación
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
};

// Se monta después de que el navegador dibuja el contenido inicial de #root (logo y texto del HTML).
// Si React lo reemplaza antes del primer dibujo, el LCP pasa a ser el logo de React y espera a todo el JS.
// En una pestaña oculta requestAnimationFrame no corre, así que ahí se monta directo.
if (document.visibilityState === 'visible') {
  requestAnimationFrame(() => setTimeout(mount, 0));
} else {
  mount();
}
