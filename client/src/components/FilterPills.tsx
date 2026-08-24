import type { ReactNode } from 'react';

export interface PillItem {
  key: string;
  label: ReactNode;
  title?: string;
}

interface Props {
  items: PillItem[];
  activeKey: string | null;
  onSelect: (key: string) => void;
  label: string;
  size?: 'md' | 'sm';
}

/** Horizontally-scrollable pill row — used for categories, grades, and subjects alike. Scrolls on mobile instead of wrapping into a wall. */
export function FilterPills({ items, activeKey, onSelect, label, size = 'md' }: Props) {
  return (
    <div className="pillrow" role="group" aria-label={label}>
      <div className="pillrow__track">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`pill-btn pill-btn--${size} ${activeKey === item.key ? 'is-active' : ''}`}
            onClick={() => onSelect(item.key)}
            aria-pressed={activeKey === item.key}
            title={item.title}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
