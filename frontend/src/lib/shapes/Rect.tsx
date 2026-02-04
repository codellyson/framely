/**
 * SVG Rectangle with animation-friendly props.
 */

import React, { forwardRef } from 'react';

export interface RectProps extends React.SVGAttributes<SVGRectElement> {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  rx?: number | string;
  ry?: number | string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;
}

export const Rect = forwardRef<SVGRectElement, RectProps>(function Rect(
  { x = 0, y = 0, width, height, rx, ry, fill = 'none', stroke, strokeWidth = 1, opacity, style, ...props },
  ref,
) {
  return (
    <rect
      ref={ref}
      x={x}
      y={y}
      width={width}
      height={height}
      rx={rx}
      ry={ry}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
      style={style}
      {...props}
    />
  );
});

Rect.displayName = 'Rect';
export default Rect;
