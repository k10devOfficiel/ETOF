import React from 'react';
import styles from './Checkbox.module.css';

/**
 * Case à cocher personnalisée et accessible au clavier avec focus visible.
 *
 * @param {{
 *   id?: string,
 *   label?: React.ReactNode,
 *   checked?: boolean,
 *   hasError?: boolean,
 *   className?: string
 * } & React.InputHTMLAttributes<HTMLInputElement>} props
 */
function Checkbox({
  id = '',
  label = null,
  checked = false,
  hasError = false,
  disabled = false,
  className = '',
  onChange,
  ...restProps
}) {
  const containerClasses = [
    styles.container,
    disabled ? styles.disabled : '',
    hasError ? styles.hasError : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <label htmlFor={id} className={containerClasses}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-invalid={hasError ? 'true' : 'false'}
        onChange={onChange}
        className={styles.input}
        {...restProps}
      />
      <span className={styles.box} aria-hidden="true">
        {checked && (
          <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}

export default Checkbox;

