import React, { useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
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
  const shotRef = useRef<ViewShot>(null);

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

  // 4-week trend (volume avg over last 4 weeks vs preceding 4 weeks)
  const trend = useMemo(() => {
    const now = Date.now();
    const fourWeeks = 4 * 7 * 24 * 3600 * 1000;
    const recent = sessions.filter((s) => s.startedAt >= now - fourWeeks);
    const older = sessions.filter((s) => s.startedAt < now - fourWeeks && s.startedAt >= now - 2 * fourWeeks);

    if (recent.length < 2 || older.length === 0) return null;

    const recentAvg = recent.reduce((sum, s) => sum + s.totalVolume, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.totalVolume, 0) / older.length;
    if (olderAvg === 0) return null;

    const change = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
    return change;
  }, [sessions]);

  // Best set of the workout (highest 1RM single set)
  const bestSet = useMemo(() => {
    let best: { exName: string; kg: number; reps: number; oneRm: number } | null = null;
    for (const ex of lastSession.exercises) {
      for (const set of ex.sets) {
        if (!set.done) continue;
        const oneRm = estimate1RM(set.kg, set.reps);
        if (!best || oneRm > best.oneRm) {
          best = {
            exName: getExerciseById(ex.exerciseId)?.nameFr || ex.exerciseId,
            kg: set.kg,
            reps: set.reps,
            oneRm,
          };
        }
      }
    }
    return best;
  }, [lastSession]);

  // Total reps done
  const totalReps = useMemo(() => {
    return lastSession.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.done).reduce((r, s) => r + s.reps, 0),
      0
    );
  }, [lastSession]);

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

  // Hero phrase based on results
  const heroPhrase = useMemo(() => {
    if (prsCount >= 3) return `🏆 ${prsCount} RECORDS BATTUS — TU ES EN FEU`;
    if (prsCount > 0) return `🏆 ${prsCount} ${prsCount > 1 ? 'RECORDS BATTUS' : 'RECORD BATTU'} — BRAVO`;
    if (volChange >= 10) return `🔥 +${volChange}% DE VOLUME — PROGRESSION SOLIDE`;
    if (volChange >= 0) return `💪 SÉANCE BIEN BOUCLÉE`;
    if (volChange > -10) return `✅ SÉANCE TERMINÉE`;
    return `🌱 SÉANCE LÉGÈRE — RÉCUP IMPORTANTE`;
  }, [prsCount, volChange]);

  // Share the summary as image
  const handleShare = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Indisponible sur web', 'Le partage marche depuis l\'app mobile.');
      return;
    }
    try {
      if (!shotRef.current?.capture) {
        Alert.alert('Erreur', 'Impossible de capturer la séance.');
        return;
      }
      const uri = await shotRef.current.capture();
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable && uri) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Partager ma séance',
        });
      }
    } catch (e) {
      Alert.alert('Erreur de partage', String(e));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* CAPTURABLE BLOCK START */}
      <ViewShot ref={shotRef} options={{ format: 'png', quality: 0.95 }} style={styles.shareBlock}>
        {/* Hero — celebration */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{heroPhrase}</Text>
          <Text style={styles.heroProgram}>{lastSession.programName}</Text>
          <Text style={styles.heroDate}>{formatDate(lastSession.date)}</Text>
        </View>

        {/* Big stat row */}
        <View style={styles.bigStatsRow}>
          <BigStat value={duration} label="MIN" emoji="⏱️" />
          <BigStat value={Math.round(totalVolume).toLocaleString('fr-FR')} label="KG VOLUME" emoji="📊" />
          <BigStat value={totalReps} label="REPS" emoji="💪" />
        </View>

        {/* Volume comparison vs last */}
        {previousSession && (
          <View style={[styles.banner, volChange >= 0 ? styles.bannerPositive : styles.bannerNegative]}>
            <Text style={styles.bannerEmoji}>{volChange >= 0 ? '📈' : '📉'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: volChange >= 0 ? colors.green : colors.gold }]}>
                {volChange >= 0 ? `+${volChange}%` : `${volChange}%`} de volume
              </Text>
              <Text style={styles.bannerSub}>
                vs ta dernière séance "{lastSession.programName}"
              </Text>
            </View>
          </View>
        )}

        {/* PR celebration */}
        {prsCount > 0 && (
          <View style={[styles.banner, styles.bannerPR]}>
            <Text style={styles.bannerEmoji}>🏆</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: colors.gold }]}>
                {prsCount} {prsCount > 1 ? 'records battus' : 'record battu'} !
              </Text>
              <Text style={styles.bannerSub}>Tu progresses, continue comme ça 💪</Text>
            </View>
          </View>
        )}

        {/* Best set highlight */}
        {bestSet && bestSet.kg > 0 && (
          <View style={styles.bestSetCard}>
            <Text style={styles.bestSetLabel}>⭐ MEILLEURE SÉRIE</Text>
            <Text style={styles.bestSetExercise}>{bestSet.exName}</Text>
            <Text style={styles.bestSetValue}>
              {bestSet.kg}kg × {bestSet.reps} reps
            </Text>
            <Text style={styles.bestSetEstimate}>1RM estimé : {Math.round(bestSet.oneRm)}kg</Text>
          </View>
        )}

        {/* 4-week trend */}
        {trend !== null && (
          <View style={[styles.banner, trend >= 0 ? styles.bannerPositive : styles.bannerNegative]}>
            <Text style={styles.bannerEmoji}>{trend >= 0 ? '🚀' : '🌙'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: trend >= 0 ? colors.green : colors.gold }]}>
                Tendance 4 semaines : {trend >= 0 ? '+' : ''}{trend}%
              </Text>
              <Text style={styles.bannerSub}>
                {trend >= 5 ? 'Tu es en progression solide.' : trend >= 0 ? 'Tu maintiens le rythme.' : 'Pense à varier ou récupérer.'}
              </Text>
            </View>
          </View>
        )}

        {/* Watermark for shared image */}
        <Text style={styles.watermark}>IRON WEEK PRO</Text>
      </ViewShot>
      {/* CAPTURABLE BLOCK END */}

      {/* Share button */}
      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareBtnText}>📤 PARTAGER MA SÉANCE</Text>
      </TouchableOpacity>

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
        <Text style={styles.sectionTitle}>Pour la prochaine séance</Text>
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

