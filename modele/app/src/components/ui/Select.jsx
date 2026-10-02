import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useId } from 'react';

import { cx } from '../../lib/cx';

/**
 * Liste déroulante native avec libellé. `options` : liste de `{ value, label }`.
 * Le libellé peut être masqué visuellement avec `hideLabel`.
 */
export default function Select({ label, options, hideLabel = false, className, id, ...props }) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className={cx('grid gap-1.5', className)}>
      <label htmlFor={selectId} className={cx('text-sm font-medium', hideLabel && 'sr-only')}>
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          className="w-full cursor-pointer appearance-none border border-black bg-white py-[9px] pl-3 pr-9 text-sm text-black disabled:border-disabled disabled:text-disabled-text"
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2"
        />
      </div>
    </div>
  );
}
