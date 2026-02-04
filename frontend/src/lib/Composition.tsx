import { lazy, Suspense, type ComponentType, type LazyExoticComponent, type ReactElement } from 'react';
import type { ZodType } from 'zod';

/**
 * Supported codecs for rendering output.
 */
export type Codec =
  | 'h264'
  | 'h265'
  | 'vp8'
  | 'vp9'
  | 'mp3'
  | 'aac'
  | 'wav'
  | 'prores'
  | 'gif';

/**
 * Schema interface supporting Zod-style and generic validate-style schemas.
 */
export interface CompositionSchema<T = Record<string, unknown>> {
  safeParse?: (data: unknown) => { success: boolean; data?: T; error?: unknown };
  parse?: (data: unknown) => T;
  validate?: (data: unknown) => T;
}

/**
 * Input provided to a calculateMetadata function.
 */
export interface CalculateMetadataInput<T extends Record<string, unknown>> {
  defaultProps: T;
  props: T;
  abortSignal: AbortSignal;
}

/**
 * Output returned from a calculateMetadata function.
 */
export interface CalculateMetadataOutput<T extends Record<string, unknown>> {
  props?: Partial<T>;
  durationInFrames?: number;
  width?: number;
  height?: number;
  fps?: number;
  defaultCodec?: Codec;
}

/**
 * Callback type for dynamically computing composition metadata.
 */
export type CalculateMetadataFunction<T extends Record<string, unknown>> = (
  input: CalculateMetadataInput<T>,
) => Promise<CalculateMetadataOutput<T>>;

/**
 * Props accepted by the Composition component.
 *
 * @template T - The shape of props passed to the rendered component.
 */
export interface CompositionProps<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Unique identifier for the composition. */
  id: string;
  /** React component to render. Mutually exclusive with lazyComponent. */
  component?: ComponentType<T>;
  /** Async function returning a module with a component (for code-splitting). */
  lazyComponent?: () => Promise<{ default: ComponentType<T> } | ComponentType<T>>;
  /** Video width in pixels. @default 1920 */
  width?: number;
  /** Video height in pixels. @default 1080 */
  height?: number;
  /** Frames per second. @default 30 */
  fps?: number;
  /** Total number of frames. @default 300 */
  durationInFrames?: number;
  /** Default props passed to the component. @default {} */
  defaultProps?: T;
  /** Async function to dynamically compute metadata before rendering. */
  calculateMetadata?: CalculateMetadataFunction<T>;
  /** Zod schema (or compatible) for prop validation and visual editing. */
  schema?: ZodType<T> | CompositionSchema<T>;
  /** Default codec used when rendering this composition. */
  defaultCodec?: Codec;
}

/**
 * Resolved composition configuration stored in the registry.
 */
export interface CompositionConfig<T extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  component?: ComponentType<T>;
  lazyComponent?: () => Promise<{ default: ComponentType<T> } | ComponentType<T>>;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  defaultProps: T;
  calculateMetadata?: CalculateMetadataFunction<T>;
  schema?: ZodType<T> | CompositionSchema<T>;
  defaultCodec?: Codec;
}

/**
 * Resolved metadata after applying calculateMetadata.
 */
export interface ResolvedMetadata<T extends Record<string, unknown> = Record<string, unknown>> {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  props: T;
  defaultCodec?: Codec;
}

/**
 * Result of validating props against a composition's schema.
 */
export type ValidationResult<T = Record<string, unknown>> =
  | { success: true; data: T; error?: undefined }
  | { success: false; data?: undefined; error: unknown };

/**
 * Composition defines a video's dimensions, frame rate, and duration.
 * It doesn't render anything itself — it's a declarative config
 * that the Player and Renderer use to know how to handle the video.
 *
 * Usage:
 *   <Composition
 *     id="my-video"
 *     component={MyVideoComponent}
 *     width={1920}
 *     height={1080}
 *     fps={30}
 *     durationInFrames={300}
 *     defaultProps={{ title: "Hello" }}
 *   />
 *
 *   // With lazy loading
 *   <Composition
 *     id="heavy-video"
 *     lazyComponent={() => import('./HeavyVideo')}
 *     ...
 *   />
 *
 *   // With dynamic metadata
 *   <Composition
 *     id="data-video"
 *     component={DataVideo}
 *     calculateMetadata={async ({ props }) => {
 *       const data = await fetchData();
 *       return {
 *         props: { ...props, data },
 *         durationInFrames: data.length * 30,
 *       };
 *     }}
 *     ...
 *   />
 */
export function Composition<T extends Record<string, unknown> = Record<string, unknown>>(
  _props: CompositionProps<T>,
): ReactElement | null {
  // Composition is a config object — it doesn't render content directly.
  // The Player reads these props and wraps the component in a TimelineProvider.
  // Registration happens via registerRoot() which traverses the component tree.
  return null;
}

// Set display name for traversal detection
Composition.displayName = 'Composition';

/**
 * Helper to define compositions as plain objects (for registry/routing).
 *
 * @template T - The shape of props passed to the rendered component.
 * @param config - Composition configuration
 * @returns Normalized composition config
 */
