import type { Appearance } from '../types';
import { COLOR_SLOTS, PARTS, type ColorSlot, type PartSlot } from '../figurine/parts';
import type { Crop } from '../figurine/FigurineArt';
import type { IconName } from '../components/Icon';

export type Category =
  | { id: string; label: string; group: string; kind: 'archetype'; icon: IconName }
  | { id: string; label: string; group: string; kind: 'part'; slot: PartSlot; crop: Crop; icon: IconName }
  | { id: string; label: string; group: string; kind: 'color'; slot: ColorSlot; icon: IconName };

export const CATEGORIES: Category[] = [
  { id: 'archetype', label: 'Archetype', group: 'Adventurer', kind: 'archetype', icon: 'sparkle' },
  { id: 'body', label: 'Body', group: 'Appearance', kind: 'part', slot: 'body', crop: 'figure', icon: 'user' },
  { id: 'skin', label: 'Skin tone', group: 'Appearance', kind: 'color', slot: 'skin', icon: 'hand' },
  { id: 'face', label: 'Face', group: 'Appearance', kind: 'part', slot: 'face', crop: 'head', icon: 'user' },
  { id: 'eyes', label: 'Eyes', group: 'Appearance', kind: 'part', slot: 'eyes', crop: 'head', icon: 'eye' },
  { id: 'ears', label: 'Ears & horns', group: 'Appearance', kind: 'part', slot: 'ears', crop: 'head', icon: 'user' },
  { id: 'facialHair', label: 'Facial hair', group: 'Appearance', kind: 'part', slot: 'facialHair', crop: 'head', icon: 'user' },
  { id: 'hair', label: 'Hairstyle', group: 'Appearance', kind: 'part', slot: 'hair', crop: 'head', icon: 'user' },
  { id: 'hairColor', label: 'Hair color', group: 'Appearance', kind: 'color', slot: 'hairColor', icon: 'sparkle' },
  { id: 'top', label: 'Tunic & armor', group: 'Gear', kind: 'part', slot: 'top', crop: 'figure', icon: 'shield' },
  { id: 'topColor', label: 'Clothing color', group: 'Gear', kind: 'color', slot: 'topColor', icon: 'sparkle' },
  { id: 'cloak', label: 'Cloak', group: 'Gear', kind: 'part', slot: 'cloak', crop: 'figure', icon: 'shield' },
  { id: 'cloakColor', label: 'Cloak color', group: 'Gear', kind: 'color', slot: 'cloakColor', icon: 'sparkle' },
  { id: 'gloves', label: 'Gloves', group: 'Gear', kind: 'part', slot: 'gloves', crop: 'figure', icon: 'hand' },
  { id: 'boots', label: 'Boots', group: 'Gear', kind: 'part', slot: 'boots', crop: 'figure', icon: 'boot' },
  { id: 'belt', label: 'Belt', group: 'Gear', kind: 'part', slot: 'belt', crop: 'figure', icon: 'shield' },
  { id: 'weapon', label: 'Weapon', group: 'Gear', kind: 'part', slot: 'weapon', crop: 'full', icon: 'bolt' },
  { id: 'shield', label: 'Shield', group: 'Gear', kind: 'part', slot: 'shield', crop: 'figure', icon: 'shield' },
  { id: 'accessory', label: 'Accessory', group: 'Gear', kind: 'part', slot: 'accessory', crop: 'full', icon: 'sparkle' },
  { id: 'baseColor', label: 'Base', group: 'Gear', kind: 'color', slot: 'baseColor', icon: 'target' },
];

export function optionsFor(cat: Category): { id: string; label: string; hex?: string }[] {
  if (cat.kind === 'part') return PARTS[cat.slot].map((p) => ({ id: p.id, label: p.label }));
  if (cat.kind === 'color') return COLOR_SLOTS[cat.slot].map((c) => ({ id: c.id, label: c.label, hex: c.hex }));
  return [];
}

export const valueOf = (a: Appearance, slot: PartSlot | ColorSlot) => (a as unknown as Record<string, string>)[slot];
