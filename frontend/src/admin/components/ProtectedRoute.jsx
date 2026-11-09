import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { ADMIN_PATH } from '../../config/adminConfig.js';
import styles from './ProtectedRoute.module.css';

/**
 * Gardien de route pour l'espace privé d'administration.
 * Vérifie l'état d'authentification issu de l'AuthContext :
 * - Affiche un indicateur de chargement durant la vérification initiale
 * - Redirige vers le formulaire de connexion sur l'URL secrète si non connecté ou expirée
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className={styles.loadingContainer} role="status" aria-live="polite">
        <Spinner size="lg" />
        <span className={styles.loadingText}>Vérification de la session administrateur...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`${ADMIN_PATH}/login`} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;

