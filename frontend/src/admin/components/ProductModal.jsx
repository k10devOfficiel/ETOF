import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
import adminApi from '../api/adminApi.js';
import styles from './ProductModal.module.css';

/**
 * Modale de création et modification de produit.
 * Propose des onglets Français et Anglais pour les textes, la saisie du prix en FCFA
 * (vide = sur demande), statut, quantité minimale, commande directe, ordre et téléversement d'image.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   product?: any | null,
 *   categories: Array<any>,
 *   onSaved: () => void
 * }} props
 * @returns {JSX.Element | null}
 */
export function ProductModal({ isOpen, onClose, product = null, categories = [], onSaved }) {
  const isEditing = Boolean(product && product.id);

  // Onglet linguistique actif (fr ou en)
  const [activeTab, setActiveTab] = useState('fr');

  // Champs du formulaire
  const [formData, setFormData] = useState({
    category_id: '',
    name_fr: '',
    name_en: '',
    description_fr: '',
    description_en: '',
    unit_fr: '',
    unit_en: '',
    reference: '',
    price: '',
    min_quantity: '1',
    is_orderable: true,
    is_available: true,
    is_active: true,
    sort_order: '0',
    image: '',
  });

  // États locaux
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Initialisation à l'ouverture
  useEffect(() => {
    if (product) {
      setFormData({
        category_id: product.category_id || product.category?.id || '',
        name_fr: product.name_fr || product.name || '',
        name_en: product.name_en || '',
        description_fr: product.description_fr || product.description || '',
        description_en: product.description_en || '',
        unit_fr: product.unit_fr || product.unit || '',
        unit_en: product.unit_en || '',
        reference: product.reference || '',
        price: product.price !== null && product.price !== undefined ? String(product.price) : '',
        min_quantity: String(product.min_quantity || 1),
        is_orderable: product.is_orderable !== undefined ? Boolean(product.is_orderable) : true,
        is_available: product.is_available !== undefined ? Boolean(product.is_available) : true,
        is_active: product.is_active !== undefined ? Boolean(product.is_active) : true,
        sort_order: String(product.sort_order || 0),
        image: product.image || '',
      });
      setPreviewUrl(product.image || '');
    } else {
      const defaultCat = categories.length > 0 ? String(categories[0].id) : '';
      setFormData({
        category_id: defaultCat,
        name_fr: '',
        name_en: '',
        description_fr: '',
        description_en: '',
        unit_fr: 'pièce',
        unit_en: 'piece',
        reference: '',
        price: '',
        min_quantity: '1',
        is_orderable: true,
        is_available: true,
        is_active: true,
        sort_order: '0',
        image: '',
      });
      setPreviewUrl('');
    }
    setSelectedFile(null);
    setGeneralError(null);
    setFieldErrors({});
    setActiveTab('fr');
  }, [product, categories, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData((prev) => ({ ...prev, image: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    try {
      setIsSubmitting(true);

      let finalImageUrl = formData.image;

      // Téléversement préalable si un nouveau fichier a été sélectionné
      if (selectedFile) {
        setIsUploading(true);
        const uploadRes = await adminApi.uploadImage(selectedFile);
        finalImageUrl = uploadRes?.url || '';
        setIsUploading(false);
      }

      const payload = {
        category_id: parseInt(formData.category_id, 10),
        name_fr: formData.name_fr.trim(),
        name_en: formData.name_en.trim() || formData.name_fr.trim(),
        description_fr: formData.description_fr.trim() || null,
        description_en: formData.description_en.trim() || null,
        unit_fr: formData.unit_fr.trim() || null,
        unit_en: formData.unit_en.trim() || null,
        reference: formData.reference.trim() || null,
        price: formData.price !== '' ? parseInt(formData.price, 10) : null,
        min_quantity: Math.max(1, parseInt(formData.min_quantity || '1', 10)),
        is_orderable: Boolean(formData.is_orderable),
        is_available: Boolean(formData.is_available),
        is_active: Boolean(formData.is_active),
        sort_order: parseInt(formData.sort_order || '0', 10),
        image: finalImageUrl || null,
      };

      if (isEditing) {
        await adminApi.updateProduct(product.id, payload);
      } else {
        await adminApi.createProduct(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      if (err?.fields) {
        setFieldErrors(err.fields);
        setGeneralError('Veuillez corriger les erreurs indiquées ci-dessous.');
      } else {
        setGeneralError(err?.message || 'Une erreur est survenue lors de l\'enregistrement du produit.');
      }
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Modifier le produit : ${product?.name_fr || product?.name}` : 'Créer un nouveau produit'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {generalError && <Alert variant="danger">{generalError}</Alert>}

        {/* Sélecteur d'onglets FR / EN */}
        <div className={styles.tabsHeader} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'fr'}
            className={`${styles.tabBtn} ${activeTab === 'fr' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('fr')}
          >
            🇫🇷 Français (Principal)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'en'}
            className={`${styles.tabBtn} ${activeTab === 'en' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('en')}
          >
            🇬🇧 Anglais (English)
          </button>
        </div>

        {/* Contenu de l'onglet Français */}
        {activeTab === 'fr' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className={styles.fieldGroup}>
              <label htmlFor="prod-name-fr" className={styles.label}>
                Nom du produit (FR) <span className={styles.required}>*</span>
              </label>
              <input
                id="prod-name-fr"
                name="name_fr"
                type="text"
                required
                className={`${styles.input} ${fieldErrors.name_fr ? styles.inputError : ''}`}
                value={formData.name_fr}
                onChange={handleChange}
                placeholder="Ex. Poulet de chair fermier"
              />
              {fieldErrors.name_fr && <span className={styles.fieldError}>{fieldErrors.name_fr[0]}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="prod-desc-fr" className={styles.label}>
                Description détaillée (FR)
              </label>
              <textarea
                id="prod-desc-fr"
                name="description_fr"
                className={styles.textarea}
                value={formData.description_fr}
                onChange={handleChange}
                placeholder="Description, méthode d'élevage, caractéristiques..."
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="prod-unit-fr" className={styles.label}>
                Unité de vente (FR)
              </label>
              <input
                id="prod-unit-fr"
                name="unit_fr"
                type="text"
                className={styles.input}
                value={formData.unit_fr}
                onChange={handleChange}
                placeholder="Ex. pièce, carton, kg, rame..."
              />
            </div>
          </div>
        )}

        {/* Contenu de l'onglet Anglais */}
        {activeTab === 'en' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className={styles.fieldGroup}>
              <label htmlFor="prod-name-en" className={styles.label}>
                Nom du produit (EN)
              </label>
              <input
                id="prod-name-en"
                name="name_en"
                type="text"
                className={styles.input}
                value={formData.name_en}
                onChange={handleChange}
                placeholder="Ex. Free-range broiler chicken"
              />
              <span className={styles.helperText}>Laissez vide pour utiliser le nom français par défaut.</span>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="prod-desc-en" className={styles.label}>
                Description détaillée (EN)
              </label>
              <textarea
                id="prod-desc-en"
                name="description_en"
                className={styles.textarea}
                value={formData.description_en}
                onChange={handleChange}
                placeholder="Description in English..."
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="prod-unit-en" className={styles.label}>
                Unité de vente (EN)
              </label>
              <input
                id="prod-unit-en"
                name="unit_en"
                type="text"
                className={styles.input}
                value={formData.unit_en}
                onChange={handleChange}
                placeholder="Ex. piece, box, kg, ream..."
              />
            </div>
          </div>
        )}

        {/* Paramètres généraux & Données numériques */}
        <div className={styles.grid2}>
          <div className={styles.fieldGroup}>
            <label htmlFor="prod-category" className={styles.label}>
              Catégorie <span className={styles.required}>*</span>
            </label>
            <select
              id="prod-category"
              name="category_id"
              required
              className={`${styles.select} ${fieldErrors.category_id ? styles.inputError : ''}`}
              value={formData.category_id}
              onChange={handleChange}
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.activity === 'farm' ? 'Ferme' : c.activity === 'office' ? 'Fournitures' : c.activity}] {c.name_fr || c.name}
                </option>
              ))}
            </select>
            {fieldErrors.category_id && <span className={styles.fieldError}>{fieldErrors.category_id[0]}</span>}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="prod-reference" className={styles.label}>
              Référence produit
            </label>
            <input
              id="prod-reference"
              name="reference"
              type="text"
              className={styles.input}
              value={formData.reference}
              onChange={handleChange}
              placeholder="Ex. FARM-CKN-001"
            />
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.fieldGroup}>
            <label htmlFor="prod-price" className={styles.label}>
              Prix unitaire (FCFA)
            </label>
            <input
              id="prod-price"
              name="price"
              type="number"
              min="0"
              step="1"
              className={`${styles.input} ${fieldErrors.price ? styles.inputError : ''}`}
              value={formData.price}
              onChange={handleChange}
              placeholder="Laisser vide pour 'Sur demande'"
            />
            {fieldErrors.price && <span className={styles.fieldError}>{fieldErrors.price[0]}</span>}
            <span className={styles.helperText}>Si non renseigné, « Prix sur demande » sera affiché.</span>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="prod-min-quantity" className={styles.label}>
              Quantité minimale de commande
            </label>
            <input
              id="prod-min-quantity"
              name="min_quantity"
              type="number"
              min="1"
              className={`${styles.input} ${fieldErrors.min_quantity ? styles.inputError : ''}`}
              value={formData.min_quantity}
              onChange={handleChange}
            />
            {fieldErrors.min_quantity && <span className={styles.fieldError}>{fieldErrors.min_quantity[0]}</span>}
          </div>
        </div>

        {/* Options et interrupteurs */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="is_available"
              checked={formData.is_available}
              onChange={handleChange}
            />
            <span>Disponible en stock</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="is_orderable"
              checked={formData.is_orderable}
              onChange={handleChange}
            />
            <span>Commande directe autorisée</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
            <span>Actif (visible sur le site)</span>
          </label>
        </div>

        {/* Téléversement d'image avec aperçu */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Photo du produit</label>
          <div className={styles.imageUploadZone}>
            {previewUrl ? (
              <div className={styles.previewContainer}>
                <img src={previewUrl} alt="Aperçu" className={styles.previewImg} />
                <button
                  type="button"
                  className={styles.removeImgBtn}
                  onClick={handleRemoveImage}
                  title="Supprimer la photo"
                >
                  ✕
                </button>
              </div>
            ) : null}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className={styles.input}
            />
            <span className={styles.helperText}>Formats acceptés : JPG, PNG, WEBP (max 5 Mo).</span>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner size="sm" />
                <span>{isUploading ? 'Téléversement...' : 'Enregistrement...'}</span>
              </>
            ) : isEditing ? (
              'Enregistrer les modifications'
            ) : (
              'Créer le produit'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductModal;

