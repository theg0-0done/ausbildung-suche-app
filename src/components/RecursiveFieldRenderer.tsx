/**
 * Recursively renders an unknown value (object, array, string, number, boolean).
 * Used for the fallback "Weitere Informationen" section to display
 * any fields not already shown in dedicated sections.
 */

interface RecursiveFieldRendererProps {
  data: Record<string, unknown>;
  /** Keys that have already been rendered in dedicated sections — skip them */
  exclude?: Set<string>;
}

/** Convert camelCase or snake_case key to a readable label */
function keyToLabel(key: string): string {
  return key
    // insert space before capital letters (camelCase)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // replace underscores
    .replace(/_/g, ' ')
    // capitalize first letter
    .replace(/^./, (c) => c.toUpperCase());
}

function isEmptyValue(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string' && v.trim() === '') return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length === 0) return true;
  return false;
}

function RenderValue({ value }: { value: unknown }) {
  if (isEmptyValue(value)) return null;

  if (typeof value === 'boolean') {
    return <span className="extra-value">{value ? 'Ja' : 'Nein'}</span>;
  }

  if (typeof value === 'number' || typeof value === 'string') {
    // Attempt to format raw ISO strings if they look like a timestamp
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      let dateString: string | null = null;
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          dateString = date.toLocaleString('de-DE');
        }
      } catch {
        // ignore and fallback
      }
      if (dateString) {
        return <span className="extra-value">{dateString}</span>;
      }
    }
    return <span className="extra-value">{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    const nonEmpty = value.filter((v) => !isEmptyValue(v));
    if (nonEmpty.length === 0) return null;

    // If array of primitives, show as tags
    if (nonEmpty.every((v) => typeof v === 'string' || typeof v === 'number')) {
      return (
        <div className="extra-tags">
          {nonEmpty.map((v, i) => (
            <span key={i} className="tag">{String(v)}</span>
          ))}
        </div>
      );
    }

    // Array of objects
    return (
      <div className="extra-nested">
        {nonEmpty.map((item, i) => (
          <div key={i} className="extra-nested-item">
            {typeof item === 'object' && item !== null ? (
              <RecursiveFieldRenderer data={item as Record<string, unknown>} />
            ) : (
              <span>{String(item)}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === 'object' && value !== null) {
    return <RecursiveFieldRenderer data={value as Record<string, unknown>} />;
  }

  return <span className="extra-value">{String(value)}</span>;
}

export default function RecursiveFieldRenderer({ data, exclude }: RecursiveFieldRendererProps) {
  const entries = Object.entries(data).filter(([key, val]) => {
    if (exclude?.has(key)) return false;
    return !isEmptyValue(val);
  });

  if (entries.length === 0) return null;

  return (
    <div className="extra-fields-list">
      {entries.map(([key, val]) => (
        <div key={key} className="extra-field-row">
          <span className="extra-field-label">{keyToLabel(key)}</span>
          <div className="extra-field-value">
            <RenderValue value={val} />
          </div>
        </div>
      ))}
    </div>
  );
}
