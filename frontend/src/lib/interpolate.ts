import { Easing, type EasingFunction } from './Easing';

export { Easing };

export type ExtrapolationType = 'extend' | 'clamp' | 'wrap' | 'identity';

export interface InterpolateOptions {
  easing?: EasingFunction;
  extrapolateLeft?: ExtrapolationType;
  extrapolateRight?: ExtrapolationType;
}

export interface SpringOptions {
  from?: number;
  to?: number;
  fps?: number;
  delay?: number;
  mass?: number;
  stiffness?: number;
  damping?: number;
  overshootClamping?: boolean;
}

/**
 * Maps a value from one range to another, with optional easing and extrapolation.
 */
export function interpolate(
  value: number,
  inputRange: readonly number[],
  outputRange: readonly number[],
  options: InterpolateOptions = {},
): number {
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
  let progress: number;
  if (inputMax === inputMin) {
    progress = 0;
  } else {
    progress = (value - inputMin) / (inputMax - inputMin);
  }

  // Handle extrapolation
  const handleExtrapolation = (p: number, direction: 'left' | 'right'): number | null => {
    const extrapolate = direction === 'left' ? extrapolateLeft : extrapolateRight;

    switch (extrapolate) {
      case 'clamp':
        return Math.max(0, Math.min(1, p));
      case 'extend':
        return p;
      case 'wrap': {
        const wrapped = p % 1;
        return wrapped < 0 ? wrapped + 1 : wrapped;
      }
      case 'identity':
        return null;
      default:
        return p;
    }
  };

  // Check if we're outside the range
  if (progress < 0) {
    if (extrapolateLeft === 'identity') {
      return value;
    }
    progress = handleExtrapolation(progress, 'left') ?? progress;
  } else if (progress > 1) {
    if (extrapolateRight === 'identity') {
      return value;
    }
    progress = handleExtrapolation(progress, 'right') ?? progress;
  }

  // Apply easing only to the 0-1 range
  const easedProgress =
    progress < 0 || progress > 1 ? progress : easing(progress);

  return outputMin + easedProgress * (outputMax - outputMin);
}

/**
 * Spring-based interpolation with physics-based easing.
 */
export function spring(frame: number, options: SpringOptions = {}): number {
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

  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const t = f / fps;

  let progress: number;

  if (zeta < 1) {
    // Underdamped (oscillates)
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    progress = 1 - Math.exp(-zeta * omega0 * t) *
      (Math.cos(omegaD * t) + (zeta * omega0 / omegaD) * Math.sin(omegaD * t));
  } else if (zeta === 1) {
    // Critically damped
    progress = 1 - Math.exp(-omega0 * t) * (1 + omega0 * t);
  } else {
    // Overdamped
    const s1 = -omega0 * (zeta - Math.sqrt(zeta * zeta - 1));
    const s2 = -omega0 * (zeta + Math.sqrt(zeta * zeta - 1));
    progress = 1 - (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s2 - s1);
  }

  if (overshootClamping) {
    progress = Math.max(0, Math.min(1, progress));
  }

  return from + (to - from) * progress;
}

export default { interpolate, spring, Easing };
