// React
import React from 'react';
import ReactDOM from 'react-dom/client';

// Third Party Libraries
import { BrowserRouter } from 'react-router-dom';

// Components
import AppProviders from './providers/AppProviders';
import App from './App';

// Styles
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </React.StrictMode>
);