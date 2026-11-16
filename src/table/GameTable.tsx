import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '../types';
import { useStore } from '../store/store';
import { MapCanvas, type MapApi } from './MapCanvas';
import { MapImporter, useMapImport } from './MapImporter';
import { GridPanel } from './GridPanel';
import { FigurineManager } from './FigurineManager';
import { QuickCard } from './QuickCard';
import { useMapImage } from './useMapImage';
import { freeSpot } from './geometry';
import { IconButton } from '../components/ui';
import { Icon } from '../components/Icon';

function useWide() {
  const q = '(min-width: 1024px)';
  const [wide, setWide] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide;
}

export function GameTable({ session }: { session: Session }) {
  const api = useRef<MapApi>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { url, error, loading } = useMapImage(session.map);
  const { importFile } = useMapImport();
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const place = useStore((s) => s.placeFigurine);
  const toast = useStore((s) => s.toast);
  const wide = useWide();
  const [partyOpen, setPartyOpen] = useState(false);
  const [gridOpen, setGridOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [dropping, setDropping] = useState(false);
  const selected = session.characters.find((c) => c.id === selectedId && session.figurines[c.id]?.onTable);
  const showParty = wide || partyOpen;

  const onScale = useCallback((s: number) => setZoom(s), []);

  const onPlace = (id: string) => {
    if (!session.map) {
      toast('Add a map first, then place figurines on it.');
      return;
    }
    const center = api.current?.viewCenter() ?? { x: session.map.width / 2, y: session.map.height / 2 };
    const taken = Object.values(session.figurines);
    const p = freeSpot(center.x, center.y, session.grid, taken, session.map.width, session.map.height);
    place(id, p.x, p.y);
    select(id);
    if (!wide) setPartyOpen(false);
  };

  const onFocus = (id: string) => {
    const f = session.figurines[id];
    if (!f) return;
    select(id);
    api.current?.centerOn(f.x, f.y);
    if (!wide) setPartyOpen(false);
  };

  return (
    <div className="absolute inset-0 flex">
      {showParty && (
        <div className={wide ? 'relative z-10 h-full' : 'absolute inset-y-0 left-0 z-30 h-full shadow-lift animate-rise'}>
          <FigurineManager session={session} onFocus={onFocus} onPlace={onPlace} onReplaceMap={() => fileRef.current?.click()} onClose={wide ? undefined : () => setPartyOpen(false)} />
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          importFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <div
        className="relative min-w-0 flex-1 overflow-hidden"
        onDragOver={(e) => {
          if (session.map && e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            setDropping(true);
          }
        }}
        onDragLeave={() => setDropping(false)}
        onDrop={(e) => {
          if (!session.map) return;
          e.preventDefault();
          setDropping(false);
          importFile(e.dataTransfer.files[0]);
        }}
      >
        {!session.map && <MapImporter />}
        {session.map && loading && <div className="absolute inset-0 flex items-center justify-center text-muted">Unrolling the map…</div>}
        {session.map && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-muted">{error}</p>
            <button type="button" className="font-semibold text-cocoa underline" onClick={() => fileRef.current?.click()}>
              Upload the map again
            </button>
          </div>
        )}
        {session.map && url && <MapCanvas key={session.map.id} ref={api} session={session} url={url} onScale={onScale} />}

        {dropping && (
          <div className="pointer-events-none absolute inset-4 z-30 flex items-center justify-center rounded-3xl border-[3px] border-dashed border-cocoa bg-surface/70 font-display text-[22px] font-semibold text-cocoa">
            Drop to replace the map
          </div>
        )}

        {/* Top-left: party toggle (narrow) and selected character */}
        <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-col items-start gap-3">
          {!wide && !partyOpen && (
            <button
              type="button"
              onClick={() => setPartyOpen(true)}
              className="pointer-events-auto flex min-h-11 items-center gap-2 rounded-2xl bg-surface px-4 text-[14px] font-semibold text-cocoa shadow-soft"
            >
              <Icon name="users" size={18} /> Party · {session.characters.length}
            </button>
          )}
          {selected && (
            <div className="pointer-events-auto">
              <QuickCard key={selected.id} c={selected} />
            </div>
          )}
        </div>

        {/* Top-right: grid settings */}
        {session.map && (
          <div className="absolute right-3 top-3 z-20 flex flex-col items-end gap-2">
            {!gridOpen && (
              <button type="button" onClick={() => setGridOpen(true)} className="flex min-h-11 items-center gap-2 rounded-2xl bg-surface px-4 text-[14px] font-semibold text-cocoa shadow-soft" aria-expanded={gridOpen}>
                <Icon name="grid" size={18} /> Grid
              </button>
            )}
            {gridOpen && <GridPanel session={session} onClose={() => setGridOpen(false)} />}
          </div>
        )}

        {/* Bottom-left: camera controls */}
        {session.map && url && (
          <div className="absolute bottom-3 left-3 z-20 flex items-end gap-2" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex flex-col gap-1 rounded-2xl bg-surface p-1.5 shadow-soft">
              <IconButton icon="plus" label="Zoom in" onClick={() => api.current?.zoomBy(1.25)} />
              <IconButton icon="minus" label="Zoom out" onClick={() => api.current?.zoomBy(1 / 1.25)} />
              <IconButton icon="fit" label="Fit map to screen" onClick={() => api.current?.fit()} />
            </div>
            <span className="rounded-xl bg-surface/90 px-3 py-2 text-[12px] font-medium text-muted tabular-nums shadow-soft">{Math.round(zoom * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
