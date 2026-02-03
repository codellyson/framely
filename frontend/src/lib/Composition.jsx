import { lazy, Suspense } from 'react';

/**
 * Composition defines a video's dimensions, frame rate, and duration.
 * It doesn't render anything itself — it's a declarative config
 * that the Player and Renderer use to know how to handle the video.
 *
 * Props:
 *   id                - Unique identifier for the composition
 *   component         - React component to render
 *   lazyComponent     - Async function returning component (for code-splitting)
 *   width             - Video width in pixels (default: 1920)
 *   height            - Video height in pixels (default: 1080)
 *   fps               - Frames per second (default: 30)
 *   durationInFrames  - Total frames (default: 300)
 *   defaultProps      - Default props passed to the component
 *   calculateMetadata - Async function to dynamically compute metadata
 *   schema            - Zod schema for prop validation and visual editing
 *   defaultCodec      - Default codec for rendering
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
export function Composition({
  id,
  component: Component,
  lazyComponent,
  width = 1920,
  height = 1080,
  fps = 30,
  durationInFrames = 300,
  defaultProps = {},
  calculateMetadata,
  schema,
  defaultCodec,
}) {
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
 * @param {object} config - Composition configuration
 * @returns {object} Normalized composition config
 */
export function defineComposition({
  id,
  component,
  lazyComponent,
  width = 1920,
  height = 1080,
  fps = 30,
  durationInFrames = 300,
  defaultProps = {},
  calculateMetadata,
  schema,
  defaultCodec,
}) {
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
 * @param {object} composition - Composition config from registry
 * @returns {React.ComponentType} The resolved component
 */
export function resolveComponent(composition) {
  if (composition.component) {
    return composition.component;
  }

  if (composition.lazyComponent) {
    return lazy(async () => {
      const module = await composition.lazyComponent();
      return { default: module.default || module };
    });
  }

  throw new Error(`Composition ${composition.id} has no component`);
}

/**
 * Resolve a composition's metadata (handles calculateMetadata).
 *
 * @param {object} composition - Composition config from registry
 * @param {object} inputProps - Props passed via CLI or API
 * @returns {Promise<object>} Resolved metadata
 */
export async function resolveMetadata(composition, inputProps = {}) {
  const baseMetadata = {
    width: composition.width,
    height: composition.height,
    fps: composition.fps,
    durationInFrames: composition.durationInFrames,
    props: { ...composition.defaultProps, ...inputProps },
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
      },
    };
  } catch (err) {
    console.error(`calculateMetadata failed for ${composition.id}:`, err);
    throw err;
  }
}

/**
 * Validate props against a composition's schema.
 *
 * @param {object} composition - Composition config from registry
 * @param {object} props - Props to validate
 * @returns {{ success: boolean, data?: object, error?: object }}
 */
export function validateProps(composition, props) {
  if (!composition.schema) {
    return { success: true, data: props };
  }

  try {
    // Assumes Zod schema with parse/safeParse methods
    if (typeof composition.schema.safeParse === 'function') {
      const result = composition.schema.safeParse(props);
      return result;
    }

    // Fallback for other schema types
    if (typeof composition.schema.validate === 'function') {
      const data = composition.schema.validate(props);
      return { success: true, data };
    }

    return { success: true, data: props };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * Get the default props for a composition, considering schema defaults.
 *
 * @param {object} composition - Composition config from registry
 * @returns {object} Default props
 */
export function getDefaultProps(composition) {
  const defaults = { ...composition.defaultProps };

  // If schema has defaults, merge them
  if (composition.schema && typeof composition.schema.parse === 'function') {
    try {
      // Parse empty object to get schema defaults
      const schemaDefaults = composition.schema.parse({});
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
 * @param {object} composition - Composition config
 * @returns {React.ComponentType} Wrapped component with Suspense
 */
export function createCompositionWrapper(composition) {
  const Component = resolveComponent(composition);

  return function CompositionWrapper(props) {
    return (
      <Suspense fallback={null}>
        <Component {...props} />
      </Suspense>
    );
  };
}

export default Composition;
