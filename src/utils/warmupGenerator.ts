export interface WarmupSet {
  kg: number;
  reps: number;
  label: string;
}

/**
 * Rounds a weight to the nearest 2.5 kg.
 */
function roundToPlate(kg: number): number {
  return Math.round(kg / 2.5) * 2.5;
}

/**
 * Generates 2-3 warmup sets based on the working weight, reps, and exercise type.
 *
 * - Set 1: empty bar (20 kg) or 50% x 10 reps (whichever is greater)
 * - Set 2: 70% x 5 reps
 * - Set 3 (compound + weight > 60 kg): 85% x 3 reps
 */
export function generateWarmupSets(
  workingWeight: number,
  workingReps: number,
  isCompound: boolean
): WarmupSet[] {
  const sets: WarmupSet[] = [];

  // Set 1: empty bar (20 kg) or 50%, whichever is higher
  const fiftyPercent = roundToPlate(workingWeight * 0.5);
  const set1Weight = Math.max(20, fiftyPercent);
  sets.push({
    kg: set1Weight,
    reps: 10,
    label: set1Weight === 20 ? 'Barre vide' : '50%',
  });

  // Set 2: 70% x 5 reps
  const seventyPercent = roundToPlate(workingWeight * 0.7);
  sets.push({
    kg: seventyPercent,
    reps: 5,
    label: '70%',
  });

  // Set 3: 85% x 3 reps (only for compound exercises with working weight > 60 kg)
  if (isCompound && workingWeight > 60) {
    const eightyFivePercent = roundToPlate(workingWeight * 0.85);
    sets.push({
      kg: eightyFivePercent,
      reps: 3,
      label: '85%',
    });
  }

  return sets;
}
