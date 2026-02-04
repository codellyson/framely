import React, { useEffect, useRef, useState } from 'react';
import { delayRender, continueRender, cancelRender } from './delayRender';

/**
 * Props for the Img component.
 *
 * Extends standard HTML img attributes with additional props
 * for controlling image loading behavior during rendering.
 */
export interface ImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Image source URL. Use staticFile() for local assets. */
  src: string;
  /** Callback when the image fails to load after all retries. */
  onError?: React.ReactEventHandler<HTMLImageElement>;
  /** Number of retry attempts on load failure. Defaults to 2. */
  maxRetries?: number;
  /** Pause playback while loading in preview mode. Defaults to false. */
  pauseWhenLoading?: boolean;
  /** Custom timeout in milliseconds for delayRender. Defaults to 30000. */
  delayRenderTimeout?: number;
  /** Number of retries for delay render timeout. Defaults to 0. */
  delayRenderRetries?: number;
}

/**
 * Image component that delays rendering until the image is loaded.
 *
 * This ensures that images are always visible in rendered frames,
 * preventing blank spaces or loading states in the final video.
 *
 * Usage:
 *   import { Img, staticFile } from './lib';
 *
 *   <Img src={staticFile('images/hero.png')} alt="Hero" />
 *   <Img src="https://example.com/image.jpg" style={{ width: 200 }} />
 */
export const Img = React.forwardRef<HTMLImageElement, ImgProps>(
  (
    {
      src,
      onError,
      maxRetries = 2,
      pauseWhenLoading = false,
      delayRenderTimeout = 30000,
      delayRenderRetries = 0,
      ...rest
    },
    forwardedRef,
  ) => {
    const [loaded, setLoaded] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [retryCount, setRetryCount] = useState<number>(0);
    const handleRef = useRef<number | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    // Merge forwarded ref and internal ref
    const setRefs = React.useCallback(
      (node: HTMLImageElement | null) => {
        imgRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLImageElement | null>).current = node;
        }
      },
      [forwardedRef],
    );

    // Initialize delay render on mount
    useEffect(() => {
      handleRef.current = delayRender(`Loading image: ${src}`, {
        timeoutInMilliseconds: delayRenderTimeout,
        retries: delayRenderRetries,
      });

      return () => {
        // Cleanup if component unmounts before load
        if (handleRef.current !== null) {
          continueRender(handleRef.current);
          handleRef.current = null;
        }
      };
    }, [src, delayRenderTimeout, delayRenderRetries]);

    // Handle image load
    const handleLoad = (): void => {
      setLoaded(true);
      setError(null);

      if (handleRef.current !== null) {
        continueRender(handleRef.current);
        handleRef.current = null;
      }
    };

    // Handle image error
    const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>): void => {
      if (retryCount < maxRetries) {
        // Retry by forcing a new request
        setRetryCount((c) => c + 1);
        if (imgRef.current) {
          // Add cache-busting query param
          const separator = src.includes('?') ? '&' : '?';
          imgRef.current.src = `${src}${separator}_retry=${retryCount + 1}`;
        }
        return;
      }

      const err = new Error(`Failed to load image: ${src}`);
      setError(err);
      onError?.(event);

      // Cancel the render - image is required
      if (handleRef.current !== null) {
        cancelRender(err);
        handleRef.current = null;
      }
    };

    // Check if image is already cached (loads synchronously)
    useEffect(() => {
      if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
        handleLoad();
      }
    }, [src]);

    return (
      <img
        ref={setRefs}
        src={src}
        onLoad={handleLoad}
        onError={handleError}
        {...rest}
        // Hide image until loaded to prevent flash of broken image
        style={{
          ...rest.style,
          opacity: loaded ? (rest.style?.opacity ?? 1) : 0,
        }}
      />
    );
  },
);

Img.displayName = 'Img';

export default Img;
