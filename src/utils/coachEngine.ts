import { CoachRecommendation, Exercise, RecommendationType, Session, UserGoal, WorkoutExercise } from '../types';
import { getExerciseById } from '../data/exercises';
import { calculateSmartIncrement, calculateDeloadWeight, roundToPlate } from './smartIncrement';

interface ExerciseHistory {
  exerciseId: string;
  sessions: {
    date: string;
    sets: { kg: number; reps: number }[];
  }[];
}

function getExerciseHistory(exerciseId: string, sessions: Session[]): ExerciseHistory {
  const relevant = sessions
    .filter((s) => s.exercises.some((e) => e.exerciseId === exerciseId))
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 4);

  return {
    exerciseId,
    sessions: relevant.map((s) => {
      const ex = s.exercises.find((e) => e.exerciseId === exerciseId)!;
      return {
        date: s.date,
        sets: ex.sets.filter((set) => set.done).map((set) => ({ kg: set.kg, reps: set.reps })),
      };
    }),
  };
}

function getRepRangeForGoal(goal: UserGoal): [number, number] {
  switch (goal) {
    case 'force':
      return [3, 6];
    case 'masse':
      return [8, 12];
    case 'seche':
      return [12, 15];
    case 'endurance':
      return [15, 20];
  }
}

function get1RMPercentForGoal(goal: UserGoal): number {
  switch (goal) {
    case 'force':
      return 0.85;
    case 'masse':
      return 0.75;
    case 'seche':
      return 0.65;
    case 'endurance':
      return 0.60;
  }
}

function getIncrement(exercise: Exercise): number {
  return exercise.type === 'compound' ? 2.5 : 1.25;
}

