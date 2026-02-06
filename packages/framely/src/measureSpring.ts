/**
 * Interface for spring preset configuration values.
 */
export interface SpringPreset {
  mass: number;
  stiffness: number;
  damping: number;
}

/**
 * Options for the measureSpring function.
 */
export interface MeasureSpringOptions {
  /** Frames per second (required) */
  fps: number;
  /** Controls animation speed (lower = faster). Defaults to 1. */
  mass?: number;
  /** Bounciness (higher = more bounce). Defaults to 100. */
  stiffness?: number;
  /** Deceleration (higher = less bounce). Defaults to 10. */
  damping?: number;
  /** How close to final value to consider "settled". Defaults to 0.001. */
  threshold?: number;
}

/**
 * Measures how many frames a spring animation takes to settle.
 *
 * This is useful for:
 * - Determining the duration of a Sequence containing spring animations
 * - Setting Loop durationInFrames to match spring completion
 * - Calculating total video duration with springs
 *
 * Usage:
 *   const frames = measureSpring({ fps: 30 });
 *   const frames = measureSpring({ fps: 30, mass: 0.5, stiffness: 200 });
 *
 * @param {MeasureSpringOptions} options
 * @param {number} options.fps - Frames per second (required)
 * @param {number} [options.mass=1] - Controls animation speed (lower = faster)
 * @param {number} [options.stiffness=100] - Bounciness (higher = more bounce)
 * @param {number} [options.damping=10] - Deceleration (higher = less bounce)
 * @param {number} [options.threshold=0.001] - How close to final value to consider "settled"
 * @returns {number} Number of frames until the spring settles
 */
export function measureSpring(options: MeasureSpringOptions): number {
  const {
    fps,
    mass = 1,
    stiffness = 100,
    damping = 10,
    threshold = 0.001,
  } = options;

  if (!fps || fps <= 0) {
    throw new Error('measureSpring requires a positive fps value');
  }

  // Calculate spring physics parameters
  const omega0: number = Math.sqrt(stiffness / mass); // Natural frequency
  const zeta: number = damping / (2 * Math.sqrt(stiffness * mass)); // Damping ratio

  // Maximum time to search (10 seconds should be enough for any reasonable spring)
  const maxTime: number = 10;
  const maxFrames: number = Math.ceil(maxTime * fps);

  // Simulate the spring frame by frame
  for (let frame = 1; frame <= maxFrames; frame++) {
    const t: number = frame / fps;
    let displacement: number;

    if (zeta < 1) {
      // Underdamped (oscillates)
      const omegaD: number = omega0 * Math.sqrt(1 - zeta * zeta);
      displacement = Math.exp(-zeta * omega0 * t) *
        (Math.cos(omegaD * t) + (zeta * omega0 / omegaD) * Math.sin(omegaD * t));
    } else if (zeta === 1) {
      // Critically damped
      displacement = Math.exp(-omega0 * t) * (1 + omega0 * t);
    } else {
      // Overdamped
      const s1: number = -omega0 * (zeta - Math.sqrt(zeta * zeta - 1));
      const s2: number = -omega0 * (zeta + Math.sqrt(zeta * zeta - 1));
      displacement = (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s2 - s1);
    }

    // Check if we've settled (displacement from target is below threshold)
    if (Math.abs(displacement) < threshold) {
      return frame;
    }
  }

  // If we didn't settle within maxFrames, return maxFrames
  // This shouldn't happen with reasonable spring parameters
  return maxFrames;
}

/**
 * Calculate the natural frequency of a spring.
 *
 * @param {number} stiffness
 * @param {number} mass
 * @returns {number} Natural frequency in radians per second
 */
export function springNaturalFrequency(stiffness: number, mass: number): number {
  return Math.sqrt(stiffness / mass);
}

/**
 * Calculate the damping ratio of a spring.
 *
 * - zeta < 1: Underdamped (oscillates)
 * - zeta = 1: Critically damped (fastest without oscillation)
 * - zeta > 1: Overdamped (slow, no oscillation)
 *
 * @param {number} damping
 * @param {number} stiffness
 * @param {number} mass
 * @returns {number} Damping ratio
 */
export function springDampingRatio(damping: number, stiffness: number, mass: number): number {
  return damping / (2 * Math.sqrt(stiffness * mass));
}

/**
 * Get spring configuration presets.
 *
 * Usage:
 *   const config = springPresets.gentle;
 *   spring(frame, { ...config, from: 0, to: 100 });
 */
export const springPresets: Record<string, SpringPreset> = {
  // Quick and snappy
  snappy: { mass: 1, stiffness: 400, damping: 30 },

  // Gentle, slow movement
  gentle: { mass: 1, stiffness: 100, damping: 15 },

  // Bouncy, playful
  bouncy: { mass: 1, stiffness: 200, damping: 10 },

  // Stiff, minimal overshoot
  stiff: { mass: 1, stiffness: 300, damping: 25 },

  // Slow, heavy feeling
  slow: { mass: 2, stiffness: 100, damping: 20 },

  // Default (matches Remotion)
  default: { mass: 1, stiffness: 100, damping: 10 },
};

export default measureSpring;
