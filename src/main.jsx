// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Global Styles (CRITICAL: Must be imported here for Tailwind to compile)
import './styles/global.css';

// Providers & Router
import AppProviders from './providers/AppProviders';
import AppRouter from './routes/AppRouter';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </BrowserRouter>
  </React.StrictMode>
);