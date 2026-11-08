import React from 'react';
import styles from './Select.module.css';

/**
 * Menu déroulant stylisé avec flèche vectorielle discrète et focus visible.
 *
 * @param {{
 *   id?: string,
 *   hasError?: boolean,
 *   options?: Array<{ value: string | number, label: string, disabled?: boolean }>,
 *   children?: React.ReactNode,
 *   className?: string
 * } & React.SelectHTMLAttributes<HTMLSelectElement>} props
 */
function Select({
  id = '',
  hasError = false,
  options = [],
  children,
  className = '',
  disabled = false,
  ...restProps
}) {
  const selectClasses = [
    styles.select,
    hasError ? styles.hasError : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.selectWrapper}>
      <select
        id={id}
        disabled={disabled}
        aria-invalid={hasError ? 'true' : 'false'}
        className={selectClasses}
        {...restProps}
      >
        {options.length > 0
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      <span className={styles.iconWrapper} aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </div>
  );
}

export default Select;

