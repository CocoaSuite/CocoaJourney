import type { Character, Session } from '../types';
import { useStore } from '../store/store';
import { FigurineArt } from '../figurine/FigurineArt';
import { Button, IconButton, cx } from '../components/ui';
import { Icon } from '../components/Icon';

export function HpBar({ c, wide }: { c: Character; wide?: boolean }) {
  const pct = c.sheet.maxHp > 0 ? Math.max(0, Math.min(1, c.sheet.hp / c.sheet.maxHp)) : 1;
  const color = pct > 0.5 ? '#4E5F45' : pct > 0.25 ? '#9A7A35' : '#A3523A';
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-[12px] font-semibold tabular-nums" style={{ color }}>
        {c.sheet.hp}/{c.sheet.maxHp}
      </span>
      <span className={cx('h-[5px] overflow-hidden rounded-full bg-sand', wide ? 'w-20' : 'w-12')}>
        <span className="block h-full rounded-full" style={{ width: `${pct * 100}%`, background: color }} />
      </span>
    </div>
  );
}

export function FigurineManager({
  session,
  onFocus,
  onPlace,
  onReplaceMap,
  onClose,
}: {
  session: Session;
  onFocus: (id: string) => void;
  onPlace: (id: string) => void;
  onReplaceMap: () => void;
  onClose?: () => void;
}) {
  const selectedId = useStore((s) => s.selectedId);
  const openCreator = useStore((s) => s.openCreator);
  const onTable = session.characters.filter((c) => session.figurines[c.id]?.onTable).length;

  return (
    <aside className="flex h-full w-[300px] flex-col gap-3 overflow-hidden border-r border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[19px] font-semibold">Party</h2>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted">{onTable} on table</span>
          {onClose && <IconButton icon="close" label="Close party panel" size={38} onClick={onClose} />}
        </div>
      </div>

      <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1 pb-1">
        {session.characters.length === 0 && <p className="rounded-2xl bg-bg p-4 text-[14px] text-muted">No characters yet. Create one and place their figurine on the map.</p>}
        {session.characters.map((c) => {
          const placed = session.figurines[c.id]?.onTable;
          const sel = selectedId === c.id;
          return (
            <div
              key={c.id}
              className={cx('flex items-center gap-2 rounded-2xl border p-2 transition-colors', sel ? 'border-cocoa bg-bg' : 'border-sand bg-surface')}
            >
              <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => (placed ? onFocus(c.id) : onPlace(c.id))}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-bg">
                  <FigurineArt appearance={c.appearance} crop="head" className="h-12 w-12" noBase />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[15px] font-semibold">{c.name}</span>
                  <span className="truncate text-[12px] text-muted">
                    {c.sheet.className} · Lv {c.sheet.level}
                  </span>
                </span>
              </button>
              {placed ? (
                <HpBar c={c} />
              ) : (
                <Button size="sm" variant="secondary" icon="pin" onClick={() => onPlace(c.id)} className="shrink-0">
                  Place
                </Button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => openCreator(null)}
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-latte text-[14px] font-semibold text-cocoa hover:bg-bg"
        >
          <Icon name="plus" size={18} /> New character
        </button>
      </div>

      {session.map && (
        <div className="flex flex-col gap-2 rounded-2xl bg-bg p-3">
          <span className="label">Map</span>
          <span className="truncate text-[14px] font-semibold">{session.map.name}</span>
          <Button size="sm" icon="image" onClick={onReplaceMap}>
            Replace map
          </Button>
        </div>
      )}
    </aside>
  );
}
