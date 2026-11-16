import { useState } from 'react';
import type { Character, Session } from '../types';
import { useStore } from '../store/store';
import { FigurineArt } from '../figurine/FigurineArt';
import { Button, Modal } from '../components/ui';
import { Icon } from '../components/Icon';
import { HpBar } from '../table/FigurineManager';

/** Roster of the session's characters. */
export function CharactersView({ session }: { session: Session }) {
  const openCreator = useStore((s) => s.openCreator);
  const openSheet = useStore((s) => s.openSheet);
  const del = useStore((s) => s.deleteCharacter);
  const [confirm, setConfirm] = useState<Character | null>(null);

  return (
    <div className="absolute inset-0 overflow-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[30px] font-semibold">Characters</h1>
            <p className="text-muted">Every hero gets a figurine for the table and a character sheet.</p>
          </div>
          <Button variant="primary" size="lg" icon="plus" onClick={() => openCreator(null)}>
            New character
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {session.characters.map((c) => (
            <article key={c.id} className="flex flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
              <button type="button" onClick={() => openSheet(c.id)} className="relative flex h-56 items-end justify-center bg-[linear-gradient(180deg,#FFFDF8,#F1E9DA)]" aria-label={`Open ${c.name}'s sheet`}>
                <FigurineArt appearance={c.appearance} className="h-[95%]" />
              </button>
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-[19px] font-semibold">{c.name}</h2>
                    <p className="truncate text-[13px] text-muted">
                      {c.sheet.species} {c.sheet.className} · Lv {c.sheet.level}
                    </p>
                  </div>
                  <HpBar c={c} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button size="sm" icon="sheet" onClick={() => openSheet(c.id)}>
                    Sheet
                  </Button>
                  <Button size="sm" icon="edit" onClick={() => openCreator(c.id)}>
                    Look
                  </Button>
                  <Button size="sm" variant="danger" icon="trash" onClick={() => setConfirm(c)} aria-label={`Delete ${c.name}`} />
                </div>
              </div>
            </article>
          ))}
          <button
            type="button"
            onClick={() => openCreator(null)}
            className="flex min-h-[340px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-latte/70 text-cocoa hover:bg-surface"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sand">
              <Icon name="plus" size={26} />
            </span>
            <span className="font-semibold">Create a new figurine</span>
          </button>
        </div>
      </div>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete character?">
        <p className="mb-5 text-muted">{confirm?.name}’s figurine and sheet will be removed from this session.</p>
        <div className="flex justify-end gap-2">
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="danger" icon="trash" onClick={() => (confirm && del(confirm.id), setConfirm(null))}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
