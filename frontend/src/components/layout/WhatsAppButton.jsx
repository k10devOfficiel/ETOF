import { useTranslation } from 'react-i18next';
import styles from './WhatsAppButton.module.css';

/**
 * Bouton d'action flottant ouvrant directement une discussion WhatsApp.
 * N'est affiché que si un numéro WhatsApp valide est configuré.
 *
 * @param {{ phoneNumber?: string }} props
 * @returns {JSX.Element | null}
 */
export function WhatsAppButton({ phoneNumber }) {
  const { t } = useTranslation();

  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return null;
  }

  const cleanNumber = phoneNumber.replace(/\D/g, '');
  if (!cleanNumber) {
    return null;
  }

  const prefilledMessage = t('layout.whatsappMessage');
  const encodedMessage = encodeURIComponent(prefilledMessage);
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.whatsappFab}
      aria-label={t('layout.whatsappAriaLabel')}
      title={t('layout.whatsappAriaLabel')}
    >
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        aria-hidden="true"
        role="img"
      >
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.9C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.05 7.61C8.86 7.61 8.56 7.68 8.31 7.95C8.06 8.22 7.36 8.87 7.36 10.22C7.36 11.57 8.34 12.87 8.48 13.06C8.62 13.24 10.37 15.95 13.09 17.12C15.35 18.09 15.81 17.9 16.3 17.85C16.8 17.81 17.91 17.19 18.14 16.54C18.37 15.9 18.37 15.35 18.3 15.23C18.24 15.12 18.09 15.05 17.86 14.93C17.63 14.82 16.52 14.27 16.31 14.2C16.1 14.12 15.95 14.08 15.8 14.31C15.65 14.54 15.22 15.05 15.09 15.2C14.96 15.35 14.83 15.37 14.6 15.25C14.37 15.14 13.63 14.89 12.75 14.11C12.07 13.5 11.61 12.75 11.48 12.52C11.35 12.29 11.47 12.17 11.58 12.05C11.69 11.95 11.82 11.77 11.94 11.63C12.05 11.5 12.09 11.4 12.17 11.25C12.24 11.1 12.21 10.97 12.15 10.85C12.09 10.74 11.63 9.61 11.44 9.15C11.26 8.7 11.07 8.76 10.92 8.75C10.78 8.75 10.63 8.75 10.48 8.75C10.33 8.75 10.09 8.81 9.88 9.04C9.68 9.27 9.05 9.86 9.05 11.21" />
      </svg>
    </a>
  );
}

export default WhatsAppButton;

