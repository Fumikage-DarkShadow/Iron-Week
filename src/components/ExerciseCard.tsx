import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Exercise } from '../types';
import { colors, fonts, borderRadius, spacing, fontSize } from '../theme';
import { muscleGroupLabels } from '../data/exercises';

interface Props {
  exercise: Exercise;
  onPress: () => void;
  rightElement?: React.ReactNode;
  showMuscleGroup?: boolean;
}

const typeColors: Record<string, string> = {
  compound: colors.blue,
  isolation: colors.purple,
  cardio: colors.green,
};

const levelLabels: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
};

export default function ExerciseCard({ exercise, onPress, rightElement, showMuscleGroup = true }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{exercise.nameFr}</Text>
          {rightElement}
        </View>
        <Text style={styles.nameEn} numberOfLines={1}>{exercise.nameEn}</Text>
        <View style={styles.tags}>
          {showMuscleGroup && (
            <View style={[styles.tag, { backgroundColor: colors.accent + '20' }]}>
              <Text style={[styles.tagText, { color: colors.accent }]}>
                {muscleGroupLabels[exercise.muscleGroup]}
              </Text>
            </View>
          )}
          <View style={[styles.tag, { backgroundColor: typeColors[exercise.type] + '20' }]}>
            <Text style={[styles.tagText, { color: typeColors[exercise.type] }]}>
              {exercise.type === 'compound' ? 'Polyarticulaire' : exercise.type === 'isolation' ? 'Isolation' : 'Cardio'}
            </Text>
          </View>
          <View style={[styles.tag, { backgroundColor: colors.muted + '20' }]}>
            <Text style={[styles.tagText, { color: colors.muted }]}>
              {levelLabels[exercise.level]}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.lg,
    color: colors.text,
    flex: 1,
  },
  nameEn: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.xs,
  },
});
