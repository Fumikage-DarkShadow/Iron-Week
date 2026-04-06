import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Program, ProgramExercise, WeeklyPlan, DayOfWeek } from '../types';

interface WorkoutStore {
  programs: Program[];
  weeklyPlan: WeeklyPlan;
  addProgram: (program: Program) => void;
  updateProgram: (id: string, updates: Partial<Program>) => void;
  deleteProgram: (id: string) => void;
  duplicateProgram: (id: string) => void;
  toggleFavorite: (id: string) => void;
  reorderExercises: (programId: string, exercises: ProgramExercise[]) => void;
  setWeeklyPlan: (day: DayOfWeek, programId: string | null) => void;
  getProgramForDay: (day: DayOfWeek) => Program | undefined;
  importPrograms: (programs: Program[]) => void;
  resetPrograms: () => void;
}

const PROGRAM_COLORS = ['#ff4d1c', '#ff8c42', '#f5c542', '#22c55e', '#60a5fa', '#c084fc', '#ef4444', '#14b8a6'];

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      programs: [],
      weeklyPlan: {
        lundi: null,
        mardi: null,
        mercredi: null,
        jeudi: null,
        vendredi: null,
        samedi: null,
        dimanche: null,
      },
      addProgram: (program) =>
        set((state) => ({
          programs: [...state.programs, {
            ...program,
            color: program.color || PROGRAM_COLORS[state.programs.length % PROGRAM_COLORS.length],
          }],
        })),
      updateProgram: (id, updates) =>
        set((state) => ({
          programs: state.programs.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        })),
      deleteProgram: (id) =>
        set((state) => {
          const newPlan = { ...state.weeklyPlan };
          for (const day of Object.keys(newPlan)) {
            if (newPlan[day] === id) newPlan[day] = null;
          }
          return {
            programs: state.programs.filter((p) => p.id !== id),
            weeklyPlan: newPlan,
          };
        }),
      duplicateProgram: (id) =>
        set((state) => {
          const original = state.programs.find((p) => p.id === id);
          if (!original) return state;
          const copy: Program = {
            ...original,
            id: `prog_${Date.now()}`,
            name: `${original.name} (copie)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isFavorite: false,
            color: PROGRAM_COLORS[state.programs.length % PROGRAM_COLORS.length],
          };
          return { programs: [...state.programs, copy] };
        }),
      toggleFavorite: (id) =>
        set((state) => ({
          programs: state.programs.map((p) =>
            p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
          ),
        })),
      reorderExercises: (programId, exercises) =>
        set((state) => ({
          programs: state.programs.map((p) =>
            p.id === programId ? { ...p, exercises, updatedAt: Date.now() } : p
          ),
        })),
      setWeeklyPlan: (day, programId) =>
        set((state) => ({
          weeklyPlan: { ...state.weeklyPlan, [day]: programId },
        })),
      getProgramForDay: (day) => {
        const { weeklyPlan, programs } = get();
        const programId = weeklyPlan[day];
        if (!programId) return undefined;
        return programs.find((p) => p.id === programId);
      },
      importPrograms: (newPrograms) =>
        set((state) => {
          // Don't import duplicates (by id)
          const existingIds = new Set(state.programs.map((p) => p.id));
          const toAdd = newPrograms.filter((p) => !existingIds.has(p.id));
          return { programs: [...state.programs, ...toAdd] };
        }),
      resetPrograms: () =>
        set({
          programs: [],
          weeklyPlan: {
            lundi: null,
            mardi: null,
            mercredi: null,
            jeudi: null,
            vendredi: null,
            samedi: null,
            dimanche: null,
          },
        }),
    }),
    {
      name: 'iron-week-workouts',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
