import { memo } from 'react';
import type { GridSettings } from '../types';

/** Square grid drawn over the map. Never touches the map image itself. */
export const GridOverlay = memo(function GridOverlay({ width, height, grid }: { width: number; height: number; grid: GridSettings }) {
  if (!grid.visible) return null;
  const c = Math.max(4, grid.cellSize);
  const ox = ((grid.offsetX % c) + c) % c;
  const oy = ((grid.offsetY % c) + c) % c;
  let d = '';
  for (let x = ox; x <= width; x += c) d += `M${x} 0V${height}`;
  for (let y = oy; y <= height; y += c) d += `M0 ${y}H${width}`;
  return (
    <svg className="pointer-events-none absolute inset-0" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={d} stroke={grid.color} strokeOpacity={grid.opacity} strokeWidth={1.25} vectorEffect="non-scaling-stroke" fill="none" shapeRendering="crispEdges" />
    </svg>
  );
});
