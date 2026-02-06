/**
 * Framely TypeScript Declarations
 *
 * Type definitions for the Framely video framework.
 */

import { ComponentType, ReactNode, CSSProperties } from 'react';

// ─── Core Types ────────────────────────────────────────────────────────────────

export interface TimelineContextValue {
  frame: number;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  playing: boolean;
  volume: number;
  playbackRate: number;
}

export interface VideoConfig {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
}

// ─── Context & Hooks ───────────────────────────────────────────────────────────

export function TimelineProvider(props: {
  value: TimelineContextValue;
  children: ReactNode;
}): JSX.Element;

export function useTimeline(): TimelineContextValue;
export function useCurrentFrame(): number;
export function useVideoConfig(): VideoConfig;

// ─── Delay Render ──────────────────────────────────────────────────────────────

export interface DelayRenderHandle {
  id: string;
  label: string;
  createdAt: number;
}

export function delayRender(label?: string, options?: { timeout?: number }): DelayRenderHandle;
export function continueRender(handle: DelayRenderHandle): void;
export function cancelRender(error?: Error): void;
export function isDelayRenderPending(): boolean;
export function getPendingDelayRenders(): DelayRenderHandle[];
export function clearAllDelayRenders(): void;

export function useDelayRender(label?: string, options?: { timeout?: number }): () => void;
export function useDelayRenderWhile(condition: boolean, label?: string): void;

// ─── Animation ─────────────────────────────────────────────────────────────────

export type ExtrapolateType = 'clamp' | 'extend' | 'wrap' | 'identity';

export interface InterpolateOptions {
  extrapolateLeft?: ExtrapolateType;
  extrapolateRight?: ExtrapolateType;
  easing?: (t: number) => number;
}

export function interpolate(
  input: number,
  inputRange: number[],
  outputRange: number[],
  options?: InterpolateOptions
): number;

export interface SpringOptions {
  from?: number;
  to?: number;
  fps?: number;
  delay?: number;
  mass?: number;
  stiffness?: number;
  damping?: number;
  overshootClamping?: boolean;
}

export function spring(frame: number, options?: SpringOptions): number;

export function interpolateColors(
  value: number,
  inputRange: number[],
  outputRange: string[],
  options?: InterpolateOptions
): string;

export interface SpringConfig {
  mass?: number;
  stiffness?: number;
  damping?: number;
}

export function measureSpring(config?: SpringConfig & { fps?: number; threshold?: number }): number;

export const springPresets: {
  default: SpringConfig;
  gentle: SpringConfig;
  bouncy: SpringConfig;
  stiff: SpringConfig;
  slow: SpringConfig;
  snappy: SpringConfig;
};

export function springNaturalFrequency(config: SpringConfig): number;
export function springDampingRatio(config: SpringConfig): number;

// ─── Easing ────────────────────────────────────────────────────────────────────

export const Easing: {
  linear: (t: number) => number;
  ease: (t: number) => number;
  quad: (t: number) => number;
  cubic: (t: number) => number;
  sin: (t: number) => number;
  exp: (t: number) => number;
  circle: (t: number) => number;
  bounce: (t: number) => number;
  poly: (n: number) => (t: number) => number;
  back: (overshoot?: number) => (t: number) => number;
  elastic: (bounciness?: number) => (t: number) => number;
  bezier: (x1: number, y1: number, x2: number, y2: number) => (t: number) => number;
  in: (easing: (t: number) => number) => (t: number) => number;
  out: (easing: (t: number) => number) => (t: number) => number;
  inOut: (easing: (t: number) => number) => (t: number) => number;
  step0: (t: number) => number;
  step1: (t: number) => number;
};

// ─── Components ────────────────────────────────────────────────────────────────

export interface SequenceProps {
  from?: number;
  durationInFrames?: number;
  name?: string;
  layout?: 'absolute-fill' | 'none';
  style?: CSSProperties;
  children: ReactNode;
}

