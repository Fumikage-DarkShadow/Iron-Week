import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, WorkoutExercise, WorkoutSet, PersonalRecord } from '../types';

interface SessionStore {
  sessions: Session[];
  activeSession: Session | null;
  startSession: (session: Session) => void;
  endSession: () => void;
  updateExercise: (exerciseIndex: number, updates: Partial<WorkoutExercise>) => void;
  updateSet: (exerciseIndex: number, setIndex: number, updates: Partial<WorkoutSet>) => void;
  addSet: (exerciseIndex: number, set: WorkoutSet) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  completeExercise: (exerciseIndex: number) => void;
  addNote: (exerciseIndex: number, note: string) => void;
  getSessionsForExercise: (exerciseId: string, limit?: number) => Session[];
  getLastSessionForProgram: (programId: string) => Session | undefined;
  getPersonalRecords: (exerciseId: string) => PersonalRecord[];
  getAllPRs: () => PersonalRecord[];
  getStreak: () => number;
  getWeeklyVolume: (weeksAgo?: number) => number;
  getWeeklySessions: (weeks?: number) => number[];
  resetAllData: () => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSession: null,

      startSession: (session) => set({ activeSession: session }),

      endSession: () =>
        set((state) => {
          if (!state.activeSession) return state;
          const completed: Session = {
            ...state.activeSession,
            completedAt: Date.now(),
            duration: Date.now() - state.activeSession.startedAt,
            totalVolume: state.activeSession.exercises.reduce(
              (total, ex) =>
                total +
                ex.sets
                  .filter((s) => s.done)
                  .reduce((vol, s) => vol + s.kg * s.reps, 0),
              0
            ),
          };
          return {
            sessions: [...state.sessions, completed],
            activeSession: null,
          };
        }),

      updateExercise: (exerciseIndex, updates) =>
        set((state) => {
          if (!state.activeSession) return state;
          const exercises = [...state.activeSession.exercises];
          exercises[exerciseIndex] = { ...exercises[exerciseIndex], ...updates };
          return { activeSession: { ...state.activeSession, exercises } };
        }),

      updateSet: (exerciseIndex, setIndex, updates) =>
        set((state) => {
          if (!state.activeSession) return state;
          const exercises = [...state.activeSession.exercises];
          const sets = [...exercises[exerciseIndex].sets];
          sets[setIndex] = { ...sets[setIndex], ...updates };
          if (updates.done) sets[setIndex].timestamp = Date.now();
          exercises[exerciseIndex] = { ...exercises[exerciseIndex], sets };
          return { activeSession: { ...state.activeSession, exercises } };
        }),

      addSet: (exerciseIndex, newSet) =>
        set((state) => {
          if (!state.activeSession) return state;
          const exercises = [...state.activeSession.exercises];
          exercises[exerciseIndex] = {
            ...exercises[exerciseIndex],
            sets: [...exercises[exerciseIndex].sets, newSet],
          };
          return { activeSession: { ...state.activeSession, exercises } };
        }),

      removeSet: (exerciseIndex, setIndex) =>
        set((state) => {
          if (!state.activeSession) return state;
          const exercises = [...state.activeSession.exercises];
          exercises[exerciseIndex] = {
            ...exercises[exerciseIndex],
            sets: exercises[exerciseIndex].sets.filter((_, i) => i !== setIndex),
          };
          return { activeSession: { ...state.activeSession, exercises } };
        }),

      completeExercise: (exerciseIndex) =>
        set((state) => {
          if (!state.activeSession) return state;
          const exercises = [...state.activeSession.exercises];
          exercises[exerciseIndex] = { ...exercises[exerciseIndex], completed: true };
          return { activeSession: { ...state.activeSession, exercises } };
        }),

      addNote: (exerciseIndex, note) =>
        set((state) => {
          if (!state.activeSession) return state;
          const exercises = [...state.activeSession.exercises];
          exercises[exerciseIndex] = { ...exercises[exerciseIndex], notes: note };
          return { activeSession: { ...state.activeSession, exercises } };
        }),

