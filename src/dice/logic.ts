import type { DiceRequest, DiceRoll, DieResult, DieType } from '../types';
import { randInt, uid } from '../lib/id';

export const DIE_TYPES: DieType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
export const SIDES: Record<DieType, number> = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 100 };

/** A physical die in the tray. d100 is thrown as a tens die plus a units d10. */
export type PhysicalKind = 'd4' | 'd6' | 'd8' | 'd10' | 'd10t' | 'd12' | 'd20';

export interface PhysicalDie {
  kind: PhysicalKind;
  /** Index into the logical die list this physical die belongs to. */
  slot: number;
  role?: 'tens' | 'units';
}

export interface LogicalDie {
  type: DieType;
}

/** Expand a request into logical dice, applying advantage/disadvantage. */
export function logicalDice(req: DiceRequest): LogicalDie[] {
  const out: LogicalDie[] = [];
  for (const t of DIE_TYPES) {
    const n = Math.max(0, Math.min(20, req.dice[t] ?? 0));
    for (let i = 0; i < n; i++) out.push({ type: t });
  }
  if (req.mode !== 'normal' && isSingleD20(req)) out.push({ type: 'd20' });
  return out;
}

export function isSingleD20(req: DiceRequest) {
  return (req.dice.d20 ?? 0) === 1;
}

export function physicalDice(logical: LogicalDie[]): PhysicalDie[] {
  const out: PhysicalDie[] = [];
  logical.forEach((d, slot) => {
    if (d.type === 'd100') {
      out.push({ kind: 'd10t', slot, role: 'tens' });
      out.push({ kind: 'd10', slot, role: 'units' });
    } else {
      out.push({ kind: d.type as PhysicalKind, slot });
    }
  });
  return out;
}

/** Face value a physical die shows, as printed (d10: 0–9, tens: 0,10..90). */
export type FaceReading = number;

/** Turn physical readings into logical die results. */
export function resolve(logical: LogicalDie[], phys: PhysicalDie[], readings: FaceReading[]): number[] {
  const values = logical.map(() => 0);
  const tens: Record<number, number> = {};
  const units: Record<number, number> = {};
  phys.forEach((p, i) => {
    const r = readings[i];
    if (p.role === 'tens') tens[p.slot] = r;
    else if (p.role === 'units') units[p.slot] = r;
    else if (p.kind === 'd10') values[p.slot] = r === 0 ? 10 : r;
    else values[p.slot] = r;
  });
  logical.forEach((d, slot) => {
    if (d.type === 'd100') {
      const v = (tens[slot] ?? 0) + (units[slot] ?? 0);
      values[slot] = v === 0 ? 100 : v;
    }
  });
  return values;
}

/** Instant, non-animated readings from a cryptographic RNG. */
export function instantReadings(phys: PhysicalDie[]): FaceReading[] {
  return phys.map((p) => {
    switch (p.kind) {
      case 'd10':
        return randInt(10);
      case 'd10t':
        return randInt(10) * 10;
      default:
        return 1 + randInt(SIDES[p.kind]);
    }
  });
}

export function formulaOf(req: DiceRequest): string {
  const parts: string[] = [];
  for (const t of DIE_TYPES) {
    const n = req.dice[t] ?? 0;
    if (n > 0) parts.push(`${n === 1 ? '' : n}${t}`);
  }
  let f = parts.join(' + ') || '—';
  if (req.mode !== 'normal' && isSingleD20(req)) f += req.mode === 'advantage' ? ' (adv)' : ' (dis)';
  if (req.modifier) f += req.modifier > 0 ? ` + ${req.modifier}` : ` − ${Math.abs(req.modifier)}`;
  return f;
}

export function buildRoll(req: DiceRequest, logical: LogicalDie[], values: number[], method: DiceRoll['method']): DiceRoll {
  const results: DieResult[] = logical.map((d, i) => ({ type: d.type, value: values[i] }));
  let natural: DiceRoll['natural'];

  if (req.mode !== 'normal' && isSingleD20(req)) {
    const idx = results.map((r, i) => (r.type === 'd20' ? i : -1)).filter((i) => i >= 0);
    const [a, b] = idx;
    const keepA = req.mode === 'advantage' ? results[a].value >= results[b].value : results[a].value <= results[b].value;
    results[keepA ? b : a].dropped = true;
  }

  const kept = results.filter((r) => !r.dropped);
  const total = kept.reduce((s, r) => s + r.value, 0) + req.modifier;

  const d20s = kept.filter((r) => r.type === 'd20');
  if (d20s.length === 1) {
    if (d20s[0].value === 20) natural = 'crit';
    else if (d20s[0].value === 1) natural = 'fumble';
  }

  return { id: uid('r'), at: Date.now(), request: req, results, total, formula: formulaOf(req), natural, method };
}

export function rollInstant(req: DiceRequest): DiceRoll {
  const logical = logicalDice(req);
  const phys = physicalDice(logical);
  return buildRoll(req, logical, resolve(logical, phys, instantReadings(phys)), 'instant');
}

export const diceCount = (req: DiceRequest) => DIE_TYPES.reduce((s, t) => s + (req.dice[t] ?? 0), 0);
