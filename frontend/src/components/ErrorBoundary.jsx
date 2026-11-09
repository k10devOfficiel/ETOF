import React, { Component } from 'react';
import i18n from '../i18n/index.js';
import styles from './ErrorBoundary.module.css';

/**
 * Composant de capture des erreurs d'exécution React avec interface de secours accessible et localisée.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    if (import.meta.env.DEV && typeof console !== 'undefined' && console.error) {
      console.error('ErrorBoundary captured error:', error, errorInfo);
    }
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className={styles.container} role="alert" aria-live="assertive">
          <div className={styles.card}>
            <h1 className={styles.title}>{i18n.t('error_boundary.title')}</h1>
            <p className={styles.description}>{i18n.t('error_boundary.description')}</p>

            {import.meta.env.DEV && this.state.error && (
              <div
                style={{
                  textAlign: 'left',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '1rem',
                  margin: '1rem 0',
                  fontSize: '0.85rem',
                  color: '#991b1b',
                  overflowX: 'auto',
                  maxHeight: '250px',
                }}
              >
                <strong>{this.state.error.name}: {this.state.error.message}</strong>
                {this.state.error.stack && (
                  <pre style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={styles.retryButton}
                onClick={this.handleReload}
              >
                {i18n.t('error_boundary.retry')}
              </button>
              {import.meta.env.DEV && (
                <button
                  type="button"
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    backgroundColor: '#e2e8f0',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                  }}
                  onClick={this.handleReset}
                >
                  Réessayer sans recharger
                </button>
              )}
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

