/**
 * SVG Circle with animation-friendly props.
 */

import React, { forwardRef } from 'react';

export interface CircleProps extends React.SVGAttributes<SVGCircleElement> {
  cx?: number | string;
  cy?: number | string;
  r?: number | string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;
}

export const Circle = forwardRef<SVGCircleElement, CircleProps>(function Circle(
  { cx, cy, r, fill = 'none', stroke, strokeWidth = 1, opacity, style, ...props },
  ref,
) {
  return (
    <circle
      ref={ref}
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
      style={style}
      {...props}
    />
  );
});

Circle.displayName = 'Circle';
export default Circle;
