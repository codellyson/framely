/**
 * usePathLength Hook
 *
 * Returns the total length of an SVG path element.
 * Useful for draw-on animations with strokeDasharray/strokeDashoffset.
 *
 * @param ref - Ref to an SVG geometry element (path, circle, rect, etc.)
 * @returns Total path length (0 if ref is not yet mounted)
 *
 * @example
 * const pathRef = useRef<SVGPathElement>(null);
 * const length = usePathLength(pathRef);
 *
 * <Path
 *   ref={pathRef}
 *   d="M10 80 Q 95 10 180 80"
 *   strokeDasharray={length}
 *   strokeDashoffset={interpolate(frame, [0, 60], [length, 0])}
 * />
 */

import React, { useState, useEffect } from 'react';

export function usePathLength(
  ref: React.RefObject<SVGGeometryElement | null>,
): number {
  const [length, setLength] = useState<number>(0);

  useEffect(() => {
    if (ref.current && typeof ref.current.getTotalLength === 'function') {
      setLength(ref.current.getTotalLength());
    }
  });

  return length;
}

export default usePathLength;
