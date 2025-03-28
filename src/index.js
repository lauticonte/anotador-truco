import React from 'react';
import { createRoot } from 'react-dom/client'; // Importar la nueva API
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.js';

// Obtener el elemento del DOM donde se montará la aplicación
const rootElement = document.getElementById('root');

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
