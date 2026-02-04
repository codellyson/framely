/**
 * Transitions Package
 *
 * Provides TransitionSeries component and built-in transition presets.
 */

// Main component
export {
  default as TransitionSeries,
  useTransition,
  createPresentation,
  createTiming,
} from './TransitionSeries';

// Fade transitions
export { fade, crossfade } from './presets/fade';

// Slide transitions
export {
  slide,
  slideFromLeft,
  slideFromRight,
  slideFromTop,
  slideFromBottom,
  push,
} from './presets/slide';

// Wipe transitions
export {
  wipe,
  wipeLeft,
  wipeRight,
  wipeTop,
  wipeBottom,
  iris,
  diagonalWipe,
} from './presets/wipe';

// Zoom transitions
export {
  zoom,
  zoomInOut,
  zoomOutIn,
  kenBurns,
  zoomRotate,
} from './presets/zoom';

// Flip transitions
export {
  flip,
  flipHorizontal,
  flipVertical,
  cardFlip,
  cube,
  door,
} from './presets/flip';

// Type exports
export type { SlideDirection, SlideOptions, TransitionStyle, TransitionResult } from './presets/slide';
export type { FadeStyle, FadeOptions, FadeTransitionStyle, FadeTransitionResult } from './presets/fade';
export type {
  FlipDirection,
  CardFlipDirection,
  CubeDirection,
  DoorSide,
  FlipOptions,
  CardFlipOptions,
  CubeOptions,
  DoorOptions,
  FlipTransitionStyle,
  FlipTransitionResult,
  CubeTransitionStyle,
  CubeTransitionResult,
  DoorTransitionStyle,
  DoorTransitionResult,
} from './presets/flip';
export type {
  WipeDirection,
  DiagonalCorner,
  WipeOptions,
  DiagonalWipeOptions,
  WipeTransitionStyle,
  WipeTransitionResult,
} from './presets/wipe';
export type {
  ZoomDirection,
  ZoomOptions,
  KenBurnsOptions,
  ZoomRotateOptions,
  ZoomTransitionStyle,
  ZoomTransitionResult,
  KenBurnsStyle,
} from './presets/zoom';
export type { TransitionPresentation } from './presets/slide';

// Re-export presets as namespace
import * as fadePresets from './presets/fade';
import * as slidePresets from './presets/slide';
import * as wipePresets from './presets/wipe';
import * as zoomPresets from './presets/zoom';
import * as flipPresets from './presets/flip';

export const presets = {
  ...fadePresets,
  ...slidePresets,
  ...wipePresets,
  ...zoomPresets,
  ...flipPresets,
};
