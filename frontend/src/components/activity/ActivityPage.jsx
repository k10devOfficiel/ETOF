import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../common/Seo.jsx';
import Container from '../ui/Container.jsx';
import Button from '../ui/Button.jsx';
import DevPlaceholder from '../ui/DevPlaceholder.jsx';
import styles from './ActivityPage.module.css';

/**
 * Composant de gabarit réutilisable pour les 4 pages d'activités d'ETOF SARL.
 * Intègre un hero avec boutons d'action visibles sans défilement (above the fold),
 * une notice prudente optionnelle, une présentation, la liste des prestations,
 * les avantages clés et un bloc d'appel à l'action final.
 *
 * @param {{
 *   path?: string,
 *   metaTitle: string,
 *   metaDescription: string,
 *   badge: string,
 *   title: string,
 *   subtitle: string,
 *   heroActions: Array<{
 *     label: string,
 *     to: string,
 *     variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
 *   }>,
 *   notice?: {
 *     text: string,
 *     details?: string
 *   },
 *   presentation: {
 *     title: string,
 *     paragraphs: string[],
 *     sideCardTitle?: string,
 *     sideCardText?: string
 *   },
 *   services: {
 *     title: string,
 *     subtitle?: string,
 *     items: Array<{
 *       title: string,
 *       description: string,
 *       linkText?: string,
 *       linkTo?: string
 *     }>
 *   },
 *   advantages: {
 *     title: string,
 *     subtitle?: string,
 *     items: Array<{
 *       title: string,
 *       description: string
 *     }>
 *   },
 *   cta: {
 *     title: string,
 *     subtitle: string,
 *     actions: Array<{
 *       label: string,
 *       to: string,
 *       variant?: 'primary' | 'secondary' | 'outline'
 *     }>
 *   },
 *   devTopicKey?: string
 * }} props
 * @returns {JSX.Element}
 */
export function ActivityPage({
  path,
  metaTitle,
  metaDescription,
  badge,
  title,
  subtitle,
  heroActions = [],
  notice,
  presentation,
  services,
  advantages,
  cta,
  devTopicKey,
  children,
}) {
  return (
    <>
      <Seo title={metaTitle} description={metaDescription} path={path} />

      {/* Bandeau Hero avec boutons d'action visibles sans défiler */}
      <header className={styles.hero}>
        <Container size="fixed">
          {badge && <span className={styles.heroBadge}>{badge}</span>}
          <h1 className={styles.heroTitle}>{title}</h1>
          <p className={styles.heroSubtitle}>{subtitle}</p>

          {heroActions.length > 0 && (
            <div className={styles.heroActions}>
              {heroActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.to}
                  style={{ textDecoration: 'none' }}
                >
                  <Button
                    variant={action.variant || (index === 0 ? 'primary' : 'outline')}
                    size="lg"
                  >
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </header>

      {/* Bandeau réglementaire prudent (optionnel, pour hydrocarbures notamment) */}
      {notice && (
        <aside className={styles.noticeBanner} role="note" aria-label={notice.text}>
          <Container size="fixed">
            <div className={styles.noticeContent}>
              <svg
                className={styles.noticeIcon}
                viewBox="0 0 24 24"
                aria-hidden="true"
                role="img"
              >
                <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
              </svg>
              <div>
                <strong>{notice.text}</strong>
                {notice.details && <span> — {notice.details}</span>}
              </div>
            </div>
          </Container>
        </aside>
      )}

      {/* Section Présentation */}
      <section className={styles.section} aria-labelledby="activity-presentation-title">
        <Container size="fixed">
          <div className={styles.twoCols}>
            <div>
              <h2 id="activity-presentation-title" className={styles.sectionTitle}>
                {presentation.title}
              </h2>
              <div className={styles.presentationText}>
                {presentation.paragraphs.map((p, index) => (
                  <p key={index}>{p}</p>
                ))}
              </div>
            </div>

            {presentation.sideCardTitle && (
              <div className={styles.sideCard}>
                <h3 className={styles.sideCardTitle}>{presentation.sideCardTitle}</h3>
                <p className={styles.sectionSubtitle}>{presentation.sideCardText}</p>
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* Section Prestations / Produits */}
      <section
        className={`${styles.section} ${styles.sectionAlt}`}
        aria-labelledby="activity-services-title"
      >
        <Container size="fixed">
          <div className={styles.sectionHeader}>
            <h2 id="activity-services-title" className={styles.sectionTitle}>
              {services.title}
            </h2>
            {services.subtitle && (
              <p className={styles.sectionSubtitle}>{services.subtitle}</p>
            )}
          </div>

          <div className={styles.servicesGrid}>
            {services.items.map((item, index) => (
              <article key={index} className={styles.serviceCard}>
                <div>
                  <div className={styles.serviceCardHeader}>
                    <div className={styles.serviceIconWrapper} aria-hidden="true">
                      <svg className={styles.serviceIcon} viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <h3 className={styles.serviceTitle}>{item.title}</h3>
                  </div>
                  <p className={styles.serviceDesc}>{item.description}</p>
                </div>

                {item.linkTo && item.linkText && (
                  <Link to={item.linkTo} className={styles.serviceLink}>
                    <span>{item.linkText}</span>
                    <svg
                      className={styles.serviceIcon}
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      style={{ width: '16px', height: '16px' }}
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </article>
            ))}
          </div>

          {devTopicKey && <DevPlaceholder topicKey={devTopicKey} />}
        </Container>
      </section>

      {/* Section Avantages Clés */}
      <section className={styles.section} aria-labelledby="activity-advantages-title">
        <Container size="fixed">
          <div className={styles.sectionHeader}>
            <h2 id="activity-advantages-title" className={styles.sectionTitle}>
              {advantages.title}
            </h2>
            {advantages.subtitle && (
              <p className={styles.sectionSubtitle}>{advantages.subtitle}</p>
            )}
          </div>

          <div className={styles.advantagesGrid}>
            {advantages.items.map((item, index) => (
              <article key={index} className={styles.advantageCard}>
                <span className={styles.advantageNumber} aria-hidden="true">
                  0{index + 1}
                </span>
                <h3 className={styles.advantageTitle}>{item.title}</h3>
                <p className={styles.advantageDesc}>{item.description}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* Section spécifique optionnelle (ex: catalogue dédié ou formulaire devis) */}
      {children}

      {/* Bloc Appel à l'action final */}
      <section className={styles.ctaSection} aria-label={cta.title}>
        <Container size="fixed">
          <div className={styles.ctaBox}>
            <h2 className={styles.ctaTitle}>{cta.title}</h2>
            <p className={styles.ctaSubtitle}>{cta.subtitle}</p>
            {cta.actions.length > 0 && (
              <div className={styles.ctaActions}>
                {cta.actions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.to}
                    style={{ textDecoration: 'none' }}
                  >
                    <Button
                      variant={action.variant || (index === 0 ? 'primary' : 'outline')}
                      size="lg"
                    >
                      {action.label}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}

export default ActivityPage;

