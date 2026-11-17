import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from 'react';
import type { Camera, Character, Figurine as FigurineData, Session } from '../types';
import { useStore } from '../store/store';
import { clampScale, figureBox, fitCamera, screenToWorld, snapPoint, zoomAt } from './geometry';
import { GridOverlay } from './GridOverlay';
import { Figurine } from './Figurine';

export interface MapApi {
  fit: () => void;
  zoomBy: (f: number) => void;
  centerOn: (x: number, y: number) => void;
  viewCenter: () => { x: number; y: number };
  scale: () => number;
}

interface Props {
  session: Session;
  url: string;
  ref?: Ref<MapApi>;
  onScale?: (s: number) => void;
}

type Gesture =
  | { kind: 'none' }
  | { kind: 'pan'; id: number; lastX: number; lastY: number; moved: number }
  | { kind: 'pinch'; ids: [number, number]; startDist: number; startCam: Camera; startMid: { x: number; y: number } }
  | {
      kind: 'figure';
      id: number;
      charId: string;
      startX: number;
      startY: number;
      origin: { x: number; y: number };
      moved: boolean;
      el: HTMLElement;
      size: number;
    };

/**
 * The tabletop surface. Camera and drag positions are applied straight to the
 * DOM during gestures (no React re-render per frame) and committed to the store
 * when a gesture ends.
 */
