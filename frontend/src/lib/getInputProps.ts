/**
 * Input Props System
 *
 * Manages props passed to compositions from external sources:
 * - CLI flags (--props '{"key": "value"}')
 * - API requests (render endpoint body)
 * - URL query parameters (?props=...)
 *
 * This allows dynamic, data-driven video generation.
 */

/** A record of string keys to unknown values, representing input props. */
export type InputProps = Record<string, unknown>;

/** Possible sources from which input props can originate. */
export type InputPropsSource = 'url' | 'renderer' | 'manual' | null;

/** Augment the global Window interface with Framely-specific properties. */
declare global {
  interface Window {
    __FRAMELY_INPUT_PROPS?: InputProps;
    __FRAMELY_SET_INPUT_PROPS?: typeof setInputProps;
  }
}

// Global storage for input props
let inputProps: InputProps = {};
let inputPropsSource: InputPropsSource = null;

/**
 * Initialize input props from various sources.
 * Called automatically on module load.
 */
function initInputProps(): void {
  if (typeof window === 'undefined') return;

  // Check URL query params first
  const urlParams = new URLSearchParams(window.location.search);
  const propsParam: string | null = urlParams.get('props');

  if (propsParam) {
    try {
      inputProps = JSON.parse(decodeURIComponent(propsParam)) as InputProps;
      inputPropsSource = 'url';
    } catch (err) {
      console.warn('Failed to parse props from URL:', err);
    }
  }

  // Check for props injected by renderer
  if (window.__FRAMELY_INPUT_PROPS) {
    inputProps = { ...inputProps, ...window.__FRAMELY_INPUT_PROPS };
    inputPropsSource = 'renderer';
  }

  // Expose setter for external use
  window.__FRAMELY_SET_INPUT_PROPS = setInputProps;
}

// Initialize on module load
initInputProps();

/**
 * Get the input props passed to the current render/preview.
 *
 * In the CLI, props are passed via --props flag:
 *   framely render my-video --props '{"name": "John"}'
 *
 * In the API, props are passed in the request body:
 *   POST /api/render { compositionId: "...", props: { name: "John" } }
 *
 * @returns {object} The input props object
 *
 * Usage:
 *   function MyVideo() {
 *     const { name, color } = getInputProps();
 *     return <div style={{ color }}>{name}</div>;
 *   }
 */
export function getInputProps<T extends InputProps = InputProps>(): T {
  return { ...inputProps } as T;
}

/**
 * Set input props programmatically.
 *
 * This is primarily used by the renderer to inject props before
 * the composition is rendered.
 *
 * @param {object} props - Props to set
 * @param {string} [source] - Source identifier (for debugging)
 */
export function setInputProps(
  props: InputProps,
  source: InputPropsSource = 'manual',
): void {
  inputProps = { ...props };
  inputPropsSource = source;

  // Update global reference
  if (typeof window !== 'undefined') {
    window.__FRAMELY_INPUT_PROPS = inputProps;
  }
}

/**
 * Merge additional props into the existing input props.
 *
 * @param {object} props - Props to merge
 */
export function mergeInputProps(props: InputProps): void {
  inputProps = { ...inputProps, ...props };

  if (typeof window !== 'undefined') {
    window.__FRAMELY_INPUT_PROPS = inputProps;
  }
}

/**
 * Get a specific input prop by key.
 *
 * @param {string} key - Prop key
 * @param {*} [defaultValue] - Default value if prop doesn't exist
 * @returns {*} The prop value or default
 *
 * Usage:
 *   const name = getInputProp('name', 'Anonymous');
 */
export function getInputProp<T = unknown>(key: string, defaultValue?: T): T {
  return (key in inputProps ? inputProps[key] : defaultValue) as T;
}

/**
 * Check if input props were provided.
 *
 * @returns {boolean}
 */
export function hasInputProps(): boolean {
  return Object.keys(inputProps).length > 0;
}

/**
 * Get the source of the current input props.
 *
 * @returns {string|null} 'url', 'renderer', 'manual', or null
 */
export function getInputPropsSource(): InputPropsSource {
  return inputPropsSource;
}

/**
 * Clear all input props (mainly for testing).
 */
export function clearInputProps(): void {
  inputProps = {};
  inputPropsSource = null;

  if (typeof window !== 'undefined') {
    delete window.__FRAMELY_INPUT_PROPS;
  }
}

/**
 * Parse props from a JSON string or file path.
 *
 * @param {string} input - JSON string or path to JSON file
 * @returns {object} Parsed props
 */
export function parsePropsInput(input: string): InputProps {
  if (!input) return {};

  // Try parsing as JSON directly
  try {
    return JSON.parse(input) as InputProps;
  } catch {
    // Not valid JSON, might be a file path (handled by CLI)
    throw new Error(
      `Invalid props input. Expected JSON string, got: ${input.slice(0, 50)}...`
    );
  }
}

/**
 * Serialize props to a URL-safe string.
 *
 * @param {object} props - Props to serialize
 * @returns {string} URL-encoded JSON string
 */
export function serializeProps(props: InputProps): string {
  return encodeURIComponent(JSON.stringify(props));
}

/**
 * Create a URL with props embedded as query parameter.
 *
 * @param {string} baseUrl - Base URL
 * @param {object} props - Props to embed
 * @returns {string} URL with props
 */
export function createUrlWithProps(baseUrl: string, props: InputProps): string {
  const url = new URL(baseUrl);
  url.searchParams.set('props', serializeProps(props));
  return url.toString();
}

export default {
  getInputProps,
  setInputProps,
  mergeInputProps,
  getInputProp,
  hasInputProps,
  getInputPropsSource,
  clearInputProps,
  parsePropsInput,
  serializeProps,
  createUrlWithProps,
};
