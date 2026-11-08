import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
import adminApi from '../api/adminApi.js';
import styles from './VehicleModal.module.css';

/**
 * Modale de création et modification d'un véhicule du parc automobile.
 * Comprend la gestion bilingue (FR/EN), la saisie des caractéristiques techniques
 * par champs simples convertis en JSON, les tarifs de vente / location en FCFA
 * et la gestion de la galerie de photos (upload, aperçu, réorganisation, suppression).
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   vehicle?: any | null,
 *   categories: Array<any>,
 *   onSaved: () => void
 * }} props
 * @returns {JSX.Element | null}
 */
export function VehicleModal({ isOpen, onClose, vehicle = null, categories = [], onSaved }) {
  const isEditing = Boolean(vehicle && vehicle.id);

  // Onglet linguistique actif (fr ou en)
  const [activeTab, setActiveTab] = useState('fr');

  // Champs du formulaire
  const [formData, setFormData] = useState({
    category_id: '',
    brand: '',
    model: '',
    year: String(new Date().getFullYear()),
    mode: 'both',
    status: 'available',
    price_sale: '',
    price_rental_day: '',
    description_fr: '',
    description_en: '',
    is_active: true,
  });

  // Caractéristiques techniques individuelles converties en objet specs JSON
  const [specsData, setSpecsData] = useState({
    fuel: 'Essence',
    transmission: 'Automatique',
    seats: '5',
    mileage: '',
    color: '',
  });

  // Images existantes de la galerie
  const [galleryImages, setGalleryImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fichier pour nouveau véhicule
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState('');

  // États locaux
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (vehicle) {
      setFormData({
        category_id: vehicle.category_id || vehicle.category?.id || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: String(vehicle.year || new Date().getFullYear()),
        mode: vehicle.mode || 'both',
        status: vehicle.status || 'available',
        price_sale: vehicle.price_sale !== null && vehicle.price_sale !== undefined ? String(vehicle.price_sale) : '',
        price_rental_day: vehicle.price_rental_day !== null && vehicle.price_rental_day !== undefined ? String(vehicle.price_rental_day) : '',
        description_fr: vehicle.description_fr || vehicle.description || '',
        description_en: vehicle.description_en || '',
        is_active: vehicle.is_active !== undefined ? Boolean(vehicle.is_active) : true,
      });

      // Extraction des specs JSON existantes
      let parsedSpecs = {};
      if (vehicle.specs) {
        if (typeof vehicle.specs === 'object') {
          parsedSpecs = vehicle.specs;
        } else {
          try {
            parsedSpecs = JSON.parse(vehicle.specs);
          } catch {
            parsedSpecs = {};
          }
        }
      }

      setSpecsData({
        fuel: parsedSpecs.fuel || parsedSpecs.carburant || 'Essence',
        transmission: parsedSpecs.transmission || parsedSpecs.boite || 'Automatique',
        seats: String(parsedSpecs.seats || parsedSpecs.places || '5'),
        mileage: parsedSpecs.mileage || parsedSpecs.kilometrage || '',
        color: parsedSpecs.color || parsedSpecs.couleur || '',
      });

      setGalleryImages(Array.isArray(vehicle.images) ? [...vehicle.images] : []);
    } else {
      const defaultCat = categories.length > 0 ? String(categories[0].id) : '';
      setFormData({
        category_id: defaultCat,
        brand: '',
        model: '',
        year: String(new Date().getFullYear()),
        mode: 'both',
        status: 'available',
        price_sale: '',
        price_rental_day: '',
        description_fr: '',
        description_en: '',
        is_active: true,
      });
      setSpecsData({
        fuel: 'Essence',
        transmission: 'Automatique',
        seats: '5',
        mileage: '',
        color: '',
      });
      setGalleryImages([]);
    }

    setPendingImageFile(null);
    setPendingPreviewUrl('');
    setGeneralError(null);
    setFieldErrors({});
    setActiveTab('fr');
  }, [vehicle, categories, isOpen]);

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

  // Ajout immédiat d'une photo pour un véhicule existant
  const handleAddImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isEditing) {
      try {
        setUploadingImage(true);
        const nextSortOrder = galleryImages.length;
        const res = await adminApi.addVehicleImage(vehicle.id, file, '', '', nextSortOrder);
        setGalleryImages((prev) => [...prev, res]);
      } catch (err) {
        setGeneralError('Échec du téléversement de la photo de galerie.');
      } finally {
        setUploadingImage(false);
        e.target.value = '';
      }
    } else {
      // Pour un nouveau véhicule en cours de création
      setPendingImageFile(file);
      setPendingPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Suppression d'une photo de galerie
  const handleDeleteImage = async (imageId) => {
    if (!isEditing || !imageId) return;
    try {
      setUploadingImage(true);
      await adminApi.deleteVehicleImage(vehicle.id, imageId);
      setGalleryImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setGeneralError('Erreur lors de la suppression de la photo.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Déplacement d'une image (monter ou descendre l'ordre visuel)
  const handleMoveImage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= galleryImages.length) return;

    setGalleryImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    try {
      setIsSubmitting(true);

      // Constitution de l'objet specs JSON
      const specsObject = {
        fuel: specsData.fuel,
        transmission: specsData.transmission,
        seats: parseInt(specsData.seats, 10) || 5,
        mileage: specsData.mileage.trim() || null,
        color: specsData.color.trim() || null,
      };

      const payload = {
        category_id: parseInt(formData.category_id, 10),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        year: parseInt(formData.year, 10),
        mode: formData.mode,
        status: formData.status,
        price_sale: formData.price_sale !== '' ? parseInt(formData.price_sale, 10) : null,
        price_rental_day: formData.price_rental_day !== '' ? parseInt(formData.price_rental_day, 10) : null,
        specs: specsObject,
        description_fr: formData.description_fr.trim() || null,
        description_en: formData.description_en.trim() || null,
        is_active: Boolean(formData.is_active),
      };

      if (isEditing) {
        await adminApi.updateVehicle(vehicle.id, payload);
      } else {
        const createRes = await adminApi.createVehicle(payload);
        const newVehicleId = createRes?.id;

        // Téléversement de l'image initiale si fournie
        if (newVehicleId && pendingImageFile) {
          try {
            await adminApi.addVehicleImage(newVehicleId, pendingImageFile, '', '', 0);
          } catch (err) {
            console.warn('Image initiale non téléversée:', err);
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
        setGeneralError(err?.message || 'Une erreur est survenue lors de l\'enregistrement du véhicule.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Modifier le véhicule : ${vehicle?.brand} ${vehicle?.model}` : 'Ajouter un nouveau véhicule'}
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
            🇫🇷 Informations (Français)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'en'}
            className={`${styles.tabBtn} ${activeTab === 'en' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('en')}
          >
            🇬🇧 English Description
          </button>
        </div>

        {/* Onglet Français */}
        {activeTab === 'fr' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className={styles.grid3}>
              <div className={styles.fieldGroup}>
                <label htmlFor="veh-brand" className={styles.label}>
                  Marque <span className={styles.required}>*</span>
                </label>
                <input
                  id="veh-brand"
                  name="brand"
                  type="text"
                  required
                  className={`${styles.input} ${fieldErrors.brand ? styles.inputError : ''}`}
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="Ex. Toyota, Peugeot, Mercedes"
                />
                {fieldErrors.brand && <span className={styles.fieldError}>{fieldErrors.brand[0]}</span>}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="veh-model" className={styles.label}>
                  Modèle <span className={styles.required}>*</span>
                </label>
                <input
                  id="veh-model"
                  name="model"
                  type="text"
                  required
                  className={`${styles.input} ${fieldErrors.model ? styles.inputError : ''}`}
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="Ex. Land Cruiser Prado TXL"
                />
                {fieldErrors.model && <span className={styles.fieldError}>{fieldErrors.model[0]}</span>}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="veh-year" className={styles.label}>
                  Année <span className={styles.required}>*</span>
                </label>
                <input
                  id="veh-year"
                  name="year"
                  type="number"
                  min="1900"
                  max="2030"
                  required
                  className={`${styles.input} ${fieldErrors.year ? styles.inputError : ''}`}
                  value={formData.year}
                  onChange={handleChange}
                />
                {fieldErrors.year && <span className={styles.fieldError}>{fieldErrors.year[0]}</span>}
              </div>
            </div>

            <div className={styles.grid3}>
              <div className={styles.fieldGroup}>
                <label htmlFor="veh-category" className={styles.label}>
                  Catégorie de véhicule <span className={styles.required}>*</span>
                </label>
                <select
                  id="veh-category"
                  name="category_id"
                  required
                  className={`${styles.select} ${fieldErrors.category_id ? styles.inputError : ''}`}
                  value={formData.category_id}
                  onChange={handleChange}
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_fr || c.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.category_id && <span className={styles.fieldError}>{fieldErrors.category_id[0]}</span>}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="veh-mode" className={styles.label}>
                  Mode d'acquisition <span className={styles.required}>*</span>
                </label>
                <select
                  id="veh-mode"
                  name="mode"
                  required
                  className={styles.select}
                  value={formData.mode}
                  onChange={handleChange}
                >
                  <option value="both">Vente et Location</option>
                  <option value="rental">Location uniquement</option>
                  <option value="sale">Vente uniquement</option>
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="veh-status" className={styles.label}>
                  Statut de disponibilité <span className={styles.required}>*</span>
                </label>
                <select
                  id="veh-status"
                  name="status"
                  required
                  className={styles.select}
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="available">Disponible</option>
                  <option value="reserved">Réservé</option>
                  <option value="sold">Vendu</option>
                  <option value="unavailable">Indisponible</option>
                </select>
              </div>
            </div>

            <div className={styles.grid2}>
              <div className={styles.fieldGroup}>
                <label htmlFor="veh-price-sale" className={styles.label}>
                  Prix de vente (FCFA)
                </label>
                <input
                  id="veh-price-sale"
                  name="price_sale"
                  type="number"
                  min="0"
                  className={styles.input}
                  value={formData.price_sale}
                  onChange={handleChange}
                  placeholder="Laisser vide pour 'Sur demande'"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="veh-price-rental" className={styles.label}>
                  Tarif journalier de location (FCFA)
                </label>
                <input
                  id="veh-price-rental"
                  name="price_rental_day"
                  type="number"
                  min="0"
                  className={styles.input}
                  value={formData.price_rental_day}
                  onChange={handleChange}
                  placeholder="Laisser vide pour 'Sur demande'"
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="veh-desc-fr" className={styles.label}>
                Description commerciale (FR)
              </label>
              <textarea
                id="veh-desc-fr"
                name="description_fr"
                className={styles.textarea}
                value={formData.description_fr}
                onChange={handleChange}
                placeholder="Présentation du véhicule, finitions, motorisation..."
              />
            </div>
          </div>
        )}

        {/* Onglet Anglais */}
        {activeTab === 'en' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className={styles.fieldGroup}>
              <label htmlFor="veh-desc-en" className={styles.label}>
                Commercial description (English)
              </label>
              <textarea
                id="veh-desc-en"
                name="description_en"
                className={styles.textarea}
                value={formData.description_en}
                onChange={handleChange}
                placeholder="Vehicle presentation, features, condition in English..."
              />
            </div>
          </div>
        )}

        {/* Caractéristiques techniques simples (converties en JSON) */}
        <div className={styles.specsSection}>
          <h2 className={styles.specsTitle}>Caractéristiques Techniques (Specs JSON)</h2>
          <div className={styles.grid3}>
            <div className={styles.fieldGroup}>
              <label htmlFor="spec-fuel" className={styles.label}>Carburant</label>
              <select
                id="spec-fuel"
                name="fuel"
                className={styles.select}
                value={specsData.fuel}
                onChange={handleSpecsChange}
              >
                <option value="Essence">Essence</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybride">Hybride</option>
                <option value="Électrique">Électrique</option>
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="spec-transmission" className={styles.label}>Boîte de vitesses</label>
              <select
                id="spec-transmission"
                name="transmission"
                className={styles.select}
                value={specsData.transmission}
                onChange={handleSpecsChange}
              >
                <option value="Automatique">Automatique</option>
                <option value="Manuelle">Manuelle</option>
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="spec-seats" className={styles.label}>Nombre de places</label>
              <input
                id="spec-seats"
                name="seats"
                type="number"
                min="1"
                max="60"
                className={styles.input}
                value={specsData.seats}
                onChange={handleSpecsChange}
              />
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.fieldGroup}>
              <label htmlFor="spec-mileage" className={styles.label}>Kilométrage</label>
              <input
                id="spec-mileage"
                name="mileage"
                type="text"
                className={styles.input}
                value={specsData.mileage}
                onChange={handleSpecsChange}
                placeholder="Ex. 45 000 km ou Neuf (0 km)"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="spec-color" className={styles.label}>Couleur extérieure</label>
              <input
                id="spec-color"
                name="color"
                type="text"
                className={styles.input}
                value={specsData.color}
                onChange={handleSpecsChange}
                placeholder="Ex. Blanc nacré, Noir métallisé, Gris argent"
              />
            </div>
          </div>
        </div>

        {/* Galerie d'images du véhicule */}
        <div className={styles.gallerySection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className={styles.specsTitle}>Galerie Photos ({isEditing ? galleryImages.length : pendingPreviewUrl ? 1 : 0})</h2>
            {uploadingImage && <Spinner size="sm" />}
          </div>

          {isEditing ? (
            <>
              {galleryImages.length > 0 ? (
                <div className={styles.galleryGrid}>
                  {galleryImages.map((img, idx) => (
                    <div key={img.id || idx} className={styles.galleryItem}>
                      <img src={img.path || img.url} alt={`Vue ${idx + 1}`} className={styles.galleryImg} />
                      <div className={styles.galleryItemActions}>
                        <div>
                          <button
                            type="button"
                            className={styles.miniBtn}
                            onClick={() => handleMoveImage(idx, -1)}
                            disabled={idx === 0}
                            title="Déplacer vers la gauche"
                          >
                            ◀
                          </button>
                          <button
                            type="button"
                            className={styles.miniBtn}
                            onClick={() => handleMoveImage(idx, 1)}
                            disabled={idx === galleryImages.length - 1}
                            title="Déplacer vers la droite"
                          >
                            ▶
                          </button>
                        </div>
                        <button
                          type="button"
                          className={`${styles.miniBtn} ${styles.miniBtnDanger}`}
                          onClick={() => handleDeleteImage(img.id)}
                          title="Supprimer cette photo"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                  Aucune photo dans la galerie. Ajoutez-en ci-dessous.
                </p>
              )}

              <div style={{ marginTop: '0.5rem' }}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAddImageFile}
                  disabled={uploadingImage}
                  className={styles.input}
                />
                <span className={styles.helperText}>Ajoutez des photos pour la fiche détaillée (JPG, PNG, WEBP).</span>
              </div>
            </>
          ) : (
            <div>
              {pendingPreviewUrl && (
                <div style={{ width: '120px', height: '90px', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.5rem', border: '1px solid #cbd5e1' }}>
                  <img src={pendingPreviewUrl} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAddImageFile}
                className={styles.input}
              />
              <span className={styles.helperText}>Sélectionnez une première photo principale. D'autres pourront être ajoutées après création.</span>
            </div>
          )}
        </div>

        {/* Interrupteur Actif */}
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
          />
          <span>Véhicule actif (visible sur le catalogue public)</span>
        </label>

        {/* Boutons d'action */}
        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || uploadingImage}>
            {isSubmitting ? (
              <>
                <Spinner size="sm" />
                <span>Enregistrement...</span>
              </>
            ) : isEditing ? (
              'Enregistrer les modifications'
            ) : (
              'Créer le véhicule'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default VehicleModal;

