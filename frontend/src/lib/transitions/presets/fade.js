/**
 * Fade Transition
 *
 * Simple opacity-based transition between scenes.
 *
 * Usage:
 *   <TransitionSeries.Transition
 *     presentation={fade()}
 *     timing={{ durationInFrames: 30 }}
 *   />
 *
 *   // With custom options
 *   <TransitionSeries.Transition
 *     presentation={fade({ enterStyle: 'in', exitStyle: 'out' })}
 *     timing={{ durationInFrames: 30 }}
 *   />
 */

import { Easing } from '../../Easing';

/**
 * Create a fade transition presentation.
 *
 * @param {object} [options]
 * @param {'in' | 'out' | 'both'} [options.enterStyle='in'] - How entering scene fades
 * @param {'in' | 'out' | 'both'} [options.exitStyle='out'] - How exiting scene fades
 * @param {function} [options.easing] - Easing function for the transition
 * @returns {{ entering: function, exiting: function }}
 */
export function fade(options = {}) {
  const {
    enterStyle = 'in',
    exitStyle = 'out',
    easing = Easing.ease,
  } = options;

  return {
    entering: (progress) => {
      const easedProgress = easing(progress);

      if (enterStyle === 'in') {
        return { opacity: easedProgress };
      }
      if (enterStyle === 'out') {
        return { opacity: 1 - easedProgress };
      }
      // both - crossfade
      return { opacity: easedProgress };
    },

    exiting: (progress) => {
      const easedProgress = easing(progress);

      if (exitStyle === 'out') {
        return { opacity: 1 - easedProgress };
      }
      if (exitStyle === 'in') {
        return { opacity: easedProgress };
      }
      // both - crossfade
      return { opacity: 1 - easedProgress };
    },
  };
}

/**
 * Crossfade - both scenes fade simultaneously.
 */
export function crossfade(options = {}) {
  return fade({ ...options, enterStyle: 'both', exitStyle: 'both' });
}

export default fade;
