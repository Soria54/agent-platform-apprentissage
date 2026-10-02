import { cx } from '../../lib/cx';

/** Compteur : un libellé en majuscules et une valeur en grands chiffres alignés. */
export default function Stat({ label, value, detail, className }) {
  return (
    <div className={cx('grid gap-1 border-t border-black pt-3', className)}>
      <p className="text-xs font-medium uppercase tracking-label text-muted">{label}</p>
      <p className="text-2xl font-semibold tabular-nums tracking-title">{value}</p>
      {detail && <p className="text-[13px] text-muted">{detail}</p>}
    </div>
  );
}
