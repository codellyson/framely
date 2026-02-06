import React, { useEffect, useRef, useState } from 'react';
import { delayRender, continueRender, cancelRender } from './delayRender';

/**
 * Props for the IFrame component.
 *
 * Extends standard iframe HTML attributes so all native iframe props
 * (e.g., sandbox, allow, referrerPolicy) are supported.
 */
export interface IFrameProps
  extends React.IframeHTMLAttributes<HTMLIFrameElement> {
  /** URL to load in the iframe. */
  src?: string;
  /** Timeout in ms before failing the delay render. Defaults to 30000. */
  delayRenderTimeout?: number;
}

/**
 * IFrame component that delays rendering until the iframe content is loaded.
 *
 * Useful for embedding web content, charts, maps, or other external content
 * that needs to be fully loaded before capturing the frame.
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
}: IFrameProps): React.ReactElement {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const handleRef = useRef<number | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);

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
  const handleLoad = (
    event: React.SyntheticEvent<HTMLIFrameElement>,
  ): void => {
    setLoaded(true);
    onLoad?.(event);

    if (handleRef.current !== null) {
      continueRender(handleRef.current);
      handleRef.current = null;
    }
  };

  // Handle iframe error
  const handleError = (
    event: React.SyntheticEvent<HTMLIFrameElement>,
  ): void => {
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