export function Sequence(props: SequenceProps): JSX.Element;

export interface SeriesProps {
  children: ReactNode;
}

export function Series(props: SeriesProps): JSX.Element;

export namespace Series {
  interface SequenceProps {
    durationInFrames: number;
    offset?: number;
    layout?: 'absolute-fill' | 'none';
    style?: CSSProperties;
    name?: string;
    children: ReactNode;
  }
  function Sequence(props: SequenceProps): JSX.Element;
}

export interface LoopProps {
  durationInFrames: number;
  times?: number;
  layout?: 'absolute-fill' | 'none';
  style?: CSSProperties;
  name?: string;
  children: ReactNode;
}

export function Loop(props: LoopProps): JSX.Element;
export function useLoop(): { iteration: number; durationInFrames: number };

export interface FreezeProps {
  frame: number;
  active?: boolean;
  children: ReactNode;
}

export function Freeze(props: FreezeProps): JSX.Element;

export interface FolderProps {
  name: string;
  children: ReactNode;
}

export function Folder(props: FolderProps): JSX.Element;
export function useFolder(): string[];

export interface AbsoluteFillProps {
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
}

export function AbsoluteFill(props: AbsoluteFillProps): JSX.Element;

// ─── Media Components ──────────────────────────────────────────────────────────

export interface ImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  maxRetries?: number;
  pauseWhenLoading?: boolean;
  onError?: (error: Error) => void;
}

export function Img(props: ImgProps): JSX.Element;

export interface VideoProps {
  src: string;
  volume?: number | ((frame: number) => number);
  playbackRate?: number;
  muted?: boolean;
  loop?: boolean;
  startFrom?: number;
  endAt?: number;
  style?: CSSProperties;
  className?: string;
  onError?: (error: Error) => void;
}

export function Video(props: VideoProps): JSX.Element;

export interface AudioProps {
  src: string;
  volume?: number | ((frame: number) => number);
  playbackRate?: number;
  muted?: boolean;
  loop?: boolean;
  startFrom?: number;
  endAt?: number;
  onError?: (error: Error) => void;
}

export function Audio(props: AudioProps): JSX.Element;
export function getAudioMetadata(src: string): Promise<{ duration: number; sampleRate: number }>;
export function getAudioDurationInFrames(src: string, fps: number): Promise<number>;

export interface IFrameProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {
  src: string;
  delayRenderLabel?: string;
  delayRenderTimeout?: number;
}

export function IFrame(props: IFrameProps): JSX.Element;

// ─── Composition ───────────────────────────────────────────────────────────────

export interface CompositionProps<T = Record<string, unknown>> {
  id: string;
  component?: ComponentType<T>;
  lazyComponent?: () => Promise<{ default: ComponentType<T> }>;
  width?: number;
  height?: number;
  fps?: number;
  durationInFrames?: number;
  defaultProps?: T;
  calculateMetadata?: (params: {
    defaultProps: T;
    props: T;
    abortSignal: AbortSignal;
  }) => Promise<Partial<CompositionProps<T>>>;
  schema?: unknown; // Zod schema
  defaultCodec?: string;
}

export function Composition<T>(props: CompositionProps<T>): null;

export function defineComposition<T>(config: CompositionProps<T>): CompositionProps<T>;
export function resolveComponent<T>(composition: CompositionProps<T>): ComponentType<T>;
export function resolveMetadata<T>(composition: CompositionProps<T>, inputProps?: T): Promise<{
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  props: T;
  defaultCodec?: string;
}>;
export function validateProps<T>(composition: CompositionProps<T>, props: T): {
  success: boolean;
  data?: T;
  error?: unknown;
};
export function getDefaultProps<T>(composition: CompositionProps<T>): T;
export function createCompositionWrapper<T>(composition: CompositionProps<T>): ComponentType<T>;

// ─── Registry ──────────────────────────────────────────────────────────────────

