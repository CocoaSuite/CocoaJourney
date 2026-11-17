import type { Session } from '../types';
import { useStore } from '../store/store';
import { IconButton, Slider, Toggle, cx } from '../components/ui';

const COLORS = ['#503422', '#332B25', '#66775B', '#FFFDF8', '#C17C61', '#4A5A78'];

export function GridPanel({ session, onClose }: { session: Session; onClose: () => void }) {
  const g = session.grid;
  const setGrid = useStore((s) => s.setGrid);
  const across = session.map ? Math.round(session.map.width / g.cellSize) : 0;

  return (
    <div className="flex w-[272px] flex-col gap-3 rounded-2xl bg-surface p-4 shadow-lift animate-pop" role="dialog" aria-label="Grid settings">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold tracking-[0.06em] text-cocoa uppercase">Grid</span>
        <IconButton icon="close" label="Close grid settings" size={36} onClick={onClose} />
      </div>
      <Toggle label="Show grid" checked={g.visible} onChange={(visible) => setGrid({ visible })} />
      <Toggle label="Snap to grid" checked={g.snap} onChange={(snap) => setGrid({ snap })} />
      <Slider label="Cell size" value={g.cellSize} min={16} max={240} onChange={(cellSize) => setGrid({ cellSize })} format={(v) => `${v} px`} />
      {session.map && (
        <div className="flex items-center justify-between text-[14px]">
          <span>Squares across</span>
          <div className="flex items-center gap-1">
            <IconButton icon="minus" label="Fewer squares" size={36} className="border border-line" onClick={() => setGrid({ cellSize: Math.round((session.map!.width / Math.max(2, across - 1)) * 100) / 100 })} />
            <span className="w-8 text-center font-semibold tabular-nums">{across}</span>
            <IconButton icon="plus" label="More squares" size={36} className="border border-line" onClick={() => setGrid({ cellSize: Math.round((session.map!.width / (across + 1)) * 100) / 100 })} />
          </div>
        </div>
      )}
      <Slider label="Opacity" value={Math.round(g.opacity * 100)} min={5} max={100} onChange={(v) => setGrid({ opacity: v / 100 })} format={(v) => `${v}%`} />
      <div className="flex items-center justify-between gap-2 text-[14px]">
        <span>Color</span>
        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Grid color ${c}`}
              aria-pressed={g.color.toLowerCase() === c.toLowerCase()}
              onClick={() => setGrid({ color: c })}
              className="flex h-8 w-8 items-center justify-center rounded-full"
            >
              <span
                className={cx('h-6 w-6 rounded-full border border-[rgb(51_43_37/0.2)]', g.color.toLowerCase() === c.toLowerCase() && 'ring-2 ring-cocoa ring-offset-2 ring-offset-surface')}
                style={{ background: c }}
              />
            </button>
          ))}
          <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full" title="Custom color">
            <span className="h-6 w-6 rounded-full border border-line" style={{ background: 'conic-gradient(#C17C61, #C9A45C, #66775B, #4A5A78, #6B4A6E, #C17C61)' }} />
            <input type="color" value={g.color} onChange={(e) => setGrid({ color: e.target.value })} className="absolute inset-0 opacity-0" aria-label="Custom grid color" />
          </label>
        </div>
      </div>
      <details className="text-[14px]">
        <summary className="min-h-10 cursor-pointer py-2 font-semibold text-cocoa">Align to map</summary>
        <div className="flex flex-col gap-2 pt-1">
          <Slider label="Shift right" value={Math.round(g.offsetX)} min={0} max={Math.round(g.cellSize)} onChange={(offsetX) => setGrid({ offsetX })} format={(v) => `${v} px`} />
          <Slider label="Shift down" value={Math.round(g.offsetY)} min={0} max={Math.round(g.cellSize)} onChange={(offsetY) => setGrid({ offsetY })} format={(v) => `${v} px`} />
        </div>
      </details>
    </div>
  );
}
