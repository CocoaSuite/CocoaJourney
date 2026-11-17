import type { PhysicalKind } from './logic';

// Polyhedra for every die, computed from vertex sets so the render mesh and the
// physics hull are guaranteed to be the same shape.

export type V3 = [number, number, number];

export interface DieFace {
  verts: number[]; // vertex indices, CCW seen from outside
  normal: V3;
  center: V3;
  value: number; // printed value (unused for d4, which reads vertices)
  up: V3; // in-plane "up" for printing the number
}

export interface DieShape {
  kind: PhysicalKind;
  vertices: V3[];
  faces: DieFace[];
  /** d4 only: printed value for each vertex. */
  vertexValues?: number[];
  /** True when the result is read from the top vertex instead of the top face. */
  readsVertex: boolean;
  radius: number;
}

const PHI = (1 + Math.sqrt(5)) / 2;

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: V3) => Math.sqrt(dot(a, a));
export const norm = (a: V3): V3 => mul(a, 1 / len(a));

function rawVertices(kind: PhysicalKind): V3[] {
  switch (kind) {
    case 'd4':
      return [
        [1, 1, 1],
        [-1, -1, 1],
        [-1, 1, -1],
        [1, -1, -1],
      ];
    case 'd6': {
      const v: V3[] = [];
      for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push([x, y, z]);
      return v;
    }
    case 'd8':
      return [
        [1, 0, 0],
        [-1, 0, 0],
        [0, 1, 0],
        [0, -1, 0],
        [0, 0, 1],
        [0, 0, -1],
      ];
    case 'd10':
    case 'd10t': {
      // Pentagonal trapezohedron. Ring heights ±a; pole height chosen so kites are planar.
      const a = 0.1;
      const c = Math.cos(Math.PI / 5);
      const h = (a * (1 + c)) / (1 - c);
      const v: V3[] = [
        [0, h, 0],
        [0, -h, 0],
      ];
      for (let i = 0; i < 10; i++) {
        const t = (i * Math.PI) / 5;
        v.push([Math.cos(t), i % 2 === 0 ? a : -a, Math.sin(t)]);
      }
      return v;
    }
    case 'd12': {
      const v: V3[] = [];
      for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push([x, y, z]);
      const p = PHI;
      const q = 1 / PHI;
      for (const s of [-1, 1])
        for (const t of [-1, 1]) {
          v.push([0, s * q, t * p]);
          v.push([s * q, t * p, 0]);
          v.push([s * p, 0, t * q]);
        }
      return v;
    }
    case 'd20': {
      const v: V3[] = [];
      for (const s of [-1, 1])
        for (const t of [-1, 1]) {
          v.push([0, s, t * PHI]);
          v.push([s, t * PHI, 0]);
          v.push([s * PHI, 0, t]);
        }
      return v;
    }
  }
}

const RADIUS: Record<PhysicalKind, number> = { d4: 1.3, d6: 1.05, d8: 1.1, d10: 1.05, d10t: 1.05, d12: 1.1, d20: 1.15 };

/** Find planar faces of a convex vertex set by brute force (fine for ≤ 20 vertices). */
function hullFaces(v: V3[]): { verts: number[]; normal: V3 }[] {
  const eps = 1e-6;
  const faces: { verts: number[]; normal: V3 }[] = [];
  const n = v.length;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      for (let k = j + 1; k < n; k++) {
        let nn = cross(sub(v[j], v[i]), sub(v[k], v[i]));
        if (len(nn) < eps) continue;
        nn = norm(nn);
        let d = dot(nn, v[i]);
        if (d < 0) {
          nn = mul(nn, -1);
          d = -d;
        }
        let ok = true;
        const on: number[] = [];
        for (let m = 0; m < n; m++) {
          const s = dot(nn, v[m]) - d;
          if (s > 1e-4) {
            ok = false;
            break;
          }
          if (Math.abs(s) <= 1e-4) on.push(m);
        }
        if (!ok) continue;
        if (faces.some((f) => dot(f.normal, nn) > 1 - 1e-5)) continue;
        faces.push({ verts: on, normal: nn });
      }
  return faces;
}

function orderCCW(v: V3[], idx: number[], normal: V3): { verts: number[]; center: V3 } {
  const center = mul(idx.reduce((s, i) => add(s, v[i]), [0, 0, 0] as V3), 1 / idx.length);
  const ref = norm(sub(v[idx[0]], center));
  const side = cross(normal, ref);
  const sorted = [...idx].sort((a, b) => {
    const da = sub(v[a], center);
    const db = sub(v[b], center);
    return Math.atan2(dot(da, side), dot(da, ref)) - Math.atan2(dot(db, side), dot(db, ref));
  });
  return { verts: sorted, center };
}

