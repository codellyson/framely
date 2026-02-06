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

import { Easing, EasingFunction } from '../../Easing';

export type WipeDirection = 'from-left' | 'from-right' | 'from-top' | 'from-bottom' | 'clock' | 'counterclock';
export type DiagonalCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface TransitionPresentation {
  style: React.CSSProperties;
  transform?: string;
}

export interface WipeOptions {
  direction?: WipeDirection;
  easing?: EasingFunction;
}

export interface DiagonalWipeOptions {
  corner?: DiagonalCorner;
  easing?: EasingFunction;
}

export interface WipeTransitionStyle {
  clipPath: string;
}

export interface WipeTransitionResult {
  entering: (progress: number) => WipeTransitionStyle;
  exiting: (progress: number) => WipeTransitionStyle;
}

/**
 * Create a wipe transition presentation.
 */
export function wipe(options: WipeOptions = {}): WipeTransitionResult {
  const {
    direction = 'from-left',
    easing = Easing.easeInOut,
  } = options;

  const getClipPath = (progress: number, isEntering: boolean): string => {
    const p: number = easing(progress) * 100;

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
    entering: (progress: number): WipeTransitionStyle => ({
      clipPath: getClipPath(progress, true),
    }),

    exiting: (progress: number): WipeTransitionStyle => ({
      clipPath: getClipPath(progress, false),
    }),
  };
}

/**
 * Wipe from left to right.
 */
export function wipeLeft(options: Omit<WipeOptions, 'direction'> = {}): WipeTransitionResult {
  return wipe({ ...options, direction: 'from-left' });
}

/**
 * Wipe from right to left.
 */
export function wipeRight(options: Omit<WipeOptions, 'direction'> = {}): WipeTransitionResult {
  return wipe({ ...options, direction: 'from-right' });
}

/**
 * Wipe from top to bottom.
 */
export function wipeTop(options: Omit<WipeOptions, 'direction'> = {}): WipeTransitionResult {
  return wipe({ ...options, direction: 'from-top' });
}

/**
 * Wipe from bottom to top.
 */
export function wipeBottom(options: Omit<WipeOptions, 'direction'> = {}): WipeTransitionResult {
  return wipe({ ...options, direction: 'from-bottom' });
}

/**
 * Circular wipe (iris) from center.
 */
export function iris(options: Omit<WipeOptions, 'direction'> = {}): WipeTransitionResult {
  return wipe({ ...options, direction: 'clock' });
}

/**
 * Diagonal wipe using polygon clip-path.
 */
export function diagonalWipe(options: DiagonalWipeOptions = {}): WipeTransitionResult {
  const {
    corner = 'top-left',
    easing = Easing.easeInOut,
  } = options;

  const getPolygon = (progress: number, isEntering: boolean): string => {
    const p: number = easing(progress) * 200; // 200% to ensure full coverage

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
    entering: (progress: number): WipeTransitionStyle => ({
      clipPath: getPolygon(progress, true),
    }),

    exiting: (progress: number): WipeTransitionStyle => ({
      clipPath: getPolygon(progress, false),
    }),
  };
}

export default wipe;
