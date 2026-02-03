import { useEffect, useRef, useState } from 'react';
import { delayRender, continueRender, cancelRender } from './delayRender';

/**
 * Image component that delays rendering until the image is loaded.
 *
 * This ensures that images are always visible in rendered frames,
 * preventing blank spaces or loading states in the final video.
 *
 * Props:
 *   src                - Image source URL (use staticFile() for local assets)
 *   onError            - Callback when image fails to load
 *   maxRetries         - Number of retry attempts (default: 2)
 *   pauseWhenLoading   - Pause playback while loading in preview mode
 *   delayRenderTimeout - Custom timeout in ms (default: 30000)
 *   delayRenderRetries - Retries for delay render timeout (default: 0)
 *   ...rest            - Standard img props (alt, style, className, etc.)
 *
 * Usage:
 *   import { Img, staticFile } from './lib';
 *
 *   <Img src={staticFile('images/hero.png')} alt="Hero" />
 *   <Img src="https://example.com/image.jpg" style={{ width: 200 }} />
 */
export function Img({
  src,
  onError,
  maxRetries = 2,
  pauseWhenLoading = false,
  delayRenderTimeout = 30000,
  delayRenderRetries = 0,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const handleRef = useRef(null);
  const imgRef = useRef(null);

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
  const handleLoad = () => {
    setLoaded(true);
    setError(null);

    if (handleRef.current !== null) {
      continueRender(handleRef.current);
      handleRef.current = null;
    }
  };

  // Handle image error
  const handleError = (event) => {
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
      ref={imgRef}
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
}

export default Img;
