import { useEffect, useRef, useState } from 'react';
import type { DieType, RollMode, Session } from '../types';
import { useStore } from '../store/store';
import { DIE_TYPES, formulaOf, diceCount } from './logic';
import { DieGlyph, DIE_FILL } from './DieGlyph';
import { DiceHistory } from './DiceHistory';
import { Button, IconButton, Segmented, Stepper, cx } from '../components/ui';
import { Icon } from '../components/Icon';

/** The always-available floating dice control. */
export function DiceRoller({ session }: { session: Session }) {
  const open = useStore((s) => s.diceOpen);
  const setOpen = useStore((s) => s.setDiceOpen);
  const requestRoll = useStore((s) => s.requestRoll);
  const selectedId = useStore((s) => s.selectedId);
  const [pool, setPool] = useState<Partial<Record<DieType, number>>>({ d20: 1 });
  const [mod, setMod] = useState(0);
  const [mode, setMode] = useState<RollMode>('normal');
  const panel = useRef<HTMLDivElement>(null);
  const last = session.rolls[0];
  const roller = session.characters.find((c) => c.id === selectedId);

  const req = { dice: pool, modifier: mod, mode };
  const n = diceCount(req);
  const singleD20 = (pool.d20 ?? 0) === 1;

  useEffect(() => {
    if (!singleD20 && mode !== 'normal') setMode('normal');
  }, [singleD20, mode]);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, setOpen]);

  const addDie = (t: DieType, d: number) => setPool((p) => ({ ...p, [t]: Math.max(0, Math.min(20, (p[t] ?? 0) + d)) }));
  const roll = (override?: Partial<typeof req>) => {
    const r = { ...req, ...override };
    if (diceCount(r) === 0) return;
    setOpen(false);
    requestRoll({ ...r, label: roller ? `${roller.name.split(' ')[0]} · ${formulaOf(r)}` : undefined, characterId: roller?.id });
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-30" onPointerDown={() => setOpen(false)} aria-hidden="true" />}
      <div className="pointer-events-none fixed bottom-0 right-0 z-30 flex flex-col items-end gap-3 p-3 sm:p-4" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        {open && (
          <div
            ref={panel}
            role="dialog"
            aria-label="Dice roller"
            className="pointer-events-auto flex max-h-[calc(100vh-120px)] w-[min(380px,calc(100vw-24px))] flex-col gap-4 overflow-y-auto rounded-[24px] bg-surface p-4 shadow-lift animate-rise"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[20px] font-semibold">Dice</h2>
              <div className="flex items-center gap-1">
                {roller && <span className="rounded-full bg-bg px-3 py-1 text-[12px] font-semibold text-cocoa">Rolling as {roller.name.split(' ')[0]}</span>}
                <IconButton icon="close" label="Close dice" size={38} onClick={() => setOpen(false)} />
              </div>
            </div>

            {/* The hero d20 */}
            <button
              type="button"
              onClick={() => roll({ dice: { d20: 1 }, mode: mode })}
              className="group flex items-center gap-4 rounded-[20px] bg-cocoa p-3 pr-5 text-left text-surface shadow-[0_6px_18px_rgb(114_81_61/0.35)] transition-transform active:scale-[0.98]"
            >
              <span className="transition-transform duration-500 group-hover:rotate-[60deg]">
                <DieGlyph type="d20" size={64} fill="#5A3F2F" label={20} />
              </span>
              <span className="flex flex-1 flex-col">
                <span className="font-display text-[22px] font-semibold">Roll a d20</span>
                <span className="text-[13px] opacity-80">
                  {mode === 'advantage' ? 'with advantage' : mode === 'disadvantage' ? 'with disadvantage' : 'straight roll'}
                  {mod ? ` · ${mod > 0 ? '+' : '−'}${Math.abs(mod)}` : ''}
                </span>
              </span>
              <Icon name="dice" size={22} />
            </button>

            <div className="flex flex-col gap-2">
              <span className="label">Build a pool</span>
              <div className="grid grid-cols-7 gap-1.5">
                {DIE_TYPES.map((t) => {
                  const c = pool[t] ?? 0;
                  return (
                    <div key={t} className="relative">
                      <button
                        type="button"
                        onClick={() => addDie(t, 1)}
                        aria-label={`Add ${t}${c ? `, ${c} selected` : ''}`}
                        className={cx('flex min-h-[64px] w-full flex-col items-center justify-center gap-0.5 rounded-xl border transition-colors', c ? 'border-cocoa bg-bg' : 'border-line bg-surface hover:border-latte')}
                      >
                        <DieGlyph type={t} size={28} fill={DIE_FILL[t]} />
                        <span className="text-[11px] font-bold text-cocoa">{t}</span>
                      </button>
                      {c > 0 && (
                        <>
                          <span className="pointer-events-none absolute -right-1 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-cocoa px-1 text-[11px] font-bold text-surface">{c}</span>
                          <button
                            type="button"
                            onClick={() => addDie(t, -1)}
                            aria-label={`Remove ${t}`}
                            className="absolute -bottom-2 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-line bg-surface text-cocoa shadow-soft"
                          >
                            <Icon name="minus" size={12} strokeWidth={2.4} />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="label">Modifier</span>
              <Stepper value={mod} onChange={setMod} min={-30} max={30} label="modifier" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Segmented<RollMode>
                label="Roll mode"
                value={mode}
                onChange={(m) => singleD20 && setMode(m)}
                options={[
                  { value: 'normal', label: 'Normal' },
                  { value: 'advantage', label: 'Advantage' },
                  { value: 'disadvantage', label: 'Disadvantage' },
                ]}
              />
              {!singleD20 && <span className="px-1 text-[12px] text-muted">Advantage applies when the pool has exactly one d20.</span>}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => (setPool({}), setMod(0), setMode('normal'))}>
                Clear
              </Button>
              <Button variant="primary" size="lg" icon="dice" className="flex-1" disabled={n === 0} onClick={() => roll()}>
                Roll {n ? formulaOf(req) : ''}
              </Button>
            </div>

            <div className="flex flex-col gap-2 border-t border-line pt-3">
              <span className="label">Recent rolls</span>
              <DiceHistory rolls={session.rolls} />
            </div>
          </div>
        )}

        {!open && (
          <div className="pointer-events-auto flex items-center gap-2">
            {last && (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className={cx(
                  'hidden min-h-12 items-center gap-2 rounded-2xl px-4 text-[13px] shadow-soft sm:flex',
                  last.natural === 'crit' ? 'bg-[#FBF4E2]' : last.natural === 'fumble' ? 'bg-[#F9ECE6]' : 'bg-surface',
                )}
                aria-label={`Last roll: ${last.formula} = ${last.total}`}
              >
                <span className="max-w-[160px] truncate text-muted">{last.request.label ?? last.formula}</span>
                <span className="font-display text-[20px] font-bold">{last.total}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open dice roller"
              className="flex h-16 items-center gap-2 rounded-[22px] bg-cocoa pl-3 pr-5 text-surface shadow-[0_8px_24px_rgb(114_81_61/0.45)] transition-transform active:scale-95"
            >
              <DieGlyph type="d20" size={44} fill="#5A3F2F" label={20} />
              <span className="font-display text-[18px] font-semibold">Roll</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
