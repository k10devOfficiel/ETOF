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
const PRODUCT_ANGLES = [
  {
    key: 'front',
    labelFr: 'Vue Principale - Face / Présentation globale',
    labelEn: 'Main view - Front / Full product view',
    badgeLabel: 'Face',
    badgeClass: 'badgeFront',
  },
  {
    key: 'detail',
    labelFr: 'Vue Rapprochée - Détail / Texture / Finition',
    labelEn: 'Close-up - Detail / Texture',
    badgeLabel: 'Détail',
    badgeClass: 'badgeDetail',
  },
  {
    key: 'packaging',
    labelFr: 'Vue Conditionnement - Emballage / Lot / Packaging',
    labelEn: 'Packaging view - Packaging / Bundle',
    badgeLabel: 'Packaging',
    badgeClass: 'badgePackaging',
  },
];

export function ProductModal({ isOpen, onClose, product = null, categories = [], onSaved }) {
  const isEditing = Boolean(product && product.id);

  // Champs du formulaire unifiés
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    unit: 'pièce',
    reference: '',
    price: '',
    min_quantity: '1',
    is_orderable: true,
    is_available: true,
    is_active: true,
    sort_order: '0',
    image: '',
  });

  // Caractéristiques techniques spécifiques structurées
  const [specsData, setSpecsData] = useState({
    origin: '',
    weight_volume: '',
    packaging: '',
    certification: '',
    brand: '',
    storage: '',
  });

  // Galerie de photos multi-angles du produit
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedAngleKey, setSelectedAngleKey] = useState('front');
  const [customAngleLabel, setCustomAngleLabel] = useState('');
  const [newAngleFile, setNewAngleFile] = useState(null);
  const [newAnglePreview, setNewAnglePreview] = useState('');
  const [pendingGalleryImages, setPendingGalleryImages] = useState([]);
  const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);

  // Photo principale de couverture
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
        name: product.name_fr || product.name || product.name_en || '',
        description: product.description_fr || product.description || product.description_en || '',
        unit: product.unit_fr || product.unit || product.unit_en || 'pièce',
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

      // Extraction des specs JSON existantes
      let parsedSpecs = {};
      if (product.specs) {
        if (typeof product.specs === 'object') {
          parsedSpecs = product.specs;
        } else {
          try {
            parsedSpecs = JSON.parse(product.specs);
          } catch {
            parsedSpecs = {};
          }
        }
      }

      setSpecsData({
        origin: parsedSpecs.origin || parsedSpecs.origine || '',
        weight_volume: parsedSpecs.weight || parsedSpecs.poids || parsedSpecs.volume || parsedSpecs.format || '',
        packaging: parsedSpecs.packaging || parsedSpecs.conditionnement || '',
        certification: parsedSpecs.certification || parsedSpecs.norme || '',
        brand: parsedSpecs.brand || parsedSpecs.marque || '',
        storage: parsedSpecs.storage || parsedSpecs.conservation || '',
      });

      setGalleryImages(Array.isArray(product.images) ? [...product.images] : []);
    } else {
      const defaultCat = categories.length > 0 ? String(categories[0].id) : '';
      setFormData({
        category_id: defaultCat,
        name: '',
        description: '',
        unit: 'pièce',
        reference: '',
        price: '',
        min_quantity: '1',
        is_orderable: true,
        is_available: true,
        is_active: true,
        sort_order: '0',
        image: '',
      });
      setSpecsData({
        origin: '',
        weight_volume: '',
        packaging: '',
        certification: '',
        brand: '',
        storage: '',
      });
      setGalleryImages([]);
      setPreviewUrl('');
    }

    setPendingGalleryImages([]);
    setNewAngleFile(null);
    setNewAnglePreview('');
    setCustomAngleLabel('');
    setSelectedAngleKey('front');
    setSelectedFile(null);
    setGeneralError(null);
    setFieldErrors({});
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

  const handleSpecsChange = (e) => {
    const { name, value } = e.target;
    setSpecsData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  // Sélection du fichier pour un angle de vue secondaire
  const handleSelectAngleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewAngleFile(file);
    setNewAnglePreview(URL.createObjectURL(file));
  };

  // Confirmation de l'ajout de la photo par angle
  const handleConfirmAddAnglePhoto = async () => {
    if (!newAngleFile) {
      setGeneralError('Veuillez sélectionner un fichier image pour cet angle.');
      return;
    }

    const angleObj = PRODUCT_ANGLES.find((a) => a.key === selectedAngleKey) || PRODUCT_ANGLES[0];
    const labelFr = customAngleLabel.trim() || angleObj.labelFr;
    const labelEn = angleObj.labelEn;

    if (isEditing) {
      try {
        setUploadingGalleryImage(true);
        setGeneralError(null);
        const nextSortOrder = galleryImages.length;
        const res = await adminApi.addProductImage(product.id, newAngleFile, labelFr, labelEn, nextSortOrder);
        setGalleryImages((prev) => [...prev, res]);
        setNewAngleFile(null);
        setNewAnglePreview('');
        setCustomAngleLabel('');
      } catch (err) {
        setGeneralError('Échec du téléversement de la photo de galerie.');
      } finally {
        setUploadingGalleryImage(false);
      }
    } else {
      const tempItem = {
        id: `pending_${Date.now()}_${Math.random()}`,
        file: newAngleFile,
        previewUrl: newAnglePreview,
        angleKey: selectedAngleKey,
        badgeLabel: angleObj.badgeLabel,
        badgeClass: angleObj.badgeClass,
        labelFr,
        labelEn,
      };
      setPendingGalleryImages((prev) => [...prev, tempItem]);
      setNewAngleFile(null);
      setNewAnglePreview('');
      setCustomAngleLabel('');
    }
  };

  // Suppression d'une photo d'angle
  const handleDeleteAngleImage = async (imgId) => {
    if (isEditing) {
      try {
        setUploadingGalleryImage(true);
        await adminApi.deleteProductImage(product.id, imgId);
        setGalleryImages((prev) => prev.filter((img) => img.id !== imgId));
      } catch (err) {
        setGeneralError('Erreur lors de la suppression de la photo.');
      } finally {
        setUploadingGalleryImage(false);
      }
    } else {
      setPendingGalleryImages((prev) => prev.filter((item) => item.id !== imgId));
    }
  };

  // Déplacement d'une photo d'angle
  const handleMoveAngleImage = (index, direction) => {
    const list = isEditing ? galleryImages : pendingGalleryImages;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    if (isEditing) {
      setGalleryImages((prev) => {
        const copy = [...prev];
        const temp = copy[index];
        copy[index] = copy[targetIndex];
        copy[targetIndex] = temp;
        return copy;
      });
    } else {
      setPendingGalleryImages((prev) => {
        const copy = [...prev];
        const temp = copy[index];
        copy[index] = copy[targetIndex];
        copy[targetIndex] = temp;
        return copy;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    try {
      setIsSubmitting(true);

      let finalImageUrl = formData.image;

      // Téléversement préalable de la photo principale si un nouveau fichier a été sélectionné
      if (selectedFile) {
        setIsUploading(true);
        const uploadRes = await adminApi.uploadImage(selectedFile);
        finalImageUrl = uploadRes?.url || '';
        setIsUploading(false);
      }

      // Construction de l'objet specs JSON structuré sans omission
      const specsObject = {};
      if (specsData.origin.trim()) specsObject.origin = specsData.origin.trim();
      if (specsData.weight_volume.trim()) specsObject.weight = specsData.weight_volume.trim();
      if (specsData.packaging.trim()) specsObject.packaging = specsData.packaging.trim();
      if (specsData.certification.trim()) specsObject.certification = specsData.certification.trim();
      if (specsData.brand.trim()) specsObject.brand = specsData.brand.trim();
      if (specsData.storage.trim()) specsObject.storage = specsData.storage.trim();

      const payload = {
        category_id: parseInt(formData.category_id, 10),
        name_fr: formData.name.trim(),
        name_en: formData.name.trim(),
        description_fr: formData.description.trim() || null,
        description_en: formData.description.trim() || null,
        unit_fr: formData.unit.trim() || null,
        unit_en: formData.unit.trim() || null,
        reference: formData.reference.trim() || null,
        price: formData.price !== '' ? parseInt(formData.price, 10) : null,
        specs: Object.keys(specsObject).length > 0 ? specsObject : null,
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
        const createRes = await adminApi.createProduct(payload);
        const newProductId = createRes?.id;

        // Téléversement séquentiel des photos d'angles en attente
        if (newProductId && pendingGalleryImages.length > 0) {
          for (let i = 0; i < pendingGalleryImages.length; i++) {
            const item = pendingGalleryImages[i];
            try {
              await adminApi.addProductImage(
                newProductId,
                item.file,
                item.labelFr,
                item.labelEn,
                i
              );
            } catch (err) {
              console.warn(`Échec téléversement photo angle ${item.labelFr}:`, err);
            }
          }
        }
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
      size="xl"
    >
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {generalError && <Alert variant="danger">{generalError}</Alert>}

        {/* Informations Principales du Produit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className={styles.fieldGroup}>
            <label htmlFor="prod-name" className={styles.label}>
              Nom du produit <span className={styles.required}>*</span>
            </label>
            <input
              id="prod-name"
              name="name"
              type="text"
              required
              className={`${styles.input} ${fieldErrors.name_fr || fieldErrors.name ? styles.inputError : ''}`}
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex. Poulet de chair fermier, Carton papier A4..."
            />
            {(fieldErrors.name_fr || fieldErrors.name) && (
              <span className={styles.fieldError}>{(fieldErrors.name_fr || fieldErrors.name)[0]}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="prod-desc" className={styles.label}>
              Description détaillée du produit
            </label>
            <textarea
              id="prod-desc"
              name="description"
              className={styles.textarea}
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Description, présentation, méthode d'élevage, caractéristiques..."
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="prod-unit" className={styles.label}>
              Unité de vente
            </label>
            <input
              id="prod-unit"
              name="unit"
              type="text"
              className={styles.input}
              value={formData.unit}
              onChange={handleChange}
              placeholder="Ex. pièce, carton, kg, rame..."
            />
          </div>
        </div>

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

        {/* Caractéristiques techniques spécifiques structurées */}
        <div className={styles.specsSection}>
          <h2 className={styles.specsTitle}>Caractéristiques Techniques & Spécifications</h2>
          
          <div className={styles.grid3}>
            <div className={styles.fieldGroup}>
              <label htmlFor="prod-spec-origin" className={styles.label}>
                Origine / Provenance
              </label>
              <input
                id="prod-spec-origin"
                name="origin"
                type="text"
                className={styles.input}
                value={specsData.origin}
                onChange={handleSpecsChange}
                placeholder="Ex. Côte d'Ivoire (Abidjan)"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="prod-spec-weight" className={styles.label}>
                Poids / Volume / Format
              </label>
              <input
                id="prod-spec-weight"
                name="weight_volume"
                type="text"
                className={styles.input}
                value={specsData.weight_volume}
                onChange={handleSpecsChange}
                placeholder="Ex. 1.4 - 1.6 kg ou Format A4 80g"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="prod-spec-packaging" className={styles.label}>
                Conditionnement / Emballage
              </label>
              <input
                id="prod-spec-packaging"
                name="packaging"
                type="text"
                className={styles.input}
                value={specsData.packaging}
                onChange={handleSpecsChange}
                placeholder="Ex. Prêt à cuire sous film ou Carton de 5 boîtes"
              />
            </div>
          </div>

          <div className={styles.grid3}>
            <div className={styles.fieldGroup}>
              <label htmlFor="prod-spec-cert" className={styles.label}>
                Certification / Norme
              </label>
              <input
                id="prod-spec-cert"
                name="certification"
                type="text"
                className={styles.input}
                value={specsData.certification}
                onChange={handleSpecsChange}
                placeholder="Ex. Élevage fermier garanti, Norme ISO 9001"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="prod-spec-brand" className={styles.label}>
                Marque / Fabricant
              </label>
              <input
                id="prod-spec-brand"
                name="brand"
                type="text"
                className={styles.input}
                value={specsData.brand}
                onChange={handleSpecsChange}
                placeholder="Ex. ETOF Ferme, Clairefontaine, Bic"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="prod-spec-storage" className={styles.label}>
                Conseil de conservation
              </label>
              <input
                id="prod-spec-storage"
                name="storage"
                type="text"
                className={styles.input}
                value={specsData.storage}
                onChange={handleSpecsChange}
                placeholder="Ex. Conserver entre 0°C et 4°C, Au sec"
              />
            </div>
          </div>
        </div>

        {/* Photo principale de couverture */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Photo principale du produit (Couverture)</label>
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
            <span className={styles.helperText}>Image de couverture du catalogue public (JPG, PNG, WEBP).</span>
          </div>
        </div>

        {/* Galerie Photos Multi-Angles (Face, Détails, Conditionnement) */}
        <div className={styles.gallerySection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className={styles.specsTitle}>
              Galerie Photos Multi-Angles ({ (isEditing ? galleryImages : pendingGalleryImages).length })
            </h2>
            {uploadingGalleryImage && <Spinner size="sm" />}
          </div>

          {/* Formulaire d'ajout d'une photo d'angle */}
          <div className={styles.angleUploaderBox}>
            <div className={styles.angleUploaderTitle}>
              <i className="fa-solid fa-camera" aria-hidden="true" />
              <span>Ajouter une vue ou un angle spécifique :</span>
            </div>

            <div className={styles.grid3}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Angle de vue</label>
                <select
                  className={styles.select}
                  value={selectedAngleKey}
                  onChange={(e) => setSelectedAngleKey(e.target.value)}
                >
                  {PRODUCT_ANGLES.map((angle) => (
                    <option key={angle.key} value={angle.key}>
                      [{angle.badgeLabel}] {angle.labelFr}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Libellé personnalisé (facultatif)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={customAngleLabel}
                  onChange={(e) => setCustomAngleLabel(e.target.value)}
                  placeholder="Ex. Gros plan sur l'emballage"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Fichier photo</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleSelectAngleFile}
                  className={styles.input}
                />
              </div>
            </div>

            {newAnglePreview && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                <div style={{ width: '90px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                  <img src={newAnglePreview} alt="Aperçu angle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmAddAnglePhoto}
                  disabled={uploadingGalleryImage}
                >
                  <i className="fa-solid fa-plus" aria-hidden="true" style={{ marginRight: '6px' }} />
                  {isEditing ? 'Téléverser cet angle' : 'Ajouter cet angle à la liste'}
                </Button>
              </div>
            )}
          </div>

          {/* Liste des photos d'angles */}
          {(isEditing ? galleryImages : pendingGalleryImages).length > 0 ? (
            <div className={styles.galleryGrid}>
              {(isEditing ? galleryImages : pendingGalleryImages).map((img, idx) => {
                const imgUrl = img.path || img.previewUrl || img.url;
                const altText = img.alt_fr || img.labelFr || `Vue ${idx + 1}`;
                const lower = (altText || '').toLowerCase();
                const isDetail = lower.includes('détail') || lower.includes('close') || lower.includes('texture');
                const isPack = lower.includes('conditionnement') || lower.includes('packaging') || lower.includes('emballage') || lower.includes('lot');
                const badgeLabel = isDetail ? 'Détail' : isPack ? 'Packaging' : 'Face';
                const badgeClass = isDetail ? styles.badgeDetail : isPack ? styles.badgePackaging : styles.badgeFront;

                return (
                  <div key={img.id || idx} className={styles.galleryItem}>
                    <img src={imgUrl} alt={altText} className={styles.galleryImg} />
                    <div className={styles.galleryItemMeta}>
                      <span className={`${styles.galleryAngleBadge} ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                      <span className={styles.galleryItemLabel} title={altText}>
                        {altText}
                      </span>
                    </div>
                    <div className={styles.galleryItemActions}>
                      <div>
                        <button
                          type="button"
                          className={styles.miniBtn}
                          onClick={() => handleMoveAngleImage(idx, -1)}
                          disabled={idx === 0}
                          title="Déplacer vers la gauche"
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          className={styles.miniBtn}
                          onClick={() => handleMoveAngleImage(idx, 1)}
                          disabled={idx === (isEditing ? galleryImages : pendingGalleryImages).length - 1}
                          title="Déplacer vers la droite"
                        >
                          ▶
                        </button>
                      </div>
                      <button
                        type="button"
                        className={`${styles.miniBtn} ${styles.miniBtnDanger}`}
                        onClick={() => handleDeleteAngleImage(img.id)}
                        title="Supprimer cette photo"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
              Aucune photo d'angle enregistrée. Ajoutez des vues rapprochées, de détail ou de conditionnement ci-dessus.
            </p>
          )}
        </div>

        {/* Boutons d'action */}
        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || isUploading || uploadingGalleryImage}>
            {isSubmitting ? (
              <>
                <Spinner size="sm" />
                <span>Enregistrement...</span>
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

