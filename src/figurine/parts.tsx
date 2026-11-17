import type { ReactNode } from 'react';
import type { Appearance } from '../types';
import { shade } from '../lib/color';

/*
 * Layered figurine parts.
 *
 * A figurine is drawn in a 120×160 viewBox. Body parts are authored in
 * "body space" (feet at y=142) and scaled by the body type; head parts are
 * authored in "head space" (neck at y=72) and translated onto the body.
 *
 * Every option returns drawings for one or more named layers. To swap in
 * painted artwork later, an option can return an <image href=…/> for a layer
 * instead of vector shapes — see `ASSET REPLACEMENT` in the README.
 */

export const INK = '#3A2A20';
export const O = { stroke: INK, strokeWidth: 1.6, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

export type Layer =
  | 'cloakBack'
  | 'hairBack'
  | 'legs'
  | 'boots'
  | 'torso'
  | 'belt'
  | 'cloakFront'
  | 'accBody'
  | 'weapon'
  | 'arms'
  | 'gloves'
  | 'earsBack'
  | 'facialHair'
  | 'face'
  | 'eyes'
  | 'hairFront'
  | 'earsFront'
  | 'accessory'
  | 'shield';

export const BODY_LAYERS: Layer[] = ['cloakBack', 'legs', 'boots', 'torso', 'belt', 'cloakFront', 'accBody', 'weapon', 'arms', 'gloves'];
export const HEAD_LAYERS: Layer[] = ['earsBack', 'facialHair', 'face', 'eyes', 'hairFront', 'earsFront', 'accessory'];

export type Drawn = Partial<Record<Layer, ReactNode>>;

export interface PartOption {
  id: string;
  label: string;
  draw?: (a: Appearance) => Drawn;
}

export interface ColorOption {
  id: string;
  label: string;
  hex: string;
}

// ───────────────────────── palettes ─────────────────────────

export const SKIN_TONES: ColorOption[] = [
  { id: 'porcelain', label: 'Porcelain', hex: '#F4DCCB' },
  { id: 'peach', label: 'Peach', hex: '#EBC5A3' },
  { id: 'honey', label: 'Honey', hex: '#D9A574' },
  { id: 'bronze', label: 'Bronze', hex: '#C08A64' },
  { id: 'umber', label: 'Umber', hex: '#8D5B3E' },
  { id: 'deep', label: 'Deep', hex: '#5E3B28' },
  { id: 'sage', label: 'Sage', hex: '#93A57C' },
  { id: 'lilac', label: 'Lilac', hex: '#A99BC2' },
  { id: 'ember', label: 'Ember', hex: '#B9604F' },
  { id: 'slate', label: 'Slate', hex: '#8A95A0' },
];

export const HAIR_COLORS: ColorOption[] = [
  { id: 'copper', label: 'Copper', hex: '#B5652F' },
  { id: 'chestnut', label: 'Chestnut', hex: '#5A3F2F' },
  { id: 'raven', label: 'Raven', hex: '#231B16' },
  { id: 'wheat', label: 'Wheat', hex: '#D7B97A' },
  { id: 'ash', label: 'Ash', hex: '#E9DFC8' },
  { id: 'silver', label: 'Silver', hex: '#B9B6B0' },
  { id: 'moss', label: 'Moss', hex: '#66775B' },
  { id: 'rose', label: 'Rose', hex: '#C17C61' },
  { id: 'plum', label: 'Plum', hex: '#6B4A6E' },
  { id: 'sky', label: 'Sky', hex: '#7E9CB5' },
];

export const CLOTH_COLORS: ColorOption[] = [
  { id: 'forest', label: 'Forest', hex: '#66775B' },
  { id: 'terracotta', label: 'Terracotta', hex: '#C17C61' },
  { id: 'cocoa', label: 'Cocoa', hex: '#72513D' },
  { id: 'navy', label: 'Navy', hex: '#4A5A78' },
  { id: 'plum', label: 'Plum', hex: '#6B4A6E' },
  { id: 'mustard', label: 'Mustard', hex: '#C9A45C' },
  { id: 'cream', label: 'Cream', hex: '#E9DFC8' },
  { id: 'charcoal', label: 'Charcoal', hex: '#3E3833' },
  { id: 'crimson', label: 'Crimson', hex: '#9C3D35' },
  { id: 'teal', label: 'Teal', hex: '#4F7C7A' },
];

export const BASE_COLORS: ColorOption[] = [
  { id: 'cocoa', label: 'Cocoa', hex: '#72513D' },
  { id: 'forest', label: 'Forest', hex: '#55664B' },
  { id: 'terracotta', label: 'Terracotta', hex: '#A9654C' },
  { id: 'slate', label: 'Slate', hex: '#4E5A66' },
  { id: 'ivory', label: 'Ivory', hex: '#D9CCB4' },
  { id: 'gold', label: 'Gold', hex: '#B8914A' },
];

const colorOf = (list: ColorOption[], id: string) => (list.find((c) => c.id === id) ?? list[0]).hex;
export const skinHex = (a: Appearance) => colorOf(SKIN_TONES, a.skin);
export const hairHex = (a: Appearance) => colorOf(HAIR_COLORS, a.hairColor);
export const topHex = (a: Appearance) => colorOf(CLOTH_COLORS, a.topColor);
export const cloakHex = (a: Appearance) => colorOf(CLOTH_COLORS, a.cloakColor);
export const baseHex = (a: Appearance) => colorOf(BASE_COLORS, a.baseColor);

const STEEL = '#A9AEB3';
const WOOD = '#8A5E3C';
const LEATHER = '#6B4A33';
const GOLD = '#C9A45C';
const CREAM = '#EFE6D4';

// ───────────────────────── body types ─────────────────────────

export const BODY_TYPES: (PartOption & { sx: number; sy: number })[] = [
  { id: 'average', label: 'Average', sx: 1, sy: 1 },
  { id: 'slender', label: 'Slender', sx: 0.88, sy: 1.05 },
  { id: 'sturdy', label: 'Sturdy', sx: 1.2, sy: 0.93 },
  { id: 'small', label: 'Small', sx: 0.96, sy: 0.8 },
  { id: 'tall', label: 'Tall', sx: 1.02, sy: 1.12 },
];

// ───────────────────────── faces & eyes ─────────────────────────

const cheeks = (
  <g fill="#C17C61" opacity={0.28}>
    <circle cx={46} cy={57} r={4} />
    <circle cx={74} cy={57} r={4} />
  </g>
);

const mouth = (d: string, fill = false) => (
  <path d={d} fill={fill ? '#8A3F33' : 'none'} stroke="#6E3A2C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
);

export const FACES: PartOption[] = [
  { id: 'smile', label: 'Smile', draw: () => ({ face: <g>{cheeks}{mouth('M54 58 Q60 63 66 58')}</g> }) },
  { id: 'grin', label: 'Grin', draw: () => ({ face: <g>{cheeks}{mouth('M53 57 Q60 66 67 57 Z', true)}<path d="M55 58 L65 58" stroke="#fff" strokeWidth={1.4} /></g> }) },
  { id: 'calm', label: 'Calm', draw: () => ({ face: <g>{cheeks}{mouth('M55 59 L65 59')}</g> }) },
  { id: 'smirk', label: 'Smirk', draw: () => ({ face: <g>{cheeks}{mouth('M54 59 Q61 61 67 56')}</g> }) },
  { id: 'stern', label: 'Stern', draw: () => ({ face: <g>{mouth('M54 61 Q60 57 66 61')}</g> }) },
  { id: 'cheer', label: 'Cheer', draw: () => ({ face: <g>{cheeks}<ellipse cx={60} cy={60} rx={3.6} ry={4} fill="#8A3F33" stroke="#6E3A2C" strokeWidth={1.6} /></g> }) },
];

const brows = (a: Appearance, d = 'M47 41 Q52 38 57 41 M63 41 Q68 38 73 41') => (
  <path d={d} fill="none" stroke={shade(hairHex(a), -0.25)} strokeWidth={2.2} strokeLinecap="round" />
);

export const EYES: PartOption[] = [
  {
    id: 'dot',
    label: 'Bright',
    draw: (a) => ({
      eyes: (
        <g>
          {brows(a)}
          <circle cx={52} cy={49} r={3} fill={INK} />
          <circle cx={68} cy={49} r={3} fill={INK} />
          <circle cx={53} cy={48} r={1} fill="#fff" />
          <circle cx={69} cy={48} r={1} fill="#fff" />
        </g>
      ),
    }),
  },
  {
    id: 'round',
    label: 'Round',
    draw: (a) => ({
      eyes: (
        <g>
          {brows(a, 'M46 40 Q52 36 58 40 M62 40 Q68 36 74 40')}
          <ellipse cx={52} cy={49} rx={4.6} ry={5.2} fill="#fff" stroke={INK} strokeWidth={1.4} />
          <ellipse cx={68} cy={49} rx={4.6} ry={5.2} fill="#fff" stroke={INK} strokeWidth={1.4} />
          <circle cx={52.6} cy={50} r={2.7} fill={INK} />
          <circle cx={68.6} cy={50} r={2.7} fill={INK} />
          <circle cx={53.6} cy={48.8} r={1} fill="#fff" />
          <circle cx={69.6} cy={48.8} r={1} fill="#fff" />
        </g>
      ),
    }),
  },
  {
    id: 'sleepy',
    label: 'Content',
    draw: (a) => ({
      eyes: (
        <g fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round">
          {brows(a)}
          <path d="M48 49 Q52 52 56 49" />
          <path d="M64 49 Q68 52 72 49" />
        </g>
      ),
    }),
  },
  {
    id: 'sharp',
    label: 'Sharp',
    draw: (a) => ({
      eyes: (
        <g>
          {brows(a, 'M46 40 L57 43 M74 40 L63 43')}
          <path d="M47 48 L57 47 L55 52 L49 51 Z" fill="#fff" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
          <path d="M73 48 L63 47 L65 52 L71 51 Z" fill="#fff" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
          <circle cx={53} cy={49.4} r={1.9} fill={INK} />
          <circle cx={67} cy={49.4} r={1.9} fill={INK} />
        </g>
      ),
    }),
  },
  {
    id: 'wink',
    label: 'Wink',
    draw: (a) => ({
      eyes: (
        <g>
          {brows(a)}
          <circle cx={52} cy={49} r={3} fill={INK} />
          <circle cx={53} cy={48} r={1} fill="#fff" />
          <path d="M64 50 Q68 46 72 50" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
        </g>
      ),
    }),
  },
  {
    id: 'glow',
    label: 'Arcane',
    draw: (a) => ({
      eyes: (
        <g>
          {brows(a)}
          <ellipse cx={52} cy={49} rx={4} ry={4.6} fill="#BFD8E0" stroke={INK} strokeWidth={1.4} />
          <ellipse cx={68} cy={49} rx={4} ry={4.6} fill="#BFD8E0" stroke={INK} strokeWidth={1.4} />
          <circle cx={52} cy={49} r={1.6} fill="#fff" />
          <circle cx={68} cy={49} r={1.6} fill="#fff" />
        </g>
      ),
    }),
  },
];

// ───────────────────────── ears / features ─────────────────────────

export const EARS: PartOption[] = [
  {
    id: 'round',
    label: 'Round ears',
    draw: (a) => ({
      earsBack: (
        <g fill={skinHex(a)} {...O}>
          <ellipse cx={38.5} cy={50} rx={5} ry={6} />
          <ellipse cx={81.5} cy={50} rx={5} ry={6} />
        </g>
      ),
    }),
  },
  {
    id: 'pointed',
    label: 'Pointed ears',
    draw: (a) => ({
      earsBack: (
        <g fill={skinHex(a)} {...O}>
          <path d="M42 45 L27 36 Q30 50 41 56 Z" />
          <path d="M78 45 L93 36 Q90 50 79 56 Z" />
        </g>
      ),
    }),
  },
  {
    id: 'long',
    label: 'Long ears',
    draw: (a) => ({
      earsBack: (
        <g fill={skinHex(a)} {...O}>
          <path d="M42 46 L18 30 Q24 50 41 57 Z" />
          <path d="M78 46 L102 30 Q96 50 79 57 Z" />
        </g>
      ),
    }),
  },
  {
    id: 'horns',
    label: 'Horns',
    draw: (a) => ({
      earsBack: (
        <g fill={skinHex(a)} {...O}>
          <path d="M42 45 L30 38 Q32 50 41 55 Z" />
          <path d="M78 45 L90 38 Q88 50 79 55 Z" />
        </g>
      ),
      earsFront: (
        <g fill="#4A3A3A" {...O}>
          <path d="M46 28 Q40 12 30 8 Q38 18 40 32 Z" />
          <path d="M74 28 Q80 12 90 8 Q82 18 80 32 Z" />
        </g>
      ),
    }),
  },
  {
    id: 'ram',
    label: 'Ram horns',
    draw: (a) => ({
      earsBack: (
        <g fill={skinHex(a)} {...O}>
          <ellipse cx={38.5} cy={50} rx={5} ry={6} />
          <ellipse cx={81.5} cy={50} rx={5} ry={6} />
        </g>
      ),
      earsFront: (
        <g fill="#CDBA98" {...O}>
          <path d="M44 30 Q28 22 26 38 Q26 50 38 50 Q32 44 34 38 Q36 32 44 36 Z" />
          <path d="M76 30 Q92 22 94 38 Q94 50 82 50 Q88 44 86 38 Q84 32 76 36 Z" />
        </g>
      ),
    }),
  },
  {
    id: 'tusks',
    label: 'Tusks',
    draw: (a) => ({
      earsBack: (
        <g fill={skinHex(a)} {...O}>
          <path d="M42 45 L32 40 Q33 51 41 55 Z" />
          <path d="M78 45 L88 40 Q87 51 79 55 Z" />
        </g>
      ),
      earsFront: (
        <g fill="#F6EFDF" {...O} strokeWidth={1.2}>
          <path d="M53 61 L52 54 L56 60 Z" />
          <path d="M67 61 L68 54 L64 60 Z" />
        </g>
      ),
    }),
  },
];

// ───────────────────────── facial hair ─────────────────────────

export const FACIAL_HAIR: PartOption[] = [
  { id: 'none', label: 'Clean' },
  {
    id: 'stubble',
    label: 'Stubble',
    draw: (a) => ({ facialHair: <path d="M40 52 Q42 68 60 70 Q78 68 80 52 Q76 64 60 65 Q44 64 40 52 Z" fill={hairHex(a)} opacity={0.3} /> }),
  },
  {
    id: 'mustache',
    label: 'Mustache',
    draw: (a) => ({ facialHair: <path d="M50 57 Q55 52 60 55 Q65 52 70 57 Q65 56 60 58 Q55 56 50 57 Z" fill={hairHex(a)} {...O} strokeWidth={1.2} /> }),
  },
  {
    id: 'goatee',
    label: 'Goatee',
    draw: (a) => ({
      facialHair: (
        <g fill={hairHex(a)} {...O} strokeWidth={1.2}>
          <path d="M52 57 Q56 53 60 55 Q64 53 68 57 Q64 56 60 57 Q56 56 52 57 Z" />
          <path d="M55 64 Q60 76 65 64 Q60 66 55 64 Z" />
        </g>
      ),
    }),
  },
  {
    id: 'beard',
    label: 'Full beard',
    draw: (a) => ({ facialHair: <path d="M38 46 Q38 80 60 84 Q82 80 82 46 Q80 60 70 56 Q60 53 50 56 Q40 60 38 46 Z" fill={hairHex(a)} {...O} /> }),
  },
  {
    id: 'braided',
    label: 'Braided beard',
    draw: (a) => {
      const c = hairHex(a);
      return {
        facialHair: (
          <g fill={c} {...O}>
            <path d="M38 46 Q38 76 60 80 Q82 76 82 46 Q80 60 70 56 Q60 53 50 56 Q40 60 38 46 Z" />
            <ellipse cx={60} cy={84} rx={5} ry={5} />
            <ellipse cx={60} cy={93} rx={4.4} ry={4.6} />
            <ellipse cx={60} cy={101} rx={3.6} ry={4} />
            <rect x={56} y={104} width={8} height={4} rx={1.5} fill={GOLD} />
          </g>
        ),
      };
    },
  },
];

// ───────────────────────── hair ─────────────────────────

const H = (a: Appearance) => ({ fill: hairHex(a), ...O });

export const HAIRSTYLES: PartOption[] = [
  { id: 'bald', label: 'Bald', draw: () => ({ hairFront: <ellipse cx={52} cy={31} rx={7} ry={3.4} fill="#fff" opacity={0.35} transform="rotate(-20 52 31)" /> }) },
  { id: 'cropped', label: 'Cropped', draw: (a) => ({ hairFront: <path {...H(a)} d="M38 46 Q37 22 60 22 Q83 22 82 46 Q80 32 60 31 Q40 32 38 46 Z" /> }) },
  {
    id: 'messy',
    label: 'Messy',
    draw: (a) => ({ hairFront: <path {...H(a)} d="M37 48 Q35 20 60 20 Q85 20 83 48 L79 37 L74 41 L71 31 L63 38 L57 30 L50 38 L45 33 L41 41 Z" /> }),
  },
  { id: 'sidepart', label: 'Side part', draw: (a) => ({ hairFront: <path {...H(a)} d="M37 50 Q35 20 62 20 Q85 21 83 46 Q74 30 52 33 Q42 37 37 50 Z" /> }) },
  {
    id: 'long',
    label: 'Long',
    draw: (a) => ({
      hairBack: <path {...H(a)} d="M35 48 Q30 18 60 17 Q90 18 85 48 L90 92 Q74 98 60 96 Q46 98 30 92 Z" />,
      hairFront: <path {...H(a)} d="M37 62 Q33 19 60 19 Q87 19 83 62 L79 60 Q81 36 66 31 Q54 40 41 42 L41 62 Z" />,
    }),
  },
  {
    id: 'ponytail',
    label: 'Ponytail',
    draw: (a) => ({
      hairBack: <path {...H(a)} d="M78 30 Q100 32 98 56 Q96 76 88 86 Q90 66 84 52 Z" />,
      hairFront: (
        <g>
          <path {...H(a)} d="M38 46 Q37 21 60 21 Q83 21 82 46 Q76 33 60 32 Q44 33 38 46 Z" />
          <rect x={80} y={30} width={7} height={8} rx={2} fill={GOLD} {...O} strokeWidth={1.2} transform="rotate(20 83 34)" />
        </g>
      ),
    }),
  },
  {
    id: 'bun',
    label: 'Top bun',
    draw: (a) => ({
      hairFront: (
        <g {...H(a)}>
          <circle cx={60} cy={17} r={10} />
          <path d="M38 46 Q37 22 60 22 Q83 22 82 46 Q80 32 60 31 Q40 32 38 46 Z" />
        </g>
      ),
    }),
  },
  {
    id: 'braids',
    label: 'Braids',
    draw: (a) => ({
      hairFront: (
        <g {...H(a)}>
          <path d="M37 50 Q35 21 60 21 Q85 21 83 50 Q78 33 60 32 Q42 33 37 50 Z" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <ellipse cx={38} cy={56 + i * 9} rx={4.6} ry={5} />
              <ellipse cx={82} cy={56 + i * 9} rx={4.6} ry={5} />
            </g>
          ))}
          <rect x={34.5} y={88} width={7} height={4} rx={1.5} fill={GOLD} />
          <rect x={78.5} y={88} width={7} height={4} rx={1.5} fill={GOLD} />
        </g>
      ),
    }),
  },
  {
    id: 'curls',
    label: 'Curls',
    draw: (a) => ({
      hairBack: (
        <g {...H(a)}>
          <circle cx={36} cy={52} r={9} />
          <circle cx={84} cy={52} r={9} />
          <circle cx={38} cy={64} r={7} />
          <circle cx={82} cy={64} r={7} />
        </g>
      ),
      hairFront: (
        <g {...H(a)}>
          {[
            [40, 38, 9],
            [48, 28, 9],
            [60, 24, 10],
            [72, 28, 9],
            [80, 38, 9],
            [54, 33, 6],
            [66, 33, 6],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} />
          ))}
        </g>
      ),
    }),
  },
  {
    id: 'mohawk',
    label: 'Mohawk',
    draw: (a) => ({
      hairFront: (
        <g>
          <path d="M39 44 Q38 24 60 24 Q82 24 81 44 Q78 34 60 33 Q42 34 39 44 Z" fill={hairHex(a)} opacity={0.25} />
          <path {...H(a)} d="M53 32 L52 8 L57 14 L60 4 L63 14 L68 8 L67 32 Q60 29 53 32 Z" />
        </g>
      ),
    }),
  },
  {
    id: 'bob',
    label: 'Bob',
    draw: (a) => ({
      hairBack: <path {...H(a)} d="M35 48 Q32 18 60 18 Q88 18 85 48 L86 68 Q60 74 34 68 Z" />,
      hairFront: <path {...H(a)} d="M36 64 Q33 20 60 20 Q87 20 84 64 L80 64 Q82 40 74 36 Q60 42 44 38 Q40 46 41 64 Z" />,
    }),
  },
  {
    id: 'wild',
    label: 'Wild',
    draw: (a) => ({
      hairBack: <path {...H(a)} d="M30 56 L22 44 L32 40 L26 26 L40 28 L42 14 L54 20 L60 8 L66 20 L78 14 L80 28 L94 26 L88 40 L98 44 L90 56 L94 70 L80 66 L60 72 L40 66 L26 70 Z" />,
      hairFront: <path {...H(a)} d="M37 50 Q36 22 60 22 Q84 22 83 50 L78 38 L72 44 L68 34 L60 40 L52 34 L48 44 L42 38 Z" />,
    }),
  },
];

