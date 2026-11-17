import { describe, expect, it } from 'vitest';
import { buildRoll, formulaOf, instantReadings, logicalDice, physicalDice, resolve, rollInstant } from './logic';

describe('dice logic', () => {
  it('expands advantage into two d20s and keeps the higher', () => {
    const req = { dice: { d20: 1 }, modifier: 5, mode: 'advantage' as const };
    const logical = logicalDice(req);
    expect(logical).toHaveLength(2);
    const roll = buildRoll(req, logical, [7, 15], 'instant');
    expect(roll.total).toBe(20);
    expect(roll.results[0].dropped).toBe(true);
    expect(roll.formula).toBe('d20 (adv) + 5');
  });

  it('disadvantage keeps the lower and flags a natural 1', () => {
    const req = { dice: { d20: 1 }, modifier: 0, mode: 'disadvantage' as const };
    const roll = buildRoll(req, logicalDice(req), [1, 18], 'instant');
    expect(roll.total).toBe(1);
    expect(roll.natural).toBe('fumble');
  });

  it('d100 combines tens and units, 00 + 0 = 100', () => {
    const req = { dice: { d100: 1 }, modifier: 0, mode: 'normal' as const };
    const logical = logicalDice(req);
    const phys = physicalDice(logical);
    expect(phys.map((p) => p.kind)).toEqual(['d10t', 'd10']);
    expect(resolve(logical, phys, [40, 7])).toEqual([47]);
    expect(resolve(logical, phys, [0, 0])).toEqual([100]);
    expect(resolve(logical, phys, [90, 0])).toEqual([90]);
  });

  it('d10 shows 0 as 10', () => {
    const req = { dice: { d10: 1 }, modifier: 0, mode: 'normal' as const };
    const logical = logicalDice(req);
    expect(resolve(logical, physicalDice(logical), [0])).toEqual([10]);
  });

  it('2d6 + 3 formula and totals', () => {
    const req = { dice: { d6: 2 }, modifier: 3, mode: 'normal' as const };
    expect(formulaOf(req)).toBe('2d6 + 3');
    expect(buildRoll(req, logicalDice(req), [4, 5], 'instant').total).toBe(12);
  });

  it('instant readings stay in range and cover all faces', () => {
    const phys = physicalDice(logicalDice({ dice: { d20: 1 }, modifier: 0, mode: 'normal' }));
    const seen = new Set<number>();
    for (let i = 0; i < 4000; i++) {
      const [v] = instantReadings(phys);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(20);
      seen.add(v);
    }
    expect(seen.size).toBe(20);
  });

  it('4d6 totals between 4 and 24', () => {
    for (let i = 0; i < 200; i++) {
      const r = rollInstant({ dice: { d6: 4 }, modifier: 0, mode: 'normal' });
      expect(r.total).toBeGreaterThanOrEqual(4);
      expect(r.total).toBeLessThanOrEqual(24);
      expect(r.results).toHaveLength(4);
    }
  });
});
