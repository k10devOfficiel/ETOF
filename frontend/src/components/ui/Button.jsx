import React from 'react';
import Spinner from './Spinner.jsx';
import styles from './Button.module.css';

/**
 * Bouton interactif haut de gamme supportant plusieurs variantes, tailles et état de chargement.
 *
 * @param {{
 *   children: React.ReactNode,
 *   variant?: 'primary' | 'secondary' | 'outline' | 'ghost',
 *   size?: 'sm' | 'md' | 'lg',
 *   type?: 'button' | 'submit' | 'reset',
 *   loading?: boolean,
 *   disabled?: boolean,
 *   fullWidth?: boolean,
 *   icon?: React.ReactNode,
 *   className?: string,
 *   onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
 * } & React.ButtonHTMLAttributes<HTMLButtonElement>} props
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon = null,
  className = '',
  onClick,
  ...restProps
}) {
  const isButtonDisabled = disabled || loading;

  const buttonClasses = [
    styles.button,
    styles[variant] || styles.primary,
    styles[size] || styles.md,
    fullWidth ? styles.fullWidth : '',
    loading ? styles.loading : '',
    className,
  ].filter(Boolean).join(' ');

  const spinnerColor = variant === 'outline' || variant === 'ghost' ? 'primary' : 'white';

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={isButtonDisabled}
      aria-busy={loading ? 'true' : undefined}
      aria-disabled={isButtonDisabled ? 'true' : undefined}
      onClick={onClick}
      {...restProps}
    >
      {loading && (
        <span className={styles.spinnerContainer} aria-hidden="true">
          <Spinner size={size === 'lg' ? 'md' : 'sm'} color={spinnerColor} />
        </span>
      )}
      <span className={loading ? styles.hiddenContent : ''}>
        {icon && <span aria-hidden="true">{icon}</span>}
        {children}
      </span>
    </button>
  );
}

export { Button };
export default Button;