// ───────────────────────── tops ─────────────────────────

const TORSO = 'M41 80 Q41 74 47 73 L73 73 Q79 74 79 80 L80 118 L40 118 Z';

export const TOPS: (PartOption & { sleeve: (a: Appearance) => string; long?: boolean; sleeveWidth?: number })[] = [
  {
    id: 'tunic',
    label: 'Tunic',
    sleeve: topHex,
    draw: (a) => ({
      torso: (
        <g>
          <path d={TORSO} fill={topHex(a)} {...O} />
          <path d="M40 112 L80 112 L81 122 L39 122 Z" fill={shade(topHex(a), -0.15)} {...O} />
          <path d="M53 73 L60 84 L67 73" fill={CREAM} {...O} strokeWidth={1.2} />
        </g>
      ),
    }),
  },
  {
    id: 'vest',
    label: 'Shirt & vest',
    sleeve: () => CREAM,
    draw: (a) => ({
      torso: (
        <g>
          <path d={TORSO} fill={CREAM} {...O} />
          <path d="M41 80 Q41 74 47 73 L55 73 L58 118 L40 118 Z" fill={topHex(a)} {...O} />
          <path d="M79 80 Q79 74 73 73 L65 73 L62 118 L80 118 Z" fill={topHex(a)} {...O} />
          <circle cx={57} cy={92} r={1.4} fill={GOLD} />
          <circle cx={57.5} cy={102} r={1.4} fill={GOLD} />
        </g>
      ),
    }),
  },
  {
    id: 'leather',
    label: 'Leather armor',
    sleeve: (a) => shade(topHex(a), -0.1),
    draw: (a) => {
      const c = shade(topHex(a), -0.05);
      return {
        torso: (
          <g>
            <path d={TORSO} fill={c} {...O} />
            <path d="M44 84 L76 84 M44 96 L76 96" stroke={shade(c, -0.35)} strokeWidth={1.4} strokeDasharray="2.5 2.5" />
            <path d="M40 110 L80 110 L81 122 L39 122 Z" fill={LEATHER} {...O} />
            <ellipse cx={42} cy={78} rx={8} ry={5.5} fill={LEATHER} {...O} />
            <ellipse cx={78} cy={78} rx={8} ry={5.5} fill={LEATHER} {...O} />
          </g>
        ),
      };
    },
  },
  {
    id: 'chain',
    label: 'Chainmail',
    sleeve: () => STEEL,
    draw: (a) => ({
      torso: (
        <g>
          <path d={TORSO} fill={STEEL} {...O} />
          <g stroke="#7E848A" strokeWidth={1.3} strokeDasharray="1.6 2.2" fill="none">
            {[80, 86, 92, 98, 104, 110].map((y) => (
              <path key={y} d={`M42 ${y} L78 ${y}`} />
            ))}
          </g>
          <path d="M52 74 L68 74 L68 122 L60 126 L52 122 Z" fill={topHex(a)} {...O} />
          <path d="M60 86 L60 100 M54 92 L66 92" stroke={GOLD} strokeWidth={2.2} strokeLinecap="round" />
        </g>
      ),
    }),
  },
  {
    id: 'plate',
    label: 'Plate armor',
    sleeve: () => STEEL,
    draw: (a) => ({
      torso: (
        <g>
          <path d="M40 112 L80 112 L82 124 L38 124 Z" fill={topHex(a)} {...O} />
          <path d="M42 80 Q42 73 48 73 L72 73 Q78 73 78 80 L76 112 L44 112 Z" fill="#BFC4C8" {...O} />
          <path d="M60 76 L60 108" stroke="#8C9296" strokeWidth={1.4} />
          <path d="M47 80 Q52 77 56 80 L55 96 Q50 96 47 92 Z" fill="#fff" opacity={0.35} />
          <path d="M42 106 L78 106" stroke="#8C9296" strokeWidth={1.4} />
          <ellipse cx={41} cy={78} rx={10} ry={7} fill="#B1B7BC" {...O} />
          <ellipse cx={79} cy={78} rx={10} ry={7} fill="#B1B7BC" {...O} />
        </g>
      ),
    }),
  },
  {
    id: 'robe',
    label: 'Robe',
    sleeve: topHex,
    sleeveWidth: 13,
    long: true,
    draw: (a) => ({
      torso: (
        <g>
          <path d="M42 80 Q41 74 47 73 L73 73 Q79 74 78 80 L88 140 Q60 145 32 140 Z" fill={topHex(a)} {...O} />
          <path d="M56 74 L60 140 M64 74 L60 140" stroke={shade(topHex(a), -0.2)} strokeWidth={1.2} fill="none" />
          <path d="M52 73 L60 86 L68 73" fill={GOLD} {...O} strokeWidth={1.2} />
          <path d="M33 136 Q60 141 87 136" stroke={GOLD} strokeWidth={2} fill="none" />
        </g>
      ),
    }),
  },
  {
    id: 'wrap',
    label: 'Monk wrap',
    sleeve: skinHex,
    draw: (a) => ({
      torso: (
        <g>
          <path d={TORSO} fill={skinHex(a)} {...O} />
          <path d="M44 73 L56 73 L80 112 L80 118 L70 118 L44 80 Z" fill={topHex(a)} {...O} />
          <path d="M40 104 L80 104 L81 122 L39 122 Z" fill={topHex(a)} {...O} />
        </g>
      ),
    }),
  },
];

