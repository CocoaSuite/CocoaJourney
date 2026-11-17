import { lazy, Suspense, useEffect } from 'react';
import { useActiveSession, useStore } from '../store/store';
import { Home } from './Home';
import { TopBar } from './TopBar';
import { GameTable } from '../table/GameTable';
import { CharactersView } from '../creator/CharactersView';
import { CharacterCreator } from '../creator/CharacterCreator';
import { CharacterSheet } from '../sheet/CharacterSheet';
import { DiceRoller } from '../dice/DiceRoller';
import { Toast } from '../components/Toast';
import { Logo } from '../components/Icon';

const DiceTray = lazy(() => import('../dice/DiceTray'));

export function App() {
  const hydrated = useStore((s) => s.hydrated);
  const view = useStore((s) => s.view);
  const session = useActiveSession();
  const pendingRoll = useStore((s) => s.pendingRoll);
  const sheetId = useStore((s) => s.sheetId);

  useEffect(() => {
    document.title = session ? `${session.name} · CocoaJourney` : 'CocoaJourney';
  }, [session?.name]);

  if (!hydrated) {
    return (
      <div className="paper flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-fade">
          <Logo size={56} />
          <span className="font-display text-[20px] font-semibold text-cocoa">CocoaJourney</span>
        </div>
      </div>
    );
  }

  if (!session || view === 'home') return <Home />;

  return (
    <div className="paper flex h-full flex-col overflow-hidden">
      {view !== 'creator' && <TopBar session={session} />}
      <main className="relative min-h-0 flex-1">
        {view === 'table' && <GameTable session={session} />}
        {view === 'characters' && <CharactersView session={session} />}
        {view === 'creator' && <CharacterCreator session={session} />}
      </main>
      {view !== 'creator' && <DiceRoller session={session} />}
      {sheetId && <CharacterSheet session={session} id={sheetId} />}
      {pendingRoll && (
        <Suspense fallback={<div className="fixed inset-0 z-[60] bg-[#2A1E17]" />}>
          <DiceTray request={pendingRoll} />
        </Suspense>
      )}
      <Toast />
    </div>
  );
}
