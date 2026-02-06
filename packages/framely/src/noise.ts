/**
 * Noise Utilities
 *
 * Deterministic noise and random functions for reproducible animations.
 * All functions are pure — same inputs always produce same outputs.
 */

/**
 * Options for 2D and 3D Perlin noise functions.
 */
interface NoiseOptions {
  /** Seed for the permutation table */
  seed?: number;
  /** Scales the input coordinates */
  frequency?: number;
  /** Scales the output value */
  amplitude?: number;
}

/**
 * Options for Fractal Brownian Motion (fBm).
 */
interface FbmOptions extends NoiseOptions {
  /** Number of noise layers */
  octaves?: number;
  /** Frequency multiplier per octave */
  lacunarity?: number;
  /** Amplitude multiplier per octave */
  persistence?: number;
}

/** A 2D gradient vector [x, y] */
type Gradient2D = [number, number];

/** A 3D gradient vector [x, y, z] */
type Gradient3D = [number, number, number];

/**
 * Generate a seeded pseudo-random number between 0 and 1.
 *
 * Uses a hash-based approach for single-call determinism (no state).
 *
 * @param {number} seed - Any number (typically frame number or index)
 * @returns {number} Pseudo-random value in [0, 1)
 */
export function random(seed: number): number {
  // Mulberry32 — fast, good distribution, 32-bit state
  let t: number = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Generate a seeded random number within a range.
 *
 * @param {number} seed - Seed value
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (exclusive)
 * @returns {number} Random value in [min, max)
 */
export function randomRange(seed: number, min: number, max: number): number {
  return min + random(seed) * (max - min);
}

/**
 * Generate a seeded random integer within a range.
 *
 * @param {number} seed - Seed value
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {number} Random integer in [min, max]
 */
export function randomInt(seed: number, min: number, max: number): number {
  return Math.floor(min + random(seed) * (max - min + 1));
}

// ─── Permutation table for Perlin noise ──────────────────────────────────────

function buildPermutation(seed: number): Uint8Array {
  const perm: Uint8Array = new Uint8Array(512);
  const base: Uint8Array = new Uint8Array(256);

  for (let i = 0; i < 256; i++) {
    base[i] = i;
  }

  // Fisher-Yates shuffle with seeded random
  for (let i = 255; i > 0; i--) {
    const j: number = Math.floor(random(seed + i) * (i + 1));
    const tmp: number = base[i];
    base[i] = base[j];
    base[j] = tmp;
  }

  // Double the table to avoid index wrapping
  for (let i = 0; i < 256; i++) {
    perm[i] = base[i];
    perm[i + 256] = base[i];
  }

  return perm;
}

// ─── Gradient vectors for 2D and 3D Perlin noise ────────────────────────────

const GRAD2: Gradient2D[] = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [-1, 1], [1, -1], [-1, -1],
];

const GRAD3: Gradient3D[] = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
];