// ───────────────────────── cloaks ─────────────────────────

const clasp = <circle cx={60} cy={76} r={3} fill={GOLD} {...O} strokeWidth={1.2} />;

export const CLOAKS: PartOption[] = [
  { id: 'none', label: 'None' },
  {
    id: 'cape',
    label: 'Short cape',
    draw: (a) => ({
      cloakBack: <path d="M42 74 Q32 96 30 116 Q60 122 90 116 Q88 96 78 74 Z" fill={shade(cloakHex(a), -0.15)} {...O} />,
      cloakFront: (
        <g>
          <path d="M44 72 L60 80 L76 72 L80 80 L60 86 L40 80 Z" fill={cloakHex(a)} {...O} />
          {clasp}
        </g>
      ),
    }),
  },
  {
    id: 'long',
    label: 'Long cloak',
    draw: (a) => ({
      cloakBack: <path d="M42 74 Q28 106 24 142 Q60 148 96 142 Q92 106 78 74 Z" fill={shade(cloakHex(a), -0.15)} {...O} />,
      cloakFront: (
        <g>
          <path d="M44 72 L60 80 L76 72 L80 80 L60 86 L40 80 Z" fill={cloakHex(a)} {...O} />
          {clasp}
        </g>
      ),
    }),
  },
  {
    id: 'tattered',
    label: 'Tattered',
    draw: (a) => ({
      cloakBack: <path d="M42 74 Q28 104 26 138 L34 132 L40 142 L48 134 L56 144 L64 134 L72 144 L80 134 L88 142 L94 136 Q92 104 78 74 Z" fill={shade(cloakHex(a), -0.15)} {...O} />,
      cloakFront: clasp,
    }),
  },
  {
    id: 'mantle',
    label: 'Fur mantle',
    draw: (a) => ({
      cloakBack: <path d="M42 74 Q30 100 28 128 Q60 134 92 128 Q90 100 78 74 Z" fill={shade(cloakHex(a), -0.15)} {...O} />,
      cloakFront: (
        <path
          d="M38 80 Q36 72 44 70 Q48 66 54 70 Q60 66 66 70 Q72 66 76 70 Q84 72 82 80 Q76 86 70 82 Q64 88 60 84 Q56 88 50 82 Q44 86 38 80 Z"
          fill="#D8C7A8"
          {...O}
        />
      ),
    }),
  },
];

