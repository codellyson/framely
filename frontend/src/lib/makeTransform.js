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
 * Supported transform operations with their CSS function names.
 */
const transformFunctions = {
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
function formatValue(key, value) {
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
function operationToString(operation) {
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
 * @param {Array<object>} operations - Array of transform operation objects
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
export function makeTransform(operations) {
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
  constructor() {
    this.operations = [];
  }

  // 2D Transforms
  translateX(value) {
    this.operations.push({ translateX: value });
    return this;
  }

  translateY(value) {
    this.operations.push({ translateY: value });
    return this;
  }

  translate(x, y) {
    this.operations.push({ translate: y !== undefined ? [x, y] : x });
    return this;
  }

  scaleX(value) {
    this.operations.push({ scaleX: value });
    return this;
  }

  scaleY(value) {
    this.operations.push({ scaleY: value });
    return this;
  }

  scale(x, y) {
    this.operations.push({ scale: y !== undefined ? [x, y] : x });
    return this;
  }

  rotate(value) {
    this.operations.push({ rotate: value });
    return this;
  }

  skewX(value) {
    this.operations.push({ skewX: value });
    return this;
  }

  skewY(value) {
    this.operations.push({ skewY: value });
    return this;
  }

  skew(x, y) {
    this.operations.push({ skew: y !== undefined ? [x, y] : x });
    return this;
  }

  // 3D Transforms
  translateZ(value) {
    this.operations.push({ translateZ: value });
    return this;
  }

  translate3d(x, y, z) {
    this.operations.push({ translate3d: [x, y, z] });
    return this;
  }

  scaleZ(value) {
    this.operations.push({ scaleZ: value });
    return this;
  }

  scale3d(x, y, z) {
    this.operations.push({ scale3d: [x, y, z] });
    return this;
  }

  rotateX(value) {
    this.operations.push({ rotateX: value });
    return this;
  }

  rotateY(value) {
    this.operations.push({ rotateY: value });
    return this;
  }

  rotateZ(value) {
    this.operations.push({ rotateZ: value });
    return this;
  }

  rotate3d(x, y, z, angle) {
    this.operations.push({ rotate3d: [x, y, z, angle] });
    return this;
  }

  perspective(value) {
    this.operations.push({ perspective: value });
    return this;
  }

  // Matrix
  matrix(...values) {
    this.operations.push({ matrix: values });
    return this;
  }

  matrix3d(...values) {
    this.operations.push({ matrix3d: values });
    return this;
  }

  // Build the transform string
  toString() {
    return makeTransform(this.operations);
  }

  // Get the operations array
  toArray() {
    return [...this.operations];
  }

  // Clear all operations
  clear() {
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
export function transform() {
  return new TransformBuilder();
}

/**
 * Interpolate between two transform strings.
 * Note: This is a simplified version that works best with matching operations.
 *
 * @param {number} progress - Interpolation progress (0-1)
 * @param {Array<object>} fromOps - Starting transform operations
 * @param {Array<object>} toOps - Ending transform operations
 * @returns {string} Interpolated transform string
 */
export function interpolateTransform(progress, fromOps, toOps) {
  const result = [];

  const maxLength = Math.max(fromOps.length, toOps.length);

  for (let i = 0; i < maxLength; i++) {
    const fromOp = fromOps[i] || {};
    const toOp = toOps[i] || {};

    const interpolatedOp = {};

    // Get all keys from both operations
    const keys = new Set([...Object.keys(fromOp), ...Object.keys(toOp)]);

    keys.forEach((key) => {
      const fromValue = fromOp[key];
      const toValue = toOp[key];

      if (fromValue === undefined && toValue !== undefined) {
        interpolatedOp[key] = toValue;
      } else if (toValue === undefined && fromValue !== undefined) {
        interpolatedOp[key] = fromValue;
      } else if (typeof fromValue === 'number' && typeof toValue === 'number') {
        interpolatedOp[key] = fromValue + (toValue - fromValue) * progress;
      } else if (Array.isArray(fromValue) && Array.isArray(toValue)) {
        interpolatedOp[key] = fromValue.map((v, idx) => {
          const from = typeof v === 'number' ? v : parseFloat(v) || 0;
          const to = typeof toValue[idx] === 'number' ? toValue[idx] : parseFloat(toValue[idx]) || 0;
          return from + (to - from) * progress;
        });
      } else {
        // Can't interpolate, use the target value
        interpolatedOp[key] = progress < 0.5 ? fromValue : toValue;
      }
    });

    result.push(interpolatedOp);
  }

  return makeTransform(result);
}

export default makeTransform;
