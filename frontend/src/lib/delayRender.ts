/**
 * Delay Render System
 *
 * This module manages asynchronous operations that must complete before
 * a frame can be captured during rendering. It's essential for:
 * - Loading images, videos, fonts
 * - Fetching data from APIs
 * - Any async operation that affects the visual output
 *
 * The renderer (Playwright) checks window.__FRAMELY_DELAY_RENDER before
 * capturing each frame. If any handles are pending, it waits.
 */

/**
 * Options for delayRender().
 */
export interface DelayRenderOptions {
  /** Timeout in milliseconds before throwing a timeout error. Defaults to 30000. */
  timeoutInMilliseconds?: number;
  /** Number of retries on timeout. Defaults to 0. */
  retries?: number;
}

/**
 * Internal data tracked for each delay render handle.
 */
export interface DelayRenderHandle {
  handle: number;
  label: string;
  createdAt: number;
  timeoutInMilliseconds: number;
  retries: number;
  retriesRemaining: number;
  timeoutId: ReturnType<typeof setTimeout> | null;
}

/**
 * Information about a pending delay render, returned by getPendingDelayRenders().
 */
export interface PendingDelayRender {
  handle: number;
  label: string;
  /** Age in milliseconds since the handle was created. */
  age: number;
}

declare global {
  interface Window {
    __FRAMELY_DELAY_RENDER: {
      pending: Map<number, DelayRenderHandle>;
      isPending: () => boolean;
      getPendingCount: () => number;
      getLabels: () => string[];
    };
    __FRAMELY_RENDER_ERROR?: {
      message: string;
      stack?: string;
      componentStack?: string | null;
    };
  }
}

// Global state for tracking delay render handles
let handleCounter: number = 0;
const pendingHandles: Map<number, DelayRenderHandle> = new Map();
const DEFAULT_TIMEOUT: number = 30000; // 30 seconds

/**
 * Initialize the global delay render state.
 * Called automatically when the module loads.
 */
function initDelayRenderState(): void {
  if (typeof window !== 'undefined') {
    window.__FRAMELY_DELAY_RENDER = {
      pending: pendingHandles,
      isPending: () => pendingHandles.size > 0,
      getPendingCount: () => pendingHandles.size,
      getLabels: () => Array.from(pendingHandles.values()).map(h => h.label),
    };
  }
}

// Initialize on module load
initDelayRenderState();

/**
 * Signals that the current frame should not be captured until
 * continueRender() is called with the returned handle.
 *
 * Use this when loading assets or fetching data that must be
 * displayed in the frame.
 *
 * @param {string | DelayRenderOptions} [label] - Optional label for debugging (shown in timeout errors), or an options object
 * @param {DelayRenderOptions} [options]
 * @param {number} [options.timeoutInMilliseconds=30000] - Timeout before throwing
 * @param {number} [options.retries=0] - Number of retries on timeout
 * @returns {number} Handle to pass to continueRender()
 *
 * Usage:
 *   const handle = delayRender('Loading profile image');
 *   fetch('/api/image')
 *     .then(data => {
 *       setImage(data);
 *       continueRender(handle);
 *     })
 *     .catch(err => cancelRender(err));
 */