// ───────────────────────── hands, feet, belt ─────────────────────────

export const GLOVES: PartOption[] = [
  { id: 'none', label: 'Bare hands' },
  {
    id: 'leather',
    label: 'Leather gloves',
    draw: () => ({
      gloves: (
        <g fill={LEATHER} {...O}>
          <circle cx={35} cy={106} r={6} />
          <circle cx={85} cy={106} r={6} />
        </g>
      ),
    }),
  },
  {
    id: 'gauntlets',
    label: 'Gauntlets',
    draw: () => ({
      gloves: (
        <g fill="#B1B7BC" {...O}>
          <path d="M29 96 L41 96 L42 110 Q35 114 28 110 Z" />
          <path d="M79 96 L91 96 L92 110 Q85 114 78 110 Z" />
        </g>
      ),
    }),
  },
  {
    id: 'wraps',
    label: 'Hand wraps',
    draw: () => ({
      gloves: (
        <g>
          <g fill={CREAM} {...O}>
            <circle cx={35} cy={106} r={6} />
            <circle cx={85} cy={106} r={6} />
          </g>
          <path d="M30 104 L40 108 M80 104 L90 108" stroke="#B8A888" strokeWidth={1.2} />
        </g>
      ),
    }),
  },
];

export const BOOTS: PartOption[] = [
  {
    id: 'simple',
    label: 'Simple boots',
    draw: () => ({
      boots: (
        <g fill="#4A3A2E" {...O}>
          <path d="M47 130 L59 130 L59 142 L45 142 Q45 136 47 130 Z" />
          <path d="M61 130 L73 130 Q75 136 75 142 L61 142 Z" />
        </g>
      ),
    }),
  },
  {
    id: 'tall',
    label: 'Tall boots',
    draw: () => ({
      boots: (
        <g>
          <g fill="#5A4030" {...O}>
            <path d="M47 118 L59 118 L59 142 L45 142 Q45 132 47 118 Z" />
            <path d="M61 118 L73 118 Q75 132 75 142 L61 142 Z" />
          </g>
          <path d="M47 122 L59 122 M61 122 L73 122" stroke="#3A2A20" strokeWidth={2} />
        </g>
      ),
    }),
  },
  {
    id: 'armored',
    label: 'Sabatons',
    draw: () => ({
      boots: (
        <g fill="#AAB0B5" {...O}>
          <path d="M47 122 L59 122 L59 142 L44 142 Q44 134 47 122 Z" />
          <path d="M61 122 L73 122 Q76 134 76 142 L61 142 Z" />
          <path d="M47 130 L59 130 M61 130 L73 130" stroke="#7E848A" strokeWidth={1.2} />
        </g>
      ),
    }),
  },
  {
    id: 'sandals',
    label: 'Sandals',
    draw: (a) => ({
      boots: (
        <g>
          <g fill={skinHex(a)} {...O}>
            <path d="M48 134 L58 134 L59 142 L46 142 Z" />
            <path d="M62 134 L72 134 L74 142 L61 142 Z" />
          </g>
          <path d="M48 137 L58 137 M62 137 L72 137 M46 141 L59 141 M61 141 L74 141" stroke={LEATHER} strokeWidth={2} />
        </g>
      ),
    }),
  },
];

