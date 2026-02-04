/**
 * PropsEditor Component
 *
 * Visual editor for composition props. Supports schema-driven
 * form generation when a Zod schema is provided.
 */

import { useState, useCallback, useEffect, type ChangeEvent } from 'react';
import styles from './PropsEditor.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported prop value types */
type PropValue =
  | string
  | number
  | boolean
  | null
  | PropValue[]
  | { [key: string]: PropValue };

/** Map of prop names to their values */
type PropsMap = Record<string, PropValue>;

/** Inferred input‐field type produced by `inferInputType` */
type InputType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'color'
  | 'url'
  | 'enum'
  | 'array'
  | 'object';

/**
 * Minimal representation of a Zod schema definition.
 * We only rely on the internal `_def` shape that the editor inspects,
 * so this is intentionally loose to avoid pulling in the full Zod type
 * surface.
 */
interface ZodFieldDef {
  typeName?: string;
  values?: string[];
  [key: string]: unknown;
}

interface ZodSchemaField {
  _def?: ZodFieldDef;
}

interface ZodSafeParseFail {
  success: false;
  error: { errors: { message: string }[] };
}

interface ZodSafeParseOk<T = unknown> {
  success: true;
  data: T;
}

type ZodSafeParseResult<T = unknown> = ZodSafeParseOk<T> | ZodSafeParseFail;

interface ZodSchema {
  _def?: {
    shape?: () => Record<string, ZodSchemaField>;
    [key: string]: unknown;
  };
  safeParse?: (data: unknown) => ZodSafeParseResult;
}

// ---------------------------------------------------------------------------
// PropInput
// ---------------------------------------------------------------------------

/** Props accepted by the `PropInput` component */
interface PropInputProps {
  name: string;
  value: PropValue;
  type: InputType;
  options: string[];
  onChange: (name: string, value: PropValue) => void;
  disabled: boolean;
}

// ---------------------------------------------------------------------------
// PropsEditor
// ---------------------------------------------------------------------------

/** Props accepted by the `PropsEditor` component */
export interface PropsEditorProps {
  /** Current prop values */
  props: PropsMap;
  /** Optional Zod schema used for field introspection and validation */
  schema?: ZodSchema;
  /** Default prop values used for reset and as fallback */
  defaultProps?: PropsMap;
  /** Callback invoked whenever the props change */
  onChange: (nextProps: PropsMap) => void;
  /** When `true`, all inputs are disabled */
  disabled?: boolean;
  /** When `true` (default), shows a JSON toggle button */
  showJson?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Infer input type from value or schema field.
 */
function inferInputType(value: PropValue, schemaField?: ZodSchemaField): InputType {
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
function getEnumOptions(schemaField?: ZodSchemaField): string[] {
  if (schemaField?._def?.typeName === 'ZodEnum') {
    return schemaField._def.values || [];
  }
  return [];
}

// ---------------------------------------------------------------------------
// PropInput component
// ---------------------------------------------------------------------------

/**
 * Input component for different prop types.
 */
function PropInput({ name, value, type, options, onChange, disabled }: PropInputProps) {
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    let newValue: PropValue = (e.target as HTMLInputElement).value;

    if (type === 'number') {
      newValue = parseFloat(newValue as string) || 0;
    } else if (type === 'boolean') {
      newValue = (e.target as HTMLInputElement).checked;
    }

    onChange(name, newValue);
  };

  switch (type) {
    case 'boolean':
      return (
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={(value as boolean) || false}
            onChange={handleChange}
            disabled={disabled}
          />
          <span className={styles.checkboxValue}>{value ? 'true' : 'false'}</span>
        </label>
      );

    case 'number':
      return (
        <input
          type="number"
          value={(value as number) ?? 0}
          onChange={handleChange}
          disabled={disabled}
          className={styles.input}
        />
      );

    case 'color':
      return (
        <div className={styles.colorRow}>
          <input
            type="color"
            value={(value as string) || '#000000'}
            onChange={handleChange}
            disabled={disabled}
            className={styles.colorInput}
          />
          <input
            type="text"
            value={(value as string) || ''}
            onChange={handleChange}
            disabled={disabled}
            className={styles.input}
            style={{ flex: 1 }}
            placeholder="#000000"
          />
        </div>
      );

    case 'enum':
      return (
        <select
          value={(value as string) || ''}
          onChange={handleChange}
          disabled={disabled}
          className={styles.input}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );

    case 'url':
      return (
        <input
          type="url"
          value={(value as string) || ''}
          onChange={handleChange}
          disabled={disabled}
          className={styles.input}
          placeholder="https://"
        />
      );

    case 'array':
    case 'object':
      return (
        <textarea
          value={JSON.stringify(value, null, 2)}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
            try {
              const parsed: PropValue = JSON.parse(e.target.value);
              onChange(name, parsed);
            } catch {
              // Invalid JSON, don't update
            }
          }}
          disabled={disabled}
          className={`${styles.textarea} ${styles.textareaObject}`}
        />
      );

