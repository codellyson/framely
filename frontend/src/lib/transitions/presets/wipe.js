/**
 * Wipe Transition
 *
 * Reveals the new scene by "wiping" away the old one using clip-path.
 *
 * Usage:
 *   <TransitionSeries.Transition
 *     presentation={wipe()}
 *     timing={{ durationInFrames: 30 }}
 *   />
 *
 *   // Wipe from top
 *   <TransitionSeries.Transition
 *     presentation={wipe({ direction: 'from-top' })}
 *     timing={{ durationInFrames: 30 }}
 *   />
 */

import { Easing } from '../../Easing';

/**
 * Wipe directions.
 * @typedef {'from-left' | 'from-right' | 'from-top' | 'from-bottom' | 'clock' | 'counterclock'} WipeDirection
 */

/**
 * Create a wipe transition presentation.
 *
 * @param {object} [options]
 * @param {WipeDirection} [options.direction='from-left'] - Direction of the wipe
 * @param {function} [options.easing] - Easing function
 * @returns {{ entering: function, exiting: function }}
 */
export function wipe(options = {}) {
  const {
    direction = 'from-left',
    easing = Easing.easeInOut,
  } = options;

  const getClipPath = (progress, isEntering) => {
    const p = easing(progress) * 100;

    switch (direction) {
      case 'from-left':
        return isEntering
          ? `inset(0 ${100 - p}% 0 0)`
          : `inset(0 0 0 ${p}%)`;

      case 'from-right':
        return isEntering
          ? `inset(0 0 0 ${100 - p}%)`
          : `inset(0 ${p}% 0 0)`;

      case 'from-top':
        return isEntering
          ? `inset(0 0 ${100 - p}% 0)`
          : `inset(${p}% 0 0 0)`;

      case 'from-bottom':
        return isEntering
          ? `inset(${100 - p}% 0 0 0)`
          : `inset(0 0 ${p}% 0)`;

      case 'clock':
        // Circular wipe clockwise
        return isEntering
          ? `circle(${p}% at 50% 50%)`
          : `circle(${100 - p}% at 50% 50%)`;

      case 'counterclock':
        // Circular wipe counter-clockwise (same as clock visually)
        return isEntering
          ? `circle(${p}% at 50% 50%)`
          : `circle(${100 - p}% at 50% 50%)`;

      default:
        return isEntering
          ? `inset(0 ${100 - p}% 0 0)`
          : `inset(0 0 0 ${p}%)`;
    }
  };

  return {
    entering: (progress) => ({
      clipPath: getClipPath(progress, true),
    }),

    exiting: (progress) => ({
      clipPath: getClipPath(progress, false),
    }),
  };
}

/**
 * Wipe from left to right.
 */
export function wipeLeft(options = {}) {
  return wipe({ ...options, direction: 'from-left' });
}

/**
 * Wipe from right to left.
 */
export function wipeRight(options = {}) {
  return wipe({ ...options, direction: 'from-right' });
}

/**
 * Wipe from top to bottom.
 */
export function wipeTop(options = {}) {
  return wipe({ ...options, direction: 'from-top' });
}

/**
 * Wipe from bottom to top.
 */
export function wipeBottom(options = {}) {
  return wipe({ ...options, direction: 'from-bottom' });
}

/**
 * Circular wipe (iris) from center.
 */
export function iris(options = {}) {
  return wipe({ ...options, direction: 'clock' });
}

/**
 * Diagonal wipe using polygon clip-path.
 *
 * @param {object} [options]
 * @param {'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'} [options.corner='top-left']
 * @param {function} [options.easing]
 */
export function diagonalWipe(options = {}) {
  const {
    corner = 'top-left',
    easing = Easing.easeInOut,
  } = options;

  const getPolygon = (progress, isEntering) => {
    const p = easing(progress) * 200; // 200% to ensure full coverage

    switch (corner) {
      case 'top-left':
        return isEntering
          ? `polygon(0 0, ${p}% 0, 0 ${p}%)`
          : `polygon(${100 - p}% 100%, 100% 100%, 100% ${100 - p}%)`;

      case 'top-right':
        return isEntering
          ? `polygon(100% 0, ${100 - p}% 0, 100% ${p}%)`
          : `polygon(0 100%, ${p}% 100%, 0 ${100 - p}%)`;

      case 'bottom-left':
        return isEntering
          ? `polygon(0 100%, ${p}% 100%, 0 ${100 - p}%)`
          : `polygon(${100 - p}% 0, 100% 0, 100% ${p}%)`;

      case 'bottom-right':
        return isEntering
          ? `polygon(100% 100%, ${100 - p}% 100%, 100% ${100 - p}%)`
          : `polygon(0 0, ${p}% 0, 0 ${p}%)`;

      default:
        return 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
    }
  };

  return {
    entering: (progress) => ({
      clipPath: getPolygon(progress, true),
    }),

    exiting: (progress) => ({
      clipPath: getPolygon(progress, false),
    }),
  };
}

export default wipe;