export const BELTS: PartOption[] = [
  { id: 'none', label: 'None' },
  {
    id: 'leather',
    label: 'Leather belt',
    draw: () => ({
      belt: (
        <g>
          <rect x={40} y={106} width={40} height={7} rx={1.5} fill={LEATHER} {...O} />
          <rect x={56} y={105} width={8} height={9} rx={1.5} fill={GOLD} {...O} strokeWidth={1.2} />
        </g>
      ),
    }),
  },
  {
    id: 'sash',
    label: 'Sash',
    draw: (a) => ({
      belt: (
        <g fill={shade(cloakHex(a), 0.15)} {...O}>
          <rect x={40} y={105} width={40} height={8} rx={2} />
          <path d="M68 110 L74 128 L68 126 L64 112 Z" />
        </g>
      ),
    }),
  },
  {
    id: 'pouches',
    label: 'Pouch belt',
    draw: () => ({
      belt: (
        <g>
          <rect x={40} y={106} width={40} height={7} rx={1.5} fill={LEATHER} {...O} />
          <rect x={43} y={110} width={9} height={10} rx={2.5} fill="#8A6A4A" {...O} />
          <rect x={68} y={110} width={9} height={10} rx={2.5} fill="#8A6A4A" {...O} />
          <rect x={56} y={105} width={8} height={9} rx={1.5} fill={GOLD} {...O} strokeWidth={1.2} />
        </g>
      ),
    }),
  },
];

