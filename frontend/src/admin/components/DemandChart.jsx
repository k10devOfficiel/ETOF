import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
import styles from './DemandChart.module.css';

// Enregistrement des modules requis de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Couleurs officielles de la charte ETOF SARL pour chaque pôle
const POLE_PALETTE = {
  farm: {
    labelKey: 'activities.farm',
    defaultLabel: 'Ferme & Volaille',
    color: '#14B8C4', // Turquoise officiel ETOF
    bg: 'rgba(20, 184, 196, 0.15)',
  },
  vehicle: {
    labelKey: 'activities.vehicle',
    defaultLabel: 'Vente & Location Véhicules',
    color: '#0B2A4A', // Bleu nuit officiel
    bg: 'rgba(11, 42, 74, 0.15)',
  },
  office: {
    labelKey: 'activities.office',
    defaultLabel: 'Fournitures de Bureau',
    color: '#4F46E5', // Indigo
    bg: 'rgba(79, 70, 229, 0.15)',
  },
  fuel: {
    labelKey: 'activities.fuel',
    defaultLabel: 'Transport Hydrocarbures',
    color: '#0284C7', // Bleu océan
    bg: 'rgba(2, 132, 199, 0.15)',
  },
};

/**
 * Composant de statistiques interactif pour le Dashboard Admin d'ETOF SARL.
 * Propose une bascule entre courbes multi-lignes et barres empilées,
 * avec sélection de granularité (6 derniers mois ou 7 derniers jours).
 *
 * @param {{
 *   stats: object | null,
 *   loading?: boolean,
 *   error?: string | null
 * }} props
 * @returns {JSX.Element}
 */
