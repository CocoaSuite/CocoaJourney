import { describe, expect, it } from 'vitest';
import { cross, dieShape, dot, readDie, type V3 } from './geometry';
import type { PhysicalKind } from './logic';

const expected: Record<PhysicalKind, { faces: number; verts: number; values: number[] }> = {
  d4: { faces: 4, verts: 3, values: [0, 0, 0, 0] },
  d6: { faces: 6, verts: 4, values: [1, 2, 3, 4, 5, 6] },
  d8: { faces: 8, verts: 3, values: [1, 2, 3, 4, 5, 6, 7, 8] },
  d10: { faces: 10, verts: 4, values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
  d10t: { faces: 10, verts: 4, values: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90] },
  d12: { faces: 12, verts: 5, values: Array.from({ length: 12 }, (_, i) => i + 1) },
  d20: { faces: 20, verts: 3, values: Array.from({ length: 20 }, (_, i) => i + 1) },
};

describe('die geometry', () => {
  for (const kind of Object.keys(expected) as PhysicalKind[]) {
    it(`${kind} has the right faces, CCW winding and unique values`, () => {
      const s = dieShape(kind);
      const e = expected[kind];
      expect(s.faces).toHaveLength(e.faces);
      for (const f of s.faces) {
        expect(f.verts).toHaveLength(e.verts);
        const [a, b, c] = f.verts.map((i) => s.vertices[i]);
        const n = cross(
          [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
          [c[0] - a[0], c[1] - a[1], c[2] - a[2]],
        );
        expect(dot(n, f.normal)).toBeGreaterThan(0);
        expect(Math.abs(dot(f.up, f.normal))).toBeLessThan(1e-6);
      }
      expect([...s.faces.map((f) => f.value)].sort((x, y) => x - y)).toEqual(e.values);
    });
  }

  it('opposite d20 faces sum to 21', () => {
    const s = dieShape('d20');
    for (const f of s.faces) {
      const opp = s.faces.find((g) => dot(g.normal, f.normal) < -0.999)!;
      expect(f.value + opp.value).toBe(21);
    }
  });

  it('reads the face that points up', () => {
    const s = dieShape('d6');
    const target = s.faces[2];
    // Rotation that maps target.normal to +Y.
    const n = target.normal;
    const axis = cross(n, [0, 1, 0]);
    const al = Math.hypot(...axis);
    const ang = Math.acos(Math.max(-1, Math.min(1, n[1])));
    const k: V3 = al < 1e-9 ? [1, 0, 0] : [axis[0] / al, axis[1] / al, axis[2] / al];
    const rot = (v: V3): V3 => {
      const c = Math.cos(ang);
      const sn = Math.sin(ang);
      const kv = cross(k, v);
      const kd = dot(k, v);
      return [0, 1, 2].map((i) => v[i] * c + kv[i] * sn + k[i] * kd * (1 - c)) as V3;
    };
    const r = readDie(s, rot);
    expect(r.value).toBe(target.value);
    expect(r.confidence).toBeGreaterThan(0.999);
  });
});
