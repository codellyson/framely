/**
 * Zoom Transition
 *
 * Scale-based transition that zooms scenes in and out.
 *
 * Usage:
 *   <TransitionSeries.Transition
 *     presentation={zoom()}
 *     timing={{ durationInFrames: 30 }}
 *   />
 *
 *   // Zoom out on exit
 *   <TransitionSeries.Transition
 *     presentation={zoom({ exitDirection: 'out' })}
 *     timing={{ durationInFrames: 30 }}
 *   />
 */

import { Easing } from '../../Easing';

/**
 * Create a zoom transition presentation.
 *
 * @param {object} [options]
 * @param {'in' | 'out'} [options.enterDirection='in'] - Zoom in or out when entering
 * @param {'in' | 'out'} [options.exitDirection='in'] - Zoom in or out when exiting
 * @param {number} [options.scale=0.5] - Starting/ending scale factor
 * @param {boolean} [options.withFade=true] - Combine with opacity fade
 * @param {function} [options.easing] - Easing function
 * @returns {{ entering: function, exiting: function }}
 */
export function zoom(options = {}) {
  const {
    enterDirection = 'in',
    exitDirection = 'in',
    scale = 0.5,
    withFade = true,
    easing = Easing.easeOutCubic,
  } = options;

  return {
    entering: (progress) => {
      const easedProgress = easing(progress);

      let scaleValue;
      if (enterDirection === 'in') {
        // Start small, zoom in to full size
        scaleValue = scale + (1 - scale) * easedProgress;
      } else {
        // Start large, zoom out to full size
        scaleValue = (2 - scale) - (1 - scale) * easedProgress;
      }

      return {
        transform: `scale(${scaleValue})`,
        ...(withFade ? { opacity: easedProgress } : {}),
      };
    },

    exiting: (progress) => {
      const easedProgress = easing(progress);

      let scaleValue;
      if (exitDirection === 'in') {
        // Zoom in and fade out
        scaleValue = 1 + (1 - scale) * easedProgress;
      } else {
        // Zoom out and fade out
        scaleValue = 1 - (1 - scale) * easedProgress;
      }

      return {
        transform: `scale(${scaleValue})`,
        ...(withFade ? { opacity: 1 - easedProgress } : {}),
      };
    },
  };
}

/**
 * Zoom in on enter, zoom out on exit.
 */
export function zoomInOut(options = {}) {
  return zoom({ ...options, enterDirection: 'in', exitDirection: 'out' });
}

/**
 * Zoom out on enter, zoom in on exit.
 */
export function zoomOutIn(options = {}) {
  return zoom({ ...options, enterDirection: 'out', exitDirection: 'in' });
}

/**
 * Ken Burns style zoom - subtle zoom during the entire sequence.
 * Note: This is different from a transition, it's an effect.
 *
 * @param {object} [options]
 * @param {number} [options.startScale=1] - Starting scale
 * @param {number} [options.endScale=1.1] - Ending scale
 * @param {string} [options.origin='center'] - Transform origin
 */
export function kenBurns(options = {}) {
  const {
    startScale = 1,
    endScale = 1.1,
    origin = 'center',
  } = options;

  // This returns a style generator for use with interpolate
  return (progress) => ({
    transform: `scale(${startScale + (endScale - startScale) * progress})`,
    transformOrigin: origin,
  });
}

/**
 * Zoom with rotation.
 *
 * @param {object} [options]
 * @param {number} [options.scale=0.5] - Scale factor
 * @param {number} [options.rotation=90] - Rotation in degrees
 * @param {boolean} [options.withFade=true] - Include opacity fade
 * @param {function} [options.easing] - Easing function
 */
export function zoomRotate(options = {}) {
  const {
    scale = 0.5,
    rotation = 90,
    withFade = true,
    easing = Easing.easeOutBack,
  } = options;

  return {
    entering: (progress) => {
      const easedProgress = easing(progress);
      const scaleValue = scale + (1 - scale) * easedProgress;
      const rotateValue = rotation * (1 - easedProgress);

      return {
        transform: `scale(${scaleValue}) rotate(${rotateValue}deg)`,
        ...(withFade ? { opacity: easedProgress } : {}),
      };
    },

    exiting: (progress) => {
      const easedProgress = easing(progress);
      const scaleValue = 1 - (1 - scale) * easedProgress;
      const rotateValue = -rotation * easedProgress;

      return {
        transform: `scale(${scaleValue}) rotate(${rotateValue}deg)`,
        ...(withFade ? { opacity: 1 - easedProgress } : {}),
      };
    },
  };
}

export default zoom;
