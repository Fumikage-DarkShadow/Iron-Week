import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { colors, fonts, borderRadius, spacing, fontSize } from '../../theme';
import { useWorkoutStore } from '../../stores/workoutStore';
import { DayOfWeek, MuscleGroup } from '../../types';
import { getExerciseById } from '../../data/exercises';

const DAYS: { id: DayOfWeek; label: string; short: string }[] = [
  { id: 'lundi', label: 'Lundi', short: 'LUN' },
  { id: 'mardi', label: 'Mardi', short: 'MAR' },
  { id: 'mercredi', label: 'Mercredi', short: 'MER' },
  { id: 'jeudi', label: 'Jeudi', short: 'JEU' },
  { id: 'vendredi', label: 'Vendredi', short: 'VEN' },
  { id: 'samedi', label: 'Samedi', short: 'SAM' },
  { id: 'dimanche', label: 'Dimanche', short: 'DIM' },
];

function getMuscleGroupsForProgram(programId: string, programs: any[]): Set<MuscleGroup> {
  const program = programs.find((p) => p.id === programId);
  if (!program) return new Set();
  const groups = new Set<MuscleGroup>();
  program.exercises.forEach((e: any) => {
    const info = getExerciseById(e.exerciseId);
    if (info) {
      groups.add(info.muscleGroup);
    }
  });
  return groups;
}

export default function WeeklyPlanScreen() {
  const { programs, weeklyPlan, setWeeklyPlan } = useWorkoutStore();
  const [pickerDay, setPickerDay] = useState<DayOfWeek | null>(null);

  // Conflict detection
  const getConflicts = () => {
    const conflicts: Map<DayOfWeek, string> = new Map();
    for (let i = 1; i < DAYS.length; i++) {
      const prevDay = DAYS[i - 1].id;
      const curDay = DAYS[i].id;
      const prevProg = weeklyPlan[prevDay];
      const curProg = weeklyPlan[curDay];
      if (!prevProg || !curProg) continue;

      const prevMuscles = getMuscleGroupsForProgram(prevProg, programs);
      const curMuscles = getMuscleGroupsForProgram(curProg, programs);
      const overlap = [...prevMuscles].filter((m) => curMuscles.has(m));
      if (overlap.length > 0) {
        conflicts.set(curDay, `Même groupe musculaire que ${DAYS[i - 1].label}`);
      }
    }
    return conflicts;
  };

  const conflicts = getConflicts();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Planning Hebdomadaire</Text>

      {DAYS.map((day) => {
        const programId = weeklyPlan[day.id];
        const program = programs.find((p) => p.id === programId);
        const conflict = conflicts.get(day.id);

        return (
          <TouchableOpacity
            key={day.id}
            style={[styles.dayCard, conflict && styles.dayCardConflict]}
            onPress={() => setPickerDay(day.id)}
          >
            <View style={styles.dayHeader}>
              <Text style={styles.dayLabel}>{day.short}</Text>
              <Text style={styles.dayName}>{day.label}</Text>
            </View>
            {program ? (
              <View style={styles.dayProgram}>
                <View style={[styles.programDot, { backgroundColor: program.color }]} />
                <Text style={styles.programName}>{program.name}</Text>
                <Text style={styles.exerciseCount}>{program.exercises.length} ex.</Text>
              </View>
            ) : (
              <Text style={styles.restText}>Repos</Text>
            )}
            {conflict && (
              <View style={styles.conflictBanner}>
                <Text style={styles.conflictText}>⚠️ {conflict}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {/* Program picker modal */}
      <Modal visible={pickerDay !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {pickerDay ? DAYS.find((d) => d.id === pickerDay)?.label : ''}
            </Text>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                if (pickerDay) setWeeklyPlan(pickerDay, null);
                setPickerDay(null);
              }}
            >
              <Text style={styles.modalOptionText}>😴 Jour de repos</Text>
            </TouchableOpacity>
            {programs.map((prog) => (
              <TouchableOpacity
                key={prog.id}
                style={styles.modalOption}
                onPress={() => {
                  if (pickerDay) setWeeklyPlan(pickerDay, prog.id);
                  setPickerDay(null);
                }}
              >
                <View style={[styles.programDot, { backgroundColor: prog.color }]} />
                <Text style={styles.modalOptionText}>{prog.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setPickerDay(null)}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxl,
    color: colors.text,
    marginBottom: spacing.lg,
    letterSpacing: 1,
  },
  dayCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayCardConflict: {
    borderColor: colors.gold + '60',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dayLabel: {
    fontFamily: fonts.heading,
    fontSize: fontSize.lg,
    color: colors.accent,
    width: 40,
    letterSpacing: 1,
  },
  dayName: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text,
  },
  dayProgram: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  programDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  programName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
  exerciseCount: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  restText: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.muted,
    fontStyle: 'italic',
  },
  conflictBanner: {
    backgroundColor: colors.gold + '15',
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    marginTop: spacing.sm,
  },
  conflictText: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.gold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xxl,
  },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxl,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
    letterSpacing: 1,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalOptionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  modalCancel: {
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  modalCancelText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.md,
    color: colors.muted,
  },
});
