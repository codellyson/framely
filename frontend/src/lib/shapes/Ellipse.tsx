/**
 * SVG Ellipse with animation-friendly props.
 */

import React, { forwardRef } from 'react';

export interface EllipseProps extends React.SVGAttributes<SVGEllipseElement> {
  cx?: number | string;
  cy?: number | string;
  rx?: number | string;
  ry?: number | string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;
}

export const Ellipse = forwardRef<SVGEllipseElement, EllipseProps>(function Ellipse(
  { cx, cy, rx, ry, fill = 'none', stroke, strokeWidth = 1, opacity, style, ...props },
  ref,
) {
  return (
    <ellipse
      ref={ref}
      cx={cx}
      cy={cy}
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

Ellipse.displayName = 'Ellipse';
export default Ellipse;
