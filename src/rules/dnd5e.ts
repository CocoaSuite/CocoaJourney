import type { AbilityKey, CharacterSheet } from '../types';

// Fifth-edition style math. Rulesets live in their own module so others can be
// added later behind the same small surface (abilities, skills, derived stats).

export const ABILITIES: { key: AbilityKey; short: string; name: string }[] = [
  { key: 'str', short: 'STR', name: 'Strength' },
  { key: 'dex', short: 'DEX', name: 'Dexterity' },
  { key: 'con', short: 'CON', name: 'Constitution' },
  { key: 'int', short: 'INT', name: 'Intelligence' },
  { key: 'wis', short: 'WIS', name: 'Wisdom' },
  { key: 'cha', short: 'CHA', name: 'Charisma' },
];

export const SKILLS: { id: string; name: string; ability: AbilityKey }[] = [
  { id: 'acrobatics', name: 'Acrobatics', ability: 'dex' },
  { id: 'animal', name: 'Animal Handling', ability: 'wis' },
  { id: 'arcana', name: 'Arcana', ability: 'int' },
  { id: 'athletics', name: 'Athletics', ability: 'str' },
  { id: 'deception', name: 'Deception', ability: 'cha' },
  { id: 'history', name: 'History', ability: 'int' },
  { id: 'insight', name: 'Insight', ability: 'wis' },
  { id: 'intimidation', name: 'Intimidation', ability: 'cha' },
  { id: 'investigation', name: 'Investigation', ability: 'int' },
  { id: 'medicine', name: 'Medicine', ability: 'wis' },
  { id: 'nature', name: 'Nature', ability: 'int' },
  { id: 'perception', name: 'Perception', ability: 'wis' },
  { id: 'performance', name: 'Performance', ability: 'cha' },
  { id: 'persuasion', name: 'Persuasion', ability: 'cha' },
  { id: 'religion', name: 'Religion', ability: 'int' },
  { id: 'sleight', name: 'Sleight of Hand', ability: 'dex' },
  { id: 'stealth', name: 'Stealth', ability: 'dex' },
  { id: 'survival', name: 'Survival', ability: 'wis' },
];

export const CLASSES = ['Fighter', 'Wizard', 'Rogue', 'Ranger', 'Cleric', 'Bard', 'Druid', 'Paladin', 'Barbarian', 'Monk', 'Sorcerer', 'Warlock'];
export const SPECIES = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Gnome', 'Orc', 'Tiefling', 'Dragonborn'];
export const ALIGNMENTS = ['', 'Lawful good', 'Neutral good', 'Chaotic good', 'Lawful neutral', 'True neutral', 'Chaotic neutral', 'Lawful evil', 'Neutral evil', 'Chaotic evil'];

export const abilityMod = (score: number) => Math.floor((score - 10) / 2);

export const proficiencyBonus = (level: number) => 2 + Math.floor((Math.max(1, Math.min(20, level)) - 1) / 4);

export const fmtMod = (n: number) => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);

export function saveBonus(s: CharacterSheet, a: AbilityKey) {
  return abilityMod(s.abilities[a]) + (s.saveProficiencies.includes(a) ? proficiencyBonus(s.level) : 0);
}

export function skillBonus(s: CharacterSheet, skillId: string) {
  const skill = SKILLS.find((k) => k.id === skillId);
  if (!skill) return 0;
  const pb = proficiencyBonus(s.level);
  const mult = s.skillExpertise.includes(skillId) ? 2 : s.skillProficiencies.includes(skillId) ? 1 : 0;
  return abilityMod(s.abilities[skill.ability]) + pb * mult;
}

export const initiative = (s: CharacterSheet) => abilityMod(s.abilities.dex) + s.initiativeBonus;

export const passivePerception = (s: CharacterSheet) => 10 + skillBonus(s, 'perception');

export function blankSheet(partial: Partial<CharacterSheet> = {}): CharacterSheet {
  return {
    className: 'Fighter',
    species: 'Human',
    level: 1,
    background: '',
    alignment: '',
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    saveProficiencies: [],
    skillProficiencies: [],
    skillExpertise: [],
    hp: 10,
    maxHp: 10,
    tempHp: 0,
    ac: 10,
    speed: 30,
    initiativeBonus: 0,
    equipment: '',
    spells: '',
    notes: '',
    ...partial,
  };
}
