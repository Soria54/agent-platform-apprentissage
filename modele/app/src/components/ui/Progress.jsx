import { cx } from '../../lib/cx';

/**
 * Barre de progression : contour noir de 1 px, remplissage noir.
 * `value` va de 0 à 1. `label` est lu par les lecteurs d'écran.
 */
export default function Progress({ value, label, className }) {
  const pourcent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pourcent}
      className={cx('h-2 w-full border border-black bg-white', className)}
    >
      <div className="h-full bg-black" style={{ width: `${pourcent}%` }} />
    </div>
  );
}
