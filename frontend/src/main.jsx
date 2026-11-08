import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './i18n/index.js';
import './styles/global.css';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { OrderProvider } from './context/OrderContext.jsx';
import App from './App.jsx';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <HelmetProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <OrderProvider>
              <App />
            </OrderProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </HelmetProvider>
    </React.StrictMode>
  );
}

