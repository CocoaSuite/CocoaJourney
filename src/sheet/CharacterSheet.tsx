import { useEffect, useState } from 'react';
import type { AbilityKey, Character, CharacterSheet as Sheet, Session } from '../types';
import { useStore } from '../store/store';
import { ABILITIES, ALIGNMENTS, CLASSES, SKILLS, SPECIES, abilityMod, fmtMod, initiative, passivePerception, proficiencyBonus, saveBonus, skillBonus } from '../rules/dnd5e';
import { FigurineArt } from '../figurine/FigurineArt';
import { Button, IconButton, Segmented, Stepper, cx } from '../components/ui';
import { Icon } from '../components/Icon';

type Tab = 'stats' | 'skills' | 'gear';

/** Compact, editable character sheet in a side drawer (bottom sheet on narrow screens). */
export function CharacterSheet({ session, id }: { session: Session; id: string }) {
  const c = session.characters.find((x) => x.id === id);
  const close = useStore((s) => s.openSheet);
  const update = useStore((s) => s.updateCharacter);
  const openCreator = useStore((s) => s.openCreator);
  const requestRoll = useStore((s) => s.requestRoll);
  const [tab, setTab] = useState<Tab>('stats');

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && close(null);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [close]);

  if (!c) return null;
  const s = c.sheet;
  const set = (patch: Partial<Sheet>) => update(c.id, (x) => ({ ...x, sheet: { ...x.sheet, ...patch } }));
  const setName = (name: string) => update(c.id, (x) => ({ ...x, name }));
  const roll = (label: string, modifier: number) => requestRoll({ dice: { d20: 1 }, modifier, mode: 'normal', label: `${c.name.split(' ')[0]} · ${label}`, characterId: c.id });

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-[rgb(51_43_37/0.25)] animate-fade" onPointerDown={(e) => e.target === e.currentTarget && close(null)}>
      <div
        role="dialog"
        aria-label={`${c.name} character sheet`}
        className="mt-auto flex h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface shadow-lift animate-rise sm:mt-0 sm:h-full sm:w-[460px] sm:rounded-none sm:rounded-l-3xl"
      >
        <header className="flex items-center gap-3 border-b border-line p-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-bg">
            <FigurineArt appearance={c.appearance} crop="head" noBase className="h-14 w-14" />
          </span>
          <div className="min-w-0 flex-1">
            <input value={c.name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg bg-transparent font-display text-[22px] font-semibold outline-none focus:bg-bg" aria-label="Character name" />
            <div className="flex flex-wrap items-center gap-x-2 text-[13px] text-muted">
              <InlineSelect value={s.className} options={CLASSES} onChange={(className) => set({ className })} label="Class" />
              <span>·</span>
              <InlineSelect value={s.species} options={SPECIES} onChange={(species) => set({ species })} label="Species" />
              <span>·</span>
              <span className="flex items-center gap-1">
                Lv
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={s.level}
                  onChange={(e) => set({ level: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
                  className="w-10 rounded-md bg-bg px-1 text-center font-semibold text-ink"
                  aria-label="Level"
                />
              </span>
            </div>
          </div>
          <IconButton icon="close" label="Close sheet" onClick={() => close(null)} />
        </header>

        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          <HpBlock c={c} set={set} />

          <div className="grid grid-cols-4 gap-2">
            <Stat label="AC" icon="shield">
              <NumInput value={s.ac} onChange={(ac) => set({ ac })} label="Armor class" />
            </Stat>
            <Stat label="Speed" icon="boot">
              <NumInput value={s.speed} onChange={(speed) => set({ speed })} label="Speed" step={5} />
            </Stat>
            <Stat label="Init" icon="bolt" onRoll={() => roll('Initiative', initiative(s))}>
              <span className="text-[20px] font-bold">{fmtMod(initiative(s))}</span>
            </Stat>
            <Stat label="Prof" icon="sparkle">
              <span className="text-[20px] font-bold">{fmtMod(proficiencyBonus(s.level))}</span>
            </Stat>
          </div>

          <Segmented<Tab>
            label="Sheet section"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'stats', label: 'Abilities' },
              { value: 'skills', label: 'Skills' },
              { value: 'gear', label: 'Gear & spells' },
            ]}
          />

          {tab === 'stats' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                {ABILITIES.map((ab) => (
                  <AbilityCard key={ab.key} k={ab.key} s={s} set={set} onRoll={() => roll(`${ab.name} check`, abilityMod(s.abilities[ab.key]))} />
                ))}
              </div>
              <div className="rounded-2xl bg-bg p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="label">Saving throws</span>
                  <span className="text-[11px] text-muted">Tap the dot to mark proficiency</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3">
                  {ABILITIES.map((ab) => (
                    <ProfRow
                      key={ab.key}
                      label={ab.name}
                      bonus={saveBonus(s, ab.key)}
                      level={s.saveProficiencies.includes(ab.key) ? 1 : 0}
                      onToggle={() => set({ saveProficiencies: toggle(s.saveProficiencies, ab.key) as AbilityKey[] })}
                      onRoll={() => roll(`${ab.short} save`, saveBonus(s, ab.key))}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Background">
                  <input className="field" value={s.background} onChange={(e) => set({ background: e.target.value })} />
                </Field>
                <Field label="Alignment">
                  <select className="field" value={s.alignment} onChange={(e) => set({ alignment: e.target.value })}>
                    {ALIGNMENTS.map((a) => (
                      <option key={a} value={a}>
                        {a || '—'}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          )}

          {tab === 'skills' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between rounded-2xl bg-bg px-3 py-2.5">
                <span className="flex items-center gap-2 text-[14px] font-semibold">
                  <Icon name="eye" size={18} className="text-cocoa" /> Passive perception
                </span>
                <span className="text-[20px] font-bold tabular-nums">{passivePerception(s)}</span>
              </div>
              <p className="px-1 text-[12px] text-muted">Tap the dot to cycle: none → proficient → expertise. Tap a bonus to roll.</p>
              <div className="rounded-2xl bg-bg px-3 py-1">
                {SKILLS.map((sk) => {
                  const lvl = s.skillExpertise.includes(sk.id) ? 2 : s.skillProficiencies.includes(sk.id) ? 1 : 0;
                  return (
                    <ProfRow
                      key={sk.id}
                      label={sk.name}
                      sub={ABILITIES.find((a) => a.key === sk.ability)!.short}
                      bonus={skillBonus(s, sk.id)}
                      level={lvl}
                      onToggle={() => {
                        const next = (lvl + 1) % 3;
                        set({
                          skillProficiencies: next >= 1 ? add(s.skillProficiencies, sk.id) : s.skillProficiencies.filter((x) => x !== sk.id),
                          skillExpertise: next === 2 ? add(s.skillExpertise, sk.id) : s.skillExpertise.filter((x) => x !== sk.id),
                        });
                      }}
                      onRoll={() => roll(sk.name, skillBonus(s, sk.id))}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'gear' && (
            <div className="flex flex-col gap-3">
              <Field label="Equipment">
                <textarea className="field min-h-28" value={s.equipment} onChange={(e) => set({ equipment: e.target.value })} placeholder="Weapons, armor, adventuring gear…" />
              </Field>
              <Field label="Spells">
                <textarea className="field min-h-28" value={s.spells} onChange={(e) => set({ spells: e.target.value })} placeholder="Cantrips, prepared spells, slots…" />
              </Field>
              <Field label="Notes">
                <textarea className="field min-h-24" value={s.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Features, bonds, secrets…" />
              </Field>
            </div>
          )}

          <Button icon="edit" onClick={() => openCreator(c.id)} className="self-start">
            Edit figurine look
          </Button>
        </div>
      </div>
    </div>
  );
}

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
const add = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr : [...arr, v]);

function HpBlock({ c, set }: { c: Character; set: (p: Partial<Sheet>) => void }) {
  const s = c.sheet;
  const [amt, setAmt] = useState(5);
  const pct = s.maxHp > 0 ? Math.max(0, Math.min(1, s.hp / s.maxHp)) : 1;
  const color = pct > 0.5 ? '#66775B' : pct > 0.25 ? '#C9A45C' : '#A3523A';
  const damage = (n: number) => {
    let temp = s.tempHp;
    let left = n;
    const fromTemp = Math.min(temp, left);
    temp -= fromTemp;
    left -= fromTemp;
    set({ tempHp: temp, hp: Math.max(0, s.hp - left) });
  };
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-bg p-3">
      <div className="flex items-center gap-3">
        <IconButton icon="minus" label="Lose 1 HP" className="border border-line bg-surface text-terracotta-dark" onClick={() => damage(1)} />
        <div className="flex flex-1 flex-col items-center">
          <span className="leading-none">
            <span className="text-[32px] font-bold tabular-nums">{s.hp}</span>
            <span className="text-[16px] text-muted"> / </span>
            <input
              type="number"
              value={s.maxHp}
              onChange={(e) => set({ maxHp: Math.max(1, Number(e.target.value) || 1) })}
              className="w-12 rounded-md bg-surface text-center text-[16px] font-semibold"
              aria-label="Maximum HP"
            />
          </span>
          <span className="text-[11px] text-muted">{s.tempHp > 0 ? `+${s.tempHp} temporary` : 'Hit points'}</span>
        </div>
        <IconButton icon="plus" label="Heal 1 HP" className="border border-line bg-surface text-forest-dark" onClick={() => set({ hp: Math.min(s.maxHp, s.hp + 1) })} />
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-sand">
        <div className="h-full rounded-full transition-[width]" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Stepper value={amt} onChange={(v) => setAmt(Math.max(0, v))} min={0} max={999} label="amount" />
        <Button size="sm" variant="danger" onClick={() => damage(amt)}>
          Damage
        </Button>
        <Button size="sm" variant="forest" onClick={() => set({ hp: Math.min(s.maxHp, s.hp + amt) })}>
          Heal
        </Button>
        <Button size="sm" variant="ghost" onClick={() => set({ tempHp: s.tempHp + amt })}>
          + Temp
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, icon, children, onRoll }: { label: string; icon: 'shield' | 'boot' | 'bolt' | 'sparkle'; children: React.ReactNode; onRoll?: () => void }) {
  return (
    <div className="relative flex flex-col items-center gap-0.5 rounded-2xl bg-bg px-1 py-2">
      <span className="flex items-center gap-1 text-[11px] text-muted">
        <Icon name={icon} size={12} />
        {label}
      </span>
      {children}
      {onRoll && (
        <button type="button" className="absolute inset-0 rounded-2xl" aria-label={`Roll ${label}`} onClick={onRoll}>
          <span className="sr-only">Roll</span>
        </button>
      )}
    </div>
  );
}

function NumInput({ value, onChange, label, step = 1 }: { value: number; onChange: (v: number) => void; label: string; step?: number }) {
  return (
    <input
      type="number"
      step={step}
      value={value}
      aria-label={label}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      onFocus={(e) => e.target.select()}
      className="w-full rounded-lg bg-transparent text-center text-[20px] font-bold outline-none focus:bg-surface"
    />
  );
}

function AbilityCard({ k, s, set, onRoll }: { k: AbilityKey; s: Sheet; set: (p: Partial<Sheet>) => void; onRoll: () => void }) {
  const ab = ABILITIES.find((a) => a.key === k)!;
  const score = s.abilities[k];
  const setScore = (v: number) => set({ abilities: { ...s.abilities, [k]: Math.max(1, Math.min(30, v)) } });
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-sand bg-surface p-2">
      <span className="text-[11px] font-bold tracking-[0.08em] text-muted">{ab.short}</span>
      <button type="button" onClick={onRoll} className="rounded-xl px-2 font-display text-[26px] leading-none font-semibold text-cocoa hover:bg-bg" aria-label={`Roll ${ab.name} check`}>
        {fmtMod(abilityMod(score))}
      </button>
      <div className="flex items-center gap-0.5">
        <button type="button" className="h-8 w-8 rounded-lg text-muted hover:bg-bg" onClick={() => setScore(score - 1)} aria-label={`Decrease ${ab.name}`}>
          −
        </button>
        <input
          value={score}
          inputMode="numeric"
          onChange={(e) => setScore(Number(e.target.value.replace(/\D/g, '')) || 1)}
          onFocus={(e) => e.target.select()}
          className="w-8 rounded-md bg-bg text-center text-[14px] font-semibold"
          aria-label={`${ab.name} score`}
        />
        <button type="button" className="h-8 w-8 rounded-lg text-muted hover:bg-bg" onClick={() => setScore(score + 1)} aria-label={`Increase ${ab.name}`}>
          +
        </button>
      </div>
    </div>
  );
}

function ProfRow({ label, sub, bonus, level, onToggle, onRoll }: { label: string; sub?: string; bonus: number; level: number; onToggle: () => void; onRoll: () => void }) {
  return (
    <div className="flex min-h-11 items-center gap-2 border-b border-sand last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-9 w-9 shrink-0 items-center justify-center"
        aria-label={`${label}: ${['not proficient', 'proficient', 'expertise'][level]}`}
      >
        <span className={cx('flex h-4 w-4 items-center justify-center rounded-full border-2', level ? 'border-cocoa bg-cocoa' : 'border-latte')}>
          {level === 2 && <span className="h-1.5 w-1.5 rounded-full bg-surface" />}
        </span>
      </button>
      <span className="flex-1 text-[14px]">
        {label}
        {sub && <span className="ml-1 text-[11px] text-muted">{sub}</span>}
      </span>
      <button type="button" onClick={onRoll} className="min-h-9 min-w-12 rounded-lg px-2 text-right text-[15px] font-bold tabular-nums hover:bg-surface" aria-label={`Roll ${label}`}>
        {fmtMod(bonus)}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function InlineSelect({ value, options, onChange, label }: { value: string; options: string[]; onChange: (v: string) => void; label: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="cursor-pointer rounded-md bg-transparent font-medium text-ink outline-none hover:bg-bg">
      {[...new Set([value, ...options])].map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}
