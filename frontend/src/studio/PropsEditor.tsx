import { useState, useEffect } from 'react';
import './PropsEditor.css';

interface PropsEditorProps {
  defaultProps: Record<string, unknown>;
  onChange: (props: Record<string, unknown>) => void;
}

/**
 * PropsEditor - Visual editor for composition props
 * Auto-detects prop types and renders appropriate inputs
 */
export function PropsEditor({ defaultProps, onChange }: PropsEditorProps) {
  const [props, setProps] = useState<Record<string, unknown>>({ ...defaultProps });

  useEffect(() => {
    setProps({ ...defaultProps });
  }, [defaultProps]);

  const handleChange = (key: string, value: unknown) => {
    const newProps = { ...props, [key]: value };
    setProps(newProps);
    onChange(newProps);
  };

  const detectType = (key: string, value: unknown): string => {
    // Check by key name patterns
    const keyLower = key.toLowerCase();
    if (keyLower.includes('color') || keyLower.includes('background')) return 'color';
    if (keyLower.includes('show') || keyLower.includes('enable') || keyLower.includes('is')) return 'boolean';

    // Check by value type
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') {
      // Check if it's a color hex
      if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value)) return 'color';
      // Check if it's a long text
      if (value.length > 50) return 'textarea';
      return 'text';
    }
    if (Array.isArray(value)) return 'array';

    return 'text';
  };

  const formatLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const renderInput = (key: string, value: unknown) => {
    const type = detectType(key, value);

    switch (type) {
      case 'color':
        return (
          <div className="props-editor-color-input">
            <input
              type="color"
              value={String(value)}
              onChange={(e) => handleChange(key, e.target.value)}
            />
            <input
              type="text"
              value={String(value)}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder="#000000"
            />
          </div>
        );

      case 'boolean':
        return (
          <label className="props-editor-toggle">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleChange(key, e.target.checked)}
            />
            <span className="props-editor-toggle-slider" />
          </label>
        );

      case 'number':
        return (
          <input
            type="number"
            value={Number(value)}
            onChange={(e) => handleChange(key, parseFloat(e.target.value) || 0)}
            className="props-editor-number"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={String(value)}
            onChange={(e) => handleChange(key, e.target.value)}
            className="props-editor-textarea"
            rows={3}
          />
        );

      case 'array':
        // For color arrays, show multiple color pickers
        if (Array.isArray(value) && value.every((v) => typeof v === 'string' && v.startsWith('#'))) {
          return (
            <div className="props-editor-color-array">
              {(value as string[]).map((color, i) => (
                <input
                  key={i}
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const newArray = [...(value as string[])];
                    newArray[i] = e.target.value;
                    handleChange(key, newArray);
                  }}
                />
              ))}
            </div>
          );
        }
        return (
          <input
            type="text"
            value={JSON.stringify(value)}
            onChange={(e) => {
              try {
                handleChange(key, JSON.parse(e.target.value));
              } catch {
                // Invalid JSON, ignore
              }
            }}
            className="props-editor-text"
          />
        );

      default:
        return (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => handleChange(key, e.target.value)}
            className="props-editor-text"
          />
        );
    }
  };

  const entries = Object.entries(props);

  if (entries.length === 0) {
    return (
      <div className="props-editor-empty">
        <p>No customizable properties</p>
      </div>
    );
  }

  return (
    <div className="props-editor">
      {entries.map(([key, value]) => (
        <div key={key} className="props-editor-field">
          <label className="props-editor-label">{formatLabel(key)}</label>
          {renderInput(key, value)}
        </div>
      ))}
    </div>
  );
}

export default PropsEditor;
