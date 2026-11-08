import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import styles from './ProtectedRoute.module.css';

/**
 * Gardien de route pour l'espace privé d'administration.
 * Vérifie l'état d'authentification issu de l'AuthContext :
 * - Affiche un indicateur de chargement durant la vérification initiale
 * - Redirige vers /admin/login si l'utilisateur n'est pas connecté ou si la session a expiré
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
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;

