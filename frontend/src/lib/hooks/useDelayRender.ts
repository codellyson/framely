import { useEffect, useRef, useCallback } from 'react';
import { delayRender, continueRender, DelayRenderOptions } from '../delayRender';

/**
 * Return type for the useDelayRender hook.
 */
export interface UseDelayRenderReturn {
  /** Call this to signal that the async operation has completed. */
  continueRender: () => void;
  /** Whether the hook is still waiting (continueRender has not been called yet). */
  isWaiting: boolean;
}

/**
 * Hook for managing delay render in React components.
 *
 * Automatically handles cleanup on unmount and provides a cleaner API
 * than using delayRender/continueRender directly.
 *
 * @param {string} [label] - Label for debugging timeout errors
 * @param {object} [options]
 * @param {number} [options.timeoutInMilliseconds=30000] - Timeout before throwing
 * @param {number} [options.retries=0] - Number of retries on timeout
 * @returns {{ continueRender: () => void, isWaiting: boolean }}
 *
 * Usage:
 *   function MyComponent() {
 *     const [data, setData] = useState(null);
 *     const { continueRender } = useDelayRender('Loading data');
 *
 *     useEffect(() => {
 *       fetchData().then(d => {
 *         setData(d);
 *         continueRender();
 *       });
 *     }, [continueRender]);
 *
 *     return data ? <div>{data}</div> : null;
 *   }
 */
export function useDelayRender(
  label?: string | DelayRenderOptions,
  options: DelayRenderOptions = {},
): UseDelayRenderReturn {
  const handleRef = useRef<number | null>(null);
  const continuedRef = useRef<boolean>(false);

  // Create the handle on mount
  useEffect(() => {
    const actualLabel: string = typeof label === 'string' ? label : 'useDelayRender';
    const actualOptions: DelayRenderOptions = typeof label === 'object' ? label : options;

    handleRef.current = delayRender(actualLabel, actualOptions);
    continuedRef.current = false;

    // Cleanup on unmount - continue if not already done
    return () => {
      if (handleRef.current !== null && !continuedRef.current) {
        continueRender(handleRef.current);
        continuedRef.current = true;
      }
    };
  }, []); // Only run on mount/unmount

  // Stable callback to continue rendering
  const continueRenderCallback = useCallback((): void => {
    if (handleRef.current !== null && !continuedRef.current) {
      continueRender(handleRef.current);
      continuedRef.current = true;
    }
  }, []);

  return {
    continueRender: continueRenderCallback,
    isWaiting: !continuedRef.current,
  };
}

/**
 * Hook that delays render while a condition is true.
 *
 * @param {boolean} condition - If true, delays render
 * @param {string} [label] - Label for debugging
 * @param {object} [options] - Same options as useDelayRender
 *
 * Usage:
 *   const [isLoading, setIsLoading] = useState(true);
 *   useDelayRenderWhile(isLoading, 'Waiting for data');
 */
export function useDelayRenderWhile(
  condition: boolean,
  label?: string,
  options: DelayRenderOptions = {},
): void {
  const handleRef = useRef<number | null>(null);

  useEffect(() => {
    if (condition && handleRef.current === null) {
      // Start delaying
      handleRef.current = delayRender(label || 'useDelayRenderWhile', options);
    } else if (!condition && handleRef.current !== null) {
      // Stop delaying
      continueRender(handleRef.current);
      handleRef.current = null;
    }

    // Cleanup
    return () => {
      if (handleRef.current !== null) {
        continueRender(handleRef.current);
        handleRef.current = null;
      }
    };
  }, [condition, label]);
}

export default useDelayRender;
