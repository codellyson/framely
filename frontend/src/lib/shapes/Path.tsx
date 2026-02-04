/**
 * SVG Path with draw-on animation support.
 *
 * Use strokeDasharray + strokeDashoffset with interpolate() for draw-on effects.
 * Use usePathLength() to get the total path length for dash calculations.
 */

import React, { forwardRef } from 'react';

export interface PathProps extends React.SVGAttributes<SVGPathElement> {
  d?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;
  strokeDasharray?: string | number;
  strokeDashoffset?: string | number;
  strokeLinecap?: 'butt' | 'round' | 'square' | 'inherit';
  strokeLinejoin?: 'miter' | 'round' | 'bevel' | 'inherit';
}

export const Path = forwardRef<SVGPathElement, PathProps>(function Path(
  {
    d,
    fill = 'none',
    stroke = 'white',
    strokeWidth = 2,
    strokeDasharray,
    strokeDashoffset,
    strokeLinecap = 'round',
    strokeLinejoin = 'round',
    opacity,
    style,
    ...props
  },
  ref,
) {
  return (
    <path
      ref={ref}
      d={d}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      strokeDashoffset={strokeDashoffset}
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      opacity={opacity}
      style={style}
      {...props}
    />
  );
});

Path.displayName = 'Path';
export default Path;
