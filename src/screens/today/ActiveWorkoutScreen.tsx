import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors, fonts, borderRadius, spacing, fontSize } from '../../theme';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getExerciseById } from '../../data/exercises';
import { estimate1RM, generateRecommendation } from '../../utils/coachEngine';
import { getSetAdvice } from '../../utils/setAdvisor';
import SetRow from '../../components/SetRow';
import RestTimer from '../../components/RestTimer';
import CoachCard from '../../components/CoachCard';
import { WorkoutSet } from '../../types';
import type { ExerciseType } from '../../types';
import { generateWarmupSets } from '../../utils/warmupGenerator';
import { showAlert } from '../../utils/alert';

export default function ActiveWorkoutScreen({ navigation }: any) {
  const { activeSession, updateSet, updateExercise, completeExercise, addSet, removeSet, addNote, endSession, sessions } = useSessionStore();
  const { settings } = useSettingsStore();
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [showTimer, setShowTimer] = useState(false);

  if (!activeSession) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucune séance active</Text>
      </View>
    );
  }

  const totalExercises = activeSession.exercises.length;
  const currentExercise = activeSession.exercises[currentExIndex];
  const exerciseInfo = currentExercise ? getExerciseById(currentExercise.exerciseId) : undefined;

  if (!currentExercise) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucun exercice dans ce programme</Text>
      </View>
    );
  }

  // Superset helpers
  const supersetGroup = currentExercise.supersetGroup;
  const supersetExercises = supersetGroup != null
    ? activeSession.exercises
        .map((ex, idx) => ({ ex, idx }))
        .filter((item) => item.ex.supersetGroup === supersetGroup)
    : [];
  const supersetPosition = supersetExercises.findIndex((item) => item.idx === currentExIndex);
  const isInSuperset = supersetExercises.length > 1;
  const isLastInSuperset = isInSuperset && supersetPosition === supersetExercises.length - 1;

  // Previous session sets for comparison
  const previousSets = useMemo(() => {
    const prevSessions = sessions
      .filter((s) => s.exercises.some((e) => e.exerciseId === currentExercise?.exerciseId))
      .sort((a, b) => b.startedAt - a.startedAt);
    if (prevSessions.length === 0) return [];
    const prevEx = prevSessions[0].exercises.find((e) => e.exerciseId === currentExercise?.exerciseId);
    return prevEx?.sets.filter((s) => s.done) || [];
  }, [currentExercise?.exerciseId, sessions]);

  // Coach recommendation (global, for the exercise)
  const recommendation = useMemo(() => {
    if (!currentExercise) return null;
    return generateRecommendation(
      currentExercise.exerciseId,
      sessions,
      currentExercise.targetRepsRange,
      settings.goal
    );
  }, [currentExercise, sessions, settings.goal]);

  // Expert per-set advice
  const getAdviceForSet = useCallback((setIndex: number): string | undefined => {
    const doneSets = currentExercise.sets.filter((s) => s.done);
    const currentSet = currentExercise.sets[setIndex];

    // Only show advice for the NEXT undone set (first undone set)
    const firstUndoneIndex = currentExercise.sets.findIndex((s) => !s.done);
    if (setIndex !== firstUndoneIndex) return undefined;

    const exType = exerciseInfo?.type || 'compound';
    const advice = getSetAdvice(
      doneSets,
      currentExercise.targetRepsRange,
      exType,
      currentExercise.sets.length,
    );

    return `${advice.emoji} ${advice.detail}`;
  }, [currentExercise.sets, currentExercise.targetRepsRange, exerciseInfo?.type]);

  // Timer advice — detailed recommendation for next set
  const getTimerAdvice = useCallback((): string | null => {
    const doneSets = currentExercise.sets.filter((s) => s.done);
    if (doneSets.length === 0) return null;

    const exType = exerciseInfo?.type || 'compound';
    const advice = getSetAdvice(
      doneSets,
      currentExercise.targetRepsRange,
      exType,
      currentExercise.sets.length,
    );

    return `${advice.emoji} ${advice.message}\n${advice.detail}`;
  }, [currentExercise.sets, currentExercise.targetRepsRange, exerciseInfo?.type]);

  // Check for PRs
  const checkPR = useCallback((setData: WorkoutSet): boolean => {
    if (!setData.done || setData.kg === 0) return false;
    const allPrevSets: { kg: number; reps: number }[] = [];
    sessions.forEach((s) => {
      s.exercises.forEach((e) => {
        if (e.exerciseId === currentExercise?.exerciseId) {
          e.sets.filter((set) => set.done).forEach((set) => allPrevSets.push({ kg: set.kg, reps: set.reps }));
        }
      });
    });
    const current1RM = estimate1RM(setData.kg, setData.reps);
    const best1RM = Math.max(0, ...allPrevSets.map((s) => estimate1RM(s.kg, s.reps)));
    return current1RM > best1RM;
  }, [currentExercise?.exerciseId, sessions]);

  const handleSetDone = (setIndex: number) => {
    const set = currentExercise.sets[setIndex];
    if (!set.done && set.kg > 0 && set.reps > 0) {
      updateSet(currentExIndex, setIndex, { done: true });

      // Auto-fill suggested kg for next undone set
      const doneSets = [...currentExercise.sets.filter((s) => s.done), { ...set, done: true }];
      const exType = exerciseInfo?.type || 'compound';
      const advice = getSetAdvice(
        doneSets as WorkoutSet[],
        currentExercise.targetRepsRange,
        exType,
        currentExercise.sets.length,
      );
      if (advice.suggestedKg > 0) {
        const nextUndoneIdx = currentExercise.sets.findIndex((s, i) => i > setIndex && !s.done);
        if (nextUndoneIdx !== -1) {
          updateSet(currentExIndex, nextUndoneIdx, { kg: advice.suggestedKg });
        }
      }

      // Superset logic: check if all sets are done after this one
      const allDoneAfter = currentExercise.sets.every((s, i) =>
        i === setIndex ? true : s.done
      );

      if (allDoneAfter && isInSuperset && !isLastInSuperset) {
        // Auto-advance to next exercise in superset WITHOUT rest timer
        completeExercise(currentExIndex);
        const nextInSuperset = supersetExercises[supersetPosition + 1];
        if (nextInSuperset) {
          setCurrentExIndex(nextInSuperset.idx);
        }
      } else {
        // Normal: show rest timer (including last-in-superset case)
        setShowTimer(true);
      }
    } else if (set.done) {
      updateSet(currentExIndex, setIndex, { done: false });
    }
  };

  const handleAddSet = () => {
    const lastSet = currentExercise.sets[currentExercise.sets.length - 1];
    addSet(currentExIndex, {
      id: `set_${Date.now()}`,
      kg: lastSet?.kg || 0,
      reps: 0,
      done: false,
    });
  };

  const handleRemoveSet = (setIndex: number) => {
    if (currentExercise.sets.length <= 1) {
      Alert.alert('Impossible', 'Il faut au moins 1 série.');
      return;
    }
    removeSet(currentExIndex, setIndex);
  };

  const loadPreviousWeights = () => {
    // Copy exact weights from last session (overrides coach suggestion)
    previousSets.forEach((prev, i) => {
      if (i < currentExercise.sets.length && !currentExercise.sets[i].done) {
        updateSet(currentExIndex, i, { kg: prev.kg });
      }
    });
  };

  const nextExercise = () => {
    completeExercise(currentExIndex);
    if (currentExIndex < totalExercises - 1) {
      setCurrentExIndex(currentExIndex + 1);
    }
  };

  const prevExercise = () => {
    if (currentExIndex > 0) {
      setCurrentExIndex(currentExIndex - 1);
    }
  };

  const finishWorkout = () => {
    showAlert(
      'Terminer la séance ?',
      'Tes résultats seront sauvegardés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          onPress: () => {
            completeExercise(currentExIndex);
            endSession();
            navigation.replace('WorkoutSummary');
          },
        },
      ]
    );
  };

  const allSetsDone = currentExercise.sets.every((s) => s.done);
  const completedSets = currentExercise.sets.filter((s) => s.done).length;
  const elapsed = Math.floor((Date.now() - activeSession.startedAt) / 60000);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Progress header */}
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            Exercice {currentExIndex + 1}/{totalExercises}
          </Text>
          <Text style={styles.timerText}>⏱️ {elapsed} min</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${((currentExIndex + (allSetsDone ? 1 : 0)) / totalExercises) * 100}%` }]}
          />
        </View>

        {/* Superset badge */}
        {isInSuperset && (
          <View style={supersetStyles.supersetBadge}>
            <Text style={supersetStyles.supersetBadgeText}>
              Superset {supersetPosition + 1}/{supersetExercises.length}
            </Text>
          </View>
        )}

        {/* Exercise info */}
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseName}>{exerciseInfo?.nameFr}</Text>
          <Text style={styles.exerciseTarget}>
            {currentExercise.targetSets} × {currentExercise.targetRepsRange[0]}-{currentExercise.targetRepsRange[1]} reps
            {'  |  '}Repos: {currentExercise.restSeconds}s
          </Text>
        </View>

        {/* Coach suggestion */}
        {recommendation && <CoachCard recommendation={recommendation} compact />}

        {/* Compact action bar — grouped */}
        <View style={styles.actionBar}>
          {previousSets.length > 0 && (
            <TouchableOpacity style={styles.actionChip} onPress={loadPreviousWeights}>
              <Text style={styles.actionChipIcon}>📋</Text>
              <Text style={styles.actionChipText}>Charges précédentes</Text>
            </TouchableOpacity>
          )}
          {!currentExercise.sets.some((s) => s.isWarmup) && (
            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => {
                const firstSetKg = currentExercise.sets[0]?.kg || 0;
                if (firstSetKg <= 0) {
                  Alert.alert('Charge manquante', 'Renseigne d\'abord le poids de ta première série.');
                  return;
                }
                const exType: ExerciseType = exerciseInfo?.type || 'compound';
                const warmups = generateWarmupSets(firstSetKg, currentExercise.targetRepsRange[0], exType === 'compound');
                const warmupSets: WorkoutSet[] = warmups.map((w, i) => ({
                  id: `warmup_${Date.now()}_${i}`,
                  kg: w.kg,
                  reps: w.reps,
                  done: false,
                  isWarmup: true,
                }));
                updateExercise(currentExIndex, { sets: [...warmupSets, ...currentExercise.sets] });
              }}
            >
              <Text style={styles.actionChipIcon}>🔥</Text>
              <Text style={styles.actionChipText}>Échauffement</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionChip} onPress={handleAddSet}>
            <Text style={styles.actionChipIcon}>➕</Text>
            <Text style={styles.actionChipText}>Série</Text>
          </TouchableOpacity>
        </View>

        {/* Sets */}
        <View style={styles.setsContainer}>
          <View style={styles.setsHeader}>
            <Text style={styles.setsTitle}>Séries {completedSets}/{currentExercise.sets.length}</Text>
          </View>

          {currentExercise.sets.map((set, i) => (
            <SetRow
              key={set.id}
              set={set}
              index={i}
              previousSet={previousSets[i] ? { kg: previousSets[i].kg, reps: previousSets[i].reps } : undefined}
              onUpdate={(updates) => updateSet(currentExIndex, i, updates)}
              onToggleDone={() => handleSetDone(i)}
              onDelete={() => handleRemoveSet(i)}
              isNewPR={set.done ? checkPR(set) : false}
              canDelete={currentExercise.sets.length > 1}
              advice={getAdviceForSet(i)}
            />
          ))}
        </View>

        {/* Notes */}
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={currentExercise.notes}
            onChangeText={(t) => addNote(currentExIndex, t)}
            placeholder="Notes libres..."
            placeholderTextColor={colors.muted}
            multiline
          />
        </View>

        {/* Navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, currentExIndex === 0 && styles.navBtnDisabled]}
            onPress={prevExercise}
            disabled={currentExIndex === 0}
          >
            <Text style={styles.navBtnText}>← Précédent</Text>
          </TouchableOpacity>

          {currentExIndex < totalExercises - 1 ? (
            <TouchableOpacity style={[styles.navBtn, styles.navBtnPrimary]} onPress={nextExercise}>
              <Text style={[styles.navBtnText, { color: colors.white }]}>Suivant →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.navBtn, styles.navBtnFinish]} onPress={finishWorkout}>
              <Text style={[styles.navBtnText, { color: colors.white }]}>Terminer ✓</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Rest Timer with expert advice */}
      <RestTimer
        duration={currentExercise.restSeconds}
        onComplete={() => setShowTimer(false)}
        onSkip={() => setShowTimer(false)}
        visible={showTimer}
        nextSetAdvice={getTimerAdvice()}
      />
    </View>
  );
}

const supersetStyles = StyleSheet.create({
  supersetBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.purple + '20',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.purple + '50',
  },
  supersetBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.sm,
    color: colors.purple,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 200 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  emptyText: { fontFamily: fonts.body, fontSize: fontSize.lg, color: colors.muted },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressText: { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.muted },
  timerText: { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.accent2 },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  exerciseHeader: { marginBottom: spacing.md },
  exerciseName: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxxl,
    color: colors.text,
    letterSpacing: 1,
  },
  exerciseTarget: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 4,
  },
  actionBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionChipIcon: { fontSize: 12 },
  actionChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.text,
  },
  setsContainer: { marginBottom: spacing.lg },
  setsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  setsTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  notesContainer: { marginBottom: spacing.lg },
  notesLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  notesInput: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  navRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  navBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnPrimary: { backgroundColor: colors.accent, borderColor: colors.accent },
  navBtnFinish: { backgroundColor: colors.green, borderColor: colors.green },
  navBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
});
