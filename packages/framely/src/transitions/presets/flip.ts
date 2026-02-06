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

import { Easing, EasingFunction } from '../../Easing';

export type FlipDirection = 'horizontal' | 'vertical';
export type CardFlipDirection = 'left' | 'right' | 'up' | 'down';
export type CubeDirection = 'left' | 'right' | 'up' | 'down';
export type DoorSide = 'left' | 'right';

export interface TransitionPresentation {
  style: React.CSSProperties;
  transform?: string;
}

export interface FlipOptions {
  direction?: FlipDirection;
  perspective?: number;
  easing?: EasingFunction;
}

export interface CardFlipOptions {
  flipDirection?: CardFlipDirection;
  perspective?: number;
  easing?: EasingFunction;
}

export interface CubeOptions {
  direction?: CubeDirection;
  perspective?: number;
  easing?: EasingFunction;
}

export interface DoorOptions {
  side?: DoorSide;
  perspective?: number;
  easing?: EasingFunction;
}

export interface FlipTransitionStyle {
  transform: string;
  backfaceVisibility: string;
  opacity?: number;
  transformStyle?: string;
  transformOrigin?: string;
}

export interface FlipTransitionResult {
  entering: (progress: number) => FlipTransitionStyle;
  exiting: (progress: number) => FlipTransitionStyle;
}

export interface CubeTransitionStyle {
  transform: string;
  transformOrigin: string;
}

export interface CubeTransitionResult {
  entering: (progress: number) => CubeTransitionStyle;
  exiting: (progress: number) => CubeTransitionStyle;
}

export interface DoorTransitionStyle {
  transform: string;
  transformOrigin: string;
}

export interface DoorTransitionResult {
  entering: (progress: number) => DoorTransitionStyle;
  exiting: (progress: number) => DoorTransitionStyle;
}

/**
 * Create a flip transition presentation.
 */
export function flip(options: FlipOptions = {}): FlipTransitionResult {
  const {
    direction = 'horizontal',
    perspective = 1000,
    easing = Easing.easeInOutCubic,
  } = options;

  const axis: string = direction === 'horizontal' ? 'Y' : 'X';

  return {
    entering: (progress: number): FlipTransitionStyle => {
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

    exiting: (progress: number): FlipTransitionStyle => {
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
export function flipHorizontal(options: Omit<FlipOptions, 'direction'> = {}): FlipTransitionResult {
  return flip({ ...options, direction: 'horizontal' });
}

/**
 * Vertical flip (around X axis).
 */
export function flipVertical(options: Omit<FlipOptions, 'direction'> = {}): FlipTransitionResult {
  return flip({ ...options, direction: 'vertical' });
}

/**
 * Card flip - like flipping a playing card.
 */
export function cardFlip(options: CardFlipOptions = {}): FlipTransitionResult {
  const {
    flipDirection = 'left',
    perspective = 1000,
    easing = Easing.easeInOut,
  } = options;

  const isHorizontal: boolean = flipDirection === 'left' || flipDirection === 'right';
  const isNegative: boolean = flipDirection === 'left' || flipDirection === 'up';
  const axis: string = isHorizontal ? 'Y' : 'X';
  const sign: number = isNegative ? 1 : -1;

  return {
    entering: (progress: number): FlipTransitionStyle => {
      const easedProgress = easing(progress);
      const rotation: number = sign * (180 - 180 * easedProgress);

      return {
        transform: `perspective(${perspective}px) rotate${axis}(${rotation}deg)`,
        backfaceVisibility: 'hidden',
        transformStyle: 'preserve-3d',
      };
    },

    exiting: (progress: number): FlipTransitionStyle => {
      const easedProgress = easing(progress);
      const rotation: number = sign * 180 * easedProgress;

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
 */
export function cube(options: CubeOptions = {}): CubeTransitionResult {
  const {
    direction = 'left',
    perspective = 1000,
    easing = Easing.easeInOutCubic,
  } = options;

  const isHorizontal: boolean = direction === 'left' || direction === 'right';
  const isNegative: boolean = direction === 'left' || direction === 'up';
  const axis: string = isHorizontal ? 'Y' : 'X';
  const sign: number = isNegative ? 1 : -1;

  return {
    entering: (progress: number): CubeTransitionStyle => {
      const easedProgress = easing(progress);
      const rotation: number = sign * (-90 + 90 * easedProgress);
      const translate: string = isHorizontal ? 'translateZ' : 'translateZ';

      return {
        transform: `perspective(${perspective}px) rotate${axis}(${rotation}deg) ${translate}(${50 * (1 - easedProgress)}%)`,
        transformOrigin: isHorizontal
          ? (isNegative ? 'left center' : 'right center')
          : (isNegative ? 'center top' : 'center bottom'),
      };
    },

    exiting: (progress: number): CubeTransitionStyle => {
      const easedProgress = easing(progress);
      const rotation: number = sign * 90 * easedProgress;
      const translate: string = isHorizontal ? 'translateZ' : 'translateZ';

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
 */
export function door(options: DoorOptions = {}): DoorTransitionResult {
  const {
    side = 'left',
    perspective = 1000,
    easing = Easing.easeOut,
  } = options;

  const sign: number = side === 'left' ? 1 : -1;
  const origin: string = side === 'left' ? 'left center' : 'right center';

  return {
    entering: (progress: number): DoorTransitionStyle => {
      const easedProgress = easing(progress);
      const rotation: number = sign * (-90 + 90 * easedProgress);

      return {
        transform: `perspective(${perspective}px) rotateY(${rotation}deg)`,
        transformOrigin: origin,
      };
    },

    exiting: (progress: number): DoorTransitionStyle => {
      const easedProgress = easing(progress);
      const rotation: number = sign * 90 * easedProgress;

      return {
        transform: `perspective(${perspective}px) rotateY(${rotation}deg)`,
        transformOrigin: origin,
      };
    },
  };
}

export default flip;
