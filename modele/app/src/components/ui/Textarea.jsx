import { useId } from 'react';

import { cx } from '../../lib/cx';

/** Zone de texte sur plusieurs lignes, avec libellé (masquable avec `hideLabel`) et aide. */
export default function Textarea({ label, hint, hideLabel = false, className, id, ...props }) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  const hintId = hint ? `${textareaId}-hint` : undefined;
  return (
    <div className={cx('grid gap-1.5', className)}>
      <label htmlFor={textareaId} className={cx('text-sm font-medium', hideLabel && 'sr-only')}>
        {label}
      </label>
      <textarea
        id={textareaId}
        aria-describedby={hintId}
        rows={4}
        className="w-full border border-black bg-white px-3.5 py-[11px] text-sm leading-relaxed text-black placeholder:text-muted focus-visible:outline-offset-0"
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-[13px] text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
