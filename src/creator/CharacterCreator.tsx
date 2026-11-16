import { useEffect, useMemo, useRef, useState } from 'react';
import type { Appearance, Character, Session } from '../types';
import { useStore } from '../store/store';
import { makeCharacter } from '../store/sample';
import { ARCHETYPES, randomAppearance } from '../figurine/archetypes';
import { FigurineArt } from '../figurine/FigurineArt';
import { findPart } from '../figurine/parts';
import { CLASSES, SPECIES, blankSheet } from '../rules/dnd5e';
import { Button, IconButton, cx } from '../components/ui';
import { Icon } from '../components/Icon';
import { CATEGORIES, optionsFor, valueOf, type Category } from './categories';
import { freeSpot } from '../table/geometry';

const HEADWEAR = ['hood', 'wizard', 'cap', 'helmet'];

/** Visual character workshop: big preview, categories, and a scrollable strip of options. */
export function CharacterCreator({ session }: { session: Session }) {
  const editingId = useStore((s) => s.editingId);
  const go = useStore((s) => s.go);
  const save = useStore((s) => s.saveCharacter);
  const place = useStore((s) => s.placeFigurine);
  const select = useStore((s) => s.select);
  const toast = useStore((s) => s.toast);
  const existing = session.characters.find((c) => c.id === editingId);

  const [draft, setDraft] = useState<Character>(() => existing ?? makeCharacter('', 'ranger', randomAppearance()));
  const [catId, setCatId] = useState<string>(existing ? 'hair' : 'archetype');
  const [bump, setBump] = useState(0);
  const cat = CATEGORIES.find((c) => c.id === catId)!;
  const a = draft.appearance;

  const setLook = (patch: Partial<Appearance>) => {
    setDraft((d) => ({ ...d, appearance: { ...d.appearance, ...patch } }));
    setBump((b) => b + 1);
  };

  const applyArchetype = (id: string) => {
    const arche = ARCHETYPES.find((x) => x.id === id)!;
    setDraft((d) => ({
      ...d,
      archetype: id,
      appearance: { ...d.appearance, ...arche.look },
      sheet: existing ? { ...d.sheet, className: id === 'custom' ? d.sheet.className : arche.className } : blankSheet({ ...arche.sheet, className: arche.className, species: d.sheet.species }),
    }));
    setBump((b) => b + 1);
  };

  const options = useMemo(() => (cat.kind === 'archetype' ? ARCHETYPES.map((x) => ({ id: x.id, label: x.label })) : optionsFor(cat)), [cat]);
  const current = cat.kind === 'archetype' ? draft.archetype : valueOf(a, cat.slot);
  const idx = Math.max(0, options.findIndex((o) => o.id === current));

  const choose = (id: string) => {
    if (cat.kind === 'archetype') applyArchetype(id);
    else setLook({ [cat.slot]: id } as Partial<Appearance>);
  };
  const step = (d: number) => choose(options[(idx + d + options.length) % options.length].id);

  const onSave = () => {
    const name = draft.name.trim() || `${draft.sheet.species} ${draft.sheet.className}`;
    const c = { ...draft, name };
    save(c);
    if (!existing && session.map) {
      const m = session.map;
      const p = freeSpot(m.width / 2, m.height / 2, session.grid, Object.values(session.figurines), m.width, m.height);
      place(c.id, p.x, p.y);
      select(c.id);
      toast(`${name} joins the table`);
      go('table');
    } else {
      toast(existing ? `${name} updated` : `${name} created`);
      go(existing ? 'table' : 'characters');
    }
  };

  // Arrow keys flip through options.
  const stepRef = useRef(step);
  stepRef.current = step;
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input,select,textarea')) return;
      if (e.key === 'ArrowRight') stepRef.current(1);
      if (e.key === 'ArrowLeft') stepRef.current(-1);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  const groups = [...new Set(CATEGORIES.map((c) => c.group))];

  return (
    <div className="absolute inset-0 flex flex-col">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line bg-surface px-3 py-2 sm:px-5" style={{ paddingTop: 'max(8px, env(safe-area-inset-top))' }}>
        <Button variant="ghost" icon="back" onClick={() => go(existing ? 'table' : 'characters')}>
          Back
        </Button>
        <h1 className="mr-auto font-display text-[20px] font-semibold sm:text-[22px]">{existing ? 'Edit figurine' : 'Character workshop'}</h1>
        <Button icon="shuffle" onClick={() => setLook(randomAppearance())}>
          <span className="hidden sm:inline">Randomize</span>
        </Button>
        <Button variant="primary" icon="check" onClick={onSave}>
          Save figurine
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Categories: a sidebar on wide screens, a chip strip on narrow ones */}
        <nav aria-label="Customization categories" className="shrink-0 border-line md:w-[220px] md:overflow-y-auto md:border-r md:bg-surface/60 md:p-3">
          <div className="no-scrollbar flex gap-1 overflow-x-auto px-3 py-2 md:hidden">
            {CATEGORIES.map((c) => (
              <CatChip key={c.id} c={c} active={c.id === catId} onClick={() => setCatId(c.id)} />
            ))}
          </div>
          <div className="hidden flex-col gap-4 md:flex">
            {groups.map((g) => (
              <div key={g} className="flex flex-col gap-0.5">
                <span className="label px-3 pb-1">{g}</span>
                {CATEGORIES.filter((c) => c.group === g).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCatId(c.id)}
                    aria-current={c.id === catId}
                    className={cx('min-h-11 rounded-xl px-3 text-left text-[14px] transition-colors', c.id === catId ? 'bg-cocoa font-bold text-surface' : 'font-medium hover:bg-sand')}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </nav>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 p-3 sm:p-5">
          {/* Preview */}
          <div className="relative flex min-h-[260px] flex-1 items-center justify-center overflow-hidden rounded-3xl bg-surface shadow-[inset_0_0_0_1px_var(--color-sand)]">
            <div className="pointer-events-none absolute bottom-[6%] left-1/2 h-[18%] w-[60%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(114_81_61/0.18),transparent)]" />
            <div key={bump} className="h-[92%] max-h-[560px] animate-pop">
              <FigurineArt appearance={a} className="h-full w-auto" title={`Figurine preview: ${draft.name || 'new adventurer'}`} />
            </div>
            <div className="absolute left-4 top-4 flex max-w-[60%] flex-col gap-1 sm:left-6 sm:top-5">
              <label htmlFor="cname" className="label">
                Name
              </label>
              <input
                id="cname"
                value={draft.name}
                placeholder="Name your hero"
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                className="w-full border-0 border-b-[1.5px] border-dashed border-[#D9CCB8] bg-transparent py-1 font-display text-[22px] font-semibold outline-none placeholder:text-[#B5A994] focus:border-cocoa sm:text-[28px]"
              />
            </div>
            <div className="absolute right-4 top-4 flex flex-col items-end gap-2 sm:right-6 sm:top-5">
              <ChipSelect label="Class" value={draft.sheet.className} options={CLASSES} onChange={(className) => setDraft((d) => ({ ...d, sheet: { ...d.sheet, className } }))} tone="forest" />
              <ChipSelect label="Species" value={draft.sheet.species} options={SPECIES} onChange={(species) => setDraft((d) => ({ ...d, sheet: { ...d.sheet, species } }))} tone="cocoa" />
            </div>
          </div>

          {(cat.id === 'hair' || cat.id === 'hairColor') && HEADWEAR.includes(a.accessory) && (
            <p className="-mt-2 flex items-center gap-2 px-1 text-[13px] text-muted">
              <Icon name="sparkle" size={14} /> Hair is partly hidden under the {findPart('accessory', a.accessory).label.toLowerCase()}.
              <button type="button" className="font-semibold text-cocoa underline" onClick={() => setLook({ accessory: 'none' })}>
                Take it off
              </button>
            </p>
          )}

          {/* Option strip */}
          <div className="flex shrink-0 flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-display text-[18px] font-semibold">{cat.label}</h2>
              <span className="text-[13px] text-muted tabular-nums">
                {options[idx]?.label} · {idx + 1} of {options.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <IconButton icon="back" label="Previous option" size={48} className="rounded-full border border-[#D9CCB8] bg-surface" onClick={() => step(-1)} />
              <OptionStrip cat={cat} options={options} current={current} a={a} onChoose={choose} />
              <IconButton icon="next" label="Next option" size={48} className="rounded-full border border-[#D9CCB8] bg-surface" onClick={() => step(1)} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function CatChip({ c, active, onClick }: { c: Category; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx('flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold', active ? 'bg-cocoa text-surface' : 'bg-surface text-ink shadow-soft')}
    >
      <Icon name={c.icon} size={15} />
      {c.label}
    </button>
  );
}

function ChipSelect({ label, value, options, onChange, tone }: { label: string; value: string; options: string[]; onChange: (v: string) => void; tone: 'forest' | 'cocoa' }) {
  return (
    <label className={cx('relative flex min-h-9 items-center gap-1 rounded-full px-3.5 text-[13px] font-semibold', tone === 'forest' ? 'bg-[#EEF1EA] text-forest-dark' : 'bg-bg text-cocoa')}>
      <span className="sr-only">{label}</span>
      {value}
      <Icon name="next" size={14} className="rotate-90" />
      <select value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label={label}>
        {[...new Set([value, ...options])].map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function OptionStrip({ cat, options, current, a, onChoose }: { cat: Category; options: { id: string; label: string; hex?: string }[]; current: string; a: Appearance; onChoose: (id: string) => void }) {
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = strip.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [current, cat.id]);

  return (
    <div ref={strip} className="scroll-x no-scrollbar flex min-w-0 flex-1 gap-2.5 px-1 py-1.5" role="listbox" aria-label={cat.label}>
      {options.map((o) => {
        const on = o.id === current;
        if (cat.kind === 'color') {
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              aria-label={o.label}
              onClick={() => onChoose(o.id)}
              className={cx('flex h-[104px] w-[84px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl bg-surface transition-shadow', on ? 'shadow-[0_0_0_2.5px_var(--color-cocoa)]' : 'shadow-[0_0_0_1px_var(--color-sand)]')}
            >
              <span className="h-11 w-11 rounded-full shadow-[inset_0_0_0_1px_rgb(51_43_37/0.15)]" style={{ background: o.hex }} />
              <span className="text-[12px] text-muted">{o.label}</span>
            </button>
          );
        }
        let preview: Appearance =
          cat.kind === 'archetype'
            ? { ...a, ...ARCHETYPES.find((x) => x.id === o.id)!.look }
            : ({ ...a, [cat.slot]: o.id } as Appearance);
        // Show hairstyles and ears without a hat in the way.
        if (cat.kind === 'part' && (cat.slot === 'hair' || cat.slot === 'ears') && HEADWEAR.includes(preview.accessory)) preview = { ...preview, accessory: 'none' };
        const crop = cat.kind === 'part' ? cat.crop : 'figure';
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            aria-label={o.label}
            onClick={() => onChoose(o.id)}
            className={cx('flex h-[120px] w-[100px] shrink-0 flex-col items-center justify-end gap-1 overflow-hidden rounded-2xl bg-surface pb-2 transition-shadow', on ? 'shadow-[0_0_0_2.5px_var(--color-cocoa)]' : 'shadow-[0_0_0_1px_var(--color-sand)]')}
          >
            <FigurineArt appearance={preview} crop={crop} noBase={crop === 'head'} className="h-[84px] w-[84px]" />
            <span className="max-w-full truncate px-1 text-[12px] text-muted">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
