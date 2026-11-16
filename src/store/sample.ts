import type { Character, GridSettings, Session } from '../types';
import { DEFAULT_APPEARANCE, ARCHETYPES } from '../figurine/archetypes';
import { blankSheet } from '../rules/dnd5e';
import { uid } from '../lib/id';
import { SAMPLE_MAPS } from '../lib/mapStore';

export const DEFAULT_GRID: GridSettings = {
  visible: true,
  snap: true,
  cellSize: 56,
  opacity: 0.28,
  color: '#503422',
  offsetX: 0,
  offsetY: 0,
};

export function makeCharacter(name: string, archetypeId: string, look: Partial<Character['appearance']> = {}, sheet: Partial<Character['sheet']> = {}): Character {
  const arche = ARCHETYPES.find((a) => a.id === archetypeId) ?? ARCHETYPES[ARCHETYPES.length - 1];
  const now = Date.now();
  return {
    id: uid('c'),
    name,
    archetype: arche.id,
    ruleset: 'dnd5e',
    appearance: { ...DEFAULT_APPEARANCE, ...arche.look, ...look },
    sheet: blankSheet({ className: arche.className, ...arche.sheet, ...sheet }),
    createdAt: now,
    updatedAt: now,
  };
}

export function emptySession(name: string): Session {
  const now = Date.now();
  return {
    id: uid('s'),
    name,
    createdAt: now,
    updatedAt: now,
    map: null,
    grid: { ...DEFAULT_GRID },
    camera: null,
    characters: [],
    figurines: {},
    rolls: [],
    role: 'dm',
  };
}

export function sampleSession(): Session {
  const s = emptySession('The Sunken Abbey');
  const m = SAMPLE_MAPS.abbey;
  s.map = { id: uid('m'), name: m.name, width: m.width, height: m.height, source: { kind: 'sample', sampleId: 'abbey' } };

  const wren = makeCharacter(
    'Wren Ashby',
    'ranger',
    { skin: 'peach', hair: 'ponytail', hairColor: 'copper', ears: 'pointed', eyes: 'dot', face: 'smile', baseColor: 'forest' },
    { species: 'Elf', level: 4, background: 'Outlander', alignment: 'Neutral good', maxHp: 32, hp: 28, ac: 15, speed: 35, initiativeBonus: 0, abilities: { str: 12, dex: 17, con: 13, int: 10, wis: 15, cha: 9 }, equipment: 'Longbow, 20 arrows, shortsword, leather armor, hunting trap' },
  );
  const brom = makeCharacter(
    'Brom Ironvale',
    'paladin',
    { skin: 'bronze', body: 'sturdy', hair: 'cropped', hairColor: 'raven', facialHair: 'braided', eyes: 'sharp', face: 'stern', accessory: 'none', baseColor: 'slate' },
    { species: 'Dwarf', level: 4, background: 'Soldier', alignment: 'Lawful good', maxHp: 44, hp: 41, ac: 18, speed: 25, abilities: { str: 17, dex: 9, con: 16, int: 10, wis: 12, cha: 14 } },
  );
  const ilsa = makeCharacter(
    'Ilsa Morrow',
    'mage',
    { skin: 'porcelain', hair: 'long', hairColor: 'ash', eyes: 'glow', face: 'calm', topColor: 'plum', baseColor: 'cocoa' },
    { species: 'Human', level: 4, background: 'Sage', alignment: 'Chaotic good', maxHp: 22, hp: 9, ac: 12, abilities: { str: 8, dex: 14, con: 13, int: 17, wis: 12, cha: 11 }, spells: 'Cantrips: Fire Bolt, Mage Hand, Light\nLevel 1: Shield, Magic Missile, Detect Magic\nLevel 2: Misty Step, Web' },
  );
  const pip = makeCharacter(
    'Pip Tumbleweed',
    'rogue',
    { skin: 'umber', body: 'small', hair: 'curls', hairColor: 'chestnut', face: 'grin', eyes: 'wink', accessory: 'none', cloakColor: 'terracotta', baseColor: 'terracotta' },
    { species: 'Halfling', level: 3, background: 'Urchin', alignment: 'Chaotic neutral', maxHp: 21, hp: 19, ac: 14, speed: 25, abilities: { str: 8, dex: 17, con: 12, int: 13, wis: 10, cha: 14 } },
  );

  s.characters = [wren, brom, ilsa, pip];
  s.grid = { ...DEFAULT_GRID, cellSize: 84 };
  const c = s.grid.cellSize;
  const at = (col: number, row: number) => ({ x: col * c + c / 2, y: row * c + c / 2 });
  const spots = [at(14, 13), at(16, 13), at(15, 14), at(13, 14)];
  s.characters.forEach((ch, i) => (s.figurines[ch.id] = { characterId: ch.id, ...spots[i], onTable: true, size: 1 }));
  return s;
}
