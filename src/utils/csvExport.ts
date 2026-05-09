import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
// SDK 54 moved the URI/encoding APIs under expo-file-system/legacy.
// We use the legacy module because the new FS API is async-only and stream-oriented.
import * as FileSystem from 'expo-file-system/legacy';
import { Session } from '../types';
import { getExerciseById } from '../data/exercises';
import { estimate1RM } from './coachEngine';

// CSV-escape a field that may contain commas, quotes or newlines
function csvField(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportSessionsToCSV(sessions: Session[]): string {
  const header = 'Date,Programme,Exercice,Serie,Charge(kg),Reps,1RM_estime,Volume';
  const rows: string[] = [header];

  for (const session of sessions) {
    for (const ex of session.exercises) {
      const info = getExerciseById(ex.exerciseId);
      const exerciseName = info?.nameFr || ex.exerciseId;

      ex.sets.forEach((set, setIndex) => {
        if (!set.done) return;
        const estimated1RM = estimate1RM(set.kg, set.reps);
        const volume = set.kg * set.reps;
        rows.push(
          [
            csvField(session.date),
            csvField(session.programName),
            csvField(exerciseName),
            csvField(setIndex + 1),
            csvField(set.kg),
            csvField(set.reps),
            csvField(estimated1RM),
            csvField(volume),
          ].join(',')
        );
      });
    }
  }

  return rows.join('\n');
}

export async function shareCSV(sessions: Session[]): Promise<void> {
  const csv = exportSessionsToCSV(sessions);
  const filename = `iron-week-export-${new Date().toISOString().split('T')[0]}.csv`;

  // ── Web: trigger a browser download via blob URL ──
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Revoke after a tick so the download is initiated
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      // Fail silently — user can retry
    }
    return;
  }

  // ── Native: write to cache then open the share sheet ──
  try {
    const dir = FileSystem.cacheDirectory;
    if (!dir) return;
    const fileUri = dir + filename;
    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Exporter mes données Iron Week',
        UTI: 'public.comma-separated-values-text',
      });
    }
  } catch {
    // Fail silently
  }
}
