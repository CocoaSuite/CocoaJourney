import type { Camera, Figurine, GridSettings } from '../types';

export const MIN_SCALE = 0.08;
export const MAX_SCALE = 6;

export const clampScale = (s: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));

/** Snap a figurine centre so its footprint covers whole cells. */
export function snapPoint(x: number, y: number, grid: GridSettings, size = 1) {
  const c = grid.cellSize;
  const half = (size * c) / 2;
  return {
    x: grid.offsetX + Math.round((x - grid.offsetX - half) / c) * c + half,
    y: grid.offsetY + Math.round((y - grid.offsetY - half) / c) * c + half,
  };
}

export function fitCamera(vw: number, vh: number, mw: number, mh: number, pad = 0.94): Camera {
  const scale = clampScale(Math.min(vw / mw, vh / mh) * pad);
  return { scale, x: (vw - mw * scale) / 2, y: (vh - mh * scale) / 2 };
}

export const screenToWorld = (cam: Camera, sx: number, sy: number) => ({ x: (sx - cam.x) / cam.scale, y: (sy - cam.y) / cam.scale });

/** Zoom around a screen point, keeping the world point under it fixed. */
export function zoomAt(cam: Camera, sx: number, sy: number, nextScale: number): Camera {
  const scale = clampScale(nextScale);
  const w = screenToWorld(cam, sx, sy);
  return { scale, x: sx - w.x * scale, y: sy - w.y * scale };
}

/** Find a free cell near (x, y) for a new figurine. */
export function freeSpot(x: number, y: number, grid: GridSettings, taken: Figurine[], mw: number, mh: number) {
  const c = grid.cellSize;
  const start = snapPoint(x, y, grid);
  const occupied = (p: { x: number; y: number }) => taken.some((f) => f.onTable && Math.abs(f.x - p.x) < c * 0.6 && Math.abs(f.y - p.y) < c * 0.6);
  for (let r = 0; r < 12; r++) {
    for (let dx = -r; dx <= r; dx++)
      for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const p = { x: start.x + dx * c, y: start.y + dy * c };
        if (p.x < 0 || p.y < 0 || p.x > mw || p.y > mh) continue;
        if (!occupied(p)) return p;
      }
  }
  return start;
}

/** Figurine art box relative to the base centre, in world units. */
export function figureBox(cell: number, size: number) {
  const w = cell * size * 1.36;
  const h = (w * 172) / 120;
  return { w, h, ax: w / 2, ay: h * (158 / 172) };
}
