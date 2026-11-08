import React from 'react';
import styles from './Textarea.module.css';

/**
 * Zone de texte multiligne accessible avec redimensionnement vertical.
 *
 * @param {{
 *   id?: string,
 *   hasError?: boolean,
 *   rows?: number,
 *   className?: string
 * } & React.TextareaHTMLAttributes<HTMLTextAreaElement>} props
 */
function Textarea({
  id = '',
  hasError = false,
  rows = 4,
  className = '',
  disabled = false,
  ...restProps
}) {
  const textareaClasses = [
    styles.textarea,
    hasError ? styles.hasError : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <textarea
      id={id}
      rows={rows}
      disabled={disabled}
      aria-invalid={hasError ? 'true' : 'false'}
      className={textareaClasses}
      {...restProps}
    />
  );
}

export default Textarea;

