import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, WorkoutExercise, WorkoutSet, PersonalRecord } from '../types';

// ─── Date helpers (local timezone, ISO week starts Monday) ───
// Parse a YYYY-MM-DD date string as a LOCAL date at midnight (not UTC).
// `new Date('2026-05-09')` is parsed as UTC by the spec — that's the bug
// we're avoiding here.
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

// Compute Monday 00:00 (local) of the week N weeks ago.
// JS getDay() returns Sunday=0, Monday=1, ..., Saturday=6.
// We convert to ISO weekday (Mon=0, ..., Sun=6) so subtraction always
// gives "this week's Monday", not "next Monday on Sundays".
function computeStartOfWeek(weeksAgo: number): Date {
  const now = new Date();
  const isoDow = (now.getDay() + 6) % 7; // Mon=0 ... Sun=6
  const start = new Date(now);
  start.setDate(now.getDate() - isoDow - weeksAgo * 7);
  start.setHours(0, 0, 0, 0);
  return start;
}

interface SessionStore {
  sessions: Session[];
  activeSession: Session | null;
  startSession: (session: Session) => void;
  endSession: () => void;
  discardSession: () => void;
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

        // Track the LATEST best for each PR type rather than every historical
        // improvement event — previously this returned a growing list that
        // bloated memory and the UI ("Tes records" showed the first PR ever
        // hit, not the current best).
        let bestWeight: PersonalRecord | null = null;
        let best1RM: PersonalRecord | null = null;
        let bestReps: PersonalRecord | null = null;
        let bestVolume: PersonalRecord | null = null;

        for (const session of sessions) {
          for (const ex of session.exercises) {
            if (ex.exerciseId !== exerciseId) continue;
            for (const s of ex.sets) {
              if (!s.done) continue;
              if (s.kg > maxWeight) {
                maxWeight = s.kg;
                bestWeight = { exerciseId, type: 'weight', value: s.kg, date: session.date };
              }
              const estimated1RM = s.kg * (1 + s.reps / 30);
              if (estimated1RM > max1RM) {
                max1RM = estimated1RM;
                best1RM = {
                  exerciseId,
                  type: '1rm',
                  value: Math.round(estimated1RM * 10) / 10,
                  date: session.date,
                };
              }
              if (s.reps > maxReps) {
                maxReps = s.reps;
                bestReps = { exerciseId, type: 'reps', value: s.reps, date: session.date };
              }
            }
            const vol = ex.sets.filter((s) => s.done).reduce((v, s) => v + s.kg * s.reps, 0);
            if (vol > maxVolume) {
              maxVolume = vol;
              bestVolume = { exerciseId, type: 'volume', value: vol, date: session.date };
            }
          }
        }

        if (bestWeight) prs.push(bestWeight);
        if (best1RM) prs.push(best1RM);
        if (bestReps) prs.push(bestReps);
        if (bestVolume) prs.push(bestVolume);
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

        // Use LOCAL date strings (YYYY-MM-DD) consistently — session.date is
        // local-formatted at session start so we must compare local-vs-local
        // (mixing toISOString with local arithmetic causes off-by-one days
        // for users east of UTC near midnight).
        const localDateStr = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };

        const sortedDates = [...new Set(sessions.map((s) => s.date))].sort().reverse();
        let streak = 0;
        const today = new Date();
        const todayStr = localDateStr(today);

        // Allow streak to start from today or yesterday (haven't trained today yet)
        const startOffset = sortedDates[0] === todayStr ? 0 : 1;

        for (let i = 0; i < sortedDates.length; i++) {
          const expected = new Date(today);
          expected.setDate(expected.getDate() - i - startOffset);
          if (sortedDates[i] === localDateStr(expected)) {
            streak++;
          } else {
            break;
          }
        }
        return streak;
      },

      getWeeklyVolume: (weeksAgo = 0) => {
        const { sessions } = get();
        const startOfWeek = computeStartOfWeek(weeksAgo);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        return sessions
          .filter((s) => {
            const d = parseLocalDate(s.date);
            return d >= startOfWeek && d < endOfWeek;
          })
          .reduce((vol, s) => vol + s.totalVolume, 0);
      },

      getWeeklySessions: (weeks = 8) => {
        const { sessions } = get();
        const result: number[] = [];
        for (let i = weeks - 1; i >= 0; i--) {
          const startOfWeek = computeStartOfWeek(i);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);

          result.push(
            sessions.filter((s) => {
              const d = parseLocalDate(s.date);
              return d >= startOfWeek && d < endOfWeek;
            }).length
          );
        }
        return result;
      },
      resetAllData: () => set({ sessions: [], activeSession: null }),

      // Discard the active session WITHOUT persisting it. Used by the
      // "Annuler" button on the Today screen so cancelling a started
      // session doesn't add a junk completed entry to history.
      discardSession: () => set({ activeSession: null }),
    }),
    {
      name: 'iron-week-sessions',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
