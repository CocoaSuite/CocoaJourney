import { useState } from 'react';
import type { Session } from '../types';
import { useStore } from '../store/store';
import { Icon, Logo } from '../components/Icon';
import { IconButton, cx } from '../components/ui';
import { SettingsDialog } from './SettingsDialog';

export function TopBar({ session }: { session: Session }) {
  const view = useStore((s) => s.view);
  const go = useStore((s) => s.go);
  const rename = useStore((s) => s.renameSession);
  const [editing, setEditing] = useState(false);
  const [settings, setSettings] = useState(false);

  const tab = (v: 'table' | 'characters', label: string, icon: 'map' | 'users') => (
    <button
      type="button"
      onClick={() => go(v)}
      aria-current={view === v ? 'page' : undefined}
      className={cx(
        'flex min-h-11 items-center gap-2 rounded-xl px-3 text-[14px] font-semibold transition-colors sm:px-4',
        view === v ? 'bg-surface text-ink shadow-soft' : 'text-muted hover:text-ink',
      )}
    >
      <Icon name={icon} size={18} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <header className="relative z-20 flex shrink-0 items-center gap-3 border-b border-line bg-surface px-3 py-2 sm:px-5" style={{ paddingTop: 'max(8px, env(safe-area-inset-top))' }}>
      <button type="button" onClick={() => go('home')} className="flex min-h-11 items-center gap-2 rounded-xl pr-2" aria-label="All sessions">
        <Logo size={34} />
        <span className="hidden font-display text-[20px] font-bold text-cocoa lg:inline">CocoaJourney</span>
      </button>
      <div className="hidden h-7 w-px bg-line sm:block" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="label hidden sm:block">Session</span>
        {editing ? (
          <input
            autoFocus
            defaultValue={session.name}
            className="field min-h-9 max-w-xs py-1 font-display text-[17px] font-semibold"
            onBlur={(e) => {
              rename(e.target.value);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') setEditing(false);
            }}
            aria-label="Session name"
          />
        ) : (
          <button type="button" className="truncate text-left font-display text-[17px] font-semibold sm:text-[18px]" onClick={() => setEditing(true)} title="Rename session">
            {session.name}
          </button>
        )}
      </div>
      <nav className="flex gap-1 rounded-2xl bg-bg p-1" aria-label="Main">
        {tab('table', 'Table', 'map')}
        {tab('characters', 'Characters', 'users')}
      </nav>
      <IconButton icon="settings" label="Settings" className="border border-line" onClick={() => setSettings(true)} />
      <SettingsDialog open={settings} onClose={() => setSettings(false)} session={session} />
    </header>
  );
}
