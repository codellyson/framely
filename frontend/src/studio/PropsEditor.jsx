/**
 * PropsEditor Component
 *
 * Visual editor for composition props. Supports schema-driven
 * form generation when a Zod schema is provided.
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * Infer input type from value or schema field.
 */
function inferInputType(value, schemaField) {
  if (schemaField) {
    const typeName = schemaField._def?.typeName;
    if (typeName === 'ZodNumber') return 'number';
    if (typeName === 'ZodBoolean') return 'boolean';
    if (typeName === 'ZodEnum') return 'enum';
    if (typeName === 'ZodArray') return 'array';
    if (typeName === 'ZodObject') return 'object';
  }

  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object' && value !== null) return 'object';
  if (typeof value === 'string') {
    if (/^#[0-9a-fA-F]{6}$/.test(value)) return 'color';
    if (/^https?:\/\//.test(value)) return 'url';
  }
  return 'string';
}

/**
 * Get enum options from Zod schema.
 */
function getEnumOptions(schemaField) {
  if (schemaField?._def?.typeName === 'ZodEnum') {
    return schemaField._def.values || [];
  }
  return [];
}

/**
 * Input component for different prop types.
 */
function PropInput({ name, value, type, options, onChange, disabled }) {
  const handleChange = (e) => {
    let newValue = e.target.value;

    if (type === 'number') {
      newValue = parseFloat(newValue) || 0;
    } else if (type === 'boolean') {
      newValue = e.target.checked;
    }

    onChange(name, newValue);
  };

  const inputStyle = {
    width: '100%',
    padding: '6px 8px',
    backgroundColor: '#333',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '13px',
  };

  switch (type) {
    case 'boolean':
      return (
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={value || false}
            onChange={handleChange}
            disabled={disabled}
          />
          <span style={{ color: '#888', fontSize: '12px' }}>
            {value ? 'true' : 'false'}
          </span>
        </label>
      );

    case 'number':
      return (
        <input
          type="number"
          value={value ?? 0}
          onChange={handleChange}
          disabled={disabled}
          style={inputStyle}
        />
      );

    case 'color':
      return (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="color"
            value={value || '#000000'}
            onChange={handleChange}
            disabled={disabled}
            style={{ width: '40px', height: '30px', padding: 0, border: 'none' }}
          />
          <input
            type="text"
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="#000000"
          />
        </div>
      );

    case 'enum':
      return (
        <select
          value={value || ''}
          onChange={handleChange}
          disabled={disabled}
          style={inputStyle}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    case 'url':
      return (
        <input
          type="url"
          value={value || ''}
          onChange={handleChange}
          disabled={disabled}
          style={inputStyle}
          placeholder="https://"
        />
      );

    case 'array':
    case 'object':
      return (
        <textarea
          value={JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onChange(name, parsed);
            } catch {
              // Invalid JSON, don't update
            }
          }}
          disabled={disabled}
          style={{ ...inputStyle, minHeight: '80px', fontFamily: 'monospace', fontSize: '11px' }}
        />
      );

    default:
      return (
        <input
          type="text"
          value={value ?? ''}
          onChange={handleChange}
          disabled={disabled}
          style={inputStyle}
        />
      );
  }
}

/**
 * PropsEditor component.
 *
 * @param {object} props
 * @param {object} props.props - Current prop values
 * @param {object} [props.schema] - Zod schema for validation and form generation
 * @param {object} [props.defaultProps={}] - Default prop values
 * @param {function} props.onChange - Called when props change
 * @param {boolean} [props.disabled=false] - Disable editing
 * @param {boolean} [props.showJson=true] - Show JSON editor toggle
 */
export function PropsEditor({
  props,
  schema,
  defaultProps = {},
  onChange,
  disabled = false,
  showJson = true,
}) {
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonValue, setJsonValue] = useState('');
  const [jsonError, setJsonError] = useState(null);

  // Sync JSON value with props
  useEffect(() => {
    setJsonValue(JSON.stringify(props, null, 2));
    setJsonError(null);
  }, [props]);

  // Handle individual prop change
  const handlePropChange = useCallback((name, value) => {
    onChange({ ...props, [name]: value });
  }, [props, onChange]);

  // Handle JSON change
  const handleJsonChange = useCallback((value) => {
    setJsonValue(value);
    try {
      const parsed = JSON.parse(value);
      setJsonError(null);

      // Validate against schema if provided
      if (schema?.safeParse) {
        const result = schema.safeParse(parsed);
        if (!result.success) {
          setJsonError(result.error.errors.map((e) => e.message).join(', '));
          return;
        }
      }

      onChange(parsed);
    } catch (e) {
      setJsonError('Invalid JSON');
    }
  }, [onChange, schema]);

  // Get prop keys from props, defaultProps, or schema
  const propKeys = new Set([
    ...Object.keys(props || {}),
    ...Object.keys(defaultProps || {}),
  ]);

  // Add schema fields if available
  if (schema?._def?.shape) {
    Object.keys(schema._def.shape()).forEach((key) => propKeys.add(key));
  }

  const sortedKeys = Array.from(propKeys).sort();

  return (
    <div
      style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid #333',
          backgroundColor: '#252525',
        }}
      >
        <span style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>
          Props
        </span>
        {showJson && (
          <button
            onClick={() => setJsonMode(!jsonMode)}
            style={{
              background: jsonMode ? '#3b82f6' : 'transparent',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              padding: '4px 8px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            {jsonMode ? 'Form' : 'JSON'}
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '12px' }}>
        {jsonMode ? (
          <div>
            <textarea
              value={jsonValue}
              onChange={(e) => handleJsonChange(e.target.value)}
              disabled={disabled}
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '8px',
                backgroundColor: '#333',
                border: `1px solid ${jsonError ? '#ef4444' : '#444'}`,
                borderRadius: '4px',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '12px',
                resize: 'vertical',
              }}
            />
            {jsonError && (
              <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>
                {jsonError}
              </div>
            )}
          </div>
        ) : sortedKeys.length === 0 ? (
          <div style={{ color: '#666', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
            No props defined
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedKeys.map((key) => {
              const value = props?.[key] ?? defaultProps?.[key];
              const schemaField = schema?._def?.shape?.()?.[key];
              const type = inferInputType(value, schemaField);
              const options = getEnumOptions(schemaField);

              return (
                <div key={key}>
                  <label
                    style={{
                      display: 'block',
                      color: '#aaa',
                      fontSize: '12px',
                      marginBottom: '4px',
                    }}
                  >
                    {key}
                    {schemaField?._def?.typeName === 'ZodOptional' && (
                      <span style={{ color: '#666', marginLeft: '4px' }}>(optional)</span>
                    )}
                  </label>
                  <PropInput
                    name={key}
                    value={value}
                    type={type}
                    options={options}
                    onChange={handlePropChange}
                    disabled={disabled}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reset button */}
      {Object.keys(defaultProps).length > 0 && (
        <div
          style={{
            padding: '8px 12px',
            borderTop: '1px solid #333',
            backgroundColor: '#222',
          }}
        >
          <button
            onClick={() => onChange({ ...defaultProps })}
            disabled={disabled}
            style={{
              width: '100%',
              padding: '6px',
              backgroundColor: 'transparent',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#888',
              fontSize: '12px',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            Reset to defaults
          </button>
        </div>
      )}
    </div>
  );
}

export default PropsEditor;
