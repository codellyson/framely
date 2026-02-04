/**
 * SVG Polygon with animation-friendly props.
 *
 * @param points - SVG points string or array of [x, y] pairs
 */

import React, { forwardRef } from 'react';

export interface PolygonProps extends Omit<React.SVGAttributes<SVGPolygonElement>, 'points'> {
  points?: string | Array<[number, number]>;
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;
}

export const Polygon = forwardRef<SVGPolygonElement, PolygonProps>(function Polygon(
  { points, fill = 'none', stroke = 'white', strokeWidth = 1, opacity, style, ...props },
  ref,
) {
  const pointsStr = Array.isArray(points)
    ? points.map(([x, y]) => `${x},${y}`).join(' ')
    : points;

  return (
    <polygon
      ref={ref}
      points={pointsStr}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
      style={style}
      {...props}
    />
  );
});

Polygon.displayName = 'Polygon';
export default Polygon;
