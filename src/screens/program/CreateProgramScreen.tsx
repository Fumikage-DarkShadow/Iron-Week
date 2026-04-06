import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors, fonts, borderRadius, spacing, fontSize } from '../../theme';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getExerciseById } from '../../data/exercises';
import { getDefaultRestSeconds } from '../../utils/restTimeCalibrator';
import { Program, ProgramExercise } from '../../types';

export default function CreateProgramScreen({ navigation, route }: any) {
  const { programs, addProgram, updateProgram } = useWorkoutStore();
  const { settings } = useSettingsStore();
  const programId = route?.params?.programId;
  const existing = programs.find((p) => p.id === programId);

  const [name, setName] = useState(existing?.name || '');
  const [exercises, setExercises] = useState<ProgramExercise[]>(existing?.exercises || []);

  useEffect(() => {
    if (route?.params?.selectedExercises) {
      const newExercises: ProgramExercise[] = route.params.selectedExercises.map((id: string) => {
        const exInfo = getExerciseById(id);
        const exType = exInfo?.type || 'compound';
        return {
          exerciseId: id,
          targetSets: exType === 'compound' ? 4 : 3,
          targetRepsRange: exInfo?.defaultRepsRange || [8, 12],
          restSeconds: getDefaultRestSeconds(exType, settings.goal),
        };
      });
      setExercises((prev) => [...prev, ...newExercises]);
    }
  }, [route?.params?.selectedExercises, settings.defaultRestSeconds]);

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Donne un nom a ton programme');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('Erreur', 'Ajoute au moins un exercice');
      return;
    }

    if (existing) {
      updateProgram(existing.id, { name, exercises });
    } else {
      const program: Program = {
        id: `prog_${Date.now()}`,
        name,
        exercises,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFavorite: false,
        color: colors.accent,
      };
      addProgram(program);
    }
    navigation.goBack();
  };

  const removeExercise = useCallback((index: number) => {
    setExercises((prev) => {
      const removed = prev[index];
      const updated = prev.filter((_, i) => i !== index);
      // If removed exercise was in a superset group, check if partner is now alone
      if (removed.supersetGroup != null) {
        const remaining = updated.filter((e) => e.supersetGroup === removed.supersetGroup);
        if (remaining.length === 1) {
          // Remove supersetGroup from the lone exercise
          return updated.map((e) =>
            e.supersetGroup === removed.supersetGroup ? { ...e, supersetGroup: undefined } : e
          );
        }
      }
      return updated;
    });
  }, []);

  const updateExerciseConfig = useCallback((index: number, updates: Partial<ProgramExercise>) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, ...updates } : ex))
    );
  }, []);

  const moveExercise = useCallback((from: number, to: number) => {
    setExercises((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  }, []);

  const toggleSuperset = useCallback((indexA: number, indexB: number) => {
    setExercises((prev) => {
      const a = prev[indexA];
      const b = prev[indexB];

      // If both already share the same superset group, unlink them
      if (a.supersetGroup != null && a.supersetGroup === b.supersetGroup) {
        return prev.map((ex, i) => {
          if (i === indexA || i === indexB) {
            return { ...ex, supersetGroup: undefined };
          }
          return ex;
        });
      }

      // Assign a new group (or reuse existing group from one of them)
      const groupId = a.supersetGroup ?? b.supersetGroup ?? Date.now();
      return prev.map((ex, i) => {
        if (i === indexA || i === indexB) {
          return { ...ex, supersetGroup: groupId };
        }
        // If the other exercise was in a different group, merge
        if (a.supersetGroup != null && ex.supersetGroup === a.supersetGroup) {
          return { ...ex, supersetGroup: groupId };
        }
        if (b.supersetGroup != null && ex.supersetGroup === b.supersetGroup) {
          return { ...ex, supersetGroup: groupId };
        }
        return ex;
      });
    });
  }, []);

  // Check if two adjacent exercises are in the same superset group
  const areInSameSuperset = (indexA: number, indexB: number): boolean => {
    if (indexA < 0 || indexB >= exercises.length) return false;
    const a = exercises[indexA];
    const b = exercises[indexB];
    return a.supersetGroup != null && a.supersetGroup === b.supersetGroup;
  };

  const renderExercise = useCallback(({ item, index }: { item: ProgramExercise; index: number }) => {
    const info = getExerciseById(item.exerciseId);
    const isInSuperset = item.supersetGroup != null;
    const isFirstInGroup = isInSuperset && (index === 0 || exercises[index - 1]?.supersetGroup !== item.supersetGroup);
    const isLastInGroup = isInSuperset && (index === exercises.length - 1 || exercises[index + 1]?.supersetGroup !== item.supersetGroup);
    const showSupersetLink = index < exercises.length - 1;
    const linkedWithNext = areInSameSuperset(index, index + 1);

    return (
      <View>
        {/* Superset bracket on the left */}
        <View style={[styles.exerciseRow, isInSuperset && styles.exerciseRowSuperset]}>
          {isInSuperset && (
            <View style={styles.supersetBracket}>
              {isFirstInGroup && (
                <Text style={styles.supersetLabel}>SS</Text>
              )}
              <View style={[
                styles.bracketLine,
                isFirstInGroup && styles.bracketLineTop,
                isLastInGroup && styles.bracketLineBottom,
                !isFirstInGroup && !isLastInGroup && styles.bracketLineMiddle,
              ]} />
            </View>
          )}
          <View style={styles.reorderBtns}>
            <TouchableOpacity onPress={() => moveExercise(index, index - 1)}>
              <Text style={styles.reorderText}>▲</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => moveExercise(index, index + 1)}>
              <Text style={styles.reorderText}>▼</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.exerciseContent}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{info?.nameFr || item.exerciseId}</Text>
              <TouchableOpacity onPress={() => removeExercise(index)}>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.configRow}>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Series</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    onPress={() => updateExerciseConfig(index, { targetSets: Math.max(1, item.targetSets - 1) })}
                  >
                    <Text style={styles.stepperBtn}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{item.targetSets}</Text>
                  <TouchableOpacity
                    onPress={() => updateExerciseConfig(index, { targetSets: item.targetSets + 1 })}
                  >
                    <Text style={styles.stepperBtn}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Min reps</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    onPress={() => updateExerciseConfig(index, { targetRepsRange: [Math.max(1, item.targetRepsRange[0] - 1), item.targetRepsRange[1]] })}
                  >
                    <Text style={styles.stepperBtn}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{item.targetRepsRange[0]}</Text>
                  <TouchableOpacity
                    onPress={() => updateExerciseConfig(index, { targetRepsRange: [Math.min(item.targetRepsRange[0] + 1, item.targetRepsRange[1]), item.targetRepsRange[1]] })}
                  >
                    <Text style={styles.stepperBtn}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Max reps</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    onPress={() => updateExerciseConfig(index, { targetRepsRange: [item.targetRepsRange[0], Math.max(item.targetRepsRange[0], item.targetRepsRange[1] - 1)] })}
                  >
                    <Text style={styles.stepperBtn}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{item.targetRepsRange[1]}</Text>
                  <TouchableOpacity
                    onPress={() => updateExerciseConfig(index, { targetRepsRange: [item.targetRepsRange[0], item.targetRepsRange[1] + 1] })}
                  >
                    <Text style={styles.stepperBtn}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Repos</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    onPress={() => updateExerciseConfig(index, { restSeconds: Math.max(15, item.restSeconds - 15) })}
                  >
                    <Text style={styles.stepperBtn}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{item.restSeconds}s</Text>
                  <TouchableOpacity
                    onPress={() => updateExerciseConfig(index, { restSeconds: item.restSeconds + 15 })}
                  >
                    <Text style={styles.stepperBtn}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Superset link button between exercises */}
        {showSupersetLink && (
          <TouchableOpacity
            style={[
              styles.supersetLinkBtn,
              linkedWithNext && styles.supersetLinkBtnActive,
            ]}
            onPress={() => toggleSuperset(index, index + 1)}
          >
            <Text style={[
              styles.supersetLinkText,
              linkedWithNext && styles.supersetLinkTextActive,
            ]}>
              {linkedWithNext ? '|| Superset ||' : '-- Lier en superset --'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [exercises, moveExercise, removeExercise, updateExerciseConfig, toggleSuperset]);

  return (
    <View style={styles.container}>
      {/* Name input OUTSIDE the FlatList to prevent re-render lag */}
      <View style={styles.headerSection}>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder="Nom du programme (ex: Push A, Legs Heavy...)"
          placeholderTextColor={colors.muted}
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('ExercisePicker', { returnProgramId: programId })}
        >
          <Text style={styles.addBtnText}>+ AJOUTER DES EXERCICES</Text>
        </TouchableOpacity>
        {exercises.length > 0 && (
          <Text style={styles.exercisesTitle}>
            Exercices ({exercises.length})
          </Text>
        )}
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        renderItem={renderExercise}
        ListFooterComponent={() =>
          exercises.length > 0 ? (
            <TouchableOpacity style={styles.saveBtn} onPress={save}>
              <Text style={styles.saveBtnText}>
                {existing ? 'SAUVEGARDER' : 'CREER LE PROGRAMME'}
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  nameInput: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.lg,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  addBtn: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent + '60',
    borderStyle: 'dashed',
    marginBottom: spacing.lg,
  },
  addBtnText: {
    fontFamily: fonts.heading,
    fontSize: fontSize.md,
    color: colors.accent,
    letterSpacing: 1,
  },
  exercisesTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  exerciseRow: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  exerciseRowSuperset: {
    borderColor: colors.purple + '60',
  },
  supersetBracket: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.purple + '15',
  },
  supersetLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    color: colors.purple,
    marginBottom: 2,
  },
  bracketLine: {
    width: 3,
    flex: 1,
    backgroundColor: colors.purple,
    borderRadius: 2,
  },
  bracketLineTop: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginTop: 16,
  },
  bracketLineBottom: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginBottom: 16,
  },
  bracketLineMiddle: {},
  reorderBtns: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
  },
  reorderText: {
    fontSize: 16,
    color: colors.muted,
    paddingVertical: spacing.xs,
  },
  exerciseContent: { flex: 1, padding: spacing.md },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  exerciseName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
  removeText: {
    fontSize: 16,
    color: colors.red,
    paddingLeft: spacing.sm,
  },
  configRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  configItem: { alignItems: 'center' },
  configLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
    marginBottom: 4,
  },
  configValue: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperBtn: {
    fontSize: 18,
    color: colors.accent,
    paddingHorizontal: spacing.sm,
  },
  stepperValue: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
  supersetLinkBtn: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginVertical: 2,
  },
  supersetLinkBtnActive: {
    backgroundColor: colors.purple + '15',
    borderRadius: borderRadius.sm,
  },
  supersetLinkText: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  supersetLinkTextActive: {
    fontFamily: fonts.bodyBold,
    color: colors.purple,
  },
  saveBtn: {
    backgroundColor: colors.green,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveBtnText: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xl,
    color: colors.white,
    letterSpacing: 2,
  },
});