    default:
      return (
        <input
          type="text"
          value={(value as string) ?? ''}
          onChange={handleChange}
          disabled={disabled}
          className={styles.input}
        />
      );
  }
}

// ---------------------------------------------------------------------------
// PropsEditor component
// ---------------------------------------------------------------------------

/**
 * PropsEditor component.
 */
export function PropsEditor({
  props,
  schema,
  defaultProps = {},
  onChange,
  disabled = false,
  showJson = true,
}: PropsEditorProps) {
  const [jsonMode, setJsonMode] = useState<boolean>(false);
  const [jsonValue, setJsonValue] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setJsonValue(JSON.stringify(props, null, 2));
    setJsonError(null);
  }, [props]);

  const handlePropChange = useCallback(
    (name: string, value: PropValue): void => {
      onChange({ ...props, [name]: value });
    },
    [props, onChange],
  );

  const handleJsonChange = useCallback(
    (value: string): void => {
      setJsonValue(value);
      try {
        const parsed: PropsMap = JSON.parse(value);
        setJsonError(null);

        if (schema?.safeParse) {
          const result = schema.safeParse(parsed);
          if (!result.success) {
            setJsonError(result.error.errors.map((e) => e.message).join(', '));
            return;
          }
        }

        onChange(parsed);
      } catch {
        setJsonError('Invalid JSON');
      }
    },
    [onChange, schema],
  );

  const propKeys = new Set<string>([
    ...Object.keys(props || {}),
    ...Object.keys(defaultProps || {}),
  ]);

  if (schema?._def?.shape) {
    Object.keys(schema._def.shape()).forEach((key) => propKeys.add(key));
  }

  const sortedKeys: string[] = Array.from(propKeys).sort();

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>Props</span>
        {showJson && (
          <button
            onClick={() => setJsonMode(!jsonMode)}
            className={`${styles.toggleBtn} ${jsonMode ? styles.toggleBtnActive : ''}`}
          >
            {jsonMode ? 'Form' : 'JSON'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {jsonMode ? (
          <div>
            <textarea
              value={jsonValue}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleJsonChange(e.target.value)}
              disabled={disabled}
              className={`${styles.textarea} ${styles.textareaJson}`}
              style={{ borderColor: jsonError ? '#ef4444' : undefined }}
            />
            {jsonError && <div className={styles.jsonError}>{jsonError}</div>}
          </div>
        ) : sortedKeys.length === 0 ? (
          <div className={styles.empty}>No props defined</div>
        ) : (
          <div className={styles.propGroup}>
            {sortedKeys.map((key) => {
              const value: PropValue = props?.[key] ?? defaultProps?.[key];
              const schemaField: ZodSchemaField | undefined = schema?._def?.shape?.()?.[key];
              const type: InputType = inferInputType(value, schemaField);
              const options: string[] = getEnumOptions(schemaField);

              return (
                <div key={key}>
                  <label className={styles.propLabel}>
                    {key}
                    {schemaField?._def?.typeName === 'ZodOptional' && (
                      <span className={styles.propOptional}>(optional)</span>
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
        <div className={styles.resetSection}>
          <button
            onClick={() => onChange({ ...defaultProps })}
            disabled={disabled}
            className={styles.resetBtn}
          >
            Reset to defaults
          </button>
        </div>
      )}
    </div>
  );
}

export default PropsEditor;
