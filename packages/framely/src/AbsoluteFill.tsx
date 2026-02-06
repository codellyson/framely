import React from 'react';

/**
 * Props for the AbsoluteFill component.
 * Extends standard HTML div attributes so callers can pass
 * any valid div prop (className, onClick, aria-*, etc.).
 */
export interface AbsoluteFillProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional inline styles merged on top of the base layout styles. */
  style?: React.CSSProperties;
  /** Content rendered inside the absolutely-positioned container. */
  children?: React.ReactNode;
}

const absoluteFillStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

/**
 * A full-size, absolutely positioned container.
 * The building block for layering elements in a composition.
 */
export const AbsoluteFill = React.forwardRef<
  HTMLDivElement,
  AbsoluteFillProps
>(({ style, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      style={{
        ...absoluteFillStyle,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
});

AbsoluteFill.displayName = 'AbsoluteFill';
