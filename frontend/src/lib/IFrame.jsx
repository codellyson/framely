import { useEffect, useRef, useState } from 'react';
import { delayRender, continueRender, cancelRender } from './delayRender';

/**
 * IFrame component that delays rendering until the iframe content is loaded.
 *
 * Useful for embedding web content, charts, maps, or other external content
 * that needs to be fully loaded before capturing the frame.
 *
 * Props:
 *   src                - URL to load in the iframe
 *   delayRenderTimeout - Timeout in ms before failing (default: 30000)
 *   onLoad             - Callback when iframe loads
 *   onError            - Callback when iframe fails to load
 *   style              - CSS styles
 *   className          - CSS class name
 *   ...rest            - Standard iframe props
 *
 * Usage:
 *   <IFrame
 *     src="https://example.com/chart"
 *     style={{ width: 800, height: 600 }}
 *   />
 */
export function IFrame({
  src,
  delayRenderTimeout = 30000,
  onLoad,
  onError,
  style,
  className,
  ...rest
}) {
  const iframeRef = useRef(null);
  const handleRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  // Delay render until iframe is loaded
  useEffect(() => {
    handleRef.current = delayRender(`Loading iframe: ${src}`, {
      timeoutInMilliseconds: delayRenderTimeout,
    });

    return () => {
      if (handleRef.current !== null) {
        continueRender(handleRef.current);
        handleRef.current = null;
      }
    };
  }, [src, delayRenderTimeout]);

  // Handle iframe load
  const handleLoad = (event) => {
    setLoaded(true);
    onLoad?.(event);

    if (handleRef.current !== null) {
      continueRender(handleRef.current);
      handleRef.current = null;
    }
  };

  // Handle iframe error
  const handleError = (event) => {
    const err = new Error(`Failed to load iframe: ${src}`);
    onError?.(event);

    if (handleRef.current !== null) {
      cancelRender(err);
      handleRef.current = null;
    }
  };

  return (
    <iframe
      ref={iframeRef}
      src={src}
      onLoad={handleLoad}
      onError={handleError}
      style={{
        border: 'none',
        ...style,
        opacity: loaded ? (style?.opacity ?? 1) : 0,
      }}
      className={className}
      {...rest}
    />
  );
}

export default IFrame;
