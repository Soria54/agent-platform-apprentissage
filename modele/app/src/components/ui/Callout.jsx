import { cx } from '../../lib/cx';

/**
 * Encadré de cours : un libellé en majuscules puis le contenu.
 * `highlighted` le met en évidence (à retenir, attention). À garder pour l'essentiel :
 * un ou deux encadrés en évidence par page au maximum.
 */
export default function Callout({ label, highlighted = false, className, children }) {
  return (
    <aside
      className={cx(
        'grid gap-2 border border-black px-[18px] py-4',
        highlighted ? 'bg-hl-soft' : 'bg-white',
        className,
      )}
    >
      {label && (
        <p className="text-xs font-semibold uppercase tracking-label text-black">{label}</p>
      )}
      <div className="grid gap-2">{children}</div>
    </aside>
  );
}