// ───────────────────────── weapons (held in the right hand at 35,106) ─────────────────────────

export const WEAPONS: PartOption[] = [
  { id: 'none', label: 'Empty hands' },
  {
    id: 'sword',
    label: 'Longsword',
    draw: () => ({
      weapon: (
        <g {...O}>
          <path d="M32 100 L32 56 L35 50 L38 56 L38 100 Z" fill="#D7DADD" />
          <path d="M35 54 L35 98" stroke="#A9AEB3" strokeWidth={1} />
          <rect x={26} y={99} width={18} height={4} rx={1.5} fill={GOLD} />
          <rect x={33} y={103} width={4} height={10} fill={LEATHER} />
          <circle cx={35} cy={115} r={2.8} fill={GOLD} />
        </g>
      ),
    }),
  },
  {
    id: 'axe',
    label: 'Battleaxe',
    draw: () => ({
      weapon: (
        <g {...O}>
          <path d="M33.5 122 L33.5 58 L36.5 58 L36.5 122 Z" fill={WOOD} />
          <path d="M36 60 Q48 56 52 64 Q54 72 50 80 Q46 74 36 76 Z" fill="#C9CDD1" />
          <path d="M34 62 Q26 64 24 70 Q26 74 34 74 Z" fill="#C9CDD1" />
        </g>
      ),
    }),
  },
  {
    id: 'mace',
    label: 'Mace',
    draw: () => ({
      weapon: (
        <g {...O}>
          <rect x={33.5} y={74} width={3} height={44} fill={WOOD} />
          <path d="M35 58 L38 63 L44 62 L41 68 L44 74 L38 73 L35 78 L32 73 L26 74 L29 68 L26 62 L32 63 Z" fill="#B1B7BC" />
          <circle cx={35} cy={68} r={4} fill="#D0D4D8" strokeWidth={1.2} />
        </g>
      ),
    }),
  },
  {
    id: 'dagger',
    label: 'Daggers',
    draw: () => ({
      weapon: (
        <g {...O}>
          <path d="M33 100 L33 82 L35 77 L37 82 L37 100 Z" fill="#D7DADD" />
          <rect x={29} y={99} width={12} height={3} rx={1} fill={GOLD} />
          <rect x={33.5} y={102} width={3} height={8} fill={LEATHER} />
          <path d="M83 100 L83 82 L85 77 L87 82 L87 100 Z" fill="#D7DADD" />
          <rect x={79} y={99} width={12} height={3} rx={1} fill={GOLD} />
        </g>
      ),
    }),
  },
  {
    id: 'staff',
    label: 'Staff',
    draw: () => ({
      weapon: (
        <g {...O}>
          <path d="M33 142 L33 34 Q35 30 37 34 L37 142 Z" fill={WOOD} />
          <path d="M29 36 Q28 22 35 18 Q42 22 41 36 Q38 30 35 30 Q32 30 29 36 Z" fill={WOOD} />
          <circle cx={35} cy={26} r={5.5} fill="#8FC1C9" />
          <circle cx={33.5} cy={24.5} r={1.6} fill="#fff" stroke="none" />
        </g>
      ),
    }),
  },
  {
    id: 'wand',
    label: 'Wand',
    draw: () => ({
      weapon: (
        <g {...O}>
          <path d="M34 108 L27 82 L29.5 81 L37 107 Z" fill="#4A3A2E" />
          <path d="M27 72 L29 77 L34 77 L30 80 L32 85 L27.5 82 L23 85 L24.5 80 L20.5 77 L25.5 77 Z" fill={GOLD} strokeWidth={1.2} />
        </g>
      ),
    }),
  },
  {
    id: 'bow',
    label: 'Longbow',
    draw: () => ({
      weapon: (
        <g>
          <path d="M33 54 L33 150" stroke="#E9DFC8" strokeWidth={1} />
          <path d="M33 54 Q12 100 33 150" fill="none" stroke={INK} strokeWidth={5.4} strokeLinecap="round" />
          <path d="M33 54 Q12 100 33 150" fill="none" stroke={WOOD} strokeWidth={3} strokeLinecap="round" />
          <rect x={20} y={96} width={6} height={10} rx={1.5} fill={LEATHER} {...O} strokeWidth={1.2} />
        </g>
      ),
    }),
  },
  {
    id: 'spear',
    label: 'Spear',
    draw: () => ({
      weapon: (
        <g {...O}>
          <rect x={33.5} y={44} width={3} height={100} fill={WOOD} />
          <path d="M35 24 L40 40 L35 46 L30 40 Z" fill="#D7DADD" />
          <path d="M31 46 L39 46 L37 50 L33 50 Z" fill={GOLD} strokeWidth={1.2} />
        </g>
      ),
    }),
  },
  {
    id: 'lute',
    label: 'Lute',
    draw: () => ({
      weapon: (
        <g {...O}>
          <path d="M40 98 L52 66 L56 68 L44 100 Z" fill="#6B4A33" />
          <path d="M50 62 L58 58 L60 66 L54 68 Z" fill="#4A3A2E" />
          <ellipse cx={36} cy={108} rx={11} ry={13} fill="#C9934F" transform="rotate(22 36 108)" />
          <circle cx={38} cy={104} r={3.2} fill="#4A3A2E" />
          <path d="M33 116 L39 114" stroke="#4A3A2E" strokeWidth={2} />
        </g>
      ),
    }),
  },
];

