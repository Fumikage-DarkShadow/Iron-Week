import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings } from '../types';

interface SettingsStore {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
}

const defaultSettings: UserSettings = {
  goal: 'masse',
  level: 'intermediaire',
  unit: 'kg',
  defaultIncrement: 2.5,
  defaultRestSeconds: 90,
  githubToken: '',
  githubRepo: '',
  notificationsEnabled: true,
  soundEnabled: true,
  hapticEnabled: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),
    }),
    {
      name: 'iron-week-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
