import { Easing } from './Easing';

/**
 * Parse a color string into RGBA components.
 *
 * Supports:
 * - Hex: #RGB, #RRGGBB, #RGBA, #RRGGBBAA
 * - RGB: rgb(r, g, b)
 * - RGBA: rgba(r, g, b, a)
 * - HSL: hsl(h, s%, l%)
 * - HSLA: hsla(h, s%, l%, a)
 * - Named colors (limited set)
 *
 * @param {string} color - Color string to parse
 * @returns {{ r: number, g: number, b: number, a: number }} RGBA values (0-255 for RGB, 0-1 for alpha)
 */
function parseColor(color) {
  if (typeof color !== 'string') {
    throw new Error(`Invalid color: ${color}`);
  }

  const trimmed = color.trim().toLowerCase();

  // Named colors (common ones)
  const namedColors = {
    transparent: { r: 0, g: 0, b: 0, a: 0 },
    black: { r: 0, g: 0, b: 0, a: 1 },
    white: { r: 255, g: 255, b: 255, a: 1 },
    red: { r: 255, g: 0, b: 0, a: 1 },
    green: { r: 0, g: 128, b: 0, a: 1 },
    blue: { r: 0, g: 0, b: 255, a: 1 },
    yellow: { r: 255, g: 255, b: 0, a: 1 },
    cyan: { r: 0, g: 255, b: 255, a: 1 },
    magenta: { r: 255, g: 0, b: 255, a: 1 },
    gray: { r: 128, g: 128, b: 128, a: 1 },
    grey: { r: 128, g: 128, b: 128, a: 1 },
    orange: { r: 255, g: 165, b: 0, a: 1 },
    purple: { r: 128, g: 0, b: 128, a: 1 },
    pink: { r: 255, g: 192, b: 203, a: 1 },
  };

  if (namedColors[trimmed]) {
    return { ...namedColors[trimmed] };
  }

  // Hex colors
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    let r, g, b, a = 1;

    if (hex.length === 3) {
      // #RGB
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 4) {
      // #RGBA
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
      a = parseInt(hex[3] + hex[3], 16) / 255;
    } else if (hex.length === 6) {
      // #RRGGBB
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else if (hex.length === 8) {
      // #RRGGBBAA
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      a = parseInt(hex.slice(6, 8), 16) / 255;
    } else {
      throw new Error(`Invalid hex color: ${color}`);
    }

    return { r, g, b, a };
  }

  // RGB/RGBA
  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
      a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1,
    };
  }

  // HSL/HSLA
  const hslMatch = trimmed.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)$/);
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]) / 360;
    const s = parseFloat(hslMatch[2]) / 100;
    const l = parseFloat(hslMatch[3]) / 100;
    const a = hslMatch[4] !== undefined ? parseFloat(hslMatch[4]) : 1;

    // Convert HSL to RGB
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
      a,
    };
  }

  throw new Error(`Unable to parse color: ${color}`);
}

/**
 * Convert RGBA components to a CSS color string.
 *
 * @param {{ r: number, g: number, b: number, a: number }} color
 * @returns {string} CSS color string
 */
function colorToString(color) {
  const r = Math.round(Math.max(0, Math.min(255, color.r)));
  const g = Math.round(Math.max(0, Math.min(255, color.g)));
  const b = Math.round(Math.max(0, Math.min(255, color.b)));
  const a = Math.max(0, Math.min(1, color.a));

  if (a === 1) {
    return `rgb(${r}, ${g}, ${b})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}

/**
 * Interpolate between colors across a range.
 *
 * Works like interpolate() but for colors. Supports any CSS color format.
 *
 * Usage:
 *   interpolateColors(frame, [0, 30], ['#ff0000', '#0000ff'])
 *   interpolateColors(frame, [0, 30], ['red', 'blue'], { easing: Easing.easeOut })
 *   interpolateColors(frame, [0, 30, 60], ['red', 'yellow', 'green']) // multi-color
 *
 * @param {number} value - The input value (usually the current frame)
 * @param {number[]} inputRange - Array of ascending input breakpoints
 * @param {string[]} outputRange - Corresponding color values
 * @param {object} [options]
 * @param {function} [options.easing=Easing.linear] - Easing function
 * @param {'extend'|'clamp'} [options.extrapolateLeft='clamp']
 * @param {'extend'|'clamp'} [options.extrapolateRight='clamp']
 * @returns {string} Interpolated CSS color string
 */
export function interpolateColors(
  value,
  inputRange,
  outputRange,
  options = {}
) {
  const {
    easing = Easing.linear,
    extrapolateLeft = 'clamp',
    extrapolateRight = 'clamp',
  } = options;

  if (inputRange.length !== outputRange.length) {
    throw new Error('inputRange and outputRange must have the same length');
  }
  if (inputRange.length < 2) {
    throw new Error('inputRange must have at least 2 elements');
  }

  // Parse all colors upfront
  const parsedColors = outputRange.map(parseColor);

  // Find which segment we're in
  let segIndex = 0;
  for (let i = 1; i < inputRange.length; i++) {
    if (value >= inputRange[i - 1]) {
      segIndex = i - 1;
    }
  }

  const inputMin = inputRange[segIndex];
  const inputMax = inputRange[segIndex + 1] ?? inputRange[segIndex];
  const colorMin = parsedColors[segIndex];
  const colorMax = parsedColors[segIndex + 1] ?? parsedColors[segIndex];

  // Calculate progress within this segment (0 to 1)
  let progress;
  if (inputMax === inputMin) {
    progress = 0;
  } else {
    progress = (value - inputMin) / (inputMax - inputMin);
  }

  // Handle extrapolation
  if (progress < 0) {
    progress = extrapolateLeft === 'clamp' ? 0 : progress;
  }
  if (progress > 1) {
    progress = extrapolateRight === 'clamp' ? 1 : progress;
  }

  // Apply easing only to the 0-1 range
  const easedProgress =
    progress < 0 || progress > 1 ? progress : easing(progress);

  // Interpolate each color channel
  const interpolated = {
    r: colorMin.r + easedProgress * (colorMax.r - colorMin.r),
    g: colorMin.g + easedProgress * (colorMax.g - colorMin.g),
    b: colorMin.b + easedProgress * (colorMax.b - colorMin.b),
    a: colorMin.a + easedProgress * (colorMax.a - colorMin.a),
  };

  return colorToString(interpolated);
}

export default interpolateColors;
