import React from 'react';
import styles from './Alert.module.css';

/**
 * Boîte d'alerte et de rétroaction utilisateur accessible et conforme aux contrastes WCAG AA.
 *
 * @param {{
 *   children: React.ReactNode,
 *   title?: React.ReactNode,
 *   variant?: 'success' | 'error' | 'warning' | 'info',
 *   className?: string
 * }} props
 */
function Alert({
  children,
  title = null,
  variant = 'info',
  className = '',
}) {
  const alertClasses = [
    styles.alert,
    styles[variant] || styles.info,
    className,
  ].filter(Boolean).join(' ');

  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status';

  return (
    <div className={alertClasses} role={role} aria-live="polite">
      <span className={styles.iconWrapper} aria-hidden="true">
        {variant === 'success' && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        )}
        {variant === 'error' && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        )}
        {variant === 'warning' && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )}
        {variant === 'info' && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        )}
      </span>
      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        <div>{children}</div>
      </div>
    </div>
  );
}

export default Alert;

