import type { ReactNode } from 'react';

export interface MetadataItem {
  label: string;
  value: string | ReactNode | undefined | null;
}

interface MetadataGridProps {
  items: MetadataItem[];
}

/**
 * A responsive grid of label/value cards.
 * Automatically filters out items with empty values.
 */
export default function MetadataGrid({ items }: MetadataGridProps) {
  const filtered = items.filter(
    (item) => item.value !== undefined && item.value !== null && item.value !== ''
  );

  if (filtered.length === 0) return null;

  return (
    <div className="detail-info-grid">
      {filtered.map((item) => (
        <div className="detail-info-item" key={item.label}>
          <span className="detail-info-label">{item.label}</span>
          <span className="detail-info-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
