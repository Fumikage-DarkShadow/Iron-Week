/**
 * Expert Set-by-Set Advisor
 *
 * Uses 1RM-based calculations (Epley formula) to give precise weight
 * recommendations between sets, not fixed +2.5/+5kg jumps.
 *
 * Core math:
 *   1RM = weight × (1 + reps / 30)
 *   target_weight = 1RM / (1 + target_reps / 30)
 *
 * Example: 30 reps at 10kg → 1RM = 20kg → for 8-12 reps = 15kg (+5kg)
 * Example: 12 reps at 80kg → 1RM = 112kg → for 10 reps = 84kg (+4kg)
 */

import { WorkoutSet } from '../types';
import { calculateNextSetWeight } from './smartIncrement';

export interface SetAdvice {
  suggestedKg: number;
  message: string;
  detail: string;
  type: 'increase' | 'maintain' | 'decrease' | 'first';
  emoji: string;
}

export function getSetAdvice(
  doneSets: WorkoutSet[],
  targetRepsRange: [number, number],
  exerciseType: 'compound' | 'isolation' | 'cardio',
  totalPlannedSets: number,
): SetAdvice {
  const [minReps, maxReps] = targetRepsRange;
  const nextSetNumber = doneSets.length + 1;
  const isCompound = exerciseType === 'compound';

  // No sets done — first set
  if (doneSets.length === 0) {
    return {
      suggestedKg: 0,
      message: `Série 1/${totalPlannedSets}`,
      detail: `Vise ${minReps}-${maxReps} reps. Choisis une charge qui te laisse 1-2 reps en réserve (RPE 8).`,
      type: 'first',
      emoji: '🎯',
    };
  }

  const lastSet = doneSets[doneSets.length - 1];
  if (lastSet.kg <= 0 || lastSet.reps <= 0) {
    return {
      suggestedKg: lastSet.kg,
      message: `Série ${nextSetNumber}/${totalPlannedSets}`,
      detail: 'Renseigne la charge et les reps de la série précédente.',
      type: 'first',
      emoji: '📝',
    };
  }

  // Use smart 1RM-based calculation
  const { weight: suggestedKg, reason } = calculateNextSetWeight(
    lastSet.kg,
    lastSet.reps,
    targetRepsRange,
    isCompound,
    doneSets.length,
  );

  const lastReps = lastSet.reps;
  const diff = suggestedKg - lastSet.kg;

  let type: SetAdvice['type'] = 'maintain';
  let emoji = '✅';

  if (diff > 0) {
    type = 'increase';
    emoji = '🔥';
  } else if (diff < 0) {
    type = 'decrease';
    emoji = lastReps < minReps ? '⚠️' : '🧠';
  }

  return {
    suggestedKg,
    message: `Série ${nextSetNumber}/${totalPlannedSets} → ${suggestedKg}kg`,
    detail: reason,
    type,
    emoji,
  };
}
