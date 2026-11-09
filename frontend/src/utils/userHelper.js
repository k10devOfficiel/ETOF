/**
 * Fonction utilitaire unique displayName(user, lang) pour l'affichage de la civilité et du nom.
 *
 * Exemples :
 * - FR : « Monsieur Kofi », « Madame Ama », « Kofi » (sans civilité)
 * - EN : « Mr Kofi », « Ms Ama », « Kofi » (none)
 *
 * Utilise le prénom par défaut, ou le nom de famille si l'utilisateur l'a défini comme préféré.
 *
 * @param {object|null|undefined} user
 * @param {string} [lang='fr']
 * @returns {string}
 */
export function displayName(user, lang = 'fr') {
  if (!user || typeof user !== 'object') {
    return lang?.startsWith('en') ? 'Customer' : 'Cher Client';
  }

  const civility = user.civility || 'none';
  const preferred = user.preferred_name || 'first_name';
  const firstName = (user.first_name || '').trim();
  const lastName = (user.last_name || '').trim();

  let chosenName = '';
  if (preferred === 'last_name' && lastName) {
    chosenName = lastName;
  } else if (firstName) {
    chosenName = firstName;
  } else if (lastName) {
    chosenName = lastName;
  } else {
    chosenName = (user.name || user.full_name || '').trim();
  }

  if (!chosenName) {
    return lang?.startsWith('en') ? 'Customer' : 'Cher Client';
  }

  const isEn = (lang || 'fr').toLowerCase().startsWith('en');

  switch (civility) {
    case 'mr':
      return `${isEn ? 'Mr' : 'Monsieur'} ${chosenName}`;
    case 'mrs':
      return `${isEn ? 'Ms' : 'Madame'} ${chosenName}`;
    default:
      return chosenName;
  }
}

export default displayName;

