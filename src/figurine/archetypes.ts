import type { Appearance, CharacterSheet } from '../types';
import { PARTS, COLOR_SLOTS, type PartSlot, type ColorSlot } from './parts';
import { pick } from '../lib/id';

export const DEFAULT_APPEARANCE: Appearance = {
  body: 'average',
  skin: 'peach',
  face: 'smile',
  eyes: 'dot',
  ears: 'round',
  facialHair: 'none',
  hair: 'messy',
  hairColor: 'chestnut',
  top: 'tunic',
  topColor: 'forest',
  cloak: 'cape',
  cloakColor: 'cocoa',
  gloves: 'none',
  boots: 'simple',
  belt: 'leather',
  weapon: 'sword',
  shield: 'none',
  accessory: 'none',
  baseColor: 'cocoa',
};

export interface Archetype {
  id: string;
  label: string;
  className: string;
  look: Partial<Appearance>;
  sheet: Partial<CharacterSheet>;
}

export const ARCHETYPES: Archetype[] = [
  {
    id: 'warrior',
    label: 'Warrior',
    className: 'Fighter',
    look: { top: 'chain', topColor: 'crimson', weapon: 'sword', shield: 'round', gloves: 'gauntlets', boots: 'armored', cloak: 'cape', cloakColor: 'crimson', accessory: 'none' },
    sheet: { abilities: { str: 16, dex: 12, con: 15, int: 9, wis: 11, cha: 10 }, saveProficiencies: ['str', 'con'], skillProficiencies: ['athletics', 'intimidation'], ac: 16, maxHp: 12, hp: 12, equipment: 'Chain shirt, longsword, round shield, bedroll' },
  },
  {
    id: 'mage',
    label: 'Mage',
    className: 'Wizard',
    look: { top: 'robe', topColor: 'navy', weapon: 'staff', shield: 'none', gloves: 'none', boots: 'simple', cloak: 'none', accessory: 'wizard', eyes: 'glow', belt: 'sash', cloakColor: 'mustard' },
    sheet: { abilities: { str: 8, dex: 14, con: 13, int: 16, wis: 12, cha: 10 }, saveProficiencies: ['int', 'wis'], skillProficiencies: ['arcana', 'history'], ac: 12, maxHp: 7, hp: 7, equipment: 'Staff, spellbook, component pouch', spells: 'Cantrips: \nLevel 1: ' },
  },
  {
    id: 'rogue',
    label: 'Rogue',
    className: 'Rogue',
    look: { top: 'leather', topColor: 'charcoal', weapon: 'dagger', shield: 'none', gloves: 'leather', boots: 'tall', cloak: 'long', cloakColor: 'charcoal', accessory: 'hood', belt: 'pouches', face: 'smirk' },
    sheet: { abilities: { str: 10, dex: 16, con: 12, int: 13, wis: 11, cha: 14 }, saveProficiencies: ['dex', 'int'], skillProficiencies: ['stealth', 'sleight', 'acrobatics', 'deception'], skillExpertise: ['stealth'], ac: 14, maxHp: 9, hp: 9, equipment: "Leather armor, two daggers, thieves' tools" },
  },
  {
    id: 'ranger',
    label: 'Ranger',
    className: 'Ranger',
    look: { top: 'leather', topColor: 'forest', weapon: 'bow', shield: 'none', gloves: 'leather', boots: 'tall', cloak: 'long', cloakColor: 'forest', accessory: 'none', belt: 'leather' },
    sheet: { abilities: { str: 12, dex: 16, con: 13, int: 10, wis: 14, cha: 9 }, saveProficiencies: ['str', 'dex'], skillProficiencies: ['survival', 'perception', 'nature'], ac: 14, maxHp: 11, hp: 11, speed: 30, equipment: 'Longbow, quiver of arrows, leather armor' },
  },
  {
    id: 'cleric',
    label: 'Cleric',
    className: 'Cleric',
    look: { top: 'chain', topColor: 'cream', weapon: 'mace', shield: 'holy', gloves: 'none', boots: 'simple', cloak: 'cape', cloakColor: 'mustard', accessory: 'amulet' },
    sheet: { abilities: { str: 13, dex: 10, con: 14, int: 10, wis: 16, cha: 12 }, saveProficiencies: ['wis', 'cha'], skillProficiencies: ['medicine', 'religion', 'insight'], ac: 18, maxHp: 10, hp: 10, equipment: 'Mace, shield, holy symbol' },
  },
  {
    id: 'bard',
    label: 'Bard',
    className: 'Bard',
    look: { top: 'vest', topColor: 'plum', weapon: 'lute', shield: 'none', gloves: 'none', boots: 'tall', cloak: 'cape', cloakColor: 'terracotta', accessory: 'cap', face: 'grin' },
    sheet: { abilities: { str: 9, dex: 14, con: 12, int: 11, wis: 10, cha: 16 }, saveProficiencies: ['dex', 'cha'], skillProficiencies: ['performance', 'persuasion', 'deception'], ac: 13, maxHp: 9, hp: 9, equipment: 'Lute, rapier, fine clothes' },
  },
  {
    id: 'druid',
    label: 'Druid',
    className: 'Druid',
    look: { top: 'robe', topColor: 'forest', weapon: 'staff', shield: 'none', gloves: 'none', boots: 'sandals', cloak: 'mantle', cloakColor: 'cocoa', accessory: 'leaves', belt: 'sash' },
    sheet: { abilities: { str: 10, dex: 12, con: 14, int: 12, wis: 16, cha: 10 }, saveProficiencies: ['int', 'wis'], skillProficiencies: ['nature', 'animal'], ac: 13, maxHp: 9, hp: 9, equipment: 'Wooden staff, herbalism kit' },
  },
  {
    id: 'paladin',
    label: 'Paladin',
    className: 'Paladin',
    look: { top: 'plate', topColor: 'navy', weapon: 'sword', shield: 'kite', gloves: 'gauntlets', boots: 'armored', cloak: 'long', cloakColor: 'navy', accessory: 'none' },
    sheet: { abilities: { str: 16, dex: 9, con: 14, int: 10, wis: 12, cha: 15 }, saveProficiencies: ['wis', 'cha'], skillProficiencies: ['athletics', 'persuasion'], ac: 18, maxHp: 12, hp: 12, equipment: 'Plate armor, longsword, kite shield' },
  },
  {
    id: 'custom',
    label: 'Custom',
    className: 'Fighter',
    look: {},
    sheet: {},
  },
];

const SLOTS: PartSlot[] = ['body', 'face', 'eyes', 'ears', 'facialHair', 'hair', 'top', 'cloak', 'gloves', 'boots', 'belt', 'weapon', 'shield', 'accessory'];
const COLORS: ColorSlot[] = ['skin', 'hairColor', 'topColor', 'cloakColor', 'baseColor'];

export function randomAppearance(): Appearance {
  const a = { ...DEFAULT_APPEARANCE } as Record<string, string>;
  const arche = pick(ARCHETYPES.filter((x) => x.id !== 'custom'));
  Object.assign(a, arche.look);
  for (const s of ['body', 'face', 'eyes', 'ears', 'facialHair', 'hair'] as PartSlot[]) a[s] = pick(PARTS[s]).id;
  for (const c of COLORS) a[c] = pick(COLOR_SLOTS[c]).id;
  return a as unknown as Appearance;
}

export function fullyRandomAppearance(): Appearance {
  const a = {} as Record<string, string>;
  for (const s of SLOTS) a[s] = pick(PARTS[s]).id;
  for (const c of COLORS) a[c] = pick(COLOR_SLOTS[c]).id;
  return a as unknown as Appearance;
}
