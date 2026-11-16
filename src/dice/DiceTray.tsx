import { useCallback, useEffect, useRef, useState } from 'react';
import type { DiceRequest, DiceRoll } from '../types';
import { useStore } from '../store/store';
import { buildRoll, formulaOf, logicalDice, physicalDice, resolve, rollInstant } from './logic';
import { DiceEngine, webglAvailable } from './engine';
import { DieGlyph, DIE_FILL } from './DieGlyph';
import { Button } from '../components/ui';
import { cx } from '../components/ui';

type Phase = 'rolling' | 'done';

/** Full-screen wooden dice tray. Results come from where the dice physically land. */
export default function DiceTray({ request }: { request: DiceRequest }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<DiceEngine | null>(null);
  const prefs = useStore((s) => s.prefs);
  const recordRoll = useStore((s) => s.recordRoll);
  const closeTray = useStore((s) => s.closeTray);
  const [phase, setPhase] = useState<Phase>('rolling');
  const [roll, setRoll] = useState<DiceRoll | null>(null);
  const [use3d] = useState(() => prefs.animateDice && webglAvailable());
  const [nonce, setNonce] = useState(0);

  const throwDice = useCallback(async () => {
    setPhase('rolling');
    setRoll(null);
    const logical = logicalDice(request);
    const phys = physicalDice(logical);
    const eng = engine.current;
    let result: DiceRoll;
    if (eng) {
      const readings = await eng.roll(phys);
      if (engine.current !== eng) return; // closed meanwhile
      result = buildRoll(request, logical, resolve(logical, phys, readings), 'physics');
      // Fade the d20 that doesn't count under advantage/disadvantage.
      const droppedSlots = result.results.map((r, i) => (r.dropped ? i : -1)).filter((i) => i >= 0);
      eng.dim(phys.map((p, i) => (droppedSlots.includes(p.slot) ? i : -1)).filter((i) => i >= 0));
    } else {
      await new Promise((r) => setTimeout(r, 450));
      result = rollInstant(request);
    }
    recordRoll(result);
    setRoll(result);
    setPhase('done');
  }, [request, recordRoll]);

  useEffect(() => {
    if (!use3d || !canvas.current) {
      throwDice();
      return;
    }
    let eng: DiceEngine | null = null;
    try {
      eng = new DiceEngine(canvas.current, { sound: prefs.diceSound });
      engine.current = eng;
    } catch {
      engine.current = null;
    }
    const onResize = () => eng?.resize();
    window.addEventListener('resize', onResize);
    throwDice();
    return () => {
      window.removeEventListener('resize', onResize);
      engine.current = null;
      eng?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [use3d]);

  useEffect(() => {
    if (nonce) throwDice();
  }, [nonce, throwDice]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTray();
      if ((e.key === ' ' || e.key === 'Enter') && phase === 'done') {
        e.preventDefault();
        setNonce((n) => n + 1);
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [closeTray, phase]);

  const crit = roll?.natural === 'crit';
  const fumble = roll?.natural === 'fumble';

  return (
    <div className="fixed inset-0 z-[60] select-none overflow-hidden bg-[#2A1E17] animate-fade" role="dialog" aria-label="Dice tray" aria-live="polite">
      {use3d ? (
        <canvas ref={canvas} className="absolute inset-0 h-full w-full touch-none" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_40%,#56684A,#2E3A27)]">
          {phase === 'rolling' && (
            <div className="animate-spin [animation-duration:600ms]">
              <DieGlyph type="d20" size={140} fill="#72513D" />
            </div>
          )}
        </div>
      )}

      {/* Header: what is being rolled */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-4" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
        <div className="rounded-full bg-[rgb(30_22_17/0.6)] px-5 py-2 text-[15px] font-semibold text-[#F5EAD6] backdrop-blur-sm">
          {request.label ?? formulaOf(request)}
          {phase === 'rolling' && <span className="ml-2 opacity-70">rolling…</span>}
        </div>
      </div>

      <button type="button" onClick={closeTray} className="absolute right-4 top-4 z-10 flex min-h-11 items-center rounded-full bg-[rgb(30_22_17/0.6)] px-4 text-[14px] font-semibold text-[#F5EAD6] backdrop-blur-sm" style={{ marginTop: 'env(safe-area-inset-top)' }}>
        Back to table
      </button>

      {/* Result */}
      {phase === 'done' && roll && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center p-4" style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
          <div
            className={cx(
              'flex w-full max-w-[560px] flex-col items-center gap-3 rounded-[28px] bg-surface p-5 shadow-lift animate-pop',
              crit && 'shadow-[0_0_0_4px_#E9C46A,0_20px_60px_rgb(233_196_106/0.45)]',
              fumble && 'shadow-[0_0_0_4px_#A3523A,0_20px_60px_rgb(163_82_58/0.35)] [animation:pop_260ms,shake_420ms_260ms]',
            )}
          >
            {crit && <span className="rounded-full bg-gold px-4 py-1 text-[13px] font-bold tracking-[0.12em] text-ink">NATURAL 20!</span>}
            {fumble && <span className="rounded-full bg-terracotta-dark px-4 py-1 text-[13px] font-bold tracking-[0.12em] text-surface">NATURAL 1</span>}
            <div className="flex items-end gap-4">
              <span className={cx('font-display text-[84px] leading-[0.9] font-bold tabular-nums', crit ? 'text-[#B8862E]' : fumble ? 'text-terracotta-dark' : 'text-ink')}>{roll.total}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {roll.results.map((d, i) => (
                <span key={i} className={cx('flex flex-col items-center', d.dropped && 'opacity-35')} title={d.dropped ? 'Not counted' : undefined}>
                  <DieGlyph type={d.type} size={40} fill={DIE_FILL[d.type]} label={d.value} />
                </span>
              ))}
              {roll.request.modifier !== 0 && (
                <span className="ml-1 text-[20px] font-semibold text-muted">
                  {roll.request.modifier > 0 ? '+' : '−'} {Math.abs(roll.request.modifier)}
                </span>
              )}
            </div>
            <span className="text-[14px] text-muted">
              {roll.formula}
              {roll.results.length > 1 || roll.request.modifier ? `  ·  ${calc(roll)}` : ''}
            </span>
            <div className="mt-1 flex w-full gap-2">
              <Button size="lg" className="flex-1" icon="dice" onClick={() => setNonce((n) => n + 1)}>
                Roll again
              </Button>
              <Button size="lg" variant="primary" className="flex-1" onClick={closeTray}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(4px)}}`}</style>
    </div>
  );
}

function calc(r: DiceRoll) {
  const kept = r.results.filter((d) => !d.dropped).map((d) => d.value);
  let s = kept.join(' + ');
  if (r.request.modifier) s += ` ${r.request.modifier > 0 ? '+' : '−'} ${Math.abs(r.request.modifier)}`;
  return s;
}