function faceUp(v: V3[], f: { verts: number[]; center: V3 }, kind: PhysicalKind): V3 {
  if (kind === 'd10' || kind === 'd10t') {
    // Kites: point the number at the pole (the vertex furthest from centre).
    let best = f.verts[0];
    let bd = -1;
    for (const i of f.verts) {
      const d = len(sub(v[i], f.center));
      if (d > bd) {
        bd = d;
        best = i;
      }
    }
    return norm(sub(v[best], f.center));
  }
  if (f.verts.length === 4) {
    const mid = mul(add(v[f.verts[0]], v[f.verts[1]]), 0.5);
    return norm(sub(mid, f.center));
  }
  return norm(sub(v[f.verts[0]], f.center));
}

/** Assign printed values so opposite faces sum to a constant, like real dice. */
function assignValues(faces: { normal: V3 }[], values: number[]): number[] {
  const out = new Array<number>(faces.length).fill(-1);
  const used = new Set<number>();
  const pairs: [number, number][] = [];
  for (let i = 0; i < faces.length; i++) {
    if (used.has(i)) continue;
    let opp = -1;
    for (let j = 0; j < faces.length; j++) {
      if (j !== i && !used.has(j) && dot(faces[i].normal, faces[j].normal) < -0.999) opp = j;
    }
    used.add(i);
    if (opp >= 0) {
      used.add(opp);
      pairs.push([i, opp]);
    } else pairs.push([i, -1]);
  }
  const sorted = [...values].sort((a, b) => a - b);
  let lo = 0;
  let hi = sorted.length - 1;
  for (const [a, b] of pairs) {
    out[a] = sorted[lo++];
    if (b >= 0) out[b] = sorted[hi--];
  }
  return out;
}

const cache = new Map<PhysicalKind, DieShape>();

export function dieShape(kind: PhysicalKind): DieShape {
  const hit = cache.get(kind);
  if (hit) return hit;

  let v = rawVertices(kind);
  const maxR = Math.max(...v.map(len));
  v = v.map((p) => mul(p, RADIUS[kind] / maxR));

  const raw = hullFaces(v).map((f) => {
    const o = orderCCW(v, f.verts, f.normal);
    return { ...o, normal: f.normal };
  });

  let values: number[];
  let vertexValues: number[] | undefined;
  if (kind === 'd4') {
    values = raw.map(() => 0);
    vertexValues = [1, 2, 3, 4];
  } else if (kind === 'd10') {
    values = assignValues(raw, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  } else if (kind === 'd10t') {
    values = assignValues(raw, [0, 10, 20, 30, 40, 50, 60, 70, 80, 90]);
  } else {
    values = assignValues(
      raw,
      raw.map((_, i) => i + 1),
    );
  }

  const faces: DieFace[] = raw.map((f, i) => ({
    verts: f.verts,
    normal: f.normal,
    center: f.center,
    value: values[i],
    up: faceUp(v, f, kind),
  }));

  const shape: DieShape = { kind, vertices: v, faces, vertexValues, readsVertex: kind === 'd4', radius: RADIUS[kind] };
  cache.set(kind, shape);
  return shape;
}

/** Label printed for a value on a die face. */
export function faceLabel(kind: PhysicalKind, value: number): string {
  if (kind === 'd10t') return value === 0 ? '00' : String(value);
  return String(value);
}

/** Read a die given a rotation function mapping local vectors to world. Up is +Y. */
export function readDie(shape: DieShape, toWorld: (v: V3) => V3): { value: number; confidence: number } {
  if (shape.readsVertex) {
    let best = 0;
    let by = -Infinity;
    shape.vertices.forEach((p, i) => {
      const y = toWorld(p)[1];
      if (y > by) {
        by = y;
        best = i;
      }
    });
    // Confidence: how flat the bottom face is.
    const bottom = Math.max(...shape.faces.map((f) => -toWorld(f.normal)[1]));
    return { value: shape.vertexValues![best], confidence: bottom };
  }
  let best = shape.faces[0];
  let bd = -Infinity;
  for (const f of shape.faces) {
    const d = toWorld(f.normal)[1];
    if (d > bd) {
      bd = d;
      best = f;
    }
  }
  return { value: best.value, confidence: bd };
}
