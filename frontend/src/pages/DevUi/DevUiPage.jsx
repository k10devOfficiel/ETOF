import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
  Button,
  Container,
  Section,
  Card,
  Badge,
  FormField,
  Input,
  Textarea,
  Select,
  Checkbox,
  Alert,
  Spinner,
  Modal,
} from '../../components/ui/index.js';
import styles from './DevUiPage.module.css';

/**
 * Page de démonstration et validation visuelle du système de design ETOF SARL (/dev/ui).
 */
function DevUiPage() {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // États pour les contrôles de formulaire
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '12345',
    activity: 'vehicle',
    message: '',
    consent: false,
    consentError: false,
  });

  const handleInputChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectOptions = [
    { value: 'farm', label: t('dev_ui.select_activity_opt1') },
    { value: 'vehicle', label: t('dev_ui.select_activity_opt2') },
    { value: 'office', label: t('dev_ui.select_activity_opt3') },
    { value: 'fuel', label: t('dev_ui.select_activity_opt4') },
  ];

  return (
    <main className={styles.page}>
      <Helmet>
        <title>{t('dev_ui.meta_title')}</title>
      </Helmet>

      {/* En-tête de page prestige */}
      <Section
        title={t('dev_ui.page_title')}
        subtitle={t('dev_ui.page_subtitle')}
        theme="white"
        align="center"
      />

      <Container>
        {/* 1. Boutons */}
        <Section
          title={t('dev_ui.section_buttons')}
          subtitle={t('dev_ui.section_buttons_sub')}
          align="left"
        >
          <div className={styles.buttonRow}>
            <Button variant="primary">{t('dev_ui.btn_primary')}</Button>
            <Button variant="secondary">{t('dev_ui.btn_secondary')}</Button>
            <Button variant="outline">{t('dev_ui.btn_outline')}</Button>
            <Button variant="ghost">{t('dev_ui.btn_ghost')}</Button>
          </div>

          <div className={styles.buttonRow} style={{ marginTop: '1.25rem' }}>
            <Button size="sm" variant="primary">{t('dev_ui.btn_small')}</Button>
            <Button size="md" variant="primary">{t('dev_ui.btn_medium')}</Button>
            <Button size="lg" variant="primary">{t('dev_ui.btn_large')}</Button>
          </div>

          <div className={styles.buttonRow} style={{ marginTop: '1.25rem' }}>
            <Button variant="primary" loading={isLoading}>
              {t('dev_ui.btn_loading')}
            </Button>
            <Button variant="primary" disabled>
              {t('dev_ui.btn_disabled')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsLoading((prev) => !prev)}
            >
              {t('dev_ui.btn_toggle_loading')}
            </Button>
          </div>
        </Section>

        {/* 2. Badges */}
        <Section
          title={t('dev_ui.section_badges')}
          subtitle={t('dev_ui.section_badges_sub')}
          align="left"
        >
          <div className={styles.badgeRow}>
            <Badge variant="available">{t('dev_ui.badge_available')}</Badge>
            <Badge variant="reserved">{t('dev_ui.badge_reserved')}</Badge>
            <Badge variant="sold">{t('dev_ui.badge_sold')}</Badge>
            <Badge variant="on_demand">{t('dev_ui.badge_on_demand')}</Badge>
            <Badge variant="primary" withDot={false}>{t('dev_ui.badge_pole_farm')}</Badge>
            <Badge variant="accent" withDot={false}>{t('dev_ui.badge_pole_vehicle')}</Badge>
          </div>
        </Section>

        {/* 3. Alertes */}
        <Section
          title={t('dev_ui.section_alerts')}
          subtitle={t('dev_ui.section_alerts_sub')}
          align="left"
        >
          <div className={styles.alertStack}>
            <Alert variant="success" title={t('dev_ui.alert_success_title')}>
              {t('dev_ui.alert_success_msg')}
            </Alert>
            <Alert variant="error" title={t('dev_ui.alert_error_title')}>
              {t('dev_ui.alert_error_msg')}
            </Alert>
            <Alert variant="warning" title={t('dev_ui.alert_warning_title')}>
              {t('dev_ui.alert_warning_msg')}
            </Alert>
            <Alert variant="info" title={t('dev_ui.alert_info_title')}>
              {t('dev_ui.alert_info_msg')}
            </Alert>
          </div>
        </Section>

        {/* 4. Cartes */}
        <Section
          title={t('dev_ui.section_cards')}
          subtitle={t('dev_ui.section_cards_sub')}
          align="left"
        >
          <div className={styles.grid}>
            <Card variant="default">
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{t('dev_ui.card_default_title')}</h3>
                <p className={styles.cardText}>{t('dev_ui.card_default_desc')}</p>
                <div className={styles.cardFooter}>
                  <Badge variant="available">{t('dev_ui.badge_available')}</Badge>
                  <Button size="sm" variant="ghost">{t('dev_ui.btn_small')}</Button>
                </div>
              </div>
            </Card>

            <Card variant="elevated">
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{t('dev_ui.card_elevated_title')}</h3>
                <p className={styles.cardText}>{t('dev_ui.card_elevated_desc')}</p>
                <div className={styles.cardFooter}>
                  <Badge variant="reserved">{t('dev_ui.badge_reserved')}</Badge>
                  <Button size="sm" variant="secondary">{t('dev_ui.btn_small')}</Button>
                </div>
              </div>
            </Card>

            <Card variant="interactive">
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{t('dev_ui.card_interactive_title')}</h3>
                <p className={styles.cardText}>{t('dev_ui.card_interactive_desc')}</p>
                <div className={styles.cardFooter}>
                  <Badge variant="accent" withDot={false}>{t('dev_ui.badge_pole_vehicle')}</Badge>
                  <Button size="sm" variant="primary">{t('dev_ui.btn_small')}</Button>
                </div>
              </div>
            </Card>
          </div>
        </Section>

        {/* 5. Formulaires & Contrôles */}
        <Section
          title={t('dev_ui.section_forms')}
          subtitle={t('dev_ui.section_forms_sub')}
          align="left"
        >
          <form className={styles.formGrid} onSubmit={(e) => e.preventDefault()}>
            <FormField
              id="field-fullname"
              label={t('dev_ui.input_name_label')}
              help={t('dev_ui.input_name_help')}
              required
            >
              <Input
                id="field-fullname"
                placeholder={t('dev_ui.input_name_placeholder')}
                value={formData.fullName}
                onChange={handleInputChange('fullName')}
                required
              />
            </FormField>

            <FormField
              id="field-email"
              label={t('dev_ui.input_email_label')}
              required
            >
              <Input
                id="field-email"
                type="email"
                placeholder={t('dev_ui.input_email_placeholder')}
                value={formData.email}
                onChange={handleInputChange('email')}
                required
              />
            </FormField>

            <FormField
              id="field-phone-error"
              label={t('dev_ui.input_error_label')}
              error={t('dev_ui.input_error_msg')}
              required
            >
              <Input
                id="field-phone-error"
                type="tel"
                placeholder={t('dev_ui.input_error_placeholder')}
                value={formData.phone}
                onChange={handleInputChange('phone')}
                hasError
              />
            </FormField>

            <FormField
              id="field-activity"
              label={t('dev_ui.select_activity_label')}
              required
            >
              <Select
                id="field-activity"
                value={formData.activity}
                options={selectOptions}
                onChange={handleInputChange('activity')}
              />
            </FormField>

            <div className={styles.formFullWidth}>
              <FormField
                id="field-message"
                label={t('dev_ui.textarea_label')}
              >
                <Textarea
                  id="field-message"
                  placeholder={t('dev_ui.textarea_placeholder')}
                  value={formData.message}
                  onChange={handleInputChange('message')}
                />
              </FormField>
            </div>

            <div className={styles.formFullWidth}>
              <Checkbox
                id="field-consent"
                checked={formData.consent}
                label={t('dev_ui.checkbox_label')}
                onChange={handleInputChange('consent')}
              />
            </div>

            <div className={styles.formFullWidth}>
              <FormField
                id="field-consent-error"
                error={t('dev_ui.checkbox_error_msg')}
              >
                <Checkbox
                  id="field-consent-error"
                  checked={formData.consentError}
                  label={t('dev_ui.checkbox_error_label')}
                  hasError
                  onChange={handleInputChange('consentError')}
                />
              </FormField>
            </div>

            <div className={styles.formFullWidth} style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <Button type="submit" variant="primary">{t('ui.submit')}</Button>
              <Button type="reset" variant="outline">{t('ui.cancel')}</Button>
            </div>
          </form>
        </Section>

        {/* 6. Spinners */}
        <Section
          title={t('dev_ui.section_spinners')}
          subtitle={t('dev_ui.section_spinners_sub')}
          align="left"
        >
          <div className={styles.spinnerRow}>
            <Spinner size="sm" color="primary" />
            <Spinner size="md" color="primary" />
            <Spinner size="lg" color="primary" />
            <Spinner size="md" color="accent" />
            <div className={styles.spinnerDarkBox}>
              <Spinner size="md" color="white" />
            </div>
          </div>
        </Section>

        {/* 7. Modale Accessible */}
        <Section
          title={t('dev_ui.section_modal')}
          subtitle={t('dev_ui.section_modal_sub')}
          align="left"
        >
          <Button variant="secondary" size="lg" onClick={() => setIsModalOpen(true)}>
            {t('dev_ui.btn_open_modal')}
          </Button>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={t('dev_ui.modal_title')}
            footer={
              <>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                  {t('dev_ui.modal_cancel')}
                </Button>
                <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                  {t('dev_ui.modal_confirm')}
                </Button>
              </>
            }
          >
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              {t('dev_ui.modal_body')}
            </p>
          </Modal>
        </Section>
      </Container>
    </main>
  );
}

export default DevUiPage;

