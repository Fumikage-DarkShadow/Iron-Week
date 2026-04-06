/**
 * Smart Weight Increment Calculator
 *
 * Instead of fixed +2.5kg/+5kg increments, calculates the optimal next
 * weight based on the Epley 1RM formula and target rep ranges.
 *
 * Core principle:
 *   1RM = weight × (1 + reps / 30)
 *   target_weight = 1RM / (1 + target_reps / 30)
 *
 * If someone does 30 reps at 10kg:
 *   1RM = 10 × (1 + 30/30) = 20kg
 *   For target 8-12 reps (midpoint 10):
 *   target_weight = 20 / (1 + 10/30) = 20 / 1.33 = 15kg → +5kg, not +2.5kg
 *
 * If someone does 12 reps at 80kg:
 *   1RM = 80 × (1 + 12/30) = 112kg
 *   For target 10 reps:
 *   target_weight = 112 / (1 + 10/30) = 112 / 1.33 = 84kg → +4kg ≈ +5kg
 *
 * This scales naturally with the lifter's strength level and rep performance.
 */

/**
 * Round to the nearest available plate increment.
 * In most gyms: 1.25, 2.5, 5, 10, 15, 20, 25 kg plates
 * So the minimum jump is 2.5kg (2×1.25) for barbell, 1kg for machines/dumbbells
 */
export function roundToPlate(kg: number, isBarbell: boolean = true): number {
  const increment = isBarbell ? 2.5 : 1;
  return Math.round(kg / increment) * increment;
}

/**
 * Estimate 1RM using Epley formula.
 */
function epley1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/**
 * Given a 1RM, calculate the weight needed to hit a target rep count.
 * Inverse of Epley: weight = 1RM / (1 + reps / 30)
 */
function weightForReps(oneRM: number, targetReps: number): number {
  if (targetReps <= 0 || oneRM <= 0) return 0;
  return oneRM / (1 + targetReps / 30);
}

/**
 * Calculate the smart increment for session-to-session progression.
 *
 * @param currentWeight - Weight used in the last session
 * @param repsAchieved - Average reps achieved in the last session
 * @param targetRepsRange - [min, max] target rep range
 * @param isCompound - Whether the exercise is compound (barbell) or isolation
 * @returns Object with new weight and explanation
 */
export function calculateSmartIncrement(
  currentWeight: number,
  repsAchieved: number,
  targetRepsRange: [number, number],
  isCompound: boolean,
): { newWeight: number; percentIncrease: number; explanation: string } {
  const [minReps, maxReps] = targetRepsRange;
  const midTarget = (minReps + maxReps) / 2;

  if (currentWeight <= 0 || repsAchieved <= 0) {
    return { newWeight: currentWeight, percentIncrease: 0, explanation: 'Pas de données' };
  }

  // Calculate current estimated 1RM from actual performance
  const current1RM = epley1RM(currentWeight, repsAchieved);

  // The target weight is what would let them hit the MIDDLE of the rep range
  // We use midpoint because:
  // - If they can do it for mid-range reps, they have room to progress within the range
  // - Too ambitious (minReps) risks failure, too conservative (maxReps) leaves gains on the table
  const idealWeight = weightForReps(current1RM, midTarget);

  // Round to nearest plate
  const newWeight = roundToPlate(idealWeight, isCompound);

  // Safety: never increase more than 10% in a single session
  const maxJump = currentWeight * 1.10;
  const safeWeight = Math.min(newWeight, roundToPlate(maxJump, isCompound));

  // Safety: never suggest less than current weight for an increase recommendation
  const finalWeight = Math.max(safeWeight, currentWeight + (isCompound ? 2.5 : 1));

  const percentIncrease = ((finalWeight - currentWeight) / currentWeight) * 100;

  const explanation = `1RM estimé: ${Math.round(current1RM)}kg (${currentWeight}kg × ${repsAchieved} reps). `
    + `Pour ${minReps}-${maxReps} reps → ${finalWeight}kg (+${Math.round(percentIncrease)}%).`;

  return { newWeight: finalWeight, percentIncrease, explanation };
}

/**
 * Calculate deload weight using inverse Epley.
 *
 * Deload logic: assume the lifter's 1RM has temporarily dropped ~15%
 * (fatigue/overreaching), then calculate the weight for the TOP of
 * the rep range at that reduced 1RM. This ensures they can comfortably
 * hit max reps during the deload.
 *
 * Example: 100kg × 6 reps → 1RM = 120kg
 *   Reduced 1RM = 120 × 0.85 = 102kg
 *   For 12 reps (top of 8-12): 102 / (1 + 12/30) = 72.8kg ≈ 72.5kg
 *   vs flat 85%: 100 × 0.85 = 85kg (which may still be too heavy)
 */
