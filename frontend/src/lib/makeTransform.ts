/**
 * makeTransform Utility
 *
 * Build CSS transform strings from an array of transform operations.
 * Helps construct complex transforms in a readable, composable way.
 *
 * Usage:
 *   const transform = makeTransform([
 *     { translateX: '100px' },
 *     { rotate: '45deg' },
 *     { scale: 1.5 },
 *   ]);
 *   // => "translateX(100px) rotate(45deg) scale(1.5)"
 *
 *   // Or using the fluent API:
 *   const transform = transform()
 *     .translateX('100px')
 *     .rotate('45deg')
 *     .scale(1.5)
 *     .toString();
 */

/**
 * A single transform operation mapping function names to their values.
 * Values can be numbers, strings, or arrays of numbers/strings (for multi-arg functions).
 */
type TransformValue = number | string;
type TransformOperation = Record<string, TransformValue | TransformValue[]>;

/**
 * Supported transform operations with their CSS function names.
 */
const transformFunctions: Record<string, string> = {
  // 2D Transforms
  translateX: 'translateX',
  translateY: 'translateY',
  translate: 'translate',
  scaleX: 'scaleX',
  scaleY: 'scaleY',
  scale: 'scale',
  rotate: 'rotate',
  skewX: 'skewX',
  skewY: 'skewY',
  skew: 'skew',

  // 3D Transforms
  translateZ: 'translateZ',
  translate3d: 'translate3d',
  scaleZ: 'scaleZ',
  scale3d: 'scale3d',
  rotateX: 'rotateX',
  rotateY: 'rotateY',
  rotateZ: 'rotateZ',
  rotate3d: 'rotate3d',
  perspective: 'perspective',

  // Matrix
  matrix: 'matrix',
  matrix3d: 'matrix3d',
};

/**
 * Format a value for CSS transform.
 * Numbers are kept as-is for scale, strings are used directly.
 */
function formatValue(key: string, value: TransformValue | TransformValue[]): string {
  // Handle arrays (for translate, scale, rotate3d, etc.)
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  // Handle numbers - add units where needed
  if (typeof value === 'number') {
    // Scale values don't need units
    if (key.startsWith('scale') || key === 'matrix' || key === 'matrix3d') {
      return String(value);
    }
    // Rotation needs deg
    if (key.startsWith('rotate') || key.startsWith('skew')) {
      return `${value}deg`;
    }
    // Translation needs px
    if (key.startsWith('translate') || key === 'perspective') {
      return `${value}px`;
    }
    return String(value);
  }

  return String(value);
}

/**
 * Convert a transform operation object to CSS string.
 */
function operationToString(operation: TransformOperation): string {
  const entries = Object.entries(operation);
  if (entries.length === 0) return '';

  return entries
    .map(([key, value]) => {
      const fnName = transformFunctions[key] || key;
      const formattedValue = formatValue(key, value);
      return `${fnName}(${formattedValue})`;
    })
    .join(' ');
}

/**
 * Build a CSS transform string from an array of transform operations.
 *
 * @param {TransformOperation | TransformOperation[]} operations - Array of transform operation objects
 * @returns {string} CSS transform string
 *
 * @example
 *   makeTransform([
 *     { translateX: 100 },
 *     { rotate: 45 },
 *     { scale: 1.5 },
 *   ])
 *   // => "translateX(100px) rotate(45deg) scale(1.5)"
 */
export function makeTransform(operations: TransformOperation | TransformOperation[]): string {
  if (!Array.isArray(operations)) {
    return operationToString(operations);
  }

  return operations
    .map(operationToString)
    .filter(Boolean)
    .join(' ');
}

/**
 * Fluent transform builder class.
 */
class TransformBuilder {
  operations: TransformOperation[];

  constructor() {
    this.operations = [];
  }

  // 2D Transforms
  translateX(value: TransformValue): this {
    this.operations.push({ translateX: value });
    return this;
  }

  translateY(value: TransformValue): this {
    this.operations.push({ translateY: value });
    return this;
  }

  translate(x: TransformValue, y?: TransformValue): this {
    this.operations.push({ translate: y !== undefined ? [x, y] : x });
    return this;
  }

  scaleX(value: TransformValue): this {
    this.operations.push({ scaleX: value });
    return this;
  }

  scaleY(value: TransformValue): this {
    this.operations.push({ scaleY: value });
    return this;
  }

  scale(x: TransformValue, y?: TransformValue): this {
    this.operations.push({ scale: y !== undefined ? [x, y] : x });
    return this;
  }