export function MapCanvas({ session, url, ref, onScale }: Props) {
  const { map, grid } = session;
  const viewport = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const cam = useRef<Camera>(session.camera ?? { x: 0, y: 0, scale: 1 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<Gesture>({ kind: 'none' });
  const saveTimer = useRef<number>(0);
  const [ready, setReady] = useState(false);

  const select = useStore((s) => s.select);
  const selectedId = useStore((s) => s.selectedId);
  const moveFigurine = useStore((s) => s.moveFigurine);
  const setCamera = useStore((s) => s.setCamera);

  const apply = useCallback(() => {
    const c = cam.current;
    const w = world.current;
    if (w) {
      w.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) scale(${c.scale})`;
      w.style.setProperty('--inv', String(1 / c.scale));
    }
    onScale?.(c.scale);
  }, [onScale]);

  const persist = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setCamera({ ...cam.current }), 350);
  }, [setCamera]);

  const fit = useCallback(() => {
    const v = viewport.current;
    if (!v || !map) return;
    cam.current = fitCamera(v.clientWidth, v.clientHeight, map.width, map.height);
    apply();
    persist();
  }, [map, apply, persist]);

  const zoomBy = useCallback(
    (f: number) => {
      const v = viewport.current;
      if (!v) return;
      cam.current = zoomAt(cam.current, v.clientWidth / 2, v.clientHeight / 2, cam.current.scale * f);
      apply();
      persist();
    },
    [apply, persist],
  );

  useImperativeHandle(
    ref,
    () => ({
      fit,
      zoomBy,
      centerOn: (x, y) => {
        const v = viewport.current;
        if (!v) return;
        const s = Math.max(cam.current.scale, 0.6);
        cam.current = { scale: s, x: v.clientWidth / 2 - x * s, y: v.clientHeight / 2 - y * s };
        world.current?.classList.add('transition-transform', 'duration-300');
        apply();
        setTimeout(() => world.current?.classList.remove('transition-transform', 'duration-300'), 320);
        persist();
      },
      viewCenter: () => {
        const v = viewport.current!;
        return screenToWorld(cam.current, v.clientWidth / 2, v.clientHeight / 2);
      },
      scale: () => cam.current.scale,
    }),
    [fit, zoomBy, apply, persist],
  );

  // First layout: restore the saved camera or fit the map.
  useLayoutEffect(() => {
    if (session.camera) cam.current = { ...session.camera };
    else if (viewport.current && map) cam.current = fitCamera(viewport.current.clientWidth, viewport.current.clientHeight, map.width, map.height);
    apply();
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map?.id]);

  // Wheel zoom needs a non-passive listener to stop page zoom.
  useEffect(() => {
    const v = viewport.current;
    if (!v) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = v.getBoundingClientRect();
      const k = e.ctrlKey ? 0.012 : 0.0016;
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      cam.current = zoomAt(cam.current, e.clientX - r.left, e.clientY - r.top, cam.current.scale * Math.exp(-delta * k));
      apply();
      persist();
    };
    v.addEventListener('wheel', onWheel, { passive: false });
    return () => v.removeEventListener('wheel', onWheel);
  }, [apply, persist]);

  // Keep the map centred when the viewport is resized (rotation, sidebar).
  useEffect(() => {
    const v = viewport.current;
    if (!v) return;
    let w = v.clientWidth;
    let h = v.clientHeight;
    const ro = new ResizeObserver(() => {
      const nw = v.clientWidth;
      const nh = v.clientHeight;
      cam.current = { ...cam.current, x: cam.current.x + (nw - w) / 2, y: cam.current.y + (nh - h) / 2 };
      w = nw;
      h = nh;
      apply();
    });
    ro.observe(v);
    return () => ro.disconnect();
  }, [apply]);

  const local = (e: { clientX: number; clientY: number }) => {
    const r = viewport.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const capture = (id: number) => {
    try {
      viewport.current?.setPointerCapture(id);
    } catch {
      /* pointer already released */
    }
  };

  const showGhost = (x: number, y: number, size: number) => {
    const g = ghost.current;
    if (!g) return;
    const s = size * grid.cellSize;
    g.style.display = 'block';
    g.style.width = g.style.height = `${s}px`;
    g.style.transform = `translate(${x - s / 2}px, ${y - s / 2}px)`;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const p = local(e);
    const figEl = (e.target as HTMLElement).closest<HTMLElement>('[data-fig]');
    const g = gesture.current;

    if (figEl && g.kind === 'none') {
      const charId = figEl.dataset.fig!;
      const f = session.figurines[charId];
      if (!f) return;
      capture(e.pointerId);
      gesture.current = { kind: 'figure', id: e.pointerId, charId, startX: p.x, startY: p.y, origin: { x: f.x, y: f.y }, moved: false, el: figEl, size: f.size };
      return;
    }
    // While a figurine is held, other touches are ignored so the map stays put.
    if (g.kind === 'figure') return;

    pointers.current.set(e.pointerId, p);
    capture(e.pointerId);
    if (pointers.current.size === 1) {
      gesture.current = { kind: 'pan', id: e.pointerId, lastX: p.x, lastY: p.y, moved: 0 };
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.entries()];
      gesture.current = {
        kind: 'pinch',
        ids: [a[0], b[0]],
        startDist: Math.hypot(a[1].x - b[1].x, a[1].y - b[1].y) || 1,
        startCam: { ...cam.current },
        startMid: { x: (a[1].x + b[1].x) / 2, y: (a[1].y + b[1].y) / 2 },
      };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const p = local(e);
    const g = gesture.current;
    if (g.kind === 'figure') {
      if (e.pointerId !== g.id) return;
      const dx = p.x - g.startX;
      const dy = p.y - g.startY;
      if (!g.moved && Math.hypot(dx, dy) < 6) return;
      if (!g.moved) {
        g.moved = true;
        g.el.classList.add('dragging');
        select(g.charId);
      }
      const s = cam.current.scale;
      g.el.style.transform = `translate(${dx / s}px, ${dy / s}px)`;
      const wx = g.origin.x + dx / s;
      const wy = g.origin.y + dy / s;
      if (grid.snap) {
        const sp = snapPoint(wx, wy, grid, g.size);
        showGhost(sp.x, sp.y, g.size);
      }
      return;
    }

    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, p);

    if (g.kind === 'pan' && e.pointerId === g.id) {
      const dx = p.x - g.lastX;
      const dy = p.y - g.lastY;
      g.lastX = p.x;
      g.lastY = p.y;
      g.moved += Math.abs(dx) + Math.abs(dy);
      cam.current = { ...cam.current, x: cam.current.x + dx, y: cam.current.y + dy };
      apply();
    } else if (g.kind === 'pinch') {
      const a = pointers.current.get(g.ids[0]);
      const b = pointers.current.get(g.ids[1]);
      if (!a || !b) return;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const scale = clampScale((g.startCam.scale * dist) / g.startDist);
      const w = screenToWorld(g.startCam, g.startMid.x, g.startMid.y);
      cam.current = { scale, x: mid.x - w.x * scale, y: mid.y - w.y * scale };
      apply();
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (g.kind === 'figure') {
      if (e.pointerId !== g.id) return;
      gesture.current = { kind: 'none' };
      if (ghost.current) ghost.current.style.display = 'none';
      g.el.classList.remove('dragging');
      if (!g.moved) {
        select(selectedId === g.charId ? null : g.charId);
        return;
      }
      const s = cam.current.scale;
      const p = local(e);
      let x = g.origin.x + (p.x - g.startX) / s;
      let y = g.origin.y + (p.y - g.startY) / s;
      if (map) {
        x = Math.max(0, Math.min(map.width, x));
        y = Math.max(0, Math.min(map.height, y));
      }
      if (grid.snap) ({ x, y } = snapPoint(x, y, grid, g.size));
      g.el.style.transform = '';
      moveFigurine(g.charId, x, y);
      return;
    }

    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);

    if (g.kind === 'pan') {
      if (g.moved < 6 && e.type === 'pointerup') select(null);
      gesture.current = { kind: 'none' };
      persist();
    } else if (g.kind === 'pinch') {
      const rest = [...pointers.current.entries()][0];
      gesture.current = rest ? { kind: 'pan', id: rest[0], lastX: rest[1].x, lastY: rest[1].y, moved: 99 } : { kind: 'none' };
      persist();
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === '+' || e.key === '=') zoomBy(1.2);
    else if (e.key === '-') zoomBy(1 / 1.2);
    else if (e.key === '0') fit();
    else if (e.key === 'Escape') select(null);
  };

  if (!map) return null;
  const onTable = session.characters.filter((c) => session.figurines[c.id]?.onTable);

  return (
    <div
      ref={viewport}
      className="absolute inset-0 touch-none overflow-hidden outline-none select-none"
      style={{ cursor: gesture.current.kind === 'pan' ? 'grabbing' : 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onLostPointerCapture={endPointer}
      onKeyDown={onKey}
      tabIndex={0}
      role="application"
      aria-label="Game table. Drag to pan, pinch or scroll to zoom, drag figurines to move them."
    >
      <div ref={world} className="absolute left-0 top-0 origin-top-left will-change-transform" style={{ width: map.width, height: map.height, opacity: ready ? 1 : 0 }}>
        <img src={url} alt={map.name} draggable={false} className="pointer-events-none absolute inset-0 h-full w-full max-w-none rounded-[6px] shadow-[0_10px_40px_rgb(51_43_37/0.25)]" />
        <GridOverlay width={map.width} height={map.height} grid={grid} />
        <div ref={ghost} className="pointer-events-none absolute left-0 top-0 hidden rounded-[6px] border-[3px] border-dashed border-[#F2C14E] bg-[#F2C14E]/20" />
        {sortByY(onTable, session.figurines).map((c) => (
          <Figurine key={c.id} character={c} fig={session.figurines[c.id]} cell={grid.cellSize} selected={selectedId === c.id} />
        ))}
      </div>
    </div>
  );
}

function sortByY(chars: Character[], figs: Record<string, FigurineData>) {
  return [...chars].sort((a, b) => figs[a.id].y - figs[b.id].y);
}

export { figureBox };
