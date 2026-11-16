import { memo } from 'react';
import type { Character, Figurine as FigurineData } from '../types';
import { FigurineArt } from '../figurine/FigurineArt';
import { figureBox } from './geometry';

interface Props {
  character: Character;
  fig: FigurineData;
  cell: number;
  selected: boolean;
}

/** A miniature standing on the map, anchored at the centre of its base. */
export const Figurine = memo(function Figurine({ character, fig, cell, selected }: Props) {
  const box = figureBox(cell, fig.size);
  const hpPct = character.sheet.maxHp > 0 ? Math.max(0, Math.min(1, character.sheet.hp / character.sheet.maxHp)) : 1;
  const down = character.sheet.hp <= 0;
  return (
    <div
      data-fig={character.id}
      className="figurine absolute left-0 top-0 cursor-grab touch-none [&.dragging]:z-50 [&.dragging]:cursor-grabbing [&.dragging_.art]:-translate-y-[6%] [&.dragging_.art]:drop-shadow-[0_18px_14px_rgb(51_43_37/0.35)]"
      style={{ left: fig.x - box.ax, top: fig.y - box.ay, width: box.w, height: box.h }}
      aria-label={character.name}
      role="button"
      aria-pressed={selected}
    >
      <FigurineArt appearance={character.appearance} className={`art pointer-events-none absolute inset-0 h-full w-full transition-transform duration-150 ${down ? 'grayscale-[0.7]' : ''}`} />
      {selected && (
        <div
          className="pointer-events-none absolute animate-pulse-ring rounded-[50%] border-[3px] border-[#F2C14E] shadow-[0_0_0_3px_rgb(255_253_248/0.6)]"
          style={{ left: '4%', width: '92%', top: `${(140 / 172) * 100}%`, height: `${(28 / 172) * 100}%` }}
        />
      )}
      <div
        className="pointer-events-none absolute left-1/2 top-full flex origin-top flex-col items-center gap-[3px]"
        style={{ transform: 'translate(-50%, -6px) scale(clamp(0.55, var(--inv, 1), 2.4))' }}
      >
        <span className={`whitespace-nowrap rounded-lg px-2 py-[2px] text-[13px] font-semibold shadow-[0_1px_3px_rgb(51_43_37/0.25)] ${selected ? 'bg-cocoa text-surface' : 'bg-surface/95 text-ink'}`}>
          {character.name.split(' ')[0]}
        </span>
        <span className="h-[5px] w-12 overflow-hidden rounded-full bg-[rgb(51_43_37/0.25)]">
          <span className="block h-full rounded-full" style={{ width: `${hpPct * 100}%`, background: hpPct > 0.5 ? '#66775B' : hpPct > 0.25 ? '#C9A45C' : '#A3523A' }} />
        </span>
      </div>
    </div>
  );
});
