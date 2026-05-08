import React, { useState, useEffect, useCallback, useRef } from 'react';
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

  // Stable program ID — created once, used as the working program identity.
  // If the user is editing an existing one, use its ID. Otherwise create a draft.
  const initialProgramId = useRef<string>(route?.params?.programId || `prog_${Date.now()}`).current;
  const isNewProgram = !route?.params?.programId;
  const hasInitialized = useRef(false);

  // Reactive program from the store
  const programInStore = programs.find((p) => p.id === initialProgramId);
  const existing = programs.find((p) => p.id === route?.params?.programId);

  const [name, setName] = useState(existing?.name || '');
  const [exercises, setExercises] = useState<ProgramExercise[]>(existing?.exercises || []);
  const processedSelectionRef = useRef<string[] | null>(null);

  // Sync local state with store whenever store changes for this program
  // (handles the case where ExercisePicker writes directly to the store)
  useEffect(() => {
    if (programInStore) {
      setExercises(programInStore.exercises);
      if (!hasInitialized.current) {
        setName(programInStore.name);
        hasInitialized.current = true;
      }
    }
  }, [programInStore?.exercises]);

  // Process selectedExercises coming from the ExercisePicker
  useEffect(() => {
    const incoming = route?.params?.selectedExercises;
    if (!incoming || incoming === processedSelectionRef.current) return;

    processedSelectionRef.current = incoming;

    const newExercises: ProgramExercise[] = incoming.map((id: string) => {
      const exInfo = getExerciseById(id);
      const exType = exInfo?.type || 'compound';
      return {
        exerciseId: id,
        targetSets: exType === 'compound' ? 4 : 3,
        targetRepsRange: exInfo?.defaultRepsRange || [8, 12],
        restSeconds: getDefaultRestSeconds(exType, settings.goal),
      };
    });

    // Append to current state AND persist to store immediately
    setExercises((prev) => {
      const updated = [...prev, ...newExercises];
      // Auto-save: ensures exercises survive screen remounts
      autoPersist(updated, name);
      return updated;
    });

    // Clear the param to prevent re-processing on re-render
    navigation.setParams({ selectedExercises: undefined });
  }, [route?.params?.selectedExercises]);

  // Persist changes to the store automatically
  const autoPersist = useCallback(
    (updatedExercises: ProgramExercise[], updatedName: string) => {
      if (updatedExercises.length === 0 && !updatedName.trim()) return;
      const finalName = updatedName.trim() || 'Nouveau programme';

      if (programInStore) {
        updateProgram(initialProgramId, {
          name: finalName,
          exercises: updatedExercises,
        });
      } else {
        // Create draft program
        const program: Program = {
          id: initialProgramId,
          name: finalName,
          exercises: updatedExercises,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isFavorite: false,
          color: colors.accent,
        };
        addProgram(program);
      }
    },
    [programInStore, initialProgramId, updateProgram, addProgram]
  );

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Donne un nom à ton programme');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('Erreur', 'Ajoute au moins un exercice');
      return;
    }
    autoPersist(exercises, name);
    navigation.goBack();
  };

  const handleNameChange = (newName: string) => {
    setName(newName);
    // Auto-persist name changes for existing programs
    if (programInStore && newName.trim()) {
      autoPersist(exercises, newName);
    }
  };

  const removeExercise = useCallback((index: number) => {
    setExercises((prev) => {
      const removed = prev[index];
      let updated = prev.filter((_, i) => i !== index);
      if (removed?.supersetGroup != null) {
        const remaining = updated.filter((e) => e.supersetGroup === removed.supersetGroup);
        if (remaining.length === 1) {
          updated = updated.map((e) =>
            e.supersetGroup === removed.supersetGroup ? { ...e, supersetGroup: undefined } : e
          );
        }
      }
      autoPersist(updated, name);
      return updated;
    });
  }, [autoPersist, name]);

  const updateExerciseConfig = useCallback(
    (index: number, updates: Partial<ProgramExercise>) => {
      setExercises((prev) => {
        const updated = prev.map((ex, i) => (i === index ? { ...ex, ...updates } : ex));
        autoPersist(updated, name);
        return updated;
      });
    },
    [autoPersist, name]
  );

  const moveExercise = useCallback(
    (from: number, to: number) => {
      setExercises((prev) => {
        if (to < 0 || to >= prev.length) return prev;
        const updated = [...prev];
        const [moved] = updated.splice(from, 1);
        updated.splice(to, 0, moved);
        autoPersist(updated, name);
        return updated;
      });
    },
    [autoPersist, name]
  );

  const toggleSuperset = useCallback(
    (index: number) => {
      setExercises((prev) => {
        if (index >= prev.length - 1) return prev;
        const cur = prev[index];
        const next = prev[index + 1];
        const updated = [...prev];
        if (cur.supersetGroup != null && cur.supersetGroup === next.supersetGroup) {
          updated[index] = { ...cur, supersetGroup: undefined };
          updated[index + 1] = { ...next, supersetGroup: undefined };
        } else {
          const newGroup = Date.now();
          updated[index] = { ...cur, supersetGroup: newGroup };
          updated[index + 1] = { ...next, supersetGroup: newGroup };
        }
        autoPersist(updated, name);
        return updated;
      });
    },
    [autoPersist, name]
  );

  const renderExercise = useCallback(
    ({ item, index }: { item: ProgramExercise; index: number }) => {
      const info = getExerciseById(item.exerciseId);
      const prev = exercises[index - 1];
      const inSupersetWithPrev = prev && prev.supersetGroup != null && prev.supersetGroup === item.supersetGroup;
      const next = exercises[index + 1];
      const inSupersetWithNext = next && next.supersetGroup != null && next.supersetGroup === item.supersetGroup;

      return (
        <View>
          {inSupersetWithPrev && (
            <View style={styles.supersetBracket}>
              <View style={styles.supersetLine} />
              <Text style={styles.supersetLabel}>SUPERSET</Text>
              <View style={styles.supersetLine} />
            </View>
          )}
          <View style={styles.exerciseRow}>
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
                  <Text style={styles.configLabel}>Séries</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      onPress={() =>
                        updateExerciseConfig(index, { targetSets: Math.max(1, item.targetSets - 1) })
                      }
                    >
                      <Text style={styles.stepperBtn}>−</Text>
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
                      onPress={() =>
                        updateExerciseConfig(index, {
                          targetRepsRange: [
                            Math.max(1, item.targetRepsRange[0] - 1),
                            item.targetRepsRange[1],
                          ],
                        })
                      }
                    >
                      <Text style={styles.stepperBtn}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{item.targetRepsRange[0]}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        updateExerciseConfig(index, {
                          targetRepsRange: [
                            Math.min(item.targetRepsRange[0] + 1, item.targetRepsRange[1]),
                            item.targetRepsRange[1],
                          ],
                        })
                      }
                    >
                      <Text style={styles.stepperBtn}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.configItem}>
                  <Text style={styles.configLabel}>Max reps</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      onPress={() =>
                        updateExerciseConfig(index, {
                          targetRepsRange: [
                            item.targetRepsRange[0],
                            Math.max(item.targetRepsRange[0], item.targetRepsRange[1] - 1),
                          ],
                        })
                      }
                    >
                      <Text style={styles.stepperBtn}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{item.targetRepsRange[1]}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        updateExerciseConfig(index, {
                          targetRepsRange: [item.targetRepsRange[0], item.targetRepsRange[1] + 1],
                        })
                      }
                    >
                      <Text style={styles.stepperBtn}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.configItem}>
                  <Text style={styles.configLabel}>Repos</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      onPress={() =>
                        updateExerciseConfig(index, {
                          restSeconds: Math.max(15, item.restSeconds - 15),
                        })
                      }
                    >
                      <Text style={styles.stepperBtn}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{item.restSeconds}s</Text>
                    <TouchableOpacity
                      onPress={() =>
                        updateExerciseConfig(index, { restSeconds: item.restSeconds + 15 })
                      }
                    >
                      <Text style={styles.stepperBtn}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Superset link button — between this exercise and the next */}
              {index < exercises.length - 1 && !inSupersetWithNext && (
                <TouchableOpacity style={styles.linkSupersetBtn} onPress={() => toggleSuperset(index)}>
                  <Text style={styles.linkSupersetText}>🔗 Lier en superset avec le suivant</Text>
                </TouchableOpacity>
              )}
              {inSupersetWithNext && (
                <TouchableOpacity
                  style={[styles.linkSupersetBtn, styles.unlinkBtn]}
                  onPress={() => toggleSuperset(index)}
                >
                  <Text style={[styles.linkSupersetText, { color: colors.muted }]}>
                    Délier le superset
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    },
    [exercises, moveExercise, removeExercise, updateExerciseConfig, toggleSuperset]
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={handleNameChange}
          placeholder="Nom du programme (ex: Push A, Legs Heavy...)"
          placeholderTextColor={colors.muted}
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            // Persist before going to picker so additions stick on the way back
            autoPersist(exercises, name);
            navigation.navigate('ExercisePicker', { returnProgramId: initialProgramId });
          }}
        >
          <Text style={styles.addBtnText}>+ AJOUTER DES EXERCICES</Text>
        </TouchableOpacity>
        {exercises.length > 0 && (
          <Text style={styles.exercisesTitle}>Exercices ({exercises.length})</Text>
        )}
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(item, i) => `${item.exerciseId}-${i}`}
        contentContainerStyle={styles.list}
        renderItem={renderExercise}
        ListFooterComponent={() =>
          exercises.length > 0 ? (
            <TouchableOpacity style={styles.saveBtn} onPress={save}>
              <Text style={styles.saveBtnText}>
                {existing || programInStore ? 'TERMINER' : 'CRÉER LE PROGRAMME'}
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
  supersetBracket: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: 4,
    paddingHorizontal: spacing.lg,
  },
  supersetLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.purple + '60',
  },
  supersetLabel: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xs,
    color: colors.purple,
    letterSpacing: 2,
  },
  exerciseRow: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
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
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  configItem: { alignItems: 'center' },
  configLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
    marginBottom: 4,
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
  linkSupersetBtn: {
    marginTop: spacing.sm,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    backgroundColor: colors.purple + '12',
    borderWidth: 1,
    borderColor: colors.purple + '30',
    borderStyle: 'dashed',
  },
  unlinkBtn: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderStyle: 'solid',
  },
  linkSupersetText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.xs,
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