export function calculateDeloadWeight(
  currentWeight: number,
  targetRepsRange: [number, number],
  isCompound: boolean,
  lastReps?: number,
): number {
  const [, maxReps] = targetRepsRange;
  const reps = lastReps || maxReps;

  // Estimate current 1RM, reduce by 15% for deload
  const current1RM = epley1RM(currentWeight, reps);
  const reduced1RM = current1RM * 0.85;

  // Target top of rep range at reduced 1RM
  const deloadWeight = weightForReps(reduced1RM, maxReps);
  return roundToPlate(deloadWeight, isCompound);
}

/**
 * For intra-session set adjustments (setAdvisor).
 * Calculates what weight to use next set based on the set just completed.
 */
export function calculateNextSetWeight(
  lastWeight: number,
  lastReps: number,
  targetRepsRange: [number, number],
  isCompound: boolean,
  setsCompleted: number,
): { weight: number; reason: string } {
  const [minReps, maxReps] = targetRepsRange;

  if (lastWeight <= 0 || lastReps <= 0) {
    return { weight: lastWeight, reason: 'Renseigne tes données' };
  }

  const current1RM = epley1RM(lastWeight, lastReps);
  const excessReps = lastReps - maxReps;
  const deficitReps = minReps - lastReps;

  // Factor in fatigue: ~3-4% loss per set
  const fatigue = 1 - (setsCompleted * 0.035);

  if (excessReps > 0) {
    // Too many reps — need to increase
    // Calculate what weight would give maxReps at current strength (adjusted for fatigue)
    const targetWeight = weightForReps(current1RM * fatigue, maxReps);
    const newWeight = roundToPlate(targetWeight, isCompound);

    if (newWeight <= lastWeight) {
      return { weight: lastWeight, reason: `Maintiens ${lastWeight}kg, la fatigue fera baisser les reps naturellement` };
    }

    const jump = newWeight - lastWeight;
    return {
      weight: newWeight,
      reason: `${lastReps} reps = trop léger. Monte à ${newWeight}kg (+${jump}kg) pour viser ${minReps}-${maxReps} reps`,
    };
  }

  if (deficitReps > 0) {
    // Not enough reps — use inverse Epley to find the right weight
    // Target: midpoint of rep range, adjusted for fatigue
    const midTarget = (minReps + maxReps) / 2;
    const targetWeight = weightForReps(current1RM * fatigue, midTarget);
    let newWeight = roundToPlate(targetWeight, isCompound);

    // Safety: ensure we actually decrease (1RM math can sometimes suggest same weight)
    if (newWeight >= lastWeight) {
      // Force a decrease using inverse Epley targeting maxReps (more conservative)
      const conservativeWeight = weightForReps(current1RM * fatigue, maxReps);
      newWeight = roundToPlate(conservativeWeight, isCompound);
      // If still not lower, force minimum drop
      if (newWeight >= lastWeight) {
        newWeight = roundToPlate(lastWeight - (isCompound ? 2.5 : 1), isCompound);
      }
    }

    const drop = lastWeight - newWeight;
    const pctDrop = Math.round((drop / lastWeight) * 100);
    return {
      weight: newWeight,
      reason: `${lastReps} reps (cible ${minReps}-${maxReps}). 1RM estimé: ${Math.round(current1RM)}kg → pour ${midTarget} reps = ${newWeight}kg (-${pctDrop}%)`,
    };
  }

  // In range — maintain but account for fatigue
  if (lastReps <= minReps + 1 && setsCompleted >= 2) {
    // At/near the bottom of range + fatigue → use 1RM to find sustainable weight
    const fatigued1RM = current1RM * fatigue;
    const sustainableWeight = weightForReps(fatigued1RM, (minReps + maxReps) / 2);
    const fatigueAdjusted = roundToPlate(sustainableWeight, isCompound);
    if (fatigueAdjusted < lastWeight) {
      const drop = lastWeight - fatigueAdjusted;
      return {
        weight: fatigueAdjusted,
        reason: `${lastReps} reps + fatigue (série ${setsCompleted + 1}). 1RM fatigué: ${Math.round(fatigued1RM)}kg → ${fatigueAdjusted}kg (-${drop}kg) pour rester dans la cible`,
      };
    }
  }

  return {
    weight: lastWeight,
    reason: `${lastReps} reps dans la cible. Continue à ${lastWeight}kg, focus technique`,
  };
}