export function registerRoot(RootComponent: ComponentType): void;
export function registerRootAsync(loader: () => Promise<{ default: ComponentType }>): Promise<void>;
export function getRoot(): ComponentType | null;
export function getCompositions(): Map<string, CompositionProps>;
export function getComposition(id: string): CompositionProps | undefined;
export function getCompositionTree(): Array<{ path: string[]; composition: CompositionProps }>;
export function isRootRegistered(): boolean;
export function onRootRegistered(callback: () => void): () => void;
export function clearRegistry(): void;

// ─── Input Props ───────────────────────────────────────────────────────────────

export function getInputProps<T = Record<string, unknown>>(): T;
export function setInputProps<T>(props: T, source?: string): void;
export function mergeInputProps<T>(props: Partial<T>): void;
export function getInputProp<T>(key: string, defaultValue?: T): T;
export function hasInputProps(): boolean;
export function getInputPropsSource(): string | null;
export function clearInputProps(): void;
export function parsePropsInput(input: string): Record<string, unknown>;
export function serializeProps(props: Record<string, unknown>): string;
export function createUrlWithProps(baseUrl: string, props: Record<string, unknown>): string;

// ─── Config ────────────────────────────────────────────────────────────────────

export interface FramelyConfig {
  concurrency: number;
  codec: string;
  pixelFormat: string;
  crf: number;
  videoBitrate: string | null;
  audioBitrate: string;
  audioCodec: string;
  scale: number;
  outputLocation: string;
  imageFormat: string;
  jpegQuality: number;
  browserExecutable: string | null;
  chromiumDisableWebSecurity: boolean;
  headless: boolean;
  delayRenderTimeout: number;
  puppeteerTimeout: number;
  studioPort: number;
  rendererPort: number;
  openBrowser: boolean;
  keyboardShortcutsEnabled: boolean;
  maxTimelineTracks: number;
  logLevel: 'error' | 'warn' | 'info' | 'verbose';
  enableMultiprocessOnLinux: boolean;
  hardwareAcceleration: 'auto' | 'on' | 'off';
}

export const Config: {
  setConcurrency: (n: number) => void;
  setCodec: (codec: string) => void;
  setPixelFormat: (format: string) => void;
  setCrf: (crf: number) => void;
  setVideoBitrate: (bitrate: string) => void;
  setAudioBitrate: (bitrate: string) => void;
  setAudioCodec: (codec: string) => void;
  setScale: (scale: number) => void;
  setOutputLocation: (path: string) => void;
  setImageFormat: (format: string) => void;
  setJpegQuality: (quality: number) => void;
  setBrowserExecutable: (path: string) => void;
  setChromiumDisableWebSecurity: (disable: boolean) => void;
  setChromiumHeadlessMode: (headless: boolean) => void;
  setDelayRenderTimeoutInMilliseconds: (ms: number) => void;
  setPuppeteerTimeout: (ms: number) => void;
  setStudioPort: (port: number) => void;
  setRendererPort: (port: number) => void;
  setShouldOpenBrowser: (open: boolean) => void;
  setKeyboardShortcutsEnabled: (enabled: boolean) => void;
  setMaxTimelineTracks: (max: number) => void;
  setLevel: (level: 'error' | 'warn' | 'info' | 'verbose') => void;
  setEnableMultiprocessOnLinux: (enable: boolean) => void;
  setHardwareAcceleration: (mode: 'auto' | 'on' | 'off') => void;
  setAll: (config: Partial<FramelyConfig>) => void;
};

export function getConfig(): FramelyConfig;
export function getConfigValue<K extends keyof FramelyConfig>(key: K): FramelyConfig[K];
export function resetConfig(): void;
export function loadConfig(config: Partial<FramelyConfig>): void;
export function getFfmpegArgs(overrides?: Partial<FramelyConfig>): string[];
export function getOutputExtension(): string;
export function validateConfig(): { valid: boolean; errors: string[] };

// ─── Asset Utilities ───────────────────────────────────────────────────────────

