import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, borderRadius, spacing, fontSize } from '../../theme';
import { getExerciseById, muscleGroupLabels } from '../../data/exercises';
import { useSessionStore } from '../../stores/sessionStore';
import { estimate1RM } from '../../utils/coachEngine';
import BodyFigure from '../../components/BodyFigure';

const equipmentLabels: Record<string, string> = {
  barre: 'Barre',
  halteres: 'Haltères',
  machine: 'Machine',
  poulie: 'Poulie',
  poids_corps: 'Poids du corps',
  kettlebell: 'Kettlebell',
  elastique: 'Élastique',
  autre: 'Autre',
};

const levelColors: Record<string, string> = {
  debutant: colors.green,
  intermediaire: colors.blue,
  avance: colors.red,
};

export default function ExerciseDetailScreen({ route, navigation }: any) {
  const { exerciseId } = route.params;
  const exercise = getExerciseById(exerciseId);
  const { getPersonalRecords, getSessionsForExercise } = useSessionStore();

  if (!exercise) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Exercice non trouvé</Text>
      </View>
    );
  }

  const prs = getPersonalRecords(exerciseId);
  const recentSessions = getSessionsForExercise(exerciseId, 5);

  const best1RM = [...prs].reverse().find((p) => p.type === '1rm');
  const bestWeight = [...prs].reverse().find((p) => p.type === 'weight');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{exercise.nameFr}</Text>
      <Text style={styles.subtitle}>{exercise.nameEn}</Text>

      {/* Tags */}
      <View style={styles.tagRow}>
        <View style={[styles.tag, { backgroundColor: colors.accent + '20' }]}>
          <Text style={[styles.tagText, { color: colors.accent }]}>
            {muscleGroupLabels[exercise.muscleGroup]}
          </Text>
        </View>
        {exercise.secondaryMuscles.map((m) => (
          <View key={m} style={[styles.tag, { backgroundColor: colors.muted + '20' }]}>
            <Text style={[styles.tagText, { color: colors.muted }]}>{muscleGroupLabels[m]}</Text>
          </View>
        ))}
        <View style={[styles.tag, { backgroundColor: levelColors[exercise.level] + '20' }]}>
          <Text style={[styles.tagText, { color: levelColors[exercise.level] }]}>
            {exercise.level === 'debutant' ? 'Débutant' : exercise.level === 'intermediaire' ? 'Intermédiaire' : 'Avancé'}
          </Text>
        </View>
      </View>

      {/* Muscle body figure */}
      <View style={styles.bodyFigureContainer}>
        <BodyFigure
          primary={exercise.muscleGroup}
          secondary={exercise.secondaryMuscles}
          width={110}
        />
      </View>

      {/* Equipment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Équipement</Text>
        <View style={styles.equipRow}>
          {exercise.equipment.map((eq) => (
            <View key={eq} style={styles.equipChip}>
              <Text style={styles.equipText}>{equipmentLabels[eq] || eq}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Rep range */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fourchette de reps</Text>
        <Text style={styles.repRange}>
          {exercise.defaultRepsRange[0]} - {exercise.defaultRepsRange[1]} reps
        </Text>
      </View>

      {/* Personal records */}
      {(best1RM || bestWeight) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tes records</Text>
          <View style={styles.prRow}>
            {bestWeight && (
              <View style={styles.prCard}>
                <Text style={styles.prValue}>{bestWeight.value}kg</Text>
                <Text style={styles.prLabel}>Charge max</Text>
              </View>
            )}
            {best1RM && (
              <View style={styles.prCard}>
                <Text style={styles.prValue}>{best1RM.value}kg</Text>
                <Text style={styles.prLabel}>1RM estimé</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conseils d'exécution</Text>
        {exercise.tips.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      {/* Recent history */}
      {recentSessions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique récent</Text>
          {recentSessions.map((session, i) => {
            const ex = session.exercises.find((e) => e.exerciseId === exerciseId);
            if (!ex) return null;
            const doneSets = ex.sets.filter((s) => s.done);
            return (
              <View key={i} style={styles.historyRow}>
                <Text style={styles.historyDate}>{session.date}</Text>
                <Text style={styles.historySets}>
                  {doneSets.map((s) => `${s.kg}×${s.reps}`).join('  ')}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Substitutes */}
      {exercise.substitutes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercices similaires</Text>
          {exercise.substitutes.map((subId) => {
            const sub = getExerciseById(subId);
            if (!sub) return null;
            return (
              <TouchableOpacity
                key={subId}
                style={styles.substituteCard}
                onPress={() => navigation.push('ExerciseDetail', { exerciseId: subId })}
              >
                <Text style={styles.substituteText}>{sub.nameFr}</Text>
                <Text style={styles.substituteArrow}>→</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Stats link */}
      <TouchableOpacity
        style={styles.statsBtn}
        onPress={() => navigation.navigate('Stats', {
          screen: 'ExerciseStats',
          params: { exerciseId },
        })}
      >
        <Text style={styles.statsBtnText}>📈 VOIR LES STATISTIQUES</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  emptyText: { fontFamily: fonts.body, fontSize: fontSize.lg, color: colors.muted },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.hero,
    color: colors.text,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.sm,
  },
  bodyFigureContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  equipRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  equipChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  equipText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  repRange: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.xxl,
    color: colors.accent,
  },
  prRow: { flexDirection: 'row', gap: spacing.md },
  prCard: {
    flex: 1,
    backgroundColor: colors.gold + '15',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold + '30',
  },
  prValue: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxxl,
    color: colors.gold,
  },
  prLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  tipBullet: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.accent,
    marginRight: spacing.sm,
    width: 12,
  },
  tipText: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
  historyRow: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyDate: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  historySets: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  substituteCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  substituteText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  substituteArrow: {
    fontSize: 16,
    color: colors.muted,
  },
  statsBtn: {
    backgroundColor: colors.blue + '20',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.blue + '40',
    marginTop: spacing.md,
  },
  statsBtnText: {
    fontFamily: fonts.heading,
    fontSize: fontSize.md,
    color: colors.blue,
    letterSpacing: 1,
  },
});
