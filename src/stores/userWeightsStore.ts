import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Stores the user's known working weights for each exercise.
 * This allows the coach engine to give accurate recommendations
 * from day 1, instead of treating the user as a beginner.
 *
 * Key = exerciseId, Value = weight in kg that the user currently uses
 * for their working sets.
 */
interface UserWeightsStore {
  weights: Record<string, number>;  // exerciseId -> kg
  setWeight: (exerciseId: string, kg: number) => void;
  removeWeight: (exerciseId: string) => void;
  getWeight: (exerciseId: string) => number | undefined;
  resetAll: () => void;
}

export const useUserWeightsStore = create<UserWeightsStore>()(
  persist(
    (set, get) => ({
      weights: {},

      setWeight: (exerciseId, kg) =>
        set((state) => ({
          weights: { ...state.weights, [exerciseId]: kg },
        })),

      removeWeight: (exerciseId) =>
        set((state) => {
          const { [exerciseId]: _, ...rest } = state.weights;
          return { weights: rest };
        }),

      getWeight: (exerciseId) => get().weights[exerciseId],

      resetAll: () => set({ weights: {} }),
    }),
    {
      name: 'iron-week-user-weights',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