// ───────────────────────── shields (left arm at 85,106) ─────────────────────────

export const SHIELDS: PartOption[] = [
  { id: 'none', label: 'No shield' },
  {
    id: 'round',
    label: 'Round shield',
    draw: (a) => ({
      shield: (
        <g {...O}>
          <circle cx={88} cy={100} r={16} fill={WOOD} />
          <circle cx={88} cy={100} r={16} fill="none" stroke="#A9AEB3" strokeWidth={3} />
          <path d="M76 92 L100 108 M76 108 L100 92" stroke={shade(WOOD, -0.25)} strokeWidth={1.2} />
          <circle cx={88} cy={100} r={4.5} fill={topHex(a) === CREAM ? GOLD : '#C9CDD1'} />
        </g>
      ),
    }),
  },
  {
    id: 'kite',
    label: 'Kite shield',
    draw: (a) => ({
      shield: (
        <g {...O}>
          <path d="M74 84 L102 84 L102 100 Q102 118 88 128 Q74 118 74 100 Z" fill={cloakHex(a)} />
          <path d="M88 86 L88 124 M76 100 L100 100" stroke={GOLD} strokeWidth={2.4} />
        </g>
      ),
    }),
  },
  {
    id: 'buckler',
    label: 'Buckler',
    draw: () => ({
      shield: (
        <g {...O}>
          <circle cx={87} cy={104} r={9.5} fill="#B1B7BC" />
          <circle cx={87} cy={104} r={3.4} fill="#D7DADD" strokeWidth={1.2} />
        </g>
      ),
    }),
  },
  {
    id: 'holy',
    label: 'Sun shield',
    draw: () => ({
      shield: (
        <g {...O}>
          <path d="M73 84 L103 84 L103 104 Q100 120 88 126 Q76 120 73 104 Z" fill={CREAM} />
          <circle cx={88} cy={102} r={6} fill={GOLD} strokeWidth={1.2} />
          <g stroke={GOLD} strokeWidth={2}>
            <path d="M88 89 L88 93 M88 111 L88 115 M75 102 L79 102 M97 102 L101 102 M79 93 L82 96 M97 93 L94 96 M79 111 L82 108 M97 111 L94 108" />
          </g>
        </g>
      ),
    }),
  },
];

