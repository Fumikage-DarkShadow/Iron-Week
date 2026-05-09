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
        // Last-write-wins merge: remote replaces local for the keys it carries.
        // Previously this was a silent no-op while reporting "success" — pulled
        // data was discarded.
        if (Array.isArray(data.sessions)) {
          useSessionStore.setState({ sessions: data.sessions });
        }
        if (Array.isArray(data.programs)) {
          useWorkoutStore.setState({ programs: data.programs });
        }
        if (data.weeklyPlan && typeof data.weeklyPlan === 'object') {
          useWorkoutStore.setState({ weeklyPlan: data.weeklyPlan });
        }
        if (data.settings && typeof data.settings === 'object') {
          // Merge settings rather than replace, so local-only flags
          // (hasOnboarded) survive the pull.
          useSettingsStore.setState((state) => ({
            settings: { ...state.settings, ...data.settings },
          }));
        }
      }
      set({ status: 'success', lastSyncAt: Date.now(), error: null });
    } catch (e: any) {
      set({ status: 'error', error: e?.message || 'Sync failed' });
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
