import type { DiceRoll } from '../types';
import { DieGlyph, DIE_FILL } from './DieGlyph';
import { cx } from '../components/ui';

export function RollRow({ r, compact }: { r: DiceRoll; compact?: boolean }) {
  return (
    <div className={cx('flex items-center gap-3 rounded-2xl border px-3 py-2', r.natural === 'crit' ? 'border-[#D9C08A] bg-[#FBF4E2]' : r.natural === 'fumble' ? 'border-[#E6C2B5] bg-[#F9ECE6]' : 'border-sand bg-surface')}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2 text-[12px] text-muted">
          <span className="truncate">{r.request.label ?? r.formula}</span>
          {r.natural === 'crit' && <span className="rounded-md bg-gold px-1.5 py-px text-[10px] font-bold text-ink">NAT 20</span>}
          {r.natural === 'fumble' && <span className="rounded-md bg-terracotta-dark px-1.5 py-px text-[10px] font-bold text-surface">NAT 1</span>}
        </div>
        {!compact && (
          <div className="flex flex-wrap items-center gap-1">
            {r.results.map((d, i) => (
              <span key={i} className={cx(d.dropped && 'opacity-35')} title={`${d.type}: ${d.value}`}>
                <DieGlyph type={d.type} size={24} fill={DIE_FILL[d.type]} label={d.value} />
              </span>
            ))}
            {r.request.modifier !== 0 && (
              <span className="ml-0.5 text-[13px] font-semibold text-muted">
                {r.request.modifier > 0 ? '+' : '−'}
                {Math.abs(r.request.modifier)}
              </span>
            )}
          </div>
        )}
      </div>
      <span className="font-display text-[24px] font-bold tabular-nums">{r.total}</span>
    </div>
  );
}

export function DiceHistory({ rolls }: { rolls: DiceRoll[] }) {
  if (!rolls.length) return <p className="px-1 py-2 text-[13px] text-muted">No rolls yet — fortune awaits.</p>;
  return (
    <div className="flex flex-col gap-2">
      {rolls.slice(0, 12).map((r) => (
        <RollRow key={r.id} r={r} />
      ))}
    </div>
  );
}
