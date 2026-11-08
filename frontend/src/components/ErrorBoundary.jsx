import React, { Component } from 'react';
import i18n from '../i18n/index.js';
import styles from './ErrorBoundary.module.css';

/**
 * Composant de capture des erreurs d'exécution React avec interface de secours accessible et localisée.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('ErrorBoundary captured error:', error, errorInfo);
    }
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className={styles.container} role="alert" aria-live="assertive">
          <div className={styles.card}>
            <h1 className={styles.title}>{i18n.t('error_boundary.title')}</h1>
            <p className={styles.description}>{i18n.t('error_boundary.description')}</p>
            <button
              type="button"
              className={styles.retryButton}
              onClick={this.handleReload}
            >
              {i18n.t('error_boundary.retry')}
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

