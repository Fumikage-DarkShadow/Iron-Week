import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, borderRadius, spacing, fontSize } from '../../theme';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSyncStore } from '../../stores/syncStore';
import { DayOfWeek, Session, WorkoutExercise, WorkoutSet } from '../../types';
import { generateRecommendation } from '../../utils/coachEngine';
import { getExerciseById } from '../../data/exercises';
import { useUserWeightsStore } from '../../stores/userWeightsStore';
import CoachCard from '../../components/CoachCard';

const DAYS_FR: DayOfWeek[] = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

function getTodayDayId(): DayOfWeek {
  const dayIndex = new Date().getDay();
  // JS: 0=dimanche, 1=lundi...
  const map: DayOfWeek[] = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  return map[dayIndex];
}

export default function TodayScreen({ navigation }: any) {
  const { programs, weeklyPlan } = useWorkoutStore();
  const { sessions, activeSession, getStreak, getWeeklyVolume } = useSessionStore();
  const { settings } = useSettingsStore();
  const { status: syncStatus } = useSyncStore();

  const todayDay = getTodayDayId();
  const todayProgramId = weeklyPlan[todayDay];
  const todayProgram = programs.find((p) => p.id === todayProgramId);

  const streak = getStreak();
  const thisWeekVol = getWeeklyVolume(0);
  const lastWeekVol = getWeeklyVolume(1);
  const volChange = lastWeekVol > 0 ? Math.round(((thisWeekVol - lastWeekVol) / lastWeekVol) * 100) : 0;

  const syncIcon = syncStatus === 'syncing' ? '⏳' : syncStatus === 'success' ? '✅' : syncStatus === 'error' ? '❌' : '☁️';
  const userWeights = useUserWeightsStore((s) => s.weights);

  const recommendations = useMemo(() => {
    if (!todayProgram) return [];
    return todayProgram.exercises.map((ex) =>
      generateRecommendation(ex.exerciseId, sessions, ex.targetRepsRange, settings.goal, userWeights[ex.exerciseId])
    );
  }, [todayProgram, sessions, settings.goal, userWeights]);

  const startWorkout = () => {
    if (!todayProgram) return;

    const session: Session = {
      id: `session_${Date.now()}`,
      programId: todayProgram.id,
      programName: todayProgram.name,
      date: new Date().toISOString().split('T')[0],
      dayId: todayDay,
      startedAt: Date.now(),
      totalVolume: 0,
      exercises: todayProgram.exercises.map((pe) => {
        const rec = recommendations.find((r) => r.exerciseId === pe.exerciseId);
        const suggestedKg = rec?.suggestedWeight || 0;
        return {
          exerciseId: pe.exerciseId,
          sets: Array.from({ length: pe.targetSets }, (_, i): WorkoutSet => ({
            id: `set_${Date.now()}_${i}`,
            kg: suggestedKg,
            reps: 0,
            done: false,
          })),
          targetSets: pe.targetSets,
          targetRepsRange: pe.targetRepsRange,
          restSeconds: pe.restSeconds,
          notes: '',
          completed: false,
          supersetGroup: pe.supersetGroup,
        };
      }),
      prs: [],
    };

    useSessionStore.getState().startSession(session);
    navigation.navigate('ActiveWorkout');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Sync status */}
      <View style={styles.syncRow}>
        <Text style={styles.syncIcon}>{syncIcon}</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>🔥 Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Math.round(thisWeekVol / 1000)}k</Text>
          <Text style={styles.statLabel}>📊 Volume sem.</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: volChange >= 0 ? colors.green : colors.red }]}>
            {volChange >= 0 ? '+' : ''}{volChange}%
          </Text>
          <Text style={styles.statLabel}>📈 vs prev.</Text>
        </View>
      </View>

      {/* Active session banner */}
      {activeSession && (
        <TouchableOpacity
          style={styles.activeSessionBanner}
          onPress={() => navigation.navigate('ActiveWorkout')}
        >
          <View style={styles.activeSessionContent}>
            <Text style={styles.activeSessionText} numberOfLines={1}>
              🏋️ Séance en cours
            </Text>
            <Text style={styles.activeSessionName} numberOfLines={1}>
              {activeSession.programName}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.activeSessionCancelBtn}
            onPress={(e) => {
              e.stopPropagation();
              useSessionStore.getState().endSession();
            }}
          >
            <Text style={styles.activeSessionCancelText}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.activeSessionCta}>Reprendre →</Text>
        </TouchableOpacity>
      )}

      {/* Today's workout */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {todayDay.charAt(0).toUpperCase() + todayDay.slice(1)} — Aujourd'hui
        </Text>

        {todayProgram ? (
          <>
            <View style={styles.programCard}>
              <View style={[styles.programColor, { backgroundColor: todayProgram.color }]} />
              <View style={styles.programInfo}>
                <Text style={styles.programName}>{todayProgram.name}</Text>
                <Text style={styles.programDetail}>
                  {todayProgram.exercises.length} exercices
                </Text>
              </View>
            </View>

            {!activeSession && (
              <TouchableOpacity style={styles.startBtn} onPress={startWorkout}>
                <Text style={styles.startBtnText}>COMMENCER LA SÉANCE</Text>
              </TouchableOpacity>
            )}

            {/* Coach preview — compact summary, details during workout */}
            {recommendations.length > 0 && (
              <View style={styles.coachSection}>
                <Text style={styles.coachTitle}>Aperçu Coach</Text>
                {recommendations.slice(0, 3).map((rec, i) => (
                  <CoachCard key={i} recommendation={rec} compact />
                ))}
                {recommendations.length > 3 && (
                  <Text style={styles.coachMore}>+{recommendations.length - 3} autres exercices</Text>
                )}
              </View>
            )}
          </>
        ) : (
          <View style={styles.restDayCard}>
            <Text style={styles.restDayEmoji}>😴</Text>
            <Text style={styles.restDayText}>Jour de repos</Text>
            <Text style={styles.restDaySubtext}>
              Aucun programme planifié pour aujourd'hui.{'\n'}
              Va dans Programme → Planning pour configurer ta semaine.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  syncRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  syncIcon: { fontSize: 18 },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxl,
    color: colors.text,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
  activeSessionBanner: {
    backgroundColor: colors.accent + '20',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent + '40',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  activeSessionContent: {
    flex: 1,
  },
  activeSessionText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.sm,
    color: colors.accent,
  },
  activeSessionName: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.accent,
    opacity: 0.8,
  },
  activeSessionCancelBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.red + '20',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.red + '40',
  },
  activeSessionCancelText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.xs,
    color: colors.red,
  },
  activeSessionCta: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.sm,
    color: colors.accent,
  },
  section: { marginBottom: spacing.xxl },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxl,
    color: colors.text,
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  programCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  programColor: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  programInfo: { flex: 1 },
  programName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  programDetail: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  startBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  startBtnText: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xl,
    color: colors.white,
    letterSpacing: 2,
  },
  coachSection: { marginTop: spacing.md },
  coachTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.lg,
    color: colors.gold,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  coachMore: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  restDayCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.xxxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  restDayEmoji: { fontSize: 48, marginBottom: spacing.md },
  restDayText: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxl,
    color: colors.text,
    letterSpacing: 1,
  },
  restDaySubtext: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
