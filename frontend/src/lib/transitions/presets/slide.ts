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

import { Easing, EasingFunction } from '../../Easing';

export type SlideDirection = 'from-left' | 'from-right' | 'from-top' | 'from-bottom';

export interface TransitionPresentation {
  style: React.CSSProperties;
  transform?: string;
}

export interface SlideOptions {
  direction?: SlideDirection;
  exitOpposite?: boolean;
  easing?: EasingFunction;
}

export interface TransitionStyle {
  transform: string;
}

export interface TransitionResult {
  entering: (progress: number) => TransitionStyle;
  exiting: (progress: number) => TransitionStyle;
}

/**
 * Create a slide transition presentation.
 */
export function slide(options: SlideOptions = {}): TransitionResult {
  const {
    direction = 'from-right',
    exitOpposite = true,
    easing = Easing.easeInOutCubic,
  } = options;

  // Calculate enter transform based on direction
  const getEnterTransform = (progress: number): string => {
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
  const getExitTransform = (progress: number): string => {
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
    entering: (progress: number): TransitionStyle => ({
      transform: getEnterTransform(progress),
    }),

    exiting: (progress: number): TransitionStyle => ({
      transform: getExitTransform(progress),
    }),
  };
}

/**
 * Slide from left.
 */
export function slideFromLeft(options: Omit<SlideOptions, 'direction'> = {}): TransitionResult {
  return slide({ ...options, direction: 'from-left' });
}

/**
 * Slide from right.
 */
export function slideFromRight(options: Omit<SlideOptions, 'direction'> = {}): TransitionResult {
  return slide({ ...options, direction: 'from-right' });
}

/**
 * Slide from top.
 */
export function slideFromTop(options: Omit<SlideOptions, 'direction'> = {}): TransitionResult {
  return slide({ ...options, direction: 'from-top' });
}

/**
 * Slide from bottom.
 */
export function slideFromBottom(options: Omit<SlideOptions, 'direction'> = {}): TransitionResult {
  return slide({ ...options, direction: 'from-bottom' });
}

/**
 * Push transition - both scenes move in the same direction.
 */
export function push(options: Omit<SlideOptions, 'exitOpposite'> = {}): TransitionResult {
  return slide({ ...options, exitOpposite: false });
}

export default slide;