// ───────────────────────── accessories ─────────────────────────

export const ACCESSORIES: PartOption[] = [
  { id: 'none', label: 'None' },
  {
    id: 'hood',
    label: 'Hood',
    draw: (a) => ({
      accessory: (
        <path
          fillRule="evenodd"
          d="M33 74 Q28 18 60 15 Q92 18 87 74 Q74 70 60 70 Q46 70 33 74 Z M60 27 Q78 27 79 50 Q78 68 60 68 Q42 68 41 50 Q42 27 60 27 Z"
          fill={cloakHex(a)}
          {...O}
        />
      ),
    }),
  },
  {
    id: 'wizard',
    label: 'Wizard hat',
    draw: (a) => ({
      accessory: (
        <g {...O}>
          <path d="M40 30 Q52 14 58 -4 Q62 -10 70 -6 Q64 6 80 30 Z" fill={topHex(a)} />
          <path d="M42 26 Q60 32 78 26 L80 30 Q60 36 40 30 Z" fill={GOLD} strokeWidth={1.2} />
          <ellipse cx={60} cy={31} rx={32} ry={6.5} fill={shade(topHex(a), -0.1)} />
          <path d="M60 12 L62 16 L66 16 L63 19 L64 23 L60 21 L56 23 L57 19 L54 16 L58 16 Z" fill={GOLD} strokeWidth={1} />
        </g>
      ),
    }),
  },
  {
    id: 'circlet',
    label: 'Circlet',
    draw: () => ({
      accessory: (
        <g {...O} strokeWidth={1.2}>
          <path d="M38 38 Q60 30 82 38 L82 41 Q60 33 38 41 Z" fill={GOLD} />
          <path d="M60 30 L63 35 L60 39 L57 35 Z" fill="#7FB3BD" />
        </g>
      ),
    }),
  },
  {
    id: 'cap',
    label: 'Feathered cap',
    draw: (a) => ({
      accessory: (
        <g {...O}>
          <path d="M70 26 Q90 4 98 6 Q90 16 76 30 Z" fill="#E9DFC8" />
          <path d="M36 36 Q38 16 60 16 Q82 16 84 36 Q60 30 36 36 Z" fill={cloakHex(a)} />
          <path d="M34 36 Q60 28 86 36 L84 40 Q60 34 36 40 Z" fill={shade(cloakHex(a), -0.25)} />
        </g>
      ),
    }),
  },
  {
    id: 'helmet',
    label: 'Helmet',
    draw: () => ({
      accessory: (
        <g {...O}>
          <path d="M36 50 Q35 19 60 19 Q85 19 84 50 L78 50 Q78 38 60 38 Q42 38 42 50 Z" fill="#B9BEC3" />
          <path d="M42 26 Q50 22 56 24" stroke="#fff" strokeWidth={2} opacity={0.6} fill="none" />
          <rect x={57.5} y={36} width={5} height={16} rx={1.5} fill="#A3A9AF" />
          <path d="M60 19 L60 8" stroke={INK} strokeWidth={4} />
          <path d="M60 19 L60 8" stroke="#C17C61" strokeWidth={2.4} />
        </g>
      ),
    }),
  },
  {
    id: 'leaves',
    label: 'Leaf crown',
    draw: () => ({
      accessory: (
        <g fill="#7E9466" {...O} strokeWidth={1.2}>
          {[
            [40, 36, -50],
            [47, 29, -30],
            [55, 25, -10],
            [65, 25, 10],
            [73, 29, 30],
            [80, 36, 50],
          ].map(([x, y, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx={4} ry={7} transform={`rotate(${r} ${x} ${y})`} />
          ))}
          <circle cx={60} cy={26} r={2.6} fill="#C17C61" />
        </g>
      ),
    }),
  },
  {
    id: 'eyepatch',
    label: 'Eyepatch',
    draw: () => ({
      accessory: (
        <g>
          <path d="M38 40 L82 56" stroke={INK} strokeWidth={2} />
          <ellipse cx={52} cy={48} rx={6} ry={5.5} fill="#2A211C" {...O} strokeWidth={1.2} />
        </g>
      ),
    }),
  },
  {
    id: 'amulet',
    label: 'Amulet',
    draw: () => ({
      accBody: (
        <g>
          <path d="M51 74 L60 90 L69 74" fill="none" stroke={GOLD} strokeWidth={1.6} />
          <path d="M60 87 L64 92 L60 98 L56 92 Z" fill="#9C3D35" {...O} strokeWidth={1.2} />
        </g>
      ),
    }),
  },
  {
    id: 'scarf',
    label: 'Scarf',
    draw: (a) => ({
      accBody: (
        <g fill={shade(cloakHex(a), 0.2)} {...O}>
          <path d="M46 70 Q60 80 74 70 L76 78 Q60 88 44 78 Z" />
          <path d="M64 80 L72 102 L64 100 L58 82 Z" />
        </g>
      ),
    }),
  },
];

export const PARTS = {
  body: BODY_TYPES,
  face: FACES,
  eyes: EYES,
  ears: EARS,
  facialHair: FACIAL_HAIR,
  hair: HAIRSTYLES,
  top: TOPS,
  cloak: CLOAKS,
  gloves: GLOVES,
  boots: BOOTS,
  belt: BELTS,
  weapon: WEAPONS,
  shield: SHIELDS,
  accessory: ACCESSORIES,
} as const;

export type PartSlot = keyof typeof PARTS;

export const COLOR_SLOTS = {
  skin: SKIN_TONES,
  hairColor: HAIR_COLORS,
  topColor: CLOTH_COLORS,
  cloakColor: CLOTH_COLORS,
  baseColor: BASE_COLORS,
} as const;

export type ColorSlot = keyof typeof COLOR_SLOTS;

export function findPart<S extends PartSlot>(slot: S, id: string): (typeof PARTS)[S][number] {
  const list = PARTS[slot] as readonly PartOption[];
  return (list.find((p) => p.id === id) ?? list[0]) as (typeof PARTS)[S][number];
}
