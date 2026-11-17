// Core data model for CocoaJourney. Everything here is plain JSON so a
// session can be persisted, exported, or (later) synchronised over the wire.

export type ID = string;

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type RulesetId = 'dnd5e';

/** Every visual slot of a figurine. Each value is an option id from the parts registry. */
export interface Appearance {
  body: string;
  skin: string;
  face: string;
  eyes: string;
  ears: string;
  facialHair: string;
  hair: string;
  hairColor: string;
  top: string; // shirt / tunic / armor / robe
  topColor: string;
  cloak: string;
  cloakColor: string;
  gloves: string;
  boots: string;
  belt: string;
  weapon: string;
  shield: string;
  accessory: string;
  baseColor: string;
}

export interface CharacterSheet {
  className: string;
  species: string;
  level: number;
  background: string;
  alignment: string;
  abilities: Record<AbilityKey, number>;
  saveProficiencies: AbilityKey[];
  skillProficiencies: string[]; // skill ids
  skillExpertise: string[];
  hp: number;
  maxHp: number;
  tempHp: number;
  ac: number;
  speed: number;
  initiativeBonus: number; // extra on top of DEX
  equipment: string;
  spells: string;
  notes: string;
}

export interface Character {
  id: ID;
  name: string;
  archetype: string;
  ruleset: RulesetId;
  appearance: Appearance;
  sheet: CharacterSheet;
  createdAt: number;
  updatedAt: number;
}

/** A figurine is a character's physical presence on the table. */
export interface Figurine {
  characterId: ID;
  x: number; // world px (map image space), centre of the base
  y: number;
  onTable: boolean;
  size: 1 | 2 | 3; // footprint in grid cells
}

export interface GridSettings {
  visible: boolean;
  snap: boolean;
  cellSize: number; // map px
  opacity: number; // 0..1
  color: string;
  offsetX: number;
  offsetY: number;
}

export type MapSource =
  | { kind: 'sample'; sampleId: string }
  | { kind: 'upload'; blobKey: string; mime: string };

export interface MapInfo {
  id: ID;
  name: string;
  width: number;
  height: number;
  source: MapSource;
}

export interface Camera {
  x: number; // screen offset of world origin
  y: number;
  scale: number;
}

export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export type RollMode = 'normal' | 'advantage' | 'disadvantage';

export interface DiceRequest {
  dice: Partial<Record<DieType, number>>;
  modifier: number;
  mode: RollMode;
  label?: string;
  characterId?: ID;
}

export interface DieResult {
  type: DieType;
  value: number;
  /** For d100: the tens and units dice values that made it. */
  parts?: [number, number];
  dropped?: boolean; // the discarded d20 under advantage/disadvantage
}

export interface DiceRoll {
  id: ID;
  at: number;
  request: DiceRequest;
  results: DieResult[];
  total: number;
  /** Pretty formula, e.g. "2d6 + 3". */
  formula: string;
  natural?: 'crit' | 'fumble';
  /** "physics" when read from the 3D tray, "instant" when rolled without animation. */
  method: 'physics' | 'instant';
}

export type Role = 'dm' | 'player';

export interface Session {
  id: ID;
  name: string;
  createdAt: number;
  updatedAt: number;
  map: MapInfo | null;
  grid: GridSettings;
  camera: Camera | null;
  characters: Character[];
  figurines: Record<ID, Figurine>;
  rolls: DiceRoll[];
  /** Reserved for future shared-room play; a single shared device acts as the DM table. */
  role: Role;
}

export interface Preferences {
  animateDice: boolean;
  diceSound: boolean;
  reduceMotion: boolean;
}
