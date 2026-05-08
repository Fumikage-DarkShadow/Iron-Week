/**
 * Expert Set-by-Set Advisor — clear, actionable messages
 *
 * Uses Epley 1RM formula to give precise weight recommendations
 * between sets, then formats them into simple readable French.
 */

import { WorkoutSet } from '../types';
import { calculateNextSetWeight } from './smartIncrement';

export interface SetAdvice {
  suggestedKg: number;
  message: string;        // Short title (e.g. "✅ Continue à 80kg")
  detail: string;         // Full explanation in clear French
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

  // First set
  if (doneSets.length === 0) {
    return {
      suggestedKg: 0,
      message: `Série 1/${totalPlannedSets}`,
      detail: `Vise ${minReps}-${maxReps} reps. Commence avec une charge qui te laisse 1 à 2 reps en réserve à la fin.`,
      type: 'first',
      emoji: '🎯',
    };
  }

  const lastSet = doneSets[doneSets.length - 1];
  if (lastSet.kg <= 0 || lastSet.reps <= 0) {
    return {
      suggestedKg: lastSet.kg,
      message: `Série ${nextSetNumber}/${totalPlannedSets}`,
      detail: 'Renseigne la charge et les reps de ta dernière série.',
      type: 'first',
      emoji: '📝',
    };
  }

  const lastReps = lastSet.reps;
  const lastKg = lastSet.kg;

  // Compute the smart next weight
  const { weight: smartKg } = calculateNextSetWeight(
    lastKg, lastReps, targetRepsRange, isCompound, doneSets.length
  );

  const diff = smartKg - lastKg;
  const inRange = lastReps >= minReps && lastReps <= maxReps;
  const aboveMax = lastReps > maxReps;
  const belowMin = lastReps < minReps;

  // ─── TROP FACILE → MONTE LA CHARGE ───
  if (aboveMax) {
    const repsExtra = lastReps - maxReps;
    const intensity = repsExtra >= 3 ? 'Trop facile' : 'Un peu facile';
    const newKg = diff > 0 ? smartKg : lastKg + (isCompound ? 2.5 : 1);
    const jump = newKg - lastKg;
    return {
      suggestedKg: newKg,
      message: `🔥 ${intensity}, monte à ${newKg}kg`,
      detail: `OK ${lastReps} reps validées avec ${lastKg}kg, c'est au-dessus de ta cible (${minReps}-${maxReps}).\n\nPasse à ${newKg}kg (+${jump}kg) et vise ${minReps}-${maxReps} reps.`,
      type: 'increase',
      emoji: '🔥',
    };
  }

  // ─── TROP DUR → BAISSE LA CHARGE ───
  if (belowMin) {
    const repsShort = minReps - lastReps;
    const intensity = repsShort >= 3 ? 'Trop lourd' : 'Un peu juste';
    const newKg = diff < 0 ? smartKg : Math.max(lastKg - (isCompound ? 2.5 : 1), 0);
    const drop = lastKg - newKg;
    return {
      suggestedKg: newKg,
      message: `⬇️ ${intensity}, baisse à ${newKg}kg`,
      detail: `Seulement ${lastReps} reps avec ${lastKg}kg, en dessous de ta cible (${minReps}-${maxReps}).\n\nDescends à ${newKg}kg (-${drop}kg) pour atteindre ${minReps} reps minimum.`,
      type: 'decrease',
      emoji: '⬇️',
    };
  }

  // ─── DANS LA CIBLE ───
  // Special case: at the bottom of range + accumulating fatigue
  if (lastReps === minReps && doneSets.length >= 2 && diff < 0) {
    const drop = lastKg - smartKg;
    return {
      suggestedKg: smartKg,
      message: `💡 Baisse à ${smartKg}kg pour la fatigue`,
      detail: `${lastReps} reps avec ${lastKg}kg c'est dans la cible mais à la limite basse.\n\nVu la fatigue accumulée, baisse à ${smartKg}kg (-${drop}kg) pour rester dans ${minReps}-${maxReps} reps sur les prochaines séries.`,
      type: 'decrease',
      emoji: '💡',
    };
  }

  // Default in-range: maintain
  return {
    suggestedKg: lastKg,
    message: `✅ Continue à ${lastKg}kg`,
    detail: `OK ${lastReps} reps validées avec ${lastKg}kg, parfait dans ta cible (${minReps}-${maxReps}).\n\nGarde ${lastKg}kg pour la série ${nextSetNumber}, focus sur la technique.`,
    type: 'maintain',
    emoji: '✅',
  };
}
