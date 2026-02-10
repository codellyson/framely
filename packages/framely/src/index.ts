/**
 * Framely Library
 *
 * Main barrel export for the Framely animation framework.
 */

// Core context & provider
export { TimelineProvider, useTimeline } from './context';
export { default as TimelineContext } from './context';
export type { TimelineContextValue, TimelineProviderProps } from './context';

// Hooks
export { useCurrentFrame, useVideoConfig } from './hooks';
export type { VideoConfig } from './hooks';
export { useDelayRender, useDelayRenderWhile } from './hooks/useDelayRender';
export type { UseDelayRenderReturn } from './hooks/useDelayRender';

// Animation utilities
export { interpolate, spring } from './interpolate';
export type { ExtrapolationType, InterpolateOptions, SpringOptions } from './interpolate';
export { Easing } from './Easing';
export type { EasingFunction } from './Easing';
export { interpolateColors } from './interpolateColors';
export type { RGBAColor, OKLCHColor, InterpolateColorsOptions } from './interpolateColors';
export { measureSpring, springPresets, springNaturalFrequency, springDampingRatio } from './measureSpring';
export type { SpringPreset, MeasureSpringOptions } from './measureSpring';

// Delay render system
export {
  delayRender,
  continueRender,
  cancelRender,
  isDelayRenderPending,
  getPendingDelayRenders,
  clearAllDelayRenders,
} from './delayRender';
export type { DelayRenderOptions, DelayRenderHandle, PendingDelayRender } from './delayRender';

// Asset utilities
export { staticFile, isStaticFile, getFileExtension, getMimeType } from './staticFile';
export {
  preloadImage,
  preloadVideo,
  preloadAudio,
  preloadFont,
  prefetch,
  preloadAll,
  resolveWhenLoaded,
} from './preload';

// Layout components
export { Sequence } from './Sequence';
export type { SequenceProps } from './Sequence';
export { Series } from './Series';
export type { SeriesSequenceProps, SeriesProps } from './Series';
export { Loop, useLoop } from './Loop';
export type { LoopContextValue, LoopProps } from './Loop';
export { Freeze } from './Freeze';
export type { FreezeProps } from './Freeze';
export { Folder, useFolder } from './Folder';
export { AbsoluteFill } from './AbsoluteFill';
export type { AbsoluteFillProps } from './AbsoluteFill';

// Composition system
export {
  Composition,
  defineComposition,
  resolveComponent,
  resolveMetadata,
  validateProps,
  getDefaultProps,
  createCompositionWrapper,
} from './Composition';
export type {
  Codec,
  CompositionSchema,
  CalculateMetadataInput,
  CalculateMetadataOutput,
  CalculateMetadataFunction,
  CompositionProps,
  CompositionConfig,
  ResolvedMetadata,
  ValidationResult,
} from './Composition';

// Registry & root
export {
  registerRoot,
  registerRootAsync,
  getRoot,
  getCompositions,
  getComposition,
  getCompositionTree,
  isRootRegistered,
  onRootRegistered,
  clearRegistry,
} from './registerRoot';
export type {
  CompositionConfig as RegisteredCompositionConfig,
  Registry,
  CompositionTree,
} from './registerRoot';

// Input props
export {
  getInputProps,
  setInputProps,
  mergeInputProps,
  getInputProp,
  hasInputProps,
  getInputPropsSource,
  clearInputProps,
  parsePropsInput,
  serializeProps,
  createUrlWithProps,
} from './getInputProps';
export type { InputProps, InputPropsSource } from './getInputProps';

// Configuration
export {
  Config,
  getConfig,
  getConfigValue,
  resetConfig,
  loadConfig,
  getFfmpegArgs,
  getOutputExtension,
  validateConfig,
} from './config';
export type {
  Codec as ConfigCodec,
  LogLevel,
  ImageFormat,
  PixelFormat,
  HardwareAcceleration,
  AudioCodec,
  FramelyConfig,
  ValidationResult as ConfigValidationResult,
  ConfigSetter,
} from './config';

// Media components
export { Img } from './Img';
export type { ImgProps } from './Img';
export { Video } from './Video';
export type { VolumeCallback as VideoVolumeCallback, VideoProps } from './Video';
export { Audio, getAudioMetadata, getAudioDurationInFrames } from './Audio';
export type { VolumeCallback as AudioVolumeCallback, AudioProps, AudioMetadata } from './Audio';
export { IFrame } from './IFrame';
export type { IFrameProps } from './IFrame';

// Transitions
export {
  TransitionSeries,
  useTransition,
  createPresentation,
  createTiming,
  // Presets
  fade,
  crossfade,
  slide,
  slideFromLeft,
  slideFromRight,
  slideFromTop,
  slideFromBottom,
  push,
  wipe,
  wipeLeft,
  wipeRight,
  wipeTop,
  wipeBottom,
  iris,
  diagonalWipe,
  zoom,
  zoomInOut,
  zoomOutIn,
  kenBurns,
  zoomRotate,
  flip,
  flipHorizontal,
  flipVertical,
  cardFlip,
  cube,
  door,
  presets as transitionPresets,
} from './transitions';
export type {
  SlideDirection,
  SlideOptions,
  TransitionStyle,
  TransitionResult,
  FadeStyle,
  FadeOptions,
  FadeTransitionStyle,
  FadeTransitionResult,
  TransitionPresentation,
} from './transitions';

// Spring hooks
export { useSpring, useSpringSequence } from './useSpring';
export type { UseSpringOptions, UseSpringSequenceOptions } from './useSpring';

// Text component
export { Text, splitText, getWords } from './Text';
export type {
  CharSpanProps,
  CharData,
  StrokeConfig,
  ShadowConfig,
  WordData,
  TextProps,
} from './Text';

// Shape components
export { Svg, Circle, Rect, Ellipse, Line, Path, Polygon, usePathLength } from './shapes';
export type {
  SvgProps,
  CircleProps,
  RectProps,
  EllipseProps,
  LineProps,
  PathProps,
  PolygonProps,
} from './shapes';

// Audio visualization
export { useAudioData, getFrequencyBands } from './useAudioData';
export type {
  AudioDataOptions,
  AudioDataResult,
  FrequencyBandRanges,
  FrequencyBandValues,
} from './useAudioData';

// Noise & random utilities
export { random, randomRange, randomInt, noise2D, noise3D, fbm2D } from './noise';

// Transform utilities
export { makeTransform, transform, interpolateTransform } from './makeTransform';

// Error boundary
export { ErrorBoundary } from './ErrorBoundary';
export type { ErrorBoundaryProps, ErrorBoundaryState } from './ErrorBoundary';

// Player
export { Player, Thumbnail } from './Player';
export type { PlayerTimelineContextValue, PlayerProps, ThumbnailProps } from './Player';

// Templates types (marketplace runtime code moved to CLI)
export { CATEGORY_LABELS } from './templates/types';
export type {
  Template,
  TemplateCategory,
  TemplateAuthor,
  TemplatePreview,
  TemplatePackageMeta,
  RegistryTemplate,
  RegistrySchema,
  TemplatesListResponse,
  TemplatesFilterParams,
  CategoryCount,
} from './templates/types';
