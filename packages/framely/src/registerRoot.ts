import React, { Children, isValidElement, ReactElement } from 'react';

/**
 * Configuration for a single composition.
 */
export interface CompositionConfig {
  id: string;
  component: React.ComponentType<any> | null;
  lazyComponent: (() => Promise<{ default: React.ComponentType<any> }>) | null;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  defaultProps: Record<string, unknown>;
  calculateMetadata?: Function;
  schema?: unknown;
  defaultCodec?: string;
  folderPath: string[];
}

/**
 * Global registry holding the root component, compositions, and callbacks.
 */
export interface Registry {
  rootComponent: React.ComponentType<any> | null;
  compositions: Map<string, CompositionConfig>;
  folders: Map<string, string>;
  isRegistered: boolean;
  onRegisterCallbacks: ((registry: Registry) => void)[];
}

/**
 * Tree structure representing compositions organized by folder.
 */
export interface CompositionTree {
  compositions: string[];
  folders: Record<string, CompositionTree>;
}

/**
 * Window augmentation for globally exposed Framely data.
 */
declare global {
  interface Window {
    __FRAMELY_ROOT?: React.ComponentType<any>;
    __FRAMELY_COMPOSITIONS?: Map<string, CompositionConfig>;
    __FRAMELY_REGISTRY?: Registry;
  }
}

/**
 * Props expected on a <Composition> element.
 */
interface CompositionProps {
  id?: string;
  component?: React.ComponentType<any> | null;
  lazyComponent?: (() => Promise<{ default: React.ComponentType<any> }>) | null;
  width?: number;
  height?: number;
  fps?: number;
  durationInFrames?: number;
  defaultProps?: Record<string, unknown>;
  calculateMetadata?: Function;
  schema?: unknown;
  defaultCodec?: string;
  children?: React.ReactNode;
}

/**
 * Props expected on a <Folder> element.
 */
interface FolderProps {
  name?: string;
  children?: React.ReactNode;
}

/**
 * Global registry for the root component and compositions.
 */
const registry: Registry = {
  rootComponent: null,
  compositions: new Map<string, CompositionConfig>(),
  folders: new Map<string, string>(),
  isRegistered: false,
  onRegisterCallbacks: [],
};

/**
 * Register the root component that contains all compositions.
 *
 * This should be called once in your entry file. The root component
 * should return one or more <Composition> components.
 *
 * @param RootComponent - Component containing <Composition> declarations
 *
 * Usage:
 *   // src/Root.tsx
 *   export const Root: React.FC = () => (
 *     <>
 *       <Composition id="intro" component={IntroVideo} ... />
 *       <Composition id="outro" component={OutroVideo} ... />
 *     </>
 *   );
 *
 *   // src/index.tsx
 *   import { registerRoot } from './lib';
 *   import { Root } from './Root';
 *   registerRoot(Root);
 */
export function registerRoot(RootComponent: React.ComponentType<any>): void {
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
 * @param loader - Async function returning the root component
 *
 * Usage:
 *   registerRootAsync(async () => {
 *     await initWasm();
 *     const { Root } = await import('./Root');
 *     return Root;
 *   });
 */
export async function registerRootAsync(
  loader: () => Promise<React.ComponentType<any>>
): Promise<void> {
  const RootComponent = await loader();
  registerRoot(RootComponent);
}

/**
 * Extract composition definitions from a root component.
 *
 * This traverses the component tree and collects all <Composition> elements.
 */
function extractCompositions(RootComponent: React.ComponentType<any>): void {
  try {
    // Create an element and traverse its children
    const element: ReactElement | null =
      typeof RootComponent === 'function'
        ? (RootComponent as (props: Record<string, never>) => ReactElement)(
            {} as Record<string, never>
          )
        : (RootComponent as unknown as ReactElement);

    if (!element) return;

    traverseElement(element, []);
  } catch (err) {
    console.warn('Could not extract compositions:', err);
  }
}

/**
 * Recursively traverse React elements to find Composition components.
 */
function traverseElement(element: ReactElement, folderPath: string[]): void {
  if (!isValidElement(element)) return;

  const { type, props } = element as ReactElement<CompositionProps & FolderProps>;
  const typeName: string =
    (type as React.ComponentType<any>)?.displayName ||
    (type as React.ComponentType<any>)?.name ||
    '';

  // Check if this is a Composition
  if (typeName === 'Composition' || props?.id) {
    if (props.id && (props.component || props.lazyComponent)) {
      const composition: CompositionConfig = {
        id: props.id,
        component: props.component ?? null,
        lazyComponent: props.lazyComponent ?? null,
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
  if (typeName === 'Folder' && (props as FolderProps).name) {
    const newPath: string[] = [...folderPath, (props as FolderProps).name!];
    registry.folders.set(newPath.join('/'), (props as FolderProps).name!);

    // Traverse children with updated folder path
    Children.forEach(props.children, (child) => {
      traverseElement(child as ReactElement, newPath);
    });
    return;
  }

  // Traverse children
  if (props?.children) {
    Children.forEach(props.children, (child) => {
      traverseElement(child as ReactElement, folderPath);
    });
  }
}

/**
 * Get the registered root component.
 *
 * @returns The registered root component or null if not registered
 */
export function getRoot(): React.ComponentType<any> | null {
  return registry.rootComponent;
}

/**
 * Get all registered compositions.
 *
 * @returns Map of composition ID to composition config
 */
export function getCompositions(): Map<string, CompositionConfig> {
  return registry.compositions;
}

/**
 * Get a specific composition by ID.
 *
 * @param id - Composition ID
 * @returns Composition config or undefined
 */
export function getComposition(id: string): CompositionConfig | undefined {
  return registry.compositions.get(id);
}

/**
 * Get composition IDs grouped by folder.
 *
 * @returns Tree structure of folders and compositions
 */
export function getCompositionTree(): CompositionTree {
  const tree: CompositionTree = { compositions: [], folders: {} };

  for (const [id, comp] of registry.compositions) {
    if (comp.folderPath.length === 0) {
      tree.compositions.push(id);
    } else {
      let current: CompositionTree = tree;
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
 * @returns Whether the root has been registered
 */
export function isRootRegistered(): boolean {
  return registry.isRegistered;
}

/**
 * Register a callback to be called when registerRoot is invoked.
 *
 * @param callback - Called with the registry object
 * @returns Unsubscribe function
 */
export function onRootRegistered(
  callback: (registry: Registry) => void
): () => void {
  // If already registered, call immediately
  if (registry.isRegistered) {
    callback(registry);
  }

  registry.onRegisterCallbacks.push(callback);

  return (): void => {
    const index: number = registry.onRegisterCallbacks.indexOf(callback);
    if (index > -1) {
      registry.onRegisterCallbacks.splice(index, 1);
    }
  };
}

/**
 * Clear the registry (mainly for testing).
 */
export function clearRegistry(): void {
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