function fade(t: number): number {
  // Improved Perlin fade: 6t^5 - 15t^4 + 10t^3
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function dot2(g: Gradient2D, x: number, y: number): number {
  return g[0] * x + g[1] * y;
}

function dot3(g: Gradient3D, x: number, y: number, z: number): number {
  return g[0] * x + g[1] * y + g[2] * z;
}

// ─── Cache for permutation tables ────────────────────────────────────────────

const permCache: Map<number, Uint8Array> = new Map();

function getPermutation(seed: number): Uint8Array {
  if (!permCache.has(seed)) {
    // Limit cache size
    if (permCache.size > 32) {
      const firstKey: number | undefined = permCache.keys().next().value;
      if (firstKey !== undefined) {
        permCache.delete(firstKey);
      }
    }
    permCache.set(seed, buildPermutation(seed));
  }
  return permCache.get(seed)!;
}

/**
 * 2D Perlin noise.
 *
 * Returns a smooth, continuous noise value for the given coordinates.
 * Same inputs always produce the same output.
 *
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {object} [options]
 * @param {number} [options.seed=0] - Seed for the permutation table
 * @param {number} [options.frequency=1] - Scales the input coordinates
 * @param {number} [options.amplitude=1] - Scales the output value
 * @returns {number} Noise value in [-amplitude, amplitude]
 */
export function noise2D(x: number, y: number, options: NoiseOptions = {}): number {
  const { seed = 0, frequency = 1, amplitude = 1 } = options;
  const perm: Uint8Array = getPermutation(seed);

  x *= frequency;
  y *= frequency;

  // Grid cell coordinates
  const xi: number = Math.floor(x) & 255;
  const yi: number = Math.floor(y) & 255;

  // Relative position within cell
  const xf: number = x - Math.floor(x);
  const yf: number = y - Math.floor(y);

  // Fade curves
  const u: number = fade(xf);
  const v: number = fade(yf);

  // Hash the 4 corners
  const aa: number = perm[perm[xi] + yi];
  const ab: number = perm[perm[xi] + yi + 1];
  const ba: number = perm[perm[xi + 1] + yi];
  const bb: number = perm[perm[xi + 1] + yi + 1];

  // Gradient dot products
  const g00: number = dot2(GRAD2[aa % 8], xf, yf);
  const g10: number = dot2(GRAD2[ba % 8], xf - 1, yf);
  const g01: number = dot2(GRAD2[ab % 8], xf, yf - 1);
  const g11: number = dot2(GRAD2[bb % 8], xf - 1, yf - 1);

  // Bilinear interpolation
  const x1: number = lerp(g00, g10, u);
  const x2: number = lerp(g01, g11, u);
  const result: number = lerp(x1, x2, v);

  return result * amplitude;
}

/**
 * 3D Perlin noise.
 *
 * Useful for animated noise: use (x, y, frame * speed) as coordinates.
 *
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} z - Z coordinate (often frame * speed)
 * @param {object} [options]
 * @param {number} [options.seed=0] - Seed for the permutation table
 * @param {number} [options.frequency=1] - Scales the input coordinates
 * @param {number} [options.amplitude=1] - Scales the output value
 * @returns {number} Noise value in [-amplitude, amplitude]
 */
export function noise3D(x: number, y: number, z: number, options: NoiseOptions = {}): number {
  const { seed = 0, frequency = 1, amplitude = 1 } = options;
  const perm: Uint8Array = getPermutation(seed);

  x *= frequency;
  y *= frequency;
  z *= frequency;

  const xi: number = Math.floor(x) & 255;
  const yi: number = Math.floor(y) & 255;
  const zi: number = Math.floor(z) & 255;

  const xf: number = x - Math.floor(x);
  const yf: number = y - Math.floor(y);
  const zf: number = z - Math.floor(z);

  const u: number = fade(xf);
  const v: number = fade(yf);
  const w: number = fade(zf);

  // Hash the 8 corners
  const a: number = perm[xi] + yi;
  const aa: number = perm[a] + zi;
  const ab: number = perm[a + 1] + zi;
  const b: number = perm[xi + 1] + yi;
  const ba: number = perm[b] + zi;
  const bb: number = perm[b + 1] + zi;

  const g000: number = dot3(GRAD3[perm[aa] % 12], xf, yf, zf);
  const g100: number = dot3(GRAD3[perm[ba] % 12], xf - 1, yf, zf);
  const g010: number = dot3(GRAD3[perm[ab] % 12], xf, yf - 1, zf);
  const g110: number = dot3(GRAD3[perm[bb] % 12], xf - 1, yf - 1, zf);
  const g001: number = dot3(GRAD3[perm[aa + 1] % 12], xf, yf, zf - 1);
  const g101: number = dot3(GRAD3[perm[ba + 1] % 12], xf - 1, yf, zf - 1);
  const g011: number = dot3(GRAD3[perm[ab + 1] % 12], xf, yf - 1, zf - 1);
  const g111: number = dot3(GRAD3[perm[bb + 1] % 12], xf - 1, yf - 1, zf - 1);

  // Trilinear interpolation
  const x1: number = lerp(g000, g100, u);
  const x2: number = lerp(g010, g110, u);
  const y1: number = lerp(x1, x2, v);

  const x3: number = lerp(g001, g101, u);
  const x4: number = lerp(g011, g111, u);
  const y2: number = lerp(x3, x4, v);

  const result: number = lerp(y1, y2, w);

  return result * amplitude;
}

/**
 * Fractal Brownian Motion (fBm) — layered 2D noise for natural textures.
 *
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {object} [options]
 * @param {number} [options.seed=0] - Seed
 * @param {number} [options.octaves=4] - Number of noise layers
 * @param {number} [options.frequency=1] - Base frequency
 * @param {number} [options.amplitude=1] - Base amplitude
 * @param {number} [options.lacunarity=2] - Frequency multiplier per octave
 * @param {number} [options.persistence=0.5] - Amplitude multiplier per octave
 * @returns {number} Noise value
 */
export function fbm2D(x: number, y: number, options: FbmOptions = {}): number {
  const {
    seed = 0,
    octaves = 4,
    frequency = 1,
    amplitude = 1,
    lacunarity = 2,
    persistence = 0.5,
  } = options;

  let value: number = 0;
  let freq: number = frequency;
  let amp: number = amplitude;

  for (let i = 0; i < octaves; i++) {
    value += noise2D(x, y, { seed: seed + i * 1000, frequency: freq, amplitude: amp });
    freq *= lacunarity;
    amp *= persistence;
  }

  return value;
}

export default { random, randomRange, randomInt, noise2D, noise3D, fbm2D };
