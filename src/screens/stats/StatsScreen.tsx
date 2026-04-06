import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, borderRadius, spacing, fontSize } from '../../theme';
import { useSessionStore } from '../../stores/sessionStore';
import { getExerciseById } from '../../data/exercises';
import { detectFatigue, getCurrentPhase, estimate1RM } from '../../utils/coachEngine';
import BodyFigure from '../../components/BodyFigure';
import { MuscleGroup } from '../../types';

export default function StatsScreen({ navigation }: any) {
  const { sessions, getStreak, getWeeklyVolume, getWeeklySessions } = useSessionStore();

  const streak = getStreak();
  const thisWeekVol = getWeeklyVolume(0);
  const lastWeekVol = getWeeklyVolume(1);
  const volChange = lastWeekVol > 0 ? Math.round(((thisWeekVol - lastWeekVol) / lastWeekVol) * 100) : 0;
  const weeklySessions = getWeeklySessions(8);
  const fatigueStatus = detectFatigue(sessions);
  const totalSessions = sessions.length;

  // Get week number for periodization
  const weekNumber = Math.floor((Date.now() - (sessions[0]?.startedAt || Date.now())) / (7 * 24 * 3600 * 1000));
  const phase = getCurrentPhase(weekNumber);

  // Recent PRs
  const recentPRs = useMemo(() => {
    const prs: { exerciseId: string; value: number; type: string; date: string }[] = [];
    const prMap = new Map<string, number>();

    for (let i = sessions.length - 1; i >= Math.max(0, sessions.length - 10); i--) {
      const session = sessions[i];
      for (const ex of session.exercises) {
        for (const set of ex.sets) {
          if (!set.done) continue;
          const rm = estimate1RM(set.kg, set.reps);
          const key = ex.exerciseId;
          const prev = prMap.get(key) || 0;
          if (rm > prev) {
            prMap.set(key, rm);
            if (prev > 0) {
              prs.push({ exerciseId: ex.exerciseId, value: rm, type: '1rm', date: session.date });
            }
          }
        }
      }
    }
    return prs.slice(-5).reverse();
  }, [sessions]);

  // Weekly muscle balance
  const weeklyMuscleMap = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const volByMuscle: Record<string, number> = {};
    let maxVol = 0;

    sessions
      .filter((s) => new Date(s.date) >= startOfWeek)
      .forEach((s) => {
        s.exercises.forEach((ex) => {
          const info = getExerciseById(ex.exerciseId);
          if (!info) return;
          const vol = ex.sets.filter((set) => set.done).reduce((v, set) => v + set.kg * set.reps, 0);
          volByMuscle[info.muscleGroup] = (volByMuscle[info.muscleGroup] || 0) + vol;
          info.secondaryMuscles.forEach((m) => {
            volByMuscle[m] = (volByMuscle[m] || 0) + vol * 0.3;
          });
        });
      });

    maxVol = Math.max(1, ...Object.values(volByMuscle));
    const result: Partial<Record<MuscleGroup, number>> = {};
    for (const [muscle, vol] of Object.entries(volByMuscle)) {
      result[muscle as MuscleGroup] = vol / maxVol;
    }
    return result;
  }, [sessions]);

  // Unique exercises trained
  const exerciseIds = useMemo(() => {
    const ids = new Set<string>();
    sessions.forEach((s) => s.exercises.forEach((e) => ids.add(e.exerciseId)));
    return ids;
  }, [sessions]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Key metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{streak}</Text>
          <Text style={styles.metricLabel}>🔥 Streak</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{totalSessions}</Text>
          <Text style={styles.metricLabel}>🏋️ Séances</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: volChange >= 0 ? colors.green : colors.red }]}>
            {volChange >= 0 ? '+' : ''}{volChange}%
          </Text>
          <Text style={styles.metricLabel}>📊 Volume</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{exerciseIds.size}</Text>
          <Text style={styles.metricLabel}>💪 Exercices</Text>
        </View>
      </View>

      {/* Weekly frequency bar chart (text-based) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fréquence (8 semaines)</Text>
        <View style={styles.barChart}>
          {weeklySessions.map((count, i) => (
            <View key={i} style={styles.barCol}>
              <View
                style={[
                  styles.bar,
                  { height: Math.max(4, count * 20), backgroundColor: i === weeklySessions.length - 1 ? colors.accent : colors.blue },
                ]}
              />
              <Text style={styles.barLabel}>{count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Fatigue / Periodization */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>État & Périodisation</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusCard, {
            borderColor: fatigueStatus === 'fatigued' ? colors.red + '60' :
              fatigueStatus === 'progressing' ? colors.green + '60' : colors.border,
          }]}>
            <Text style={styles.statusEmoji}>
              {fatigueStatus === 'fatigued' ? '😰' : fatigueStatus === 'progressing' ? '💪' : fatigueStatus === 'stagnant' ? '😐' : '👍'}
            </Text>
            <Text style={styles.statusText}>
              {fatigueStatus === 'fatigued' ? 'Fatigue détectée' :
                fatigueStatus === 'progressing' ? 'En progression' :
                  fatigueStatus === 'stagnant' ? 'Stagnation' : 'Normal'}
            </Text>
          </View>
          <View style={styles.statusCard}>
            <Text style={styles.statusEmoji}>📅</Text>
            <Text style={styles.statusText}>{phase.phase}</Text>
            <Text style={styles.statusSub}>{phase.description}</Text>
          </View>
        </View>
      </View>

      {/* Muscle balance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bilan musculaire (semaine)</Text>
        <View style={styles.muscleMapContainer}>
          <BodyFigure intensityMap={weeklyMuscleMap} width={100} />
        </View>
      </View>

      {/* Recent PRs */}
      {recentPRs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Records récents 🏆</Text>
          {recentPRs.map((pr, i) => {
            const info = getExerciseById(pr.exerciseId);
            return (
              <TouchableOpacity
                key={i}
                style={styles.prRow}
                onPress={() => navigation.navigate('ExerciseStats', { exerciseId: pr.exerciseId })}
              >
                <Text style={styles.prName}>{info?.nameFr || pr.exerciseId}</Text>
                <Text style={styles.prValue}>{Math.round(pr.value)}kg</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Exercise list for detailed stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progression par exercice</Text>
        {Array.from(exerciseIds).map((id) => {
          const info = getExerciseById(id);
          if (!info) return null;
          return (
            <TouchableOpacity
              key={id}
              style={styles.exerciseLink}
              onPress={() => navigation.navigate('ExerciseStats', { exerciseId: id })}
            >
              <Text style={styles.exerciseLinkText}>{info.nameFr}</Text>
              <Text style={styles.exerciseLinkArrow}>→</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricValue: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxxl,
    color: colors.text,
  },
  metricLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  barCol: { alignItems: 'center', flex: 1 },
  bar: {
    width: 20,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 4,
  },
  statusRow: { gap: spacing.sm },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  statusEmoji: { fontSize: 24 },
  statusText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  statusSub: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
    width: '100%',
  },
  muscleMapContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  prRow: {
    backgroundColor: colors.gold + '10',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold + '25',
  },
  prName: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  prValue: {
    fontFamily: fonts.heading,
    fontSize: fontSize.lg,
    color: colors.gold,
  },
  exerciseLink: {
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
  exerciseLinkText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  exerciseLinkArrow: {
    fontSize: 16,
    color: colors.muted,
  },
});
