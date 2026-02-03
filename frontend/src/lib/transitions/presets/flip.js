/**
 * Flip Transition
 *
 * 3D flip/rotation transition between scenes.
 *
 * Usage:
 *   <TransitionSeries.Transition
 *     presentation={flip()}
 *     timing={{ durationInFrames: 30 }}
 *   />
 *
 *   // Flip vertically
 *   <TransitionSeries.Transition
 *     presentation={flip({ direction: 'vertical' })}
 *     timing={{ durationInFrames: 30 }}
 *   />
 */

import { Easing } from '../../Easing';

/**
 * Create a flip transition presentation.
 *
 * @param {object} [options]
 * @param {'horizontal' | 'vertical'} [options.direction='horizontal'] - Flip axis
 * @param {number} [options.perspective=1000] - 3D perspective value
 * @param {function} [options.easing] - Easing function
 * @returns {{ entering: function, exiting: function }}
 */
export function flip(options = {}) {
  const {
    direction = 'horizontal',
    perspective = 1000,
    easing = Easing.easeInOutCubic,
  } = options;

  const axis = direction === 'horizontal' ? 'Y' : 'X';

  return {
    entering: (progress) => {
      const easedProgress = easing(progress);
      // Start at -90 degrees (hidden), rotate to 0
      const rotation = -90 + 90 * easedProgress;

      return {
        transform: `perspective(${perspective}px) rotate${axis}(${rotation}deg)`,
        backfaceVisibility: 'hidden',
        // Only visible when rotation is past -90
        opacity: progress > 0.5 ? 1 : 0,
      };
    },

    exiting: (progress) => {
      const easedProgress = easing(progress);
      // Start at 0, rotate to 90 degrees (hidden)
      const rotation = 90 * easedProgress;

      return {
        transform: `perspective(${perspective}px) rotate${axis}(${rotation}deg)`,
        backfaceVisibility: 'hidden',
        // Only visible when rotation is before 90
        opacity: progress < 0.5 ? 1 : 0,
      };
    },
  };
}

/**
 * Horizontal flip (around Y axis).
 */
export function flipHorizontal(options = {}) {
  return flip({ ...options, direction: 'horizontal' });
}

/**
 * Vertical flip (around X axis).
 */
export function flipVertical(options = {}) {
  return flip({ ...options, direction: 'vertical' });
}

/**
 * Card flip - like flipping a playing card.
 *
 * @param {object} [options]
 * @param {'left' | 'right' | 'up' | 'down'} [options.flipDirection='left']
 * @param {number} [options.perspective=1000]
 * @param {function} [options.easing]
 */
export function cardFlip(options = {}) {
  const {
    flipDirection = 'left',
    perspective = 1000,
    easing = Easing.easeInOut,
  } = options;

  const isHorizontal = flipDirection === 'left' || flipDirection === 'right';
  const isNegative = flipDirection === 'left' || flipDirection === 'up';
  const axis = isHorizontal ? 'Y' : 'X';
  const sign = isNegative ? 1 : -1;

  return {
    entering: (progress) => {
      const easedProgress = easing(progress);
      const rotation = sign * (180 - 180 * easedProgress);

      return {
        transform: `perspective(${perspective}px) rotate${axis}(${rotation}deg)`,
        backfaceVisibility: 'hidden',
        transformStyle: 'preserve-3d',
      };
    },

    exiting: (progress) => {
      const easedProgress = easing(progress);
      const rotation = sign * 180 * easedProgress;

      return {
        transform: `perspective(${perspective}px) rotate${axis}(${rotation}deg)`,
        backfaceVisibility: 'hidden',
        transformStyle: 'preserve-3d',
      };
    },
  };
}

/**
 * Cube rotation - scenes appear on faces of a rotating cube.
 *
 * @param {object} [options]
 * @param {'left' | 'right' | 'up' | 'down'} [options.direction='left']
 * @param {number} [options.perspective=1000]
 * @param {function} [options.easing]
 */
export function cube(options = {}) {
  const {
    direction = 'left',
    perspective = 1000,
    easing = Easing.easeInOutCubic,
  } = options;

  const isHorizontal = direction === 'left' || direction === 'right';
  const isNegative = direction === 'left' || direction === 'up';
  const axis = isHorizontal ? 'Y' : 'X';
  const sign = isNegative ? 1 : -1;

  return {
    entering: (progress) => {
      const easedProgress = easing(progress);
      const rotation = sign * (-90 + 90 * easedProgress);
      const translate = isHorizontal ? 'translateZ' : 'translateZ';

      return {
        transform: `perspective(${perspective}px) rotate${axis}(${rotation}deg) ${translate}(${50 * (1 - easedProgress)}%)`,
        transformOrigin: isHorizontal
          ? (isNegative ? 'left center' : 'right center')
          : (isNegative ? 'center top' : 'center bottom'),
      };
    },

    exiting: (progress) => {
      const easedProgress = easing(progress);
      const rotation = sign * 90 * easedProgress;
      const translate = isHorizontal ? 'translateZ' : 'translateZ';

      return {
        transform: `perspective(${perspective}px) rotate${axis}(${rotation}deg) ${translate}(${50 * easedProgress}%)`,
        transformOrigin: isHorizontal
          ? (isNegative ? 'right center' : 'left center')
          : (isNegative ? 'center bottom' : 'center top'),
      };
    },
  };
}

/**
 * Door opening effect.
 *
 * @param {object} [options]
 * @param {'left' | 'right'} [options.side='left'] - Which side the "hinge" is on
 * @param {number} [options.perspective=1000]
 * @param {function} [options.easing]
 */
export function door(options = {}) {
  const {
    side = 'left',
    perspective = 1000,
    easing = Easing.easeOut,
  } = options;

  const sign = side === 'left' ? 1 : -1;
  const origin = side === 'left' ? 'left center' : 'right center';

  return {
    entering: (progress) => {
      const easedProgress = easing(progress);
      const rotation = sign * (-90 + 90 * easedProgress);

      return {
        transform: `perspective(${perspective}px) rotateY(${rotation}deg)`,
        transformOrigin: origin,
      };
    },

    exiting: (progress) => {
      const easedProgress = easing(progress);
      const rotation = sign * 90 * easedProgress;

      return {
        transform: `perspective(${perspective}px) rotateY(${rotation}deg)`,
        transformOrigin: origin,
      };
    },
  };
}

export default flip;
