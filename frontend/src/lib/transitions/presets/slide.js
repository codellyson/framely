/**
 * Slide Transition
 *
 * Slide scenes in and out from different directions.
 *
 * Usage:
 *   <TransitionSeries.Transition
 *     presentation={slide()}
 *     timing={{ durationInFrames: 30 }}
 *   />
 *
 *   // Slide from bottom
 *   <TransitionSeries.Transition
 *     presentation={slide({ direction: 'from-bottom' })}
 *     timing={{ durationInFrames: 30 }}
 *   />
 */

import { Easing } from '../../Easing';

/**
 * Slide directions.
 * @typedef {'from-left' | 'from-right' | 'from-top' | 'from-bottom'} SlideDirection
 */

/**
 * Create a slide transition presentation.
 *
 * @param {object} [options]
 * @param {SlideDirection} [options.direction='from-right'] - Direction to slide from
 * @param {boolean} [options.exitOpposite=true] - Exit in opposite direction
 * @param {function} [options.easing] - Easing function
 * @returns {{ entering: function, exiting: function }}
 */
export function slide(options = {}) {
  const {
    direction = 'from-right',
    exitOpposite = true,
    easing = Easing.easeInOutCubic,
  } = options;

  // Calculate enter transform based on direction
  const getEnterTransform = (progress) => {
    const easedProgress = easing(progress);
    const offset = (1 - easedProgress) * 100;

    switch (direction) {
      case 'from-left':
        return `translateX(${-offset}%)`;
      case 'from-right':
        return `translateX(${offset}%)`;
      case 'from-top':
        return `translateY(${-offset}%)`;
      case 'from-bottom':
        return `translateY(${offset}%)`;
      default:
        return `translateX(${offset}%)`;
    }
  };

  // Calculate exit transform (opposite or same direction)
  const getExitTransform = (progress) => {
    const easedProgress = easing(progress);
    const offset = easedProgress * 100;

    if (exitOpposite) {
      // Exit in opposite direction
      switch (direction) {
        case 'from-left':
          return `translateX(${offset}%)`;
        case 'from-right':
          return `translateX(${-offset}%)`;
        case 'from-top':
          return `translateY(${offset}%)`;
        case 'from-bottom':
          return `translateY(${-offset}%)`;
        default:
          return `translateX(${-offset}%)`;
      }
    } else {
      // Exit in same direction (push effect)
      switch (direction) {
        case 'from-left':
          return `translateX(${-offset}%)`;
        case 'from-right':
          return `translateX(${offset}%)`;
        case 'from-top':
          return `translateY(${-offset}%)`;
        case 'from-bottom':
          return `translateY(${offset}%)`;
        default:
          return `translateX(${offset}%)`;
      }
    }
  };

  return {
    entering: (progress) => ({
      transform: getEnterTransform(progress),
    }),

    exiting: (progress) => ({
      transform: getExitTransform(progress),
    }),
  };
}

/**
 * Slide from left.
 */
export function slideFromLeft(options = {}) {
  return slide({ ...options, direction: 'from-left' });
}

/**
 * Slide from right.
 */
export function slideFromRight(options = {}) {
  return slide({ ...options, direction: 'from-right' });
}

/**
 * Slide from top.
 */
export function slideFromTop(options = {}) {
  return slide({ ...options, direction: 'from-top' });
}

/**
 * Slide from bottom.
 */
export function slideFromBottom(options = {}) {
  return slide({ ...options, direction: 'from-bottom' });
}

/**
 * Push transition - both scenes move in the same direction.
 */
export function push(options = {}) {
  return slide({ ...options, exitOpposite: false });
}

export default slide;
