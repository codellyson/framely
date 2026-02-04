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

import { Easing, EasingFunction } from '../../Easing';

export type ZoomDirection = 'in' | 'out';

export interface TransitionPresentation {
  style: React.CSSProperties;
  transform?: string;
}

export interface ZoomOptions {
  enterDirection?: ZoomDirection;
  exitDirection?: ZoomDirection;
  scale?: number;
  withFade?: boolean;
  easing?: EasingFunction;
}

export interface KenBurnsOptions {
  startScale?: number;
  endScale?: number;
  origin?: string;
}

export interface ZoomRotateOptions {
  scale?: number;
  rotation?: number;
  withFade?: boolean;
  easing?: EasingFunction;
}

export interface ZoomTransitionStyle {
  transform: string;
  opacity?: number;
}

export interface ZoomTransitionResult {
  entering: (progress: number) => ZoomTransitionStyle;
  exiting: (progress: number) => ZoomTransitionStyle;
}

export interface KenBurnsStyle {
  transform: string;
  transformOrigin: string;
}

/**
 * Create a zoom transition presentation.
 */
export function zoom(options: ZoomOptions = {}): ZoomTransitionResult {
  const {
    enterDirection = 'in',
    exitDirection = 'in',
    scale = 0.5,
    withFade = true,
    easing = Easing.easeOutCubic,
  } = options;

  return {
    entering: (progress: number): ZoomTransitionStyle => {
      const easedProgress = easing(progress);

      let scaleValue: number;
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

    exiting: (progress: number): ZoomTransitionStyle => {
      const easedProgress = easing(progress);

      let scaleValue: number;
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
export function zoomInOut(options: Omit<ZoomOptions, 'enterDirection' | 'exitDirection'> = {}): ZoomTransitionResult {
  return zoom({ ...options, enterDirection: 'in', exitDirection: 'out' });
}

/**
 * Zoom out on enter, zoom in on exit.
 */
export function zoomOutIn(options: Omit<ZoomOptions, 'enterDirection' | 'exitDirection'> = {}): ZoomTransitionResult {
  return zoom({ ...options, enterDirection: 'out', exitDirection: 'in' });
}

/**
 * Ken Burns style zoom - subtle zoom during the entire sequence.
 * Note: This is different from a transition, it's an effect.
 */
export function kenBurns(options: KenBurnsOptions = {}): (progress: number) => KenBurnsStyle {
  const {
    startScale = 1,
    endScale = 1.1,
    origin = 'center',
  } = options;

  // This returns a style generator for use with interpolate
  return (progress: number): KenBurnsStyle => ({
    transform: `scale(${startScale + (endScale - startScale) * progress})`,
    transformOrigin: origin,
  });
}

/**
 * Zoom with rotation.
 */
export function zoomRotate(options: ZoomRotateOptions = {}): ZoomTransitionResult {
  const {
    scale = 0.5,
    rotation = 90,
    withFade = true,
    easing = Easing.easeOutBack,
  } = options;

  return {
    entering: (progress: number): ZoomTransitionStyle => {
      const easedProgress = easing(progress);
      const scaleValue: number = scale + (1 - scale) * easedProgress;
      const rotateValue: number = rotation * (1 - easedProgress);

      return {
        transform: `scale(${scaleValue}) rotate(${rotateValue}deg)`,
        ...(withFade ? { opacity: easedProgress } : {}),
      };
    },

    exiting: (progress: number): ZoomTransitionStyle => {
      const easedProgress = easing(progress);
      const scaleValue: number = 1 - (1 - scale) * easedProgress;
      const rotateValue: number = -rotation * easedProgress;

      return {
        transform: `scale(${scaleValue}) rotate(${rotateValue}deg)`,
        ...(withFade ? { opacity: 1 - easedProgress } : {}),
      };
    },
  };
}

export default zoom;