      getSessionsForExercise: (exerciseId, limit = 4) => {
        const { sessions } = get();
        return sessions
          .filter((s) => s.exercises.some((e) => e.exerciseId === exerciseId))
          .sort((a, b) => b.startedAt - a.startedAt)
          .slice(0, limit);
      },

      getLastSessionForProgram: (programId) => {
        const { sessions } = get();
        return sessions
          .filter((s) => s.programId === programId)
          .sort((a, b) => b.startedAt - a.startedAt)[0];
      },

      getPersonalRecords: (exerciseId) => {
        const { sessions } = get();
        const prs: PersonalRecord[] = [];
        let maxWeight = 0;
        let max1RM = 0;
        let maxVolume = 0;
        let maxReps = 0;

        for (const session of sessions) {
          for (const ex of session.exercises) {
            if (ex.exerciseId !== exerciseId) continue;
            for (const s of ex.sets) {
              if (!s.done) continue;
              if (s.kg > maxWeight) {
                maxWeight = s.kg;
                prs.push({ exerciseId, type: 'weight', value: s.kg, date: session.date });
              }
              const estimated1RM = s.kg * (1 + s.reps / 30);
              if (estimated1RM > max1RM) {
                max1RM = estimated1RM;
                prs.push({ exerciseId, type: '1rm', value: Math.round(estimated1RM * 10) / 10, date: session.date });
              }
              if (s.reps > maxReps) {
                maxReps = s.reps;
                prs.push({ exerciseId, type: 'reps', value: s.reps, date: session.date });
              }
            }
            const vol = ex.sets.filter((s) => s.done).reduce((v, s) => v + s.kg * s.reps, 0);
            if (vol > maxVolume) {
              maxVolume = vol;
              prs.push({ exerciseId, type: 'volume', value: vol, date: session.date });
            }
          }
        }
        return prs;
      },

      getAllPRs: () => {
        const { sessions } = get();
        const prMap = new Map<string, PersonalRecord>();

        for (const session of sessions) {
          for (const pr of session.prs || []) {
            const key = `${pr.exerciseId}_${pr.type}`;
            const existing = prMap.get(key);
            if (!existing || pr.value > existing.value) {
              prMap.set(key, pr);
            }
          }
        }
        return Array.from(prMap.values());
      },

      getStreak: () => {
        const { sessions } = get();
        if (sessions.length === 0) return 0;

        const sortedDates = [...new Set(sessions.map((s) => s.date))].sort().reverse();
        let streak = 0;
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Allow streak to start from today or yesterday
        const startOffset = sortedDates[0] === todayStr ? 0 : 1;

        for (let i = 0; i < sortedDates.length; i++) {
          const d = new Date(sortedDates[i]);
          const expected = new Date(today);
          expected.setDate(expected.getDate() - i - startOffset);
          if (d.toISOString().split('T')[0] === expected.toISOString().split('T')[0]) {
            streak++;
          } else {
            break;
          }
        }
        return streak;
      },

      getWeeklyVolume: (weeksAgo = 0) => {
        const { sessions } = get();
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() - weeksAgo * 7 + 1);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        return sessions
          .filter((s) => {
            const d = new Date(s.date);
            return d >= startOfWeek && d < endOfWeek;
          })
          .reduce((vol, s) => vol + s.totalVolume, 0);
      },

      getWeeklySessions: (weeks = 8) => {
        const { sessions } = get();
        const result: number[] = [];
        for (let i = weeks - 1; i >= 0; i--) {
          const now = new Date();
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay() - i * 7 + 1);
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);

          result.push(
            sessions.filter((s) => {
              const d = new Date(s.date);
              return d >= startOfWeek && d < endOfWeek;
            }).length
          );
        }
        return result;
      },
      resetAllData: () => set({ sessions: [], activeSession: null }),
    }),
    {
      name: 'iron-week-sessions',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