export function staticFile(path: string): string;
export function isStaticFile(path: string): boolean;
export function getFileExtension(path: string): string;
export function getMimeType(path: string): string;

export function preloadImage(src: string): Promise<HTMLImageElement>;
export function preloadVideo(src: string): Promise<HTMLVideoElement>;
export function preloadAudio(src: string): Promise<HTMLAudioElement>;
export function preloadFont(src: string, family: string): Promise<FontFace>;
export function prefetch(src: string): Promise<Response>;
export function preloadAll(assets: string[]): Promise<void>;
export function resolveWhenLoaded(element: HTMLElement): Promise<void>;

// ─── Transitions ───────────────────────────────────────────────────────────────

export interface TransitionPresentation {
  entering: (progress: number) => CSSProperties;
  exiting: (progress: number) => CSSProperties;
}

export interface TransitionTiming {
  durationInFrames: number;
  easing?: (t: number) => number;
}

export interface TransitionState {
  entering: boolean;
  exiting: boolean;
  progress: number;
  presentationDirection: 'entering' | 'exiting' | 'stable';
}

export function TransitionSeries(props: {
  children: ReactNode;
  style?: CSSProperties;
  name?: string;
}): JSX.Element;

export namespace TransitionSeries {
  function Sequence(props: {
    children: ReactNode;
    durationInFrames: number;
    offset?: number;
    style?: CSSProperties;
    name?: string;
  }): null;

  function Transition(props: {
    presentation: TransitionPresentation;
    timing: TransitionTiming;
  }): null;
}

export function useTransition(): TransitionState;
export function createPresentation(config: TransitionPresentation): TransitionPresentation;
export function createTiming(config: TransitionTiming): TransitionTiming;

// Transition presets
export function fade(options?: { enterStyle?: string; exitStyle?: string; easing?: (t: number) => number }): TransitionPresentation;
export function crossfade(options?: { easing?: (t: number) => number }): TransitionPresentation;
export function slide(options?: { direction?: string; exitOpposite?: boolean; easing?: (t: number) => number }): TransitionPresentation;
export function slideFromLeft(options?: { easing?: (t: number) => number }): TransitionPresentation;
export function slideFromRight(options?: { easing?: (t: number) => number }): TransitionPresentation;
export function slideFromTop(options?: { easing?: (t: number) => number }): TransitionPresentation;
export function slideFromBottom(options?: { easing?: (t: number) => number }): TransitionPresentation;
export function push(options?: { direction?: string; easing?: (t: number) => number }): TransitionPresentation;
export function wipe(options?: { direction?: string; easing?: (t: number) => number }): TransitionPresentation;
export function wipeLeft(options?: { easing?: (t: number) => number }): TransitionPresentation;
export function wipeRight(options?: { easing?: (t: number) => number }): TransitionPresentation;
export function wipeTop(options?: { easing?: (t: number) => number }): TransitionPresentation;
export function wipeBottom(options?: { easing?: (t: number) => number }): TransitionPresentation;
export function iris(options?: { easing?: (t: number) => number }): TransitionPresentation;
export function diagonalWipe(options?: { corner?: string; easing?: (t: number) => number }): TransitionPresentation;
export function zoom(options?: { enterDirection?: string; exitDirection?: string; scale?: number; withFade?: boolean; easing?: (t: number) => number }): TransitionPresentation;
export function zoomInOut(options?: { scale?: number; withFade?: boolean; easing?: (t: number) => number }): TransitionPresentation;
export function zoomOutIn(options?: { scale?: number; withFade?: boolean; easing?: (t: number) => number }): TransitionPresentation;
export function kenBurns(options?: { startScale?: number; endScale?: number; origin?: string }): (progress: number) => CSSProperties;
export function zoomRotate(options?: { scale?: number; rotation?: number; withFade?: boolean; easing?: (t: number) => number }): TransitionPresentation;
export function flip(options?: { direction?: string; perspective?: number; easing?: (t: number) => number }): TransitionPresentation;
export function flipHorizontal(options?: { perspective?: number; easing?: (t: number) => number }): TransitionPresentation;
export function flipVertical(options?: { perspective?: number; easing?: (t: number) => number }): TransitionPresentation;
export function cardFlip(options?: { flipDirection?: string; perspective?: number; easing?: (t: number) => number }): TransitionPresentation;
export function cube(options?: { direction?: string; perspective?: number; easing?: (t: number) => number }): TransitionPresentation;
export function door(options?: { side?: string; perspective?: number; easing?: (t: number) => number }): TransitionPresentation;