function roundToNearest(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

export function generateRecommendation(
  exerciseId: string,
  allSessions: Session[],
  targetRepsRange: [number, number],
  goal: UserGoal,
  userKnownWeight?: number,
): CoachRecommendation {
  const exercise = getExerciseById(exerciseId);
  if (!exercise) {
    return {
      exerciseId,
      recommendation: 'first_time',
      suggestedWeight: 20,
      currentWeight: 0,
      reason: 'Exercice inconnu',
      confidence: 0,
      tip: '',
      emoji: '❓',
    };
  }

  const history = getExerciseHistory(exerciseId, allSessions);
  const [minReps, maxReps] = targetRepsRange;

  // Rule 5 — First time
  if (history.sessions.length === 0) {
    return ruleFirstTime(exercise, goal, userKnownWeight);
  }

  const currentSession = history.sessions[0];
  if (currentSession.sets.length === 0) {
    return ruleFirstTime(exercise, goal, userKnownWeight);
  }
  const currentWeight = currentSession.sets[0].kg;
  const currentReps = currentSession.sets.map((s) => s.reps);

  // Rule 1 — Double Progressive Overload
  if (history.sessions.length >= 2) {
    const last2 = history.sessions.slice(0, 2);
    const allAtMax = last2.every((session) =>
      session.sets.every((s) => s.reps >= maxReps)
    );

    if (allAtMax) {
      // Smart increment based on 1RM calculation
      const avgReps = currentReps.reduce((s, r) => s + r, 0) / currentReps.length;
      const isCompound = exercise.type === 'compound';
      const { newWeight, percentIncrease, explanation } = calculateSmartIncrement(
        currentWeight, avgReps, targetRepsRange, isCompound
      );
      return {
        exerciseId,
        recommendation: 'increase',
        suggestedWeight: newWeight,
        currentWeight,
        reason: `Tu as atteint ${maxReps} reps sur toutes tes séries 2 séances de suite. ${explanation}`,
        confidence: 90,
        tip: `Passe à ${newWeight}kg (+${Math.round(percentIncrease)}%). Si tu n'atteins pas ${minReps} reps, reviens à ${currentWeight}kg.`,
        emoji: '🔥',
      };
    }
  }

  // Rule 3 — Deload (check before consolidation)
  if (history.sessions.length >= 2) {
    const bestSession = history.sessions.reduce((best, session) => {
      const avgReps = session.sets.reduce((sum, s) => sum + s.reps, 0) / (session.sets.length || 1);
      const bestAvg = best.sets.reduce((sum, s) => sum + s.reps, 0) / (best.sets.length || 1);
      return avgReps > bestAvg ? session : best;
    });
    const bestAvg = bestSession.sets.reduce((sum, s) => sum + s.reps, 0) / (bestSession.sets.length || 1);
    const currentAvg = currentReps.reduce((sum, r) => sum + r, 0) / (currentReps.length || 1);
    const dropPercent = ((bestAvg - currentAvg) / bestAvg) * 100;

    if (dropPercent > 20) {
      const isCompound = exercise.type === 'compound';
      const deloadWeight = calculateDeloadWeight(currentWeight, targetRepsRange, isCompound, currentAvg);
      return {
        exerciseId,
        recommendation: 'deload',
        suggestedWeight: deloadWeight,
        currentWeight,
        reason: `Tes reps ont chuté de ${Math.round(dropPercent)}% par rapport à ta meilleure séance. Ton corps a besoin de récupération.`,
        confidence: 85,
        tip: `Baisse à ${deloadWeight}kg (-${Math.round(((currentWeight - deloadWeight) / currentWeight) * 100)}%). Focus technique et récupération.`,
        emoji: '⚠️',
      };
    }
  }

  // Rule 4 — Stagnation
  if (history.sessions.length >= 3) {
    const last3Avgs = history.sessions.slice(0, 3).map((s) => {
      const avg = s.sets.reduce((sum, set) => sum + set.reps, 0) / (s.sets.length || 1);
      return avg;
    });
    const maxDiff = Math.max(...last3Avgs) - Math.min(...last3Avgs);
    if (maxDiff <= 1) {
      // Count stagnation periods to cycle through suggestions
      const stagnationCount = history.sessions.length;
      const tip = getStagnationTip(exercise, currentWeight, stagnationCount);
      return {
        exerciseId,
        recommendation: 'variation',
        suggestedWeight: currentWeight,
        currentWeight,
        reason: `Stagnation détectée sur 3 séances. Essaie une variation technique avant de changer la charge.`,
        confidence: 75,
        tip,
        emoji: '💡',
      };
    }
  }

  // Rule 2 — Consolidation (default)
  const setsAtMax = currentReps.filter((r) => r >= maxReps).length;
  const totalSets = currentReps.length;

  return {
    exerciseId,
    recommendation: 'maintain',
    suggestedWeight: currentWeight,
    currentWeight,
    reason: `Tu es à ${setsAtMax}/${totalSets} séries dans la fourchette haute. Vise l'homogénéité avant d'augmenter.`,
    confidence: 80,
    tip: `Maintiens ${currentWeight}kg. Objectif : toutes les séries à ${maxReps} reps.`,
    emoji: '✅',
  };
}

function ruleFirstTime(exercise: Exercise, goal: UserGoal, userKnownWeight?: number): CoachRecommendation {
  // If the user has configured their current working weight, use it directly
  if (userKnownWeight && userKnownWeight > 0) {
    return {
      exerciseId: exercise.id,
      recommendation: 'first_time',
      suggestedWeight: userKnownWeight,
      currentWeight: 0,
      reason: `Première séance trackée. Charge basée sur ton profil.`,
      confidence: 85,
      tip: `${userKnownWeight}kg — ta charge habituelle. Le coach s'adaptera après cette séance.`,
      emoji: '🎯',
    };
  }

  const percent = get1RMPercentForGoal(goal);
  const estimatedStartWeights: Record<string, number> = {
    pectoraux: 40,
    dos: 40,
    epaules: 25,
    biceps: 15,
    triceps: 15,
    quadriceps: 60,
    ischio_fessiers: 50,
    mollets: 30,
    abdos: 0,
    lombaires: 0,
    cardio: 0,
  };
  const base = estimatedStartWeights[exercise.muscleGroup] || 20;
  const suggested = roundToNearest(base * percent, getIncrement(exercise));

  return {
    exerciseId: exercise.id,
    recommendation: 'first_time',
    suggestedWeight: suggested,
    currentWeight: 0,
    reason: `Première séance ! Commence léger pour apprendre le mouvement.`,
    confidence: 50,
    tip: `Charge suggérée : ${suggested}kg. Va dans Réglages → Mes charges pour configurer tes charges actuelles.`,
    emoji: '🆕',
  };
}

export function generateAllRecommendations(
  programExerciseIds: string[],
  allSessions: Session[],
  targetRepsRanges: Map<string, [number, number]>,
  goal: UserGoal
): CoachRecommendation[] {
  return programExerciseIds.map((id) => {
    const range = targetRepsRanges.get(id) || getRepRangeForGoal(goal);
    return generateRecommendation(id, allSessions, range, goal);
  });
}

// Fatigue detection
export function detectFatigue(sessions: Session[]): 'fatigued' | 'progressing' | 'stagnant' | 'normal' {
  if (sessions.length < 4) return 'normal';

  const recentWeeks = sessions
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 8);

  const firstHalf = recentWeeks.slice(4);
  const secondHalf = recentWeeks.slice(0, 4);

  const avgVolFirst = firstHalf.reduce((s, sess) => s + sess.totalVolume, 0) / (firstHalf.length || 1);
  const avgVolSecond = secondHalf.reduce((s, sess) => s + sess.totalVolume, 0) / (secondHalf.length || 1);

  if (avgVolFirst === 0) return 'normal';
  const change = ((avgVolSecond - avgVolFirst) / avgVolFirst) * 100;

  if (change < -15) return 'fatigued';
  if (change > 10) return 'progressing';
  if (Math.abs(change) < 3) return 'stagnant';
  return 'normal';
}