  rotate(value: TransformValue): this {
    this.operations.push({ rotate: value });
    return this;
  }

  skewX(value: TransformValue): this {
    this.operations.push({ skewX: value });
    return this;
  }

  skewY(value: TransformValue): this {
    this.operations.push({ skewY: value });
    return this;
  }

  skew(x: TransformValue, y?: TransformValue): this {
    this.operations.push({ skew: y !== undefined ? [x, y] : x });
    return this;
  }

  // 3D Transforms
  translateZ(value: TransformValue): this {
    this.operations.push({ translateZ: value });
    return this;
  }

  translate3d(x: TransformValue, y: TransformValue, z: TransformValue): this {
    this.operations.push({ translate3d: [x, y, z] });
    return this;
  }

  scaleZ(value: TransformValue): this {
    this.operations.push({ scaleZ: value });
    return this;
  }

  scale3d(x: TransformValue, y: TransformValue, z: TransformValue): this {
    this.operations.push({ scale3d: [x, y, z] });
    return this;
  }

  rotateX(value: TransformValue): this {
    this.operations.push({ rotateX: value });
    return this;
  }

  rotateY(value: TransformValue): this {
    this.operations.push({ rotateY: value });
    return this;
  }

  rotateZ(value: TransformValue): this {
    this.operations.push({ rotateZ: value });
    return this;
  }

  rotate3d(x: TransformValue, y: TransformValue, z: TransformValue, angle: TransformValue): this {
    this.operations.push({ rotate3d: [x, y, z, angle] });
    return this;
  }

  perspective(value: TransformValue): this {
    this.operations.push({ perspective: value });
    return this;
  }

  // Matrix
  matrix(...values: TransformValue[]): this {
    this.operations.push({ matrix: values });
    return this;
  }

  matrix3d(...values: TransformValue[]): this {
    this.operations.push({ matrix3d: values });
    return this;
  }

  // Build the transform string
  toString(): string {
    return makeTransform(this.operations);
  }

  // Get the operations array
  toArray(): TransformOperation[] {
    return [...this.operations];
  }

  // Clear all operations
  clear(): this {
    this.operations = [];
    return this;
  }
}

/**
 * Create a new transform builder for fluent API usage.
 *
 * @returns {TransformBuilder}
 *
 * @example
 *   const transform = transform()
 *     .translateX(100)
 *     .rotate(45)
 *     .scale(1.5)
 *     .toString();
 */
export function transform(): TransformBuilder {
  return new TransformBuilder();
}

/**
 * Interpolate between two transform strings.
 * Note: This is a simplified version that works best with matching operations.
 *
 * @param {number} progress - Interpolation progress (0-1)
 * @param {TransformOperation[]} fromOps - Starting transform operations
 * @param {TransformOperation[]} toOps - Ending transform operations
 * @returns {string} Interpolated transform string
 */
export function interpolateTransform(
  progress: number,
  fromOps: TransformOperation[],
  toOps: TransformOperation[],
): string {
  const result: TransformOperation[] = [];

  const maxLength = Math.max(fromOps.length, toOps.length);

  for (let i = 0; i < maxLength; i++) {
    const fromOp: TransformOperation = fromOps[i] || {};
    const toOp: TransformOperation = toOps[i] || {};

    const interpolatedOp: TransformOperation = {};

    // Get all keys from both operations
    const keys = new Set([...Object.keys(fromOp), ...Object.keys(toOp)]);

    keys.forEach((key: string) => {
      const fromValue = fromOp[key];
      const toValue = toOp[key];

      if (fromValue === undefined && toValue !== undefined) {
        interpolatedOp[key] = toValue;
      } else if (toValue === undefined && fromValue !== undefined) {
        interpolatedOp[key] = fromValue;
      } else if (typeof fromValue === 'number' && typeof toValue === 'number') {
        interpolatedOp[key] = fromValue + (toValue - fromValue) * progress;
      } else if (Array.isArray(fromValue) && Array.isArray(toValue)) {
        interpolatedOp[key] = fromValue.map((v: TransformValue, idx: number) => {
          const from = typeof v === 'number' ? v : parseFloat(v) || 0;
          const to = typeof toValue[idx] === 'number' ? (toValue[idx] as number) : parseFloat(toValue[idx] as string) || 0;
          return from + (to - from) * progress;
        });
      } else {
        // Can't interpolate, use the target value
        interpolatedOp[key] = progress < 0.5 ? fromValue! : toValue!;
      }
    });

    result.push(interpolatedOp);
  }

  return makeTransform(result);
}

export default makeTransform;