export function defineComposition<T extends Record<string, unknown> = Record<string, unknown>>(
  config: CompositionProps<T> & { id: string },
): CompositionConfig<T> {
  const {
    id,
    component,
    lazyComponent,
    width = 1920,
    height = 1080,
    fps = 30,
    durationInFrames = 300,
    defaultProps = {} as T,
    calculateMetadata,
    schema,
    defaultCodec,
  } = config;

  if (!id) {
    throw new Error('Composition requires an id');
  }
  if (!component && !lazyComponent) {
    throw new Error('Composition requires either component or lazyComponent');
  }

  return {
    id,
    component,
    lazyComponent,
    width,
    height,
    fps,
    durationInFrames,
    defaultProps,
    calculateMetadata,
    schema,
    defaultCodec,
  };
}

/**
 * Resolve a composition's component (handles lazy loading).
 *
 * @template T - The shape of props for the component.
 * @param composition - Composition config from registry
 * @returns The resolved component (possibly lazy-wrapped)
 */
export function resolveComponent<T extends Record<string, unknown>>(
  composition: CompositionConfig<T>,
): ComponentType<T> | LazyExoticComponent<ComponentType<T>> {
  if (composition.component) {
    return composition.component;
  }

  if (composition.lazyComponent) {
    const lazyLoader = composition.lazyComponent;
    return lazy<ComponentType<T>>(async () => {
      const module = await lazyLoader();
      if ('default' in module) {
        return module as { default: ComponentType<T> };
      }
      return { default: module as ComponentType<T> };
    });
  }

  throw new Error(`Composition ${composition.id} has no component`);
}

/**
 * Resolve a composition's metadata (handles calculateMetadata).
 *
 * @template T - The shape of props for the component.
 * @param composition - Composition config from registry
 * @param inputProps - Props passed via CLI or API
 * @returns Resolved metadata
 */
export async function resolveMetadata<T extends Record<string, unknown>>(
  composition: CompositionConfig<T>,
  inputProps: Partial<T> = {},
): Promise<ResolvedMetadata<T>> {
  const baseMetadata: ResolvedMetadata<T> = {
    width: composition.width,
    height: composition.height,
    fps: composition.fps,
    durationInFrames: composition.durationInFrames,
    props: { ...composition.defaultProps, ...inputProps } as T,
    defaultCodec: composition.defaultCodec,
  };

  if (!composition.calculateMetadata) {
    return baseMetadata;
  }

  try {
    const calculated = await composition.calculateMetadata({
      defaultProps: composition.defaultProps,
      props: baseMetadata.props,
      abortSignal: new AbortController().signal,
    });

    return {
      ...baseMetadata,
      ...calculated,
      props: {
        ...baseMetadata.props,
        ...(calculated.props || {}),
      } as T,
    };
  } catch (err) {
    console.error(`calculateMetadata failed for ${composition.id}:`, err);
    throw err;
  }
}

/**
 * Validate props against a composition's schema.
 *
 * @template T - The shape of props for the component.
 * @param composition - Composition config from registry
 * @param props - Props to validate
 * @returns Validation result with success status and parsed data or error
 */
export function validateProps<T extends Record<string, unknown>>(
  composition: CompositionConfig<T>,
  props: unknown,
): ValidationResult<T> {
  if (!composition.schema) {
    return { success: true, data: props as T };
  }

  try {
    const schema = composition.schema as CompositionSchema<T>;

    // Assumes Zod schema with parse/safeParse methods
    if (typeof schema.safeParse === 'function') {
      const result = schema.safeParse(props);
      if (result.success) {
        return { success: true, data: result.data as T };
      }
      return { success: false, error: result.error };
    }

    // Fallback for other schema types
    if (typeof schema.validate === 'function') {
      const data = schema.validate(props);
      return { success: true, data: data as T };
    }

    return { success: true, data: props as T };
  } catch (err: unknown) {
    return { success: false, error: err };
  }
}

/**
 * Get the default props for a composition, considering schema defaults.
 *
 * @template T - The shape of props for the component.
 * @param composition - Composition config from registry
 * @returns Default props merged with schema defaults
 */
export function getDefaultProps<T extends Record<string, unknown>>(
  composition: CompositionConfig<T>,
): T {
  const defaults: T = { ...composition.defaultProps };

  // If schema has defaults, merge them
  const schema = composition.schema as CompositionSchema<T> | undefined;
  if (schema && typeof schema.parse === 'function') {
    try {
      // Parse empty object to get schema defaults
      const schemaDefaults = schema.parse({});
      return { ...schemaDefaults, ...defaults };
    } catch {
      // Schema requires values, use composition defaults
    }
  }

  return defaults;
}

/**
 * Create a composition wrapper component that handles lazy loading.
 *
 * @template T - The shape of props for the component.
 * @param composition - Composition config
 * @returns Wrapped component with Suspense boundary
 */
export function createCompositionWrapper<T extends Record<string, unknown>>(
  composition: CompositionConfig<T>,
): ComponentType<T> {
  const Component = resolveComponent(composition);

  return function CompositionWrapper(props: T): ReactElement {
    return (
      <Suspense fallback={null}>
        <Component {...(props as any)} />
      </Suspense>
    );
  };
}

export default Composition;