function BigStat({ value, label, emoji }: { value: string | number; label: string; emoji: string }) {
  return (
    <View style={styles.bigStat}>
      <Text style={styles.bigStatEmoji}>{emoji}</Text>
      <Text style={styles.bigStatValue}>{value}</Text>
      <Text style={styles.bigStatLabel}>{label}</Text>
    </View>
  );
}

function formatDate(date: string): string {
  try {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch {
    return date;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  emptyText: { fontFamily: fonts.body, fontSize: fontSize.lg, color: colors.muted },

  // Share block
  shareBlock: {
    backgroundColor: colors.bg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxl,
    color: colors.accent,
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 32,
  },
  heroProgram: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.lg,
    color: colors.text,
    marginTop: spacing.sm,
  },
  heroDate: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
    textTransform: 'capitalize',
  },

  // Big stats
  bigStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  bigStat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bigStatEmoji: { fontSize: 22, marginBottom: 4 },
  bigStatValue: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxxl,
    color: colors.text,
  },
  bigStatLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.5,
    marginTop: 2,
  },

  // Banners
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerPositive: {
    backgroundColor: colors.green + '12',
    borderColor: colors.green + '40',
  },
  bannerNegative: {
    backgroundColor: colors.gold + '12',
    borderColor: colors.gold + '40',
  },
  bannerPR: {
    backgroundColor: colors.gold + '15',
    borderColor: colors.gold + '60',
  },
  bannerEmoji: { fontSize: 32 },
  bannerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.lg,
  },
  bannerSub: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
  },

  // Best set
  bestSetCard: {
    backgroundColor: colors.gold + '12',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold + '40',
  },
  bestSetLabel: {
    fontFamily: fonts.heading,
    fontSize: fontSize.sm,
    color: colors.gold,
    letterSpacing: 2,
  },
  bestSetExercise: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.text,
    marginTop: spacing.xs,
  },
  bestSetValue: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxxl,
    color: colors.gold,
    marginTop: 4,
  },
  bestSetEstimate: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },

  watermark: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xs,
    color: colors.accent,
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: spacing.md,
  },

  // Share button
  shareBtn: {
    backgroundColor: colors.blue + '20',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.blue + '40',
  },
  shareBtnText: {
    fontFamily: fonts.heading,
    fontSize: fontSize.md,
    color: colors.blue,
    letterSpacing: 2,
  },

  // Sections
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
