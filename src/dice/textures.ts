import * as THREE from 'three';
import { dieShape, faceLabel, cross, dot, type DieShape, type V3 } from './geometry';
import type { PhysicalKind } from './logic';

export interface Resin {
  body: string;
  edge: string;
  ink: string;
  inkShadow: string;
}

export const RESINS: Record<PhysicalKind, Resin> = {
  d20: { body: '#6E4A35', edge: '#4E3326', ink: '#F5EAD6', inkShadow: '#2B1B12' },
  d4: { body: '#E8DCC4', edge: '#C9B79A', ink: '#5A3F2F', inkShadow: '#FFF8EA' },
  d6: { body: '#EFE4CF', edge: '#CDB999', ink: '#6E4A35', inkShadow: '#FFF9EE' },
  d8: { body: '#B86F55', edge: '#8E4F3A', ink: '#FBEFE0', inkShadow: '#5A2C1E' },
  d10: { body: '#5F7152', edge: '#435238', ink: '#F3EAD7', inkShadow: '#28311F' },
  d10t: { body: '#4C5C42', edge: '#36422E', ink: '#E9D8A8', inkShadow: '#1F2618' },
  d12: { body: '#A57C4E', edge: '#7B5934', ink: '#FFF4E2', inkShadow: '#4A3218' },
};

const SIZE = 256;
const textureCache = new Map<string, THREE.CanvasTexture>();

/** 2D coordinates of a face's vertices in its own (right, up) basis, normalised to the texture. */
export function faceLayout(shape: DieShape, faceIndex: number) {
  const f = shape.faces[faceIndex];
  const right = cross(f.up, f.normal);
  const pts = f.verts.map((i) => {
    const p = shape.vertices[i];
    const d: V3 = [p[0] - f.center[0], p[1] - f.center[1], p[2] - f.center[2]];
    return [dot(d, right), dot(d, f.up)] as [number, number];
  });
  const extent = Math.max(...pts.map(([x, y]) => Math.max(Math.abs(x), Math.abs(y))));
  const s = 0.47 / extent;
  const uv = pts.map(([x, y]) => [0.5 + x * s, 0.5 + y * s] as [number, number]);
  return { right, up: f.up, uv, scale: s };
}

function drawNumber(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, rot: number, r: Resin, underline: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.font = `700 ${size}px "Fraunces Variable", Fraunces, Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Engraved: a soft shadow on the upper-left lip, then the paint.
  ctx.fillStyle = r.inkShadow;
  ctx.globalAlpha = 0.55;
  ctx.fillText(text, -2, -2);
  ctx.globalAlpha = 1;
  ctx.fillStyle = r.ink;
  ctx.fillText(text, 0, 0);
  if (underline) ctx.fillRect(-size * 0.22, size * 0.42, size * 0.44, size * 0.07);
  ctx.restore();
}

export function faceTexture(kind: PhysicalKind, faceIndex: number): THREE.CanvasTexture {
  const key = `${kind}:${faceIndex}`;
  const hit = textureCache.get(key);
  if (hit) return hit;

  const shape = dieShape(kind);
  const face = shape.faces[faceIndex];
  const r = RESINS[kind];
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  const { uv } = faceLayout(shape, faceIndex);
  const px = uv.map(([u, v]) => [u * SIZE, (1 - v) * SIZE] as [number, number]);

  // Body with gentle depth toward the edges.
  const g = ctx.createRadialGradient(SIZE / 2, SIZE / 2, SIZE * 0.05, SIZE / 2, SIZE / 2, SIZE * 0.6);
  g.addColorStop(0, r.body);
  g.addColorStop(1, r.edge);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Soft bevel line just inside each edge.
  ctx.beginPath();
  px.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255,248,235,0.22)';
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 3;
  ctx.stroke();

  const cx = SIZE / 2;
  const cy = SIZE / 2;

  if (shape.readsVertex) {
    // d4: each corner carries the value of the vertex it points at.
    face.verts.forEach((vi, k) => {
      const [x, y] = px[k];
      const dx = x - cx;
      const dy = y - cy;
      const rot = Math.atan2(dx, -dy);
      drawNumber(ctx, String(shape.vertexValues![vi]), cx + dx * 0.55, cy + dy * 0.55, 54, rot, r, false);
    });
  } else {
    const label = faceLabel(kind, face.value);
    const n = shape.faces.length;
    let size = n <= 6 ? 120 : n <= 8 ? 96 : n === 12 ? 92 : n === 20 ? 78 : 80;
    if (label.length > 1) size *= kind === 'd10t' ? 0.72 : 0.86;
    const yOff = kind === 'd20' || kind === 'd8' ? 10 : kind === 'd10' || kind === 'd10t' ? 16 : 0;
    const underline = (label === '6' || label === '9') && kind !== 'd10t';
    drawNumber(ctx, label, cx, cy + yOff, size, 0, r, underline);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  textureCache.set(key, tex);
  return tex;
}

/** Felt cloth for the tray floor. */
export function feltTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#56684A';
  ctx.fillRect(0, 0, 512, 512);
  const img = ctx.getImageData(0, 0, 512, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 22;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n * 0.8;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Walnut grain for the tray rim. */
export function woodTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#6E4A33';
  ctx.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 70; i++) {
    const y = Math.random() * c.height;
    ctx.strokeStyle = Math.random() < 0.5 ? 'rgba(40,24,14,0.35)' : 'rgba(170,120,80,0.25)';
    ctx.lineWidth = 1 + Math.random() * 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= c.width; x += 32) ctx.lineTo(x, y + Math.sin(x / (60 + Math.random() * 40) + i) * 4);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
