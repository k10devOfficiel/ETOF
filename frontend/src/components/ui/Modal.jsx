import React, { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Modal.module.css';

/**
 * Boîte de dialogue modale accessible avec gestion de l'échappement clavier et focus.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   title: React.ReactNode,
 *   children: React.ReactNode,
 *   footer?: React.ReactNode,
 *   size?: 'sm' | 'md' | 'lg',
 *   className?: string
 * }} props
 */
function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  size = 'md',
  className = '',
}) {
  const { t } = useTranslation();

  // Écoute de la touche Échap pour refermer la modale
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  const modalClasses = [
    styles.modal,
    styles[size] || styles.md,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        className={modalClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className={styles.header}>
          <h2 id="modal-title" className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t('ui.close')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className={styles.body}>{children}</div>

        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>
  );
}

export { Modal };
export default Modal;

