/**
 * Auto-calibrates rest times based on exercise type and training goal.
 *
 * Based on NSCA guidelines and current literature:
 * - Compound/Force (RPE 8-10): 3-5 min (phosphocreatine full recovery)
 * - Compound/Hypertrophy: 2-3 min
 * - Isolation/Hypertrophy: 60-90s
 * - Isolation/Endurance: 30-60s
 * - Cardio: 0s (continuous)
 */

import { ExerciseType, UserGoal } from '../types';

export function getDefaultRestSeconds(exerciseType: ExerciseType, goal: UserGoal): number {
  const matrix: Record<ExerciseType, Record<UserGoal, number>> = {
    compound: {
      force: 180,      // 3 min — full phosphocreatine recovery
      masse: 120,      // 2 min — balance recovery/metabolic stress
      seche: 90,       // 1:30 — shorter for higher metabolic demand
      endurance: 60,   // 1 min — minimal rest
    },
    isolation: {
      force: 120,      // 2 min
      masse: 90,       // 1:30
      seche: 60,       // 1 min
      endurance: 45,   // 45s
    },
    cardio: {
      force: 0,
      masse: 0,
      seche: 0,
      endurance: 0,
    },
  };

  return matrix[exerciseType]?.[goal] ?? 90;
}
