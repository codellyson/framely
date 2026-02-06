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

import { Easing, EasingFunction } from '../../Easing';

export type FadeStyle = 'in' | 'out' | 'both';

export interface TransitionPresentation {
  style: React.CSSProperties;
  transform?: string;
}

export interface FadeOptions {
  enterStyle?: FadeStyle;
  exitStyle?: FadeStyle;
  easing?: EasingFunction;
}

export interface FadeTransitionStyle {
  opacity: number;
}

export interface FadeTransitionResult {
  entering: (progress: number) => FadeTransitionStyle;
  exiting: (progress: number) => FadeTransitionStyle;
}

/**
 * Create a fade transition presentation.
 */
export function fade(options: FadeOptions = {}): FadeTransitionResult {
  const {
    enterStyle = 'in',
    exitStyle = 'out',
    easing = Easing.ease,
  } = options;

  return {
    entering: (progress: number): FadeTransitionStyle => {
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

    exiting: (progress: number): FadeTransitionStyle => {
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
export function crossfade(options: Omit<FadeOptions, 'enterStyle' | 'exitStyle'> = {}): FadeTransitionResult {
  return fade({ ...options, enterStyle: 'both', exitStyle: 'both' });
}

export default fade;
