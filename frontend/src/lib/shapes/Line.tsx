/**
 * SVG Line with animation-friendly props.
 */

import React, { forwardRef } from 'react';

export interface LineProps extends React.SVGAttributes<SVGLineElement> {
  x1?: number | string;
  y1?: number | string;
  x2?: number | string;
  y2?: number | string;
  stroke?: string;
  strokeWidth?: number | string;
}

export const Line = forwardRef<SVGLineElement, LineProps>(function Line(
  { x1, y1, x2, y2, stroke = 'white', strokeWidth = 1, opacity, style, ...props },
  ref,
) {
  return (
    <line
      ref={ref}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
      style={style}
      {...props}
    />
  );
});

Line.displayName = 'Line';
export default Line;
