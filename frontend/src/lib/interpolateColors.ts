import { Easing, EasingFunction } from './Easing';

/**
 * RGBA color with channels 0-255 for RGB and 0-1 for alpha.
 */
export interface RGBAColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Color in the OKLCH perceptual color space.
 */
export interface OKLCHColor {
  L: number;
  C: number;
  H: number;
}

/**
 * Options for interpolateColors.
 */
export interface InterpolateColorsOptions {
  easing?: EasingFunction;
  extrapolateLeft?: 'extend' | 'clamp';
  extrapolateRight?: 'extend' | 'clamp';
  colorSpace?: 'rgb' | 'oklch';
}

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
function parseColor(color: string): RGBAColor {
  if (typeof color !== 'string') {
    throw new Error(`Invalid color: ${color}`);
  }

  const trimmed = color.trim().toLowerCase();

  // Named colors (common ones)
  const namedColors: Record<string, RGBAColor> = {
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
    let r: number, g: number, b: number, a: number = 1;

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
    let r: number, g: number, b: number;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number): number => {
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

  // OKLCH: oklch(70% 0.15 240) or oklch(70% 0.15 240 / 0.5)
  const oklchMatch = trimmed.match(
    /^oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/,
  );
  if (oklchMatch) {
    const L = parseFloat(oklchMatch[1]) / 100;
    const C = parseFloat(oklchMatch[2]);
    const H = parseFloat(oklchMatch[3]);
    const a = oklchMatch[4] !== undefined ? parseFloat(oklchMatch[4]) : 1;
    const rgb = oklchToRgb(L, C, H);
    return { r: rgb.r, g: rgb.g, b: rgb.b, a };
  }

  throw new Error(`Unable to parse color: ${color}`);
}

// ─── OKLCH ↔ RGB conversion ─────────────────────────────────────────────────

/**
 * Convert OKLCH to linear RGB, then to sRGB.
 *
 * OKLCH → OKLab → linear RGB → sRGB
 */
function oklchToRgb(L: number, C: number, H: number): Omit<RGBAColor, 'a'> {
  // OKLCH → OKLab
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // OKLab → linear RGB (via LMS intermediate)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return {
    r: Math.round(Math.max(0, Math.min(255, linearToSrgb(rLin) * 255))),
    g: Math.round(Math.max(0, Math.min(255, linearToSrgb(gLin) * 255))),
    b: Math.round(Math.max(0, Math.min(255, linearToSrgb(bLin) * 255))),
  };
}

/**
 * Convert sRGB to OKLCH.
 */
function rgbToOklch(r: number, g: number, b: number): OKLCHColor {
  const rLin = srgbToLinear(r / 255);
  const gLin = srgbToLinear(g / 255);
  const bLin = srgbToLinear(b / 255);

  const l_ = Math.cbrt(0.4122214708 * rLin + 0.5363325363 * gLin + 0.0514459929 * bLin);
  const m_ = Math.cbrt(0.2119034982 * rLin + 0.6806995451 * gLin + 0.1073969566 * bLin);
  const s_ = Math.cbrt(0.0883024619 * rLin + 0.2817188376 * gLin + 0.6299787005 * bLin);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bOk = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const C = Math.sqrt(a * a + bOk * bOk);
  let H = (Math.atan2(bOk, a) * 180) / Math.PI;
  if (H < 0) H += 360;

  return { L, C, H };
}

function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Convert RGBA components to a CSS color string.
 *
 * @param {{ r: number, g: number, b: number, a: number }} color
 * @returns {string} CSS color string
 */
function colorToString(color: RGBAColor): string {
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
 * @param {'rgb'|'oklch'} [options.colorSpace='rgb'] - Interpolation color space
 * @returns {string} Interpolated CSS color string
 */
export function interpolateColors(
  value: number,
  inputRange: number[],
  outputRange: string[],
  options: InterpolateColorsOptions = {}
): string {
  const {
    easing = Easing.linear,
    extrapolateLeft = 'clamp',
    extrapolateRight = 'clamp',
    colorSpace = 'rgb',
  } = options;

  if (inputRange.length !== outputRange.length) {
    throw new Error('inputRange and outputRange must have the same length');
  }
  if (inputRange.length < 2) {
    throw new Error('inputRange must have at least 2 elements');
  }

  // Parse all colors upfront
  const parsedColors: RGBAColor[] = outputRange.map(parseColor);

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
  let progress: number;
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
  const easedProgress: number =
    progress < 0 || progress > 1 ? progress : easing(progress);

  // Interpolate in the chosen color space
  let interpolated: RGBAColor;

  if (colorSpace === 'oklch') {
    // Convert to OKLCH, interpolate there, convert back
    const oklch1 = rgbToOklch(colorMin.r, colorMin.g, colorMin.b);
    const oklch2 = rgbToOklch(colorMax.r, colorMax.g, colorMax.b);

    // Interpolate hue via shortest path
    let hDiff = oklch2.H - oklch1.H;
    if (hDiff > 180) hDiff -= 360;
    if (hDiff < -180) hDiff += 360;

    const L = oklch1.L + easedProgress * (oklch2.L - oklch1.L);
    const C = oklch1.C + easedProgress * (oklch2.C - oklch1.C);
    let H = oklch1.H + easedProgress * hDiff;
    if (H < 0) H += 360;
    if (H >= 360) H -= 360;

    const rgb = oklchToRgb(L, C, H);
    interpolated = {
      ...rgb,
      a: colorMin.a + easedProgress * (colorMax.a - colorMin.a),
    };
  } else {
    // RGB interpolation (default)
    interpolated = {
      r: colorMin.r + easedProgress * (colorMax.r - colorMin.r),
      g: colorMin.g + easedProgress * (colorMax.g - colorMin.g),
      b: colorMin.b + easedProgress * (colorMax.b - colorMin.b),
      a: colorMin.a + easedProgress * (colorMax.a - colorMin.a),
    };
  }

  return colorToString(interpolated);
}

export default interpolateColors;
