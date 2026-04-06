import { create } from 'zustand';
import { SyncStatus } from '../types';
import { pullData, pushData, isConfigured } from '../utils/githubSync';
import { useSessionStore } from './sessionStore';
import { useWorkoutStore } from './workoutStore';
import { useSettingsStore } from './settingsStore';

interface SyncStore {
  status: SyncStatus;
  lastSyncAt: number | null;
  pendingChanges: number;
  error: string | null;
  sync: () => Promise<void>;
  pull: () => Promise<void>;
  push: () => Promise<void>;
  incrementPending: () => void;
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  status: 'idle',
  lastSyncAt: null,
  pendingChanges: 0,
  error: null,

  incrementPending: () =>
    set((state) => ({ pendingChanges: state.pendingChanges + 1 })),

  pull: async () => {
    const configured = await isConfigured();
    if (!configured) return;

    set({ status: 'syncing' });
    try {
      const data = await pullData();
      if (data) {
        // Merge pulled data with local (simple: remote wins for now)
        if (data.sessions) {
          // We'd merge sessions here in a real app
        }
      }
      set({ status: 'success', lastSyncAt: Date.now(), error: null });
    } catch (e: any) {
      set({ status: 'error', error: e.message });
    }
  },

  push: async () => {
    const configured = await isConfigured();
    if (!configured) return;

    set({ status: 'syncing' });
    try {
      const sessions = useSessionStore.getState().sessions;
      const programs = useWorkoutStore.getState().programs;
      const weeklyPlan = useWorkoutStore.getState().weeklyPlan;
      const settings = useSettingsStore.getState().settings;

      const success = await pushData({
        sessions,
        programs,
        weeklyPlan,
        goals: [],
        settings,
        lastModified: Date.now(),
      });

      if (success) {
        set({ status: 'success', lastSyncAt: Date.now(), pendingChanges: 0, error: null });
      } else {
        set({ status: 'error', error: 'Push failed' });
      }
    } catch (e: any) {
      set({ status: 'error', error: e.message });
    }
  },

  sync: async () => {
    await get().pull();
    await get().push();
  },
}));
