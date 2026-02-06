/**
 * SVG container that sizes to the composition viewport.
 */

import React from 'react';
import { useTimeline } from '../context';

export interface SvgProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number | string;
  height?: number | string;
  viewBox?: string;
  children?: React.ReactNode;
}

export function Svg({ children, viewBox, style, ...props }: SvgProps) {
  const { width, height } = useTimeline();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox || `0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'visible',
        ...style,
      }}
      {...props}
    >
      {children}
    </svg>
  );
}

Svg.displayName = 'Svg';
export default Svg;
