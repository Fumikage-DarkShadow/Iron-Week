import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, borderRadius, spacing, fontSize } from '../../theme';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getExerciseById } from '../../data/exercises';
import { generateRecommendation, estimate1RM } from '../../utils/coachEngine';
import CoachCard from '../../components/CoachCard';
import BodyFigure from '../../components/BodyFigure';
import { MuscleGroup } from '../../types';

export default function WorkoutSummaryScreen({ navigation }: any) {
  const { sessions } = useSessionStore();
  const { settings } = useSettingsStore();
  const lastSession = sessions[sessions.length - 1];

  if (!lastSession) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucune séance terminée</Text>
      </View>
    );
  }

  const duration = lastSession.duration ? Math.round(lastSession.duration / 60000) : 0;
  const totalVolume = lastSession.totalVolume;

  // Count PRs
  const prsCount = useMemo(() => {
    let count = 0;
    const prevSessions = sessions.slice(0, -1);
    for (const ex of lastSession.exercises) {
      for (const set of ex.sets) {
        if (!set.done) continue;
        const current1RM = estimate1RM(set.kg, set.reps);
        const best = Math.max(
          0,
          ...prevSessions.flatMap((s) =>
            s.exercises
              .filter((e) => e.exerciseId === ex.exerciseId)
              .flatMap((e) => e.sets.filter((st) => st.done).map((st) => estimate1RM(st.kg, st.reps)))
          )
        );
        if (current1RM > best && best > 0) count++;
      }
    }
    return count;
  }, [lastSession, sessions]);

  // Compare with previous session of same program
  const previousSession = sessions
    .slice(0, -1)
    .filter((s) => s.programId === lastSession.programId)
    .sort((a, b) => b.startedAt - a.startedAt)[0];
  const volChange = previousSession && previousSession.totalVolume > 0
    ? Math.round(((totalVolume - previousSession.totalVolume) / previousSession.totalVolume) * 100)
    : 0;

  // Muscle map data
  const muscleIntensity = useMemo(() => {
    const map: Partial<Record<MuscleGroup, number>> = {};
    let maxVol = 0;
    const volByMuscle: Record<string, number> = {};

    for (const ex of lastSession.exercises) {
      const info = getExerciseById(ex.exerciseId);
      if (!info) continue;
      const vol = ex.sets.filter((s) => s.done).reduce((v, s) => v + s.kg * s.reps, 0);
      volByMuscle[info.muscleGroup] = (volByMuscle[info.muscleGroup] || 0) + vol;
      for (const sec of info.secondaryMuscles) {
        volByMuscle[sec] = (volByMuscle[sec] || 0) + vol * 0.3;
      }
    }

    maxVol = Math.max(1, ...Object.values(volByMuscle));
    for (const [muscle, vol] of Object.entries(volByMuscle)) {
      map[muscle as MuscleGroup] = vol / maxVol;
    }
    return map;
  }, [lastSession]);

  // Recommendations
  const recommendations = useMemo(() => {
    return lastSession.exercises.map((ex) =>
      generateRecommendation(ex.exerciseId, sessions, ex.targetRepsRange, settings.goal)
    );
  }, [lastSession, sessions, settings.goal]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>SÉANCE TERMINÉE</Text>
      <Text style={styles.programName}>{lastSession.programName}</Text>

      {/* Stats cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>⏱️</Text>
          <Text style={styles.statValue}>{duration}</Text>
          <Text style={styles.statLabel}>minutes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>📊</Text>
          <Text style={styles.statValue}>{Math.round(totalVolume)}</Text>
          <Text style={styles.statLabel}>kg volume</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🏆</Text>
          <Text style={styles.statValue}>{prsCount}</Text>
          <Text style={styles.statLabel}>PR battus</Text>
        </View>
        {previousSession && (
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>{volChange >= 0 ? '📈' : '📉'}</Text>
            <Text style={[styles.statValue, { color: volChange >= 0 ? colors.green : colors.red }]}>
              {volChange >= 0 ? '+' : ''}{volChange}%
            </Text>
            <Text style={styles.statLabel}>vs précédent</Text>
          </View>
        )}
      </View>

      {/* Muscle Map */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Muscles travaillés</Text>
        <View style={styles.muscleMapContainer}>
          <BodyFigure intensityMap={muscleIntensity} width={100} />
        </View>
      </View>

      {/* Exercise summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Détail par exercice</Text>
        {lastSession.exercises.map((ex, i) => {
          const info = getExerciseById(ex.exerciseId);
          const doneSets = ex.sets.filter((s) => s.done);
          const vol = doneSets.reduce((v, s) => v + s.kg * s.reps, 0);
          return (
            <View key={i} style={styles.exerciseRow}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{info?.nameFr || ex.exerciseId}</Text>
                <Text style={styles.exerciseDetail}>
                  {doneSets.map((s) => `${s.kg}×${s.reps}`).join('  |  ')}
                </Text>
                <Text style={styles.exerciseVolume}>Volume: {Math.round(vol)} kg</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Coach Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommandations Coach</Text>
        {recommendations.map((rec, i) => (
          <CoachCard key={i} recommendation={rec} />
        ))}
      </View>

      <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.navigate('TodayHome')}>
        <Text style={styles.doneBtnText}>RETOUR À L'ACCUEIL</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  emptyText: { fontFamily: fonts.body, fontSize: fontSize.lg, color: colors.muted },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.hero,
    color: colors.accent,
    textAlign: 'center',
    letterSpacing: 4,
  },
  programName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.xl,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statEmoji: { fontSize: 24, marginBottom: spacing.xs },
  statValue: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxxl,
    color: colors.text,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  section: { marginBottom: spacing.xxl },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xl,
    color: colors.text,
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  muscleMapContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseRow: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseInfo: {},
  exerciseName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  exerciseDetail: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
  },
  exerciseVolume: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.xs,
    color: colors.blue,
    marginTop: 2,
  },
  doneBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xxxl,
  },
  doneBtnText: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xl,
    color: colors.white,
    letterSpacing: 2,
  },
});
