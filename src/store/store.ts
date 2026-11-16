import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import type { Camera, Character, DiceRequest, DiceRoll, Figurine, GridSettings, ID, MapInfo, Preferences, Session } from '../types';
import { emptySession, makeCharacter, sampleSession } from './sample';
import { deleteMap } from '../lib/mapStore';

// One store, plain actions. Every mutation that affects the shared table goes
// through a named action, which is the seam where a future room-code sync
// layer can broadcast and apply changes.

export type View = 'home' | 'table' | 'characters' | 'creator';

const idbStorage: StateStorage = {
  getItem: async (k) => (await idbGet<string>(k)) ?? null,
  setItem: (k, v) => idbSet(k, v),
  removeItem: (k) => idbDel(k),
};

interface UIState {
  view: View;
  editingId: ID | null; // character being edited in the creator (null = new)
  selectedId: ID | null; // selected figurine
  sheetId: ID | null; // open character sheet
  diceOpen: boolean;
  pendingRoll: DiceRequest | null; // request being thrown in the 3D tray
  toastMsg: string | null;
}

interface DataState {
  sessions: Session[];
  activeId: ID | null;
  prefs: Preferences;
}

interface Actions {
  // navigation
  go: (v: View) => void;
  openCreator: (id: ID | null) => void;
  select: (id: ID | null) => void;
  openSheet: (id: ID | null) => void;
  setDiceOpen: (o: boolean) => void;
  toast: (msg: string | null) => void;

  // sessions
  createSession: (name: string) => ID;
  createSampleSession: () => ID;
  openSession: (id: ID) => void;
  renameSession: (name: string) => void;
  deleteSession: (id: ID) => void;
  importSession: (s: Session) => void;

  // map & grid
  setMap: (m: MapInfo | null) => void;
  setGrid: (g: Partial<GridSettings>) => void;
  setCamera: (c: Camera) => void;

  // characters & figurines
  saveCharacter: (c: Character) => void;
  updateCharacter: (id: ID, fn: (c: Character) => Character) => void;
  deleteCharacter: (id: ID) => void;
  moveFigurine: (id: ID, x: number, y: number) => void;
  placeFigurine: (id: ID, x: number, y: number) => void;
  removeFigurine: (id: ID) => void;

  // dice
  requestRoll: (r: DiceRequest) => void;
  recordRoll: (r: DiceRoll) => void;
  closeTray: () => void;
  clearRolls: () => void;

  setPrefs: (p: Partial<Preferences>) => void;
}

export type Store = UIState & DataState & Actions & { hydrated: boolean };