// Periodization
export function getCurrentPhase(weekNumber: number): {
  phase: string;
  volumeModifier: number;
  intensityModifier: number;
  description: string;
} {
  const cycleWeek = weekNumber % 9;

  if (cycleWeek < 4) {
    return {
      phase: 'Accumulation',
      volumeModifier: 1.1,
      intensityModifier: 0.85,
      description: 'Volume élevé, charges modérées. Focus sur le volume d\'entraînement.',
    };
  }
  if (cycleWeek < 7) {
    return {
      phase: 'Intensification',
      volumeModifier: 0.85,
      intensityModifier: 1.05,
      description: 'Volume réduit, charges lourdes. Focus sur la force.',
    };
  }
  if (cycleWeek < 8) {
    return {
      phase: 'Réalisation',
      volumeModifier: 0.7,
      intensityModifier: 1.1,
      description: 'Volume minimal, charges maximales. Teste tes PRs !',
    };
  }
  return {
    phase: 'Déload',
    volumeModifier: 0.6,
    intensityModifier: 0.75,
    description: 'Semaine légère. -40% volume pour la récupération.',
  };
}

// 1RM estimation (Epley formula)
export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps === 0 || weight === 0) return 0;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

// Stagnation technique suggestions based on exercise type
function getStagnationTip(exercise: Exercise, currentWeight: number, stagnationCount: number): string {
  const compoundTips = [
    `Même charge (${currentWeight}kg). Ajoute une pause de 2s en bas du mouvement pour casser le plateau.`,
    `Même charge (${currentWeight}kg). Essaie un tempo excentrique 4-0-1 (4s descente, 0 pause, 1s montée).`,
    `Même charge (${currentWeight}kg). Drop set : fais ton set normal puis baisse de 20% et continue jusqu'à l'échec.`,
  ];

  const isolationTips = [
    `Même charge (${currentWeight}kg). Rest-pause : fais ton set, repos 15s, reprends jusqu'à l'échec.`,
    `Même charge (${currentWeight}kg). Myo-reps : 1 set activation (12-15 reps), puis 4-5 mini-sets de 3-5 reps avec 10s repos.`,
    `Même charge (${currentWeight}kg). Négatif lent : 5s sur la phase excentrique.`,
  ];

  const tips = exercise.type === 'compound' ? compoundTips : isolationTips;
  return tips[stagnationCount % tips.length];
}

// Muscle imbalance detection
export function detectMuscleImbalance(sessions: Session[]): { muscle: string; ratio: number; warning: string }[] {
  const volumeByGroup: Record<string, number> = {};

  for (const session of sessions) {
    for (const ex of session.exercises) {
      const info = getExerciseById(ex.exerciseId);
      if (!info) continue;
      const vol = ex.sets
        .filter((set) => set.done)
        .reduce((sum, set) => sum + set.kg * set.reps, 0);
      volumeByGroup[info.muscleGroup] = (volumeByGroup[info.muscleGroup] || 0) + vol;
    }
  }

  const warnings: { muscle: string; ratio: number; warning: string }[] = [];

  // Push vs Pull: (pectoraux + epaules + triceps) vs (dos + biceps)
  const pushVol = (volumeByGroup['pectoraux'] || 0) + (volumeByGroup['epaules'] || 0) + (volumeByGroup['triceps'] || 0);
  const pullVol = (volumeByGroup['dos'] || 0) + (volumeByGroup['biceps'] || 0);

  if (pullVol > 0) {
    const pushPullRatio = pushVol / pullVol;
    if (pushPullRatio > 1.5) {
      warnings.push({
        muscle: 'Push/Pull',
        ratio: Math.round(pushPullRatio * 100) / 100,
        warning: `Déséquilibre Push/Pull (${pushPullRatio.toFixed(2)}:1). Ajoute plus de tirage (dos, biceps).`,
      });
    } else if (pushPullRatio < 0.67) {
      warnings.push({
        muscle: 'Push/Pull',
        ratio: Math.round(pushPullRatio * 100) / 100,
        warning: `Déséquilibre Push/Pull (${pushPullRatio.toFixed(2)}:1). Ajoute plus de poussée (pectoraux, épaules).`,
      });
    } else {
      warnings.push({
        muscle: 'Push/Pull',
        ratio: Math.round(pushPullRatio * 100) / 100,
        warning: 'Équilibre Push/Pull correct.',
      });
    }
  }

  // Quad vs Hamstring
  const quadVol = volumeByGroup['quadriceps'] || 0;
  const hamVol = volumeByGroup['ischio_fessiers'] || 0;

  if (hamVol > 0) {
    const quadHamRatio = quadVol / hamVol;
    if (quadHamRatio > 1.5) {
      warnings.push({
        muscle: 'Quad/Ischio',
        ratio: Math.round(quadHamRatio * 100) / 100,
        warning: `Déséquilibre Quad/Ischio (${quadHamRatio.toFixed(2)}:1). Ajoute plus d'ischios (soulevé de terre roumain, leg curl).`,
      });
    } else if (quadHamRatio < 0.67) {
      warnings.push({
        muscle: 'Quad/Ischio',
        ratio: Math.round(quadHamRatio * 100) / 100,
        warning: `Déséquilibre Quad/Ischio (${quadHamRatio.toFixed(2)}:1). Ajoute plus de quadriceps (squat, leg press).`,
      });
    } else {
      warnings.push({
        muscle: 'Quad/Ischio',
        ratio: Math.round(quadHamRatio * 100) / 100,
        warning: 'Équilibre Quad/Ischio correct.',
      });
    }
  }

  return warnings;
}
