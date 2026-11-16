import type { Character } from '../types';
import { useStore } from '../store/store';
import { abilityMod, fmtMod, initiative } from '../rules/dnd5e';
import { FigurineArt } from '../figurine/FigurineArt';
import { Button, IconButton } from '../components/ui';

/** Compact character card shown when a figurine is selected on the table. */
export function QuickCard({ c }: { c: Character }) {
  const select = useStore((s) => s.select);
  const openSheet = useStore((s) => s.openSheet);
  const update = useStore((s) => s.updateCharacter);
  const remove = useStore((s) => s.removeFigurine);
  const requestRoll = useStore((s) => s.requestRoll);
  const s = c.sheet;
  const setHp = (hp: number) => update(c.id, (x) => ({ ...x, sheet: { ...x.sheet, hp: Math.max(0, Math.min(x.sheet.maxHp + 50, hp)) } }));

  const stat = (label: string, value: string | number) => (
    <div className="flex flex-col items-center rounded-xl bg-bg px-2 py-1.5">
      <span className="text-[11px] text-muted">{label}</span>
      <span className="text-[18px] font-bold tabular-nums">{value}</span>
    </div>
  );

  return (
    <div className="flex w-[300px] flex-col gap-3 rounded-[20px] bg-surface p-4 shadow-lift animate-pop" role="dialog" aria-label={`${c.name} quick view`}>
      <div className="flex items-start gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-bg">
          <FigurineArt appearance={c.appearance} crop="head" className="h-14 w-14" noBase />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-display text-[19px] font-semibold">{c.name}</span>
          <span className="truncate text-[12px] text-muted">
            {s.className} · {s.species} · Lv {s.level}
          </span>
        </div>
        <IconButton icon="close" label="Deselect" size={36} onClick={() => select(null)} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stat('AC', s.ac)}
        {stat('Speed', s.speed)}
        {stat('Init', fmtMod(initiative(s)))}
      </div>
      <div className="flex items-center gap-2">
        <IconButton icon="minus" label="Decrease HP" className="border border-line text-terracotta-dark" onClick={() => setHp(s.hp - 1)} />
        <div className="flex flex-1 flex-col items-center leading-tight">
          <span>
            <span className="text-[24px] font-bold tabular-nums">{s.hp}</span>
            <span className="text-muted"> / {s.maxHp}</span>
          </span>
          <span className="text-[11px] text-muted">{s.hp <= 0 ? 'Down!' : 'Hit points'}</span>
        </div>
        <IconButton icon="plus" label="Increase HP" className="border border-line text-forest-dark" onClick={() => setHp(s.hp + 1)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="primary" icon="sheet" onClick={() => openSheet(c.id)}>
          Sheet
        </Button>
        <Button
          icon="dice"
          onClick={() => requestRoll({ dice: { d20: 1 }, modifier: abilityMod(s.abilities.dex) + s.initiativeBonus, mode: 'normal', label: `${c.name.split(' ')[0]} · Initiative`, characterId: c.id })}
        >
          Initiative
        </Button>
      </div>
      <Button variant="ghost" size="sm" icon="remove" onClick={() => (remove(c.id), select(null))}>
        Take off the table
      </Button>
    </div>
  );
}
