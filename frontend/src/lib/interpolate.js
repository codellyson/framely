import { Easing } from './Easing';

// Re-export Easing for convenience
export { Easing };

/**
 * Maps a value from one range to another, with optional easing and extrapolation.
 *
 * This is the core animation primitive in Framely. Use it to convert frame numbers
 * into animation values like opacity, position, scale, etc.
 *
 * Usage:
 *   interpolate(frame, [0, 30], [0, 1])                     // linear fade-in over 30 frames
 *   interpolate(frame, [0, 30], [0, 1], { easing: Easing.easeOut })
 *   interpolate(frame, [0, 30, 60], [0, 1, 0])              // multi-segment: fade in then out
 *   interpolate(frame, [0, 30], [0, 100], { extrapolateRight: 'extend' })
 *
 * @param {number} value - The input value (usually the current frame)
 * @param {number[]} inputRange - Array of ascending input breakpoints
 * @param {number[]} outputRange - Corresponding output values
 * @param {object} [options]
 * @param {'extend'|'clamp'|'wrap'|'identity'} [options.extrapolateLeft='clamp']
 *   - 'clamp': Return outputRange[0] for values below inputRange[0]
 *   - 'extend': Continue interpolating beyond the range
 *   - 'wrap': Loop the value change (useful for cyclic animations)
 *   - 'identity': Return the input value unchanged
 * @param {'extend'|'clamp'|'wrap'|'identity'} [options.extrapolateRight='clamp']
 *   Same options as extrapolateLeft, for values above the range
 * @param {function} [options.easing=Easing.linear] - Easing function to apply
 * @returns {number}
 */
export function interpolate(
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

  // Validate ranges are ascending
  for (let i = 1; i < inputRange.length; i++) {
    if (inputRange[i] < inputRange[i - 1]) {
      throw new Error('inputRange must be monotonically increasing');
    }
  }

  // Find which segment we're in
  let segIndex = 0;
  for (let i = 1; i < inputRange.length; i++) {
    if (value >= inputRange[i - 1]) {
      segIndex = i - 1;
    }
  }

  const inputMin = inputRange[segIndex];
  const inputMax = inputRange[segIndex + 1] ?? inputRange[segIndex];
  const outputMin = outputRange[segIndex];
  const outputMax = outputRange[segIndex + 1] ?? outputRange[segIndex];

  // Calculate progress within this segment (0 to 1)
  let progress;
  if (inputMax === inputMin) {
    progress = 0;
  } else {
    progress = (value - inputMin) / (inputMax - inputMin);
  }

  // Handle extrapolation
  const handleExtrapolation = (progress, direction) => {
    const extrapolate = direction === 'left' ? extrapolateLeft : extrapolateRight;

    switch (extrapolate) {
      case 'clamp':
        return Math.max(0, Math.min(1, progress));
      case 'extend':
        return progress; // Allow values outside 0-1
      case 'wrap':
        // Wrap progress to 0-1 range
        const wrapped = progress % 1;
        return wrapped < 0 ? wrapped + 1 : wrapped;
      case 'identity':
        // Return the original input value
        return null; // Signal to return identity
      default:
        return progress;
    }
  };

  // Check if we're outside the range
  if (progress < 0) {
    if (extrapolateLeft === 'identity') {
      return value;
    }
    progress = handleExtrapolation(progress, 'left');
  } else if (progress > 1) {
    if (extrapolateRight === 'identity') {
      return value;
    }
    progress = handleExtrapolation(progress, 'right');
  }

  // Apply easing only to the 0-1 range
  const easedProgress =
    progress < 0 || progress > 1 ? progress : easing(progress);

  return outputMin + easedProgress * (outputMax - outputMin);
}

/**
 * Spring-based interpolation with physics-based easing.
 *
 * Creates smooth, natural-feeling animations that overshoot and settle.
 *
 * @param {number} frame - Current frame number
 * @param {object} options
 * @param {number} [options.from=0] - Starting value
 * @param {number} [options.to=1] - Ending value
 * @param {number} [options.fps=30] - Frames per second
 * @param {number} [options.delay=0] - Frames to wait before starting
 * @param {number} [options.mass=1] - Controls animation speed (lower = faster)
 * @param {number} [options.stiffness=100] - Bounciness (higher = more bounce)
 * @param {number} [options.damping=10] - Deceleration (higher = less bounce)
 * @param {boolean} [options.overshootClamping=false] - Prevent exceeding target
 * @returns {number}
 */
export function spring(frame, options = {}) {
  const {
    from = 0,
    to = 1,
    fps = 30,
    delay = 0,
    mass = 1,
    stiffness = 100,
    damping = 10,
    overshootClamping = false,
  } = options;

  const f = frame - delay;
  if (f < 0) return from;

  // Calculate spring physics
  // Using a simplified damped harmonic oscillator model
  const omega0 = Math.sqrt(stiffness / mass); // Natural frequency
  const zeta = damping / (2 * Math.sqrt(stiffness * mass)); // Damping ratio
  const t = f / fps; // Time in seconds

  let progress;

  if (zeta < 1) {
    // Underdamped (oscillates)
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    progress = 1 - Math.exp(-zeta * omega0 * t) *
      (Math.cos(omegaD * t) + (zeta * omega0 / omegaD) * Math.sin(omegaD * t));
  } else if (zeta === 1) {
    // Critically damped (fastest without oscillation)
    progress = 1 - Math.exp(-omega0 * t) * (1 + omega0 * t);
  } else {
    // Overdamped (slow return)
    const s1 = -omega0 * (zeta - Math.sqrt(zeta * zeta - 1));
    const s2 = -omega0 * (zeta + Math.sqrt(zeta * zeta - 1));
    progress = 1 - (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s2 - s1);
  }

  // Clamp overshoot if requested
  if (overshootClamping) {
    progress = Math.max(0, Math.min(1, progress));
  }

  return from + (to - from) * progress;
}

export default { interpolate, spring, Easing };