export function delayRender(
  label?: string | DelayRenderOptions,
  options: DelayRenderOptions = {},
): number {
  const {
    timeoutInMilliseconds = DEFAULT_TIMEOUT,
    retries = 0,
  } = typeof label === 'object' ? label : options;

  const actualLabel: string = typeof label === 'string' ? label : 'Unnamed delay';
  const handle: number = ++handleCounter;

  const handleData: DelayRenderHandle = {
    handle,
    label: actualLabel,
    createdAt: Date.now(),
    timeoutInMilliseconds,
    retries,
    retriesRemaining: retries,
    timeoutId: null,
  };

  // Set up timeout
  if (typeof window !== 'undefined' && timeoutInMilliseconds > 0) {
    handleData.timeoutId = setTimeout(() => {
      if (pendingHandles.has(handle)) {
        const error = new Error(
          `delayRender() timed out after ${timeoutInMilliseconds}ms.\n` +
          `Label: "${actualLabel}"\n` +
          `Handle: ${handle}\n\n` +
          `This usually means:\n` +
          `- An asset failed to load (image, video, font)\n` +
          `- A fetch request never completed\n` +
          `- continueRender() was never called\n\n` +
          `Make sure to call continueRender(handle) when your async operation completes.`
        );
        error.name = 'DelayRenderTimeoutError';

        // Check if we should retry
        if (handleData.retriesRemaining > 0) {
          handleData.retriesRemaining--;
          console.warn(`delayRender retry (${retries - handleData.retriesRemaining}/${retries}): ${actualLabel}`);
          // Reset timeout
          handleData.timeoutId = setTimeout(() => {
            if (pendingHandles.has(handle)) {
              cancelRender(error);
            }
          }, timeoutInMilliseconds);
        } else {
          cancelRender(error);
        }
      }
    }, timeoutInMilliseconds);
  }

  pendingHandles.set(handle, handleData);

  return handle;
}

/**
 * Signals that the async operation for the given handle has completed.
 * The frame can now be captured (if no other handles are pending).
 *
 * @param {number} handle - The handle returned by delayRender()
 *
 * Usage:
 *   const handle = delayRender('Loading data');
 *   fetchData().then(() => continueRender(handle));
 */
export function continueRender(handle: number): void {
  const handleData = pendingHandles.get(handle);

  if (!handleData) {
    console.warn(
      `continueRender() called with unknown handle: ${handle}. ` +
      `It may have already been continued or timed out.`
    );
    return;
  }

  // Clear timeout
  if (handleData.timeoutId) {
    clearTimeout(handleData.timeoutId);
  }

  pendingHandles.delete(handle);
}

/**
 * Cancels the render with an error. Use this when an unrecoverable
 * error occurs (e.g., asset failed to load, API error).
 *
 * @param {Error|string} error - The error that caused the cancellation
 *
 * Usage:
 *   fetch('/api/data')
 *     .catch(err => cancelRender(err));
 */
export function cancelRender(error: Error | string): never {
  const errorObj: Error = error instanceof Error ? error : new Error(String(error));

  // Clear all pending handles
  for (const [handle, data] of pendingHandles) {
    if (data.timeoutId) {
      clearTimeout(data.timeoutId);
    }
  }
  pendingHandles.clear();

  // Expose the error globally for the renderer to catch
  if (typeof window !== 'undefined') {
    window.__FRAMELY_RENDER_ERROR = errorObj;

    // Also dispatch an event for any listeners
    window.dispatchEvent(new CustomEvent('framely-render-error', {
      detail: { error: errorObj }
    }));
  }

  // In development, also throw to show in console
  console.error('Render cancelled:', errorObj);

  throw errorObj;
}

/**
 * Check if there are any pending delay render handles.
 *
 * @returns {boolean}
 */
export function isDelayRenderPending(): boolean {
  return pendingHandles.size > 0;
}

/**
 * Get information about all pending delay render handles.
 * Useful for debugging.
 *
 * @returns {Array<PendingDelayRender>}
 */
export function getPendingDelayRenders(): PendingDelayRender[] {
  const now = Date.now();
  return Array.from(pendingHandles.values()).map(data => ({
    handle: data.handle,
    label: data.label,
    age: now - data.createdAt,
  }));
}

/**
 * Clear all pending delay render handles.
 * Use with caution - mainly for testing/cleanup.
 */
export function clearAllDelayRenders(): void {
  for (const [handle, data] of pendingHandles) {
    if (data.timeoutId) {
      clearTimeout(data.timeoutId);
    }
  }
  pendingHandles.clear();
}

export default {
  delayRender,
  continueRender,
  cancelRender,
  isDelayRenderPending,
  getPendingDelayRenders,
  clearAllDelayRenders,
};
