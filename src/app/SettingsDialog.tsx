import { useRef, useState } from 'react';
import type { Session } from '../types';
import { useStore } from '../store/store';
import { Button, Modal, Toggle } from '../components/ui';
import { exportSession, importSessionFile } from '../lib/sessionFile';

export function SettingsDialog({ open, onClose, session }: { open: boolean; onClose: () => void; session: Session }) {
  const prefs = useStore((s) => s.prefs);
  const setPrefs = useStore((s) => s.setPrefs);
  const clearRolls = useStore((s) => s.clearRolls);
  const importSession = useStore((s) => s.importSession);
  const deleteSession = useStore((s) => s.deleteSession);
  const toast = useStore((s) => s.toast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState(false);

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-1">
          <span className="label mb-1">Dice</span>
          <Toggle label="3D dice tray" checked={prefs.animateDice} onChange={(v) => setPrefs({ animateDice: v })} />
          <Toggle label="Dice sounds" checked={prefs.diceSound} onChange={(v) => setPrefs({ diceSound: v })} />
          <Button variant="ghost" icon="history" className="mt-1 self-start" onClick={() => (clearRolls(), toast('Roll history cleared'))}>
            Clear roll history
          </Button>
        </section>

        <section className="flex flex-col gap-2">
          <span className="label">Session file</span>
          <p className="text-[13px] text-muted">Save this session — map, characters and figurine positions — as a file you can open on another device.</p>
          <div className="flex flex-wrap gap-2">
            <Button icon="download" onClick={() => exportSession(session).then(() => toast('Session exported'))}>
              Export session
            </Button>
            <Button icon="upload" onClick={() => fileRef.current?.click()}>
              Import session
            </Button>
            <input
              ref={fileRef}
              type="file"
              hidden
              accept=".json,application/json"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f) return;
                try {
                  importSession(await importSessionFile(f));
                  toast('Session imported');
                  onClose();
                } catch (err) {
                  toast((err as Error).message);
                }
              }}
            />
          </div>
        </section>

        <section className="flex flex-col gap-2 border-t border-line pt-5">
          {confirm ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px]">Delete “{session.name}” from this device?</span>
              <Button variant="danger" icon="trash" onClick={() => (deleteSession(session.id), onClose())}>
                Delete
              </Button>
              <Button onClick={() => setConfirm(false)}>Cancel</Button>
            </div>
          ) : (
            <Button variant="danger" icon="trash" className="self-start" onClick={() => setConfirm(true)}>
              Delete session
            </Button>
          )}
        </section>
        <p className="text-[12px] text-muted">CocoaJourney saves everything on this device automatically.</p>
      </div>
    </Modal>
  );
}