export const transitionPresets: {
  fade: typeof fade;
  crossfade: typeof crossfade;
  slide: typeof slide;
  // ... all other presets
};

// ─── Transform Utilities ───────────────────────────────────────────────────────

export interface TransformOperation {
  translateX?: number | string;
  translateY?: number | string;
  translateZ?: number | string;
  translate?: number | string | [number | string, number | string];
  translate3d?: [number | string, number | string, number | string];
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  scale?: number | [number, number];
  scale3d?: [number, number, number];
  rotate?: number | string;
  rotateX?: number | string;
  rotateY?: number | string;
  rotateZ?: number | string;
  rotate3d?: [number, number, number, number | string];
  skewX?: number | string;
  skewY?: number | string;
  skew?: number | string | [number | string, number | string];
  perspective?: number | string;
  matrix?: number[];
  matrix3d?: number[];
}

export function makeTransform(operations: TransformOperation | TransformOperation[]): string;

export interface TransformBuilder {
  translateX(value: number | string): TransformBuilder;
  translateY(value: number | string): TransformBuilder;
  translateZ(value: number | string): TransformBuilder;
  translate(x: number | string, y?: number | string): TransformBuilder;
  translate3d(x: number | string, y: number | string, z: number | string): TransformBuilder;
  scaleX(value: number): TransformBuilder;
  scaleY(value: number): TransformBuilder;
  scaleZ(value: number): TransformBuilder;
  scale(x: number, y?: number): TransformBuilder;
  scale3d(x: number, y: number, z: number): TransformBuilder;
  rotate(value: number | string): TransformBuilder;
  rotateX(value: number | string): TransformBuilder;
  rotateY(value: number | string): TransformBuilder;
  rotateZ(value: number | string): TransformBuilder;
  rotate3d(x: number, y: number, z: number, angle: number | string): TransformBuilder;
  skewX(value: number | string): TransformBuilder;
  skewY(value: number | string): TransformBuilder;
  skew(x: number | string, y?: number | string): TransformBuilder;
  perspective(value: number | string): TransformBuilder;
  matrix(...values: number[]): TransformBuilder;
  matrix3d(...values: number[]): TransformBuilder;
  toString(): string;
  toArray(): TransformOperation[];
  clear(): TransformBuilder;
}

export function transform(): TransformBuilder;
export function interpolateTransform(progress: number, fromOps: TransformOperation[], toOps: TransformOperation[]): string;

// ─── Player ────────────────────────────────────────────────────────────────────

export interface PlayerProps<T = Record<string, unknown>> {
  component: ComponentType<T>;
  durationInFrames: number;
  fps?: number;
  width?: number;
  height?: number;
  inputProps?: T;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  showFrameCount?: boolean;
  initialFrame?: number;
  style?: CSSProperties;
  className?: string;
  onFrameChange?: (frame: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: Error) => void;
}

export function Player<T>(props: PlayerProps<T>): JSX.Element;

export interface ThumbnailProps<T = Record<string, unknown>> {
  component: ComponentType<T>;
  frame?: number;
  fps?: number;
  width?: number;
  height?: number;
  inputProps?: T;
  style?: CSSProperties;
  className?: string;
}

export function Thumbnail<T>(props: ThumbnailProps<T>): JSX.Element;
