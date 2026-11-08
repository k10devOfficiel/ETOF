import React from 'react';
import styles from './Input.module.css';

/**
 * Champ de saisie texte accessible et stylisé avec focus turquoise.
 *
 * @param {{
 *   id?: string,
 *   type?: string,
 *   hasError?: boolean,
 *   className?: string
 * } & React.InputHTMLAttributes<HTMLInputElement>} props
 */
function Input({
  id = '',
  type = 'text',
  hasError = false,
  className = '',
  disabled = false,
  ...restProps
}) {
  const inputClasses = [
    styles.input,
    hasError ? styles.hasError : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.inputWrapper}>
      <input
        id={id}
        type={type}
        disabled={disabled}
        aria-invalid={hasError ? 'true' : 'false'}
        className={inputClasses}
        {...restProps}
      />
    </div>
  );
}

export default Input;

