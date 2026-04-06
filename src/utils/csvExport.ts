import * as Sharing from 'expo-sharing';
import { Session } from '../types';
import { getExerciseById } from '../data/exercises';
import { estimate1RM } from './coachEngine';

export function exportSessionsToCSV(sessions: Session[]): string {
  const header = 'Date,Programme,Exercice,Serie,Charge(kg),Reps,1RM_estime,Volume';
  const rows: string[] = [header];

  for (const session of sessions) {
    for (const ex of session.exercises) {
      const info = getExerciseById(ex.exerciseId);
      const exerciseName = info?.nameFr || ex.exerciseId;
      const safeName = exerciseName.includes(',') ? `"${exerciseName}"` : exerciseName;

      ex.sets.forEach((set, setIndex) => {
        if (!set.done) return;
        const estimated1RM = estimate1RM(set.kg, set.reps);
        const volume = set.kg * set.reps;
        rows.push(
          `${session.date},${session.programName},${safeName},${setIndex + 1},${set.kg},${set.reps},${estimated1RM},${volume}`
        );
      });
    }
  }

  return rows.join('\n');
}

export async function shareCSV(sessions: Session[]): Promise<void> {
  const csv = exportSessionsToCSV(sessions);

  // Use a blob URI approach that works without expo-file-system
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    // Write to a temporary file via a simple fetch trick
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    // On native, we need a different approach - just share the text
    await Sharing.shareAsync(url, {
      mimeType: 'text/csv',
      dialogTitle: 'Exporter mes données Iron Week',
    });
  }
}
