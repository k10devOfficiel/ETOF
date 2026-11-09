import React from 'react';

/**
 * Correspondance exhaustive des noms d'icônes avec Font Awesome 6.
 */
const faMap = {
  // Contact & Réseaux
  phone: 'fa-solid fa-phone',
  envelope: 'fa-solid fa-envelope',
  'location-dot': 'fa-solid fa-location-dot',
  clock: 'fa-solid fa-clock',
  whatsapp: 'fa-brands fa-whatsapp',
  facebook: 'fa-brands fa-facebook',
  instagram: 'fa-brands fa-instagram',
  linkedin: 'fa-brands fa-linkedin',

  // Pôles d'activités ETOF
  car: 'fa-solid fa-car',
  feather: 'fa-solid fa-feather-pointed',
  briefcase: 'fa-solid fa-briefcase',
  'gas-pump': 'fa-solid fa-gas-pump',

  // Interface utilisateur & Statuts
  check: 'fa-solid fa-check',
  xmark: 'fa-solid fa-xmark',
  bars: 'fa-solid fa-bars',
  chevronDown: 'fa-solid fa-chevron-down',
  'chevron-down': 'fa-solid fa-chevron-down',
  'arrow-right': 'fa-solid fa-arrow-right',
  'shield-halved': 'fa-solid fa-shield-halved',
  'circle-check': 'fa-solid fa-circle-check',
  'circle-xmark': 'fa-solid fa-circle-xmark',
  'circle-info': 'fa-solid fa-circle-info',
  user: 'fa-solid fa-user',
  cart: 'fa-solid fa-cart-shopping',
  box: 'fa-solid fa-box',
  message: 'fa-solid fa-comment',
  lock: 'fa-solid fa-lock',
  'magnifying-glass': 'fa-solid fa-magnifying-glass',
  bell: 'fa-solid fa-bell',
  'file-lines': 'fa-solid fa-file-lines',
  eye: 'fa-solid fa-eye',
  filter: 'fa-solid fa-filter',
};

/**
 * Composant d'icône officiel propulsé par Font Awesome 6.
 *
 * @param {{
 *   name: string,
 *   size?: number | string,
 *   className?: string,
 *   color?: string,
 *   title?: string,
 *   style?: React.CSSProperties
 * }} props
 * @returns {JSX.Element}
 */
export function Icon({
  name,
  size = 24,
  className = '',
  color = 'currentColor',
  title,
  style = {},
  ...restProps
}) {
  const faClass = faMap[name] || `fa-solid fa-${name}`;

  return (
    <i
      className={`${faClass} ${className}`}
      style={{
        fontSize: typeof size === 'number' ? `${size}px` : size,
        color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        ...style,
      }}
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
      aria-label={title}
      {...restProps}
    />
  );
}

export default Icon;
