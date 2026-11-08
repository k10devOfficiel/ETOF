import React, { useId } from 'react';
import styles from './FormField.module.css';

/**
 * Enveloppe de champ de formulaire reliant de manière accessible et robuste
 * le libellé (htmlFor), l'aide et le message d'erreur d'accessibilité (role="alert", aria-live="polite").
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
  const generatedId = useId();
  const fieldId = id || generatedId;
  const helpId = help ? `${fieldId}-help` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  // Injection accessible des attributs ARIA dans l'élément enfant
  const enhancedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    const describedBy = [
      child.props['aria-describedby'],
      errorId,
      !error && helpId ? helpId : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return React.cloneElement(child, {
      id: child.props.id || fieldId,
      hasError: Boolean(child.props.hasError || child.props.error || error),
      'aria-invalid': Boolean(error || child.props.hasError || child.props.error) ? 'true' : 'false',
      'aria-describedby': describedBy,
      'aria-required': required ? 'true' : child.props['aria-required'],
    });
  });

  return (
    <div className={`${styles.field} ${className}`.trim()}>
      {label && (
        <div className={styles.labelWrapper}>
          <label htmlFor={fieldId} className={styles.label}>
            {label}
            {required && (
              <span className={styles.required} aria-hidden="true">
                *
              </span>
            )}
          </label>
        </div>
      )}
      {enhancedChildren}
      {help && !error && (
        <div id={helpId} className={styles.helpText}>
          {help}
        </div>
      )}
      {error && (
        <div id={errorId} className={styles.errorText} role="alert" aria-live="polite">
          {error}
        </div>
      )}
    </div>
  );
}

export default FormField;
