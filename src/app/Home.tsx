import { useRef, useState } from 'react';
import { useStore } from '../store/store';
import { Button, IconButton, Modal } from '../components/ui';
import { Icon, Logo } from '../components/Icon';
import { FigurineArt } from '../figurine/FigurineArt';
import { importSessionFile } from '../lib/sessionFile';
import { useMapImage } from '../table/useMapImage';
import type { Session } from '../types';
import { DEFAULT_APPEARANCE } from '../figurine/archetypes';

function timeAgo(t: number) {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(t).toLocaleDateString();
}

export function Home() {
  const sessions = useStore((s) => s.sessions);
  const createSession = useStore((s) => s.createSession);
  const createSample = useStore((s) => s.createSampleSession);
  const openSession = useStore((s) => s.openSession);
  const deleteSession = useStore((s) => s.deleteSession);
  const importSession = useStore((s) => s.importSession);
  const toast = useStore((s) => s.toast);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Session | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    try {
      importSession(await importSessionFile(f));
      toast('Session imported');
    } catch (e) {
      toast((e as Error).message);
    }
  };

  return (
    <div className="paper h-full overflow-auto">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-10 sm:py-16">
        <header className="flex items-center gap-3">
          <Logo size={44} />
          <span className="font-display text-[28px] font-bold text-cocoa">CocoaJourney</span>
        </header>

        <section className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-5">
            <h1 className="font-display text-[40px] leading-[1.08] font-semibold sm:text-[52px]">
              Little figurines.
              <br />A beautiful map.
              <br />
              <span className="text-cocoa">Roll the d20.</span>
            </h1>
            <p className="max-w-md text-[17px] text-muted">Set a tablet in the middle of the table, drop in your map, and start your adventure in a minute.</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="lg" icon="plus" onClick={() => setNaming(true)}>
                New session
              </Button>
              <Button size="lg" icon="sparkle" onClick={() => createSample()}>
                Try the sample adventure
              </Button>
            </div>
          </div>
          <div className="relative hidden h-[300px] md:block" aria-hidden="true">
            <div className="absolute inset-x-6 bottom-6 top-10 rounded-[28px] bg-[#E3D5B5] shadow-soft" style={{ backgroundImage: 'linear-gradient(to right, rgb(80 52 34 / .16) 1px, transparent 1px), linear-gradient(to bottom, rgb(80 52 34 / .16) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
            <FigurineArt className="absolute bottom-10 left-[14%] h-[190px]" appearance={heroA} />
            <FigurineArt className="absolute bottom-16 left-[40%] h-[210px]" appearance={heroB} />
            <FigurineArt className="absolute bottom-8 left-[64%] h-[180px]" appearance={heroC} />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-[22px] font-semibold">Your sessions</h2>
            <Button variant="ghost" icon="upload" onClick={() => fileRef.current?.click()}>
              Import
            </Button>
            <input ref={fileRef} type="file" accept=".json,.cocoajourney,application/json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
          </div>
          {sessions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-latte/60 p-8 text-center text-muted">No sessions yet. Start a new one or open the sample adventure.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((s) => (
                <div key={s.id} className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
                  <button type="button" className="flex flex-1 flex-col text-left" onClick={() => openSession(s.id)}>
                    <div className="relative h-28 overflow-hidden bg-[#E3D5B5]">
                      <MapThumb session={s} />
                      <div className="absolute inset-0 flex items-end justify-center gap-1 pb-1">
                        {s.characters.slice(0, 5).map((c) => (
                          <FigurineArt key={c.id} appearance={c.appearance} className="h-20" />
                        ))}
                        {s.characters.length === 0 && <Icon name="map" size={36} className="mb-6 text-latte" />}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 p-4">
                      <span className="font-display text-[18px] font-semibold">{s.name}</span>
                      <span className="text-[13px] text-muted">
                        {s.characters.length} character{s.characters.length === 1 ? '' : 's'} · {timeAgo(s.updatedAt)}
                      </span>
                    </div>
                  </button>
                  <IconButton icon="trash" label={`Delete ${s.name}`} className="absolute right-2 top-2 bg-surface/90" onClick={() => setConfirmDelete(s)} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal open={naming} onClose={() => setNaming(false)} title="New session">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            createSession(name);
            setName('');
            setNaming(false);
          }}
        >
          <label className="flex flex-col gap-2">
            <span className="label">Session name</span>
            <input autoFocus className="field" placeholder="e.g. Curse of the Hollow King" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <Button variant="primary" type="submit" size="lg">
            Create & open table
          </Button>
        </form>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete session?">
        <p className="mb-5 text-muted">“{confirmDelete?.name}” and its map, characters and roll history will be removed from this device.</p>
        <div className="flex justify-end gap-2">
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button
            variant="danger"
            icon="trash"
            onClick={() => {
              if (confirmDelete) deleteSession(confirmDelete.id);
              setConfirmDelete(null);
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

const heroA = { ...DEFAULT_APPEARANCE, top: 'leather', topColor: 'forest', weapon: 'bow', cloak: 'long', cloakColor: 'forest', hair: 'ponytail', hairColor: 'copper', ears: 'pointed', baseColor: 'forest' };
const heroB = { ...DEFAULT_APPEARANCE, top: 'plate', topColor: 'navy', weapon: 'sword', shield: 'kite', cloak: 'long', cloakColor: 'navy', skin: 'bronze', facialHair: 'braided', hairColor: 'raven', hair: 'cropped', body: 'sturdy', eyes: 'sharp', face: 'stern', baseColor: 'slate', boots: 'armored', gloves: 'gauntlets' };
const heroC = { ...DEFAULT_APPEARANCE, top: 'robe', topColor: 'plum', weapon: 'staff', cloak: 'none', accessory: 'wizard', hair: 'long', hairColor: 'ash', skin: 'porcelain', eyes: 'glow', face: 'calm', belt: 'sash' };

function MapThumb({ session }: { session: Session }) {
  const { url } = useMapImage(session.map);
  if (!url) return null;
  return <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />;
}
