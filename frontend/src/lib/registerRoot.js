import { Children, isValidElement } from 'react';

/**
 * Global registry for the root component and compositions.
 */
const registry = {
  rootComponent: null,
  compositions: new Map(),
  folders: new Map(),
  isRegistered: false,
  onRegisterCallbacks: [],
};

/**
 * Register the root component that contains all compositions.
 *
 * This should be called once in your entry file. The root component
 * should return one or more <Composition> components.
 *
 * @param {React.ComponentType} RootComponent - Component containing <Composition> declarations
 *
 * Usage:
 *   // src/Root.jsx
 *   export const Root = () => (
 *     <>
 *       <Composition id="intro" component={IntroVideo} ... />
 *       <Composition id="outro" component={OutroVideo} ... />
 *     </>
 *   );
 *
 *   // src/index.jsx
 *   import { registerRoot } from './lib';
 *   import { Root } from './Root';
 *   registerRoot(Root);
 */
export function registerRoot(RootComponent) {
  if (registry.isRegistered) {
    console.warn(
      'registerRoot() called multiple times. Only the first call takes effect.'
    );
    return;
  }

  registry.rootComponent = RootComponent;
  registry.isRegistered = true;

  // Extract compositions from the root component
  extractCompositions(RootComponent);

  // Expose globally for the renderer
  if (typeof window !== 'undefined') {
    window.__FRAMELY_ROOT = RootComponent;
    window.__FRAMELY_COMPOSITIONS = registry.compositions;
    window.__FRAMELY_REGISTRY = registry;
  }

  // Notify any listeners
  registry.onRegisterCallbacks.forEach((cb) => cb(registry));
}

/**
 * Register root component asynchronously.
 *
 * Useful for dynamic imports or when you need to load WASM/data first.
 *
 * @param {() => Promise<React.ComponentType>} loader - Async function returning the root component
 *
 * Usage:
 *   registerRootAsync(async () => {
 *     await initWasm();
 *     const { Root } = await import('./Root');
 *     return Root;
 *   });
 */
export async function registerRootAsync(loader) {
  const RootComponent = await loader();
  registerRoot(RootComponent);
}

/**
 * Extract composition definitions from a root component.
 *
 * This traverses the component tree and collects all <Composition> elements.
 */
function extractCompositions(RootComponent) {
  try {
    // Create an element and traverse its children
    const element = typeof RootComponent === 'function'
      ? RootComponent({})
      : RootComponent;

    if (!element) return;

    traverseElement(element, []);
  } catch (err) {
    console.warn('Could not extract compositions:', err);
  }
}

/**
 * Recursively traverse React elements to find Composition components.
 */
function traverseElement(element, folderPath) {
  if (!isValidElement(element)) return;

  const { type, props } = element;
  const typeName = type?.displayName || type?.name || '';

  // Check if this is a Composition
  if (typeName === 'Composition' || props?.id) {
    if (props.id && (props.component || props.lazyComponent)) {
      const composition = {
        id: props.id,
        component: props.component,
        lazyComponent: props.lazyComponent,
        width: props.width ?? 1920,
        height: props.height ?? 1080,
        fps: props.fps ?? 30,
        durationInFrames: props.durationInFrames ?? 300,
        defaultProps: props.defaultProps ?? {},
        calculateMetadata: props.calculateMetadata,
        schema: props.schema,
        defaultCodec: props.defaultCodec,
        folderPath: [...folderPath],
      };
      registry.compositions.set(props.id, composition);
    }
  }

  // Check if this is a Folder
  if (typeName === 'Folder' && props.name) {
    const newPath = [...folderPath, props.name];
    registry.folders.set(newPath.join('/'), props.name);

    // Traverse children with updated folder path
    Children.forEach(props.children, (child) => {
      traverseElement(child, newPath);
    });
    return;
  }

  // Traverse children
  if (props?.children) {
    Children.forEach(props.children, (child) => {
      traverseElement(child, folderPath);
    });
  }
}

/**
 * Get the registered root component.
 *
 * @returns {React.ComponentType|null}
 */
export function getRoot() {
  return registry.rootComponent;
}

/**
 * Get all registered compositions.
 *
 * @returns {Map<string, object>} Map of composition ID to composition config
 */
export function getCompositions() {
  return registry.compositions;
}

/**
 * Get a specific composition by ID.
 *
 * @param {string} id - Composition ID
 * @returns {object|undefined} Composition config or undefined
 */
export function getComposition(id) {
  return registry.compositions.get(id);
}

/**
 * Get composition IDs grouped by folder.
 *
 * @returns {object} Tree structure of folders and compositions
 */
export function getCompositionTree() {
  const tree = { compositions: [], folders: {} };

  for (const [id, comp] of registry.compositions) {
    if (comp.folderPath.length === 0) {
      tree.compositions.push(id);
    } else {
      let current = tree;
      for (const folder of comp.folderPath) {
        if (!current.folders[folder]) {
          current.folders[folder] = { compositions: [], folders: {} };
        }
        current = current.folders[folder];
      }
      current.compositions.push(id);
    }
  }

  return tree;
}

/**
 * Check if registerRoot has been called.
 *
 * @returns {boolean}
 */
export function isRootRegistered() {
  return registry.isRegistered;
}

/**
 * Register a callback to be called when registerRoot is invoked.
 *
 * @param {function} callback - Called with the registry object
 * @returns {function} Unsubscribe function
 */
export function onRootRegistered(callback) {
  // If already registered, call immediately
  if (registry.isRegistered) {
    callback(registry);
  }

  registry.onRegisterCallbacks.push(callback);

  return () => {
    const index = registry.onRegisterCallbacks.indexOf(callback);
    if (index > -1) {
      registry.onRegisterCallbacks.splice(index, 1);
    }
  };
}

/**
 * Clear the registry (mainly for testing).
 */
export function clearRegistry() {
  registry.rootComponent = null;
  registry.compositions.clear();
  registry.folders.clear();
  registry.isRegistered = false;
  registry.onRegisterCallbacks = [];

  if (typeof window !== 'undefined') {
    delete window.__FRAMELY_ROOT;
    delete window.__FRAMELY_COMPOSITIONS;
    delete window.__FRAMELY_REGISTRY;
  }
}

export default {
  registerRoot,
  registerRootAsync,
  getRoot,
  getCompositions,
  getComposition,
  getCompositionTree,
  isRootRegistered,
  onRootRegistered,
  clearRegistry,
};
