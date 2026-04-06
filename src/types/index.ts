export type MuscleGroup =
  | 'pectoraux'
  | 'dos'
  | 'epaules'
  | 'biceps'
  | 'triceps'
  | 'quadriceps'
  | 'ischio_fessiers'
  | 'mollets'
  | 'abdos'
  | 'lombaires'
  | 'cardio';

export type ExerciseType = 'compound' | 'isolation' | 'cardio';
export type ExerciseLevel = 'debutant' | 'intermediaire' | 'avance';
export type Equipment = 'barre' | 'halteres' | 'machine' | 'poulie' | 'poids_corps' | 'kettlebell' | 'elastique' | 'autre';

export interface Exercise {
  id: string;
  nameFr: string;
  nameEn: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  type: ExerciseType;
  level: ExerciseLevel;
  equipment: Equipment[];
  defaultRepsRange: [number, number];
  tips: string[];
  substitutes: string[];
}

export interface WorkoutSet {
  id: string;
  kg: number;
  reps: number;
  done: boolean;
  timestamp?: number;
  isWarmup?: boolean;
  rpe?: number;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: WorkoutSet[];
  targetSets: number;
  targetRepsRange: [number, number];
  restSeconds: number;
  notes: string;
  completed: boolean;
}

export interface Program {
  id: string;
  name: string;
  exercises: ProgramExercise[];
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  color: string;
}

export interface ProgramExercise {
  exerciseId: string;
  targetSets: number;
  targetRepsRange: [number, number];
  restSeconds: number;
}

export interface Session {
  id: string;
  programId: string;
  programName: string;
  date: string;
  dayId: string;
  startedAt: number;
  completedAt?: number;
  duration?: number;
  totalVolume: number;
  exercises: WorkoutExercise[];
  prs: PersonalRecord[];
}

export interface PersonalRecord {
  exerciseId: string;
  type: '1rm' | 'weight' | 'reps' | 'volume';
  value: number;
  date: string;
}

export type DayOfWeek = 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi' | 'dimanche';

export interface WeeklyPlan {
  [key: string]: string | null; // dayId -> programId or null (rest)
}

export type RecommendationType = 'increase' | 'maintain' | 'decrease' | 'deload' | 'variation' | 'first_time';

export interface CoachRecommendation {
  exerciseId: string;
  recommendation: RecommendationType;
  suggestedWeight: number;
  currentWeight: number;
  reason: string;
  confidence: number;
  tip: string;
  emoji: string;
}

export type UserGoal = 'masse' | 'force' | 'seche' | 'endurance';
export type UserLevel = 'debutant' | 'intermediaire' | 'avance';
export type WeightUnit = 'kg' | 'lbs';

export interface ExerciseGoal {
  exerciseId: string;
  targetWeight: number;
  targetDate: string;
  startWeight: number;
  startDate: string;
}

export type PeriodizationPhase = 'accumulation' | 'intensification' | 'realisation' | 'deload';

export interface PeriodizationCycle {
  phase: PeriodizationPhase;
  startDate: string;
  endDate: string;
  weekNumber: number;
  volumeModifier: number;
  intensityModifier: number;
}

export interface UserSettings {
  goal: UserGoal;
  level: UserLevel;
  unit: WeightUnit;
  defaultIncrement: number;
  defaultRestSeconds: number;
  githubToken: string;
  githubRepo: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  lastSyncAt?: number;
  pendingChanges: number;
  error?: string;
}
