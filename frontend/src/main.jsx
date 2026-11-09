import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './i18n/index.js';
import './styles/global.css';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { UserAuthProvider } from './context/UserAuthContext.jsx';
import { OrderProvider } from './context/OrderContext.jsx';
import App from './App.jsx';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <HelmetProvider>
        <ErrorBoundary>
          <ThemeProvider>
            <BrowserRouter>
              <ToastProvider>
                <UserAuthProvider>
                  <OrderProvider>
                    <App />
                  </OrderProvider>
                </UserAuthProvider>
              </ToastProvider>
            </BrowserRouter>
          </ThemeProvider>
        </ErrorBoundary>
      </HelmetProvider>
    </React.StrictMode>
  );
}