const touch = (s: Session): Session => ({ ...s, updatedAt: Date.now() });

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      const patchActive = (fn: (s: Session) => Session) =>
        set((st) => ({ sessions: st.sessions.map((s) => (s.id === st.activeId ? touch(fn(s)) : s)) }));

      return {
        hydrated: false,
        view: 'home',
        editingId: null,
        selectedId: null,
        sheetId: null,
        diceOpen: false,
        pendingRoll: null,
        toastMsg: null,
        sessions: [],
        activeId: null,
        prefs: { animateDice: true, diceSound: true, reduceMotion: false },

        go: (view) => set({ view, selectedId: view === 'table' ? get().selectedId : null }),
        openCreator: (editingId) => set({ view: 'creator', editingId, sheetId: null }),
        select: (selectedId) => set({ selectedId }),
        openSheet: (sheetId) => set({ sheetId }),
        setDiceOpen: (diceOpen) => set({ diceOpen }),
        toast: (toastMsg) => set({ toastMsg }),

        createSession: (name) => {
          const s = emptySession(name.trim() || 'Untitled adventure');
          set((st) => ({ sessions: [s, ...st.sessions], activeId: s.id, view: 'table', selectedId: null, sheetId: null }));
          return s.id;
        },
        createSampleSession: () => {
          const s = sampleSession();
          set((st) => ({ sessions: [s, ...st.sessions], activeId: s.id, view: 'table', selectedId: null, sheetId: null }));
          return s.id;
        },
        openSession: (id) => set({ activeId: id, view: 'table', selectedId: null, sheetId: null }),
        renameSession: (name) => patchActive((s) => ({ ...s, name: name.trim() || s.name })),
        deleteSession: (id) => {
          const s = get().sessions.find((x) => x.id === id);
          if (s) deleteMap(s.map);
          set((st) => ({
            sessions: st.sessions.filter((x) => x.id !== id),
            activeId: st.activeId === id ? null : st.activeId,
            view: st.activeId === id ? 'home' : st.view,
          }));
        },
        importSession: (s) => set((st) => ({ sessions: [s, ...st.sessions.filter((x) => x.id !== s.id)], activeId: s.id, view: 'table' })),

        setMap: (m) => {
          const cur = active(get());
          if (cur?.map && cur.map.id !== m?.id) deleteMap(cur.map);
          patchActive((s) => ({ ...s, map: m, camera: null }));
        },
        setGrid: (g) => patchActive((s) => ({ ...s, grid: { ...s.grid, ...g } })),
        setCamera: (camera) => set((st) => ({ sessions: st.sessions.map((s) => (s.id === st.activeId ? { ...s, camera } : s)) })),

        saveCharacter: (c) =>
          patchActive((s) => {
            const exists = s.characters.some((x) => x.id === c.id);
            const characters = exists ? s.characters.map((x) => (x.id === c.id ? { ...c, updatedAt: Date.now() } : x)) : [...s.characters, c];
            return { ...s, characters };
          }),
        updateCharacter: (id, fn) =>
          patchActive((s) => ({ ...s, characters: s.characters.map((c) => (c.id === id ? { ...fn(c), updatedAt: Date.now() } : c)) })),
        deleteCharacter: (id) =>
          set((st) => {
            const sessions = st.sessions.map((s) => {
              if (s.id !== st.activeId) return s;
              const figurines = { ...s.figurines };
              delete figurines[id];
              return touch({ ...s, characters: s.characters.filter((c) => c.id !== id), figurines });
            });
            return { sessions, selectedId: st.selectedId === id ? null : st.selectedId, sheetId: st.sheetId === id ? null : st.sheetId };
          }),
        moveFigurine: (id, x, y) => patchActive((s) => ({ ...s, figurines: { ...s.figurines, [id]: { ...(s.figurines[id] ?? defFig(id)), x, y, onTable: true } } })),
        placeFigurine: (id, x, y) => patchActive((s) => ({ ...s, figurines: { ...s.figurines, [id]: { ...(s.figurines[id] ?? defFig(id)), x, y, onTable: true } } })),
        removeFigurine: (id) =>
          patchActive((s) => ({ ...s, figurines: { ...s.figurines, [id]: { ...(s.figurines[id] ?? defFig(id)), onTable: false } } })),

        requestRoll: (r) => set({ pendingRoll: r }),
        recordRoll: (r) => patchActive((s) => ({ ...s, rolls: [r, ...s.rolls].slice(0, 60) })),
        closeTray: () => set({ pendingRoll: null }),
        clearRolls: () => patchActive((s) => ({ ...s, rolls: [] })),

        setPrefs: (p) => set((st) => ({ prefs: { ...st.prefs, ...p } })),
      };
    },
    {
      name: 'cocoajourney',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: (st) => ({ sessions: st.sessions, activeId: st.activeId, prefs: st.prefs, view: st.view === 'creator' ? 'characters' : st.view }) as unknown as Store,
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.activeId || !state.sessions.some((s) => s.id === state.activeId)) state.view = 'home';
        }
        useStore.setState({ hydrated: true });
      },
    },
  ),
);

const defFig = (id: ID): Figurine => ({ characterId: id, x: 0, y: 0, onTable: false, size: 1 });

export const active = (st: Pick<Store, 'sessions' | 'activeId'>): Session | undefined => st.sessions.find((s) => s.id === st.activeId);

export function useActiveSession(): Session | undefined {
  return useStore((st) => st.sessions.find((s) => s.id === st.activeId));
}

export { makeCharacter };
