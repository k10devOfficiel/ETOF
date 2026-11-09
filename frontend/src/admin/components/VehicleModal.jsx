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
const VEHICLE_ANGLES = [
  {
    key: 'exterior_front',
    category: 'exterior',
    labelFr: 'Extérieur - Face / 3/4 Avant (Photo principale)',
    labelEn: 'Exterior - Front view (Main photo)',
    badgeLabel: 'Extérieur',
    badgeClass: 'badgeExterior',
  },
  {
    key: 'exterior_rear',
    category: 'exterior',
    labelFr: 'Extérieur - Profil / Arrière',
    labelEn: 'Exterior - Side / Rear view',
    badgeLabel: 'Extérieur',
    badgeClass: 'badgeExterior',
  },
  {
    key: 'interior_cockpit',
    category: 'interior',
    labelFr: 'Intérieur - Poste de conduite / Cockpit',
    labelEn: 'Interior - Cockpit / Dashboard',
    badgeLabel: 'Intérieur',
    badgeClass: 'badgeInterior',
  },
  {
    key: 'interior_seats',
    category: 'interior',
    labelFr: 'Intérieur - Sièges / Habitacle',
    labelEn: 'Interior - Seats / Cabin',
    badgeLabel: 'Intérieur',
    badgeClass: 'badgeInterior',
  },
  {
    key: 'others_details',
    category: 'others',
    labelFr: 'Autre vue - Coffre / Moteur / Détails',
    labelEn: 'Other view - Trunk / Engine / Details',
    badgeLabel: 'Autre',
    badgeClass: 'badgeOthers',
  },
];

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

  // Caractéristiques techniques individuelles complètes converties en objet specs JSON
  const [specsData, setSpecsData] = useState({
    fuel: 'Essence',
    transmission: 'Automatique',
    seats: '5',
    mileage: '',
    color_exterior: '',
    color_interior: '',
    engine: '',
    air_conditioning: 'Automatique bi-zone',
    features: '',
    consumption: '',
  });

  // Images existantes de la galerie
  const [galleryImages, setGalleryImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // État de sélection d'angle et de fichier pour l'ajout d'une photo
  const [selectedAngleKey, setSelectedAngleKey] = useState('exterior_front');
  const [customAngleLabel, setCustomAngleLabel] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState('');

  // Liste des photos en attente pour un nouveau véhicule
  const [pendingImages, setPendingImages] = useState([]);

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
        color_exterior: parsedSpecs.color_exterior || parsedSpecs.color || parsedSpecs.couleur || '',
        color_interior: parsedSpecs.color_interior || parsedSpecs.sellerie || '',
        engine: parsedSpecs.engine || parsedSpecs.motorisation || '',
        air_conditioning: parsedSpecs.air_conditioning || parsedSpecs.climatisation || 'Automatique bi-zone',
        features: parsedSpecs.features || parsedSpecs.equipements || '',
        consumption: parsedSpecs.consumption || parsedSpecs.consommation || '',
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
        color_exterior: '',
        color_interior: '',
        engine: '',
        air_conditioning: 'Automatique bi-zone',
        features: '',
        consumption: '',
      });
      setGalleryImages([]);
    }

    setPendingImages([]);
    setNewImageFile(null);
    setNewImagePreview('');
    setCustomAngleLabel('');
    setSelectedAngleKey('exterior_front');
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

  // Sélection du fichier dans le sélecteur d'angle
  const handleSelectNewFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
  };

  // Ajout de la photo avec l'angle spécifié
  const handleConfirmAddAnglePhoto = async () => {
    if (!newImageFile) {
      setGeneralError('Veuillez sélectionner un fichier image pour cet angle.');
      return;
    }

    const angleObj = VEHICLE_ANGLES.find((a) => a.key === selectedAngleKey) || VEHICLE_ANGLES[0];
    const labelFr = customAngleLabel.trim() || angleObj.labelFr;
    const labelEn = angleObj.labelEn;

    if (isEditing) {
      try {
        setUploadingImage(true);
        setGeneralError(null);
        const nextSortOrder = galleryImages.length;
        const res = await adminApi.addVehicleImage(vehicle.id, newImageFile, labelFr, labelEn, nextSortOrder);
        setGalleryImages((prev) => [...prev, res]);
        setNewImageFile(null);
        setNewImagePreview('');
        setCustomAngleLabel('');
      } catch (err) {
        setGeneralError('Échec du téléversement de la photo pour cet angle.');
      } finally {
        setUploadingImage(false);
      }
    } else {
      // En création : mise en file d'attente
      const tempItem = {
        id: `pending_${Date.now()}_${Math.random()}`,
        file: newImageFile,
        previewUrl: newImagePreview,
        angleKey: selectedAngleKey,
        category: angleObj.category,
        badgeLabel: angleObj.badgeLabel,
        badgeClass: angleObj.badgeClass,
        labelFr,
        labelEn,
      };
      setPendingImages((prev) => [...prev, tempItem]);
      setNewImageFile(null);
      setNewImagePreview('');
      setCustomAngleLabel('');
    }
  };

  // Suppression d'une photo existante ou en attente
  const handleDeleteImage = async (imgId) => {
    if (isEditing) {
      try {
        setUploadingImage(true);
        await adminApi.deleteVehicleImage(vehicle.id, imgId);
        setGalleryImages((prev) => prev.filter((img) => img.id !== imgId));
      } catch (err) {
        setGeneralError('Erreur lors de la suppression de la photo.');
      } finally {
        setUploadingImage(false);
      }
    } else {
      setPendingImages((prev) => prev.filter((item) => item.id !== imgId));
    }
  };

  // Déplacement d'une image (monter ou descendre l'ordre visuel)
  const handleMoveImage = (index, direction) => {
    const list = isEditing ? galleryImages : pendingImages;
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
      setPendingImages((prev) => {
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

      // Constitution de l'objet specs JSON complet sans omission
      const specsObject = {
        fuel: specsData.fuel,
        transmission: specsData.transmission,
        seats: parseInt(specsData.seats, 10) || 5,
        mileage: specsData.mileage.trim() || null,
        color_exterior: specsData.color_exterior.trim() || null,
        color_interior: specsData.color_interior.trim() || null,
        engine: specsData.engine.trim() || null,
        air_conditioning: specsData.air_conditioning.trim() || null,
        features: specsData.features.trim() || null,
        consumption: specsData.consumption.trim() || null,
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

        // Téléversement séquentiel de toutes les photos par angle ajoutées lors de la création
        if (newVehicleId && pendingImages.length > 0) {
          for (let i = 0; i < pendingImages.length; i++) {
            const item = pendingImages[i];
            try {
              await adminApi.addVehicleImage(
                newVehicleId,
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
        setGeneralError(err?.message || 'Une erreur est survenue lors de l\'enregistrement du véhicule.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeImagesList = isEditing ? galleryImages : pendingImages;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Modifier le véhicule : ${vehicle?.brand} ${vehicle?.model}` : 'Ajouter un nouveau véhicule'}
      size="xl"
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

        {/* Caractéristiques techniques complètes sans omission */}
        <div className={styles.specsSection}>
          <h2 className={styles.specsTitle}>Caractéristiques Techniques Détaillées</h2>
          
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
                <option value="Séquentielle">Séquentielle</option>
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

          <div className={styles.grid3}>
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
              <label htmlFor="spec-color-ext" className={styles.label}>Couleur extérieure</label>
              <input
                id="spec-color-ext"
                name="color_exterior"
                type="text"
                className={styles.input}
                value={specsData.color_exterior}
                onChange={handleSpecsChange}
                placeholder="Ex. Blanc nacré, Noir métallisé"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="spec-color-int" className={styles.label}>Finition / Sellerie intérieure</label>
              <input
                id="spec-color-int"
                name="color_interior"
                type="text"
                className={styles.input}
                value={specsData.color_interior}
                onChange={handleSpecsChange}
                placeholder="Ex. Cuir noir, Tissu gris, Alcantara"
              />
            </div>
          </div>

          <div className={styles.grid3}>
            <div className={styles.fieldGroup}>
              <label htmlFor="spec-engine" className={styles.label}>Motorisation / Cylindrée</label>
              <input
                id="spec-engine"
                name="engine"
                type="text"
                className={styles.input}
                value={specsData.engine}
                onChange={handleSpecsChange}
                placeholder="Ex. 2.8L D-4D 204 ch, V6 3.0L"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="spec-ac" className={styles.label}>Climatisation</label>
              <select
                id="spec-ac"
                name="air_conditioning"
                className={styles.select}
                value={specsData.air_conditioning}
                onChange={handleSpecsChange}
              >
                <option value="Automatique bi-zone">Automatique bi-zone</option>
                <option value="Automatique">Automatique</option>
                <option value="Manuelle">Manuelle</option>
                <option value="Oui">Oui</option>
                <option value="Non">Non</option>
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="spec-consumption" className={styles.label}>Consommation mixte</label>
              <input
                id="spec-consumption"
                name="consumption"
                type="text"
                className={styles.input}
                value={specsData.consumption}
                onChange={handleSpecsChange}
                placeholder="Ex. 7.8 L / 100 km"
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="spec-features" className={styles.label}>Équipements & Options clés</label>
            <input
              id="spec-features"
              name="features"
              type="text"
              className={styles.input}
              value={specsData.features}
              onChange={handleSpecsChange}
              placeholder="Ex. Caméra de recul, Écran tactile CarPlay, Régulateur adaptatif, Démarrage sans clé"
            />
          </div>
        </div>

        {/* Galerie d'images par Angle de vue */}
        <div className={styles.gallerySection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className={styles.specsTitle}>
              Galerie Photos par Angle de Vue ({activeImagesList.length})
            </h2>
            {uploadingImage && <Spinner size="sm" />}
          </div>

          {/* Formulaire d'ajout d'une photo par angle */}
          <div className={styles.angleUploaderBox}>
            <div className={styles.angleUploaderTitle}>
              <i className="fa-solid fa-camera" aria-hidden="true" />
              <span>Ajouter une photo sous un angle précis :</span>
            </div>

            <div className={styles.grid3}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Angle de vue prédéfini</label>
                <select
                  className={styles.select}
                  value={selectedAngleKey}
                  onChange={(e) => setSelectedAngleKey(e.target.value)}
                >
                  {VEHICLE_ANGLES.map((angle) => (
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
                  placeholder="Ex. Vue profil gauche avec jantes alliage"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Fichier photo (JPG, PNG, WEBP)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleSelectNewFile}
                  className={styles.input}
                />
              </div>
            </div>

            {newImagePreview && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                <div style={{ width: '90px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                  <img src={newImagePreview} alt="Aperçu angle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmAddAnglePhoto}
                  disabled={uploadingImage}
                >
                  <i className="fa-solid fa-plus" aria-hidden="true" style={{ marginRight: '6px' }} />
                  {isEditing ? 'Téléverser cet angle' : 'Ajouter cet angle à la liste'}
                </Button>
              </div>
            )}
          </div>

          {/* Liste des photos existantes ou en attente */}
          {activeImagesList.length > 0 ? (
            <div className={styles.galleryGrid}>
              {activeImagesList.map((img, idx) => {
                const imgUrl = img.path || img.previewUrl || img.url;
                const altText = img.alt_fr || img.labelFr || `Angle ${idx + 1}`;
                const lower = (altText || '').toLowerCase();
                const isInt = lower.includes('intérieur') || lower.includes('interior') || lower.includes('cockpit') || lower.includes('siège') || lower.includes('habitacle');
                const isOth = lower.includes('autre') || lower.includes('moteur') || lower.includes('coffre') || lower.includes('détail');
                const badgeLabel = isInt ? 'Intérieur' : isOth ? 'Autre' : 'Extérieur';
                const badgeClass = isInt ? styles.badgeInterior : isOth ? styles.badgeOthers : styles.badgeExterior;

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
                          disabled={idx === activeImagesList.length - 1}
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
                );
              })}
            </div>
          ) : (
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
              Aucune photo enregistrée sous les différents angles. Utilisez le cadre ci-dessus pour ajouter des photos de l'extérieur, du cockpit et des détails.
            </p>
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

