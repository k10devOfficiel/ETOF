/**
 * Utilitaire de gestion des effets sonores interactifs pour ETOF SARL.
 * Joue des notifications sonores agréables et légères (WAV pré-généré ou synthèse Web Audio en secours).
 */

const SOUND_PATHS = {
  notification: '/sounds/notification.wav',
  cart_add: '/sounds/cart_add.wav',
  status_success: '/sounds/status_success.wav',
  status_alert: '/sounds/status_alert.wav',
};

/**
 * Synthèse Web Audio API de secours si le fichier audio est bloqué ou inaccessible
 */
function playFallbackTone(type) {
  if (typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'cart_add') {
      osc.frequency.setValueAtTime(784, now); // G5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'status_success') {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.start(now);
      osc.stop(now + 0.32);
    }
  } catch {}
}

/**
 * Déclenche un effet sonore de notification
 *
 * @param {'notification' | 'cart_add' | 'status_success' | 'status_alert'} [soundType='notification']
 */
export function playSound(soundType = 'notification') {
  if (typeof window === 'undefined') return;

  try {
    const path = SOUND_PATHS[soundType] || SOUND_PATHS.notification;
    const audio = new Audio(path);
    audio.volume = 0.5;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // En cas de restriction d'autoplay du navigateur, utiliser le fallback Web Audio
        playFallbackTone(soundType);
      });
    }
  } catch {
    playFallbackTone(soundType);
  }
}

export default playSound;