export function DemandChart({ stats, loading = false, error = null }) {
  const { t } = useTranslation();
  const [chartType, setChartType] = useState('line'); // 'line' | 'bar'
  const [period, setPeriod] = useState('monthly'); // 'monthly' | 'daily'

  // Préparation des données pour le graphique selon la période sélectionnée
  const chartData = useMemo(() => {
    if (!stats) {
      return { labels: [], datasets: [] };
    }

    if (period === 'monthly') {
      const monthlyHistory = Array.isArray(stats.monthly_history) ? stats.monthly_history : [];
      const labels = monthlyHistory.map((m) => m.label || m.month);

      const datasets = [
        {
          label: t(POLE_PALETTE.farm.labelKey, POLE_PALETTE.farm.defaultLabel),
          data: monthlyHistory.map((m) => Number(m.farm || 0)),
          borderColor: POLE_PALETTE.farm.color,
          backgroundColor: POLE_PALETTE.farm.color,
          fill: false,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2.5,
        },
        {
          label: t(POLE_PALETTE.vehicle.labelKey, POLE_PALETTE.vehicle.defaultLabel),
          data: monthlyHistory.map((m) => Number(m.vehicle || 0)),
          borderColor: POLE_PALETTE.vehicle.color,
          backgroundColor: POLE_PALETTE.vehicle.color,
          fill: false,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2.5,
        },
        {
          label: t(POLE_PALETTE.office.labelKey, POLE_PALETTE.office.defaultLabel),
          data: monthlyHistory.map((m) => Number(m.office || 0)),
          borderColor: POLE_PALETTE.office.color,
          backgroundColor: POLE_PALETTE.office.color,
          fill: false,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2.5,
        },
        {
          label: t(POLE_PALETTE.fuel.labelKey, POLE_PALETTE.fuel.defaultLabel),
          data: monthlyHistory.map((m) => Number(m.fuel || 0)),
          borderColor: POLE_PALETTE.fuel.color,
          backgroundColor: POLE_PALETTE.fuel.color,
          fill: false,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2.5,
        },
      ];

      return { labels, datasets };
    } else {
      // Période quotidienne (7 derniers jours)
      const dailyHistory = Array.isArray(stats.daily_history) ? stats.daily_history : [];
      const labels = dailyHistory.map((d) => d.label || d.date);

      const datasets = [
        {
          label: t('admin.dashboard.totalRequests', 'Total des demandes'),
          data: dailyHistory.map((d) => Number(d.count || 0)),
          borderColor: '#14B8C4',
          backgroundColor: 'rgba(20, 184, 196, 0.18)',
          fill: chartType === 'line',
          tension: 0.35,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#0B2A4A',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          borderWidth: 3,
        },
      ];

      return { labels, datasets };
    }
  }, [stats, period, chartType, t]);

  // Options de configuration visuelle Chart.js
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: period === 'monthly',
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            usePointStyle: true,
            pointStyle: 'circle',
            font: {
              family: "'Archivo', sans-serif",
              size: 11,
              weight: '500',
            },
            color: '#475569',
            padding: 14,
          },
        },
        tooltip: {
          backgroundColor: '#0B2A4A',
          titleColor: '#ffffff',
          bodyColor: '#e2e8f0',
          titleFont: {
            family: "'Archivo', sans-serif",
            weight: '700',
            size: 13,
          },
          bodyFont: {
            family: "'Archivo', sans-serif",
            size: 12,
          },
          padding: 12,
          cornerRadius: 8,
          borderColor: 'rgba(20, 184, 196, 0.35)',
          borderWidth: 1,
          displayColors: true,
          boxWidth: 10,
          boxHeight: 10,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y ?? 0;
              return ` ${label} : ${value} demande(s)`;
            },
          },
        },
      },
      scales: {
        x: {
          stacked: chartType === 'bar' && period === 'monthly',
          grid: {
            display: false,
          },
          ticks: {
            font: {
              family: "'Archivo', sans-serif",
              size: 11,
            },
            color: '#64748b',
          },
          border: {
            display: false,
          },
        },
        y: {
          stacked: chartType === 'bar' && period === 'monthly',
          beginAtZero: true,
          grid: {
            color: '#f1f5f9',
          },
          ticks: {
            stepSize: 1,
            precision: 0,
            font: {
              family: "'Archivo', sans-serif",
              size: 11,
            },
            color: '#64748b',
          },
          border: {
            display: false,
          },
        },
      },
    };
  }, [chartType, period]);

  return (
    <div className={styles.chartCard} aria-labelledby="demand-chart-heading">
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h2 id="demand-chart-heading" className={styles.chartTitle}>
            {t('admin.dashboard.chartTitle', 'Activité et Volume des Demandes')}
          </h2>
          <p className={styles.chartSubtitle}>
            {period === 'monthly'
              ? t('admin.dashboard.chartSubtitleMonthly', 'Répartition par pôle d’activité sur les 6 derniers mois')
              : t('admin.dashboard.chartSubtitleDaily', 'Évolution quotidienne sur les 7 derniers jours')}
          </p>
        </div>

        <div className={styles.controlsGroup}>
          {/* Bascule de période (6 mois / 7 jours) */}
          <div className={styles.segmentedControl} role="group" aria-label="Période du graphique">
            <button
              type="button"
              className={`${styles.controlBtn} ${period === 'monthly' ? styles.activeBtn : ''}`}
              onClick={() => setPeriod('monthly')}
            >
              {t('admin.dashboard.sixMonths', '6 mois')}
            </button>
            <button
              type="button"
              className={`${styles.controlBtn} ${period === 'daily' ? styles.activeBtn : ''}`}
              onClick={() => setPeriod('daily')}
            >
              {t('admin.dashboard.sevenDays', '7 jours')}
            </button>
          </div>

          {/* Bascule du type de courbe (Courbe / Barres empilées) */}
          <div className={styles.segmentedControl} role="group" aria-label="Type de visualisation">
            <button
              type="button"
              className={`${styles.controlBtn} ${chartType === 'line' ? styles.activeBtn : ''}`}
              onClick={() => setChartType('line')}
              title={t('admin.dashboard.typeLine', 'Courbes multi-lignes')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <span>{t('admin.dashboard.line', 'Courbe')}</span>
            </button>

            <button
              type="button"
              className={`${styles.controlBtn} ${chartType === 'bar' ? styles.activeBtn : ''}`}
              onClick={() => setChartType('bar')}
              title={t('admin.dashboard.typeBar', 'Barres empilées')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>{t('admin.dashboard.bar', 'Barres')}</span>
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className={styles.centerState}>
          <Spinner size="lg" />
          <span>{t('common.loading', 'Chargement des statistiques...')}</span>
        </div>
      )}

      {error && !loading && (
        <div className={styles.centerState}>
          <Alert variant="danger">{error}</Alert>
        </div>
      )}

      {!loading && !error && (
        <div className={styles.canvasWrapper}>
          {chartType === 'line' ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </div>
      )}
    </div>
  );
}

export default DemandChart;

