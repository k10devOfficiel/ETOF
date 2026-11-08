import React from 'react';
import styles from './FormField.module.css';

/**
 * Enveloppe de champ de formulaire reliant le libellé, l'aide et le message d'erreur d'accessibilité.
 *
 * @param {{
 *   children: React.ReactNode,
 *   id?: string,
 *   label?: React.ReactNode,
 *   help?: React.ReactNode,
 *   error?: React.ReactNode,
 *   required?: boolean,
 *   className?: string
 * }} props
 */
function FormField({
  children,
  id = '',
  label = null,
  help = null,
  error = null,
  required = false,
  className = '',
}) {
  const helpId = id && help ? `${id}-help` : undefined;
  const errorId = id && error ? `${id}-error` : undefined;

  return (
    <div className={`${styles.field} ${className}`.trim()}>
      {label && (
        <div className={styles.labelWrapper}>
          <label htmlFor={id} className={styles.label}>
            {label}
            {required && <span className={styles.required} aria-hidden="true">*</span>}
          </label>
        </div>
      )}
      {children}
      {help && !error && (
        <div id={helpId} className={styles.helpText}>
          {help}
        </div>
      )}
      {error && (
        <div id={errorId} className={styles.errorText} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default FormField;

