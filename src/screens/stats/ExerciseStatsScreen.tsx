import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line as SvgLine, Circle, Text as SvgText, G, Path } from 'react-native-svg';
import { colors, fonts, borderRadius, spacing, fontSize } from '../../theme';
import { useSessionStore } from '../../stores/sessionStore';
import { getExerciseById } from '../../data/exercises';
import { estimate1RM } from '../../utils/coachEngine';

type Period = '1m' | '3m' | '6m' | 'all';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_W = SCREEN_WIDTH - spacing.lg * 2 - 2; // minus padding & border
const CHART_H = 160;
const PAD = { top: 16, right: 16, bottom: 28, left: 42 };

function MiniLineChart({ data, color, label }: { data: number[]; color: string; label: string }) {
  if (data.length < 2) return null;
  const w = CHART_W - PAD.left - PAD.right;
  const h = CHART_H - PAD.top - PAD.bottom;
  const max = Math.max(...data) * 1.1 || 1;
  const min = Math.min(...data) * 0.9;
  const range = max - min || 1;

  const points = data.map((v, i) => ({
    x: PAD.left + (i / (data.length - 1)) * w,
    y: PAD.top + h - ((v - min) / range) * h,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <Svg width={CHART_W} height={CHART_H}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
        const y = PAD.top + h - pct * h;
        const val = min + pct * range;
        return (
          <G key={i}>
            <SvgLine x1={PAD.left} y1={y} x2={CHART_W - PAD.right} y2={y} stroke={colors.border} strokeWidth={0.5} />
            <SvgText x={PAD.left - 4} y={y + 4} textAnchor="end" fill={colors.muted} fontSize={9}>
              {Math.round(val)}
            </SvgText>
          </G>
        );
      })}
      {/* X labels */}
      {data.length <= 8
        ? points.map((p, i) => (
            <SvgText key={i} x={p.x} y={CHART_H - 4} textAnchor="middle" fill={colors.muted} fontSize={8}>
              S{i + 1}
            </SvgText>
          ))
        : [0, Math.floor(data.length / 2), data.length - 1].map((i) => (
            <SvgText key={i} x={points[i].x} y={CHART_H - 4} textAnchor="middle" fill={colors.muted} fontSize={8}>
              S{i + 1}
            </SvgText>
          ))}
      {/* Line */}
      <Path d={pathD} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color} />
      ))}
      {/* Last value label */}
      <SvgText
        x={points[points.length - 1].x}
        y={points[points.length - 1].y - 10}
        textAnchor="middle"
        fill={color}
        fontSize={11}
        fontWeight="bold"
      >
        {Math.round(data[data.length - 1])}
      </SvgText>
    </Svg>
  );
}

function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  if (data.length < 1) return null;
  const w = CHART_W - PAD.left - PAD.right;
  const h = CHART_H - PAD.top - PAD.bottom;
  const max = Math.max(...data) * 1.1 || 1;
  const barW = Math.max(8, Math.min(24, w / data.length - 4));

  return (
    <Svg width={CHART_W} height={CHART_H}>
      {/* Grid */}
      {[0, 0.5, 1].map((pct, i) => {
        const y = PAD.top + h - pct * h;
        return (
          <G key={i}>
            <SvgLine x1={PAD.left} y1={y} x2={CHART_W - PAD.right} y2={y} stroke={colors.border} strokeWidth={0.5} />
            <SvgText x={PAD.left - 4} y={y + 4} textAnchor="end" fill={colors.muted} fontSize={9}>
              {Math.round(pct * max)}
            </SvgText>
          </G>
        );
      })}
      {/* Bars */}
      {data.map((v, i) => {
        const x = PAD.left + (i / data.length) * w + (w / data.length - barW) / 2;
        const barH = (v / max) * h;
        const y = PAD.top + h - barH;
        return (
          <G key={i}>
            <Rect x={x} y={y} width={barW} height={barH} rx={3} fill={color} opacity={0.85} />
            <SvgText x={x + barW / 2} y={CHART_H - 4} textAnchor="middle" fill={colors.muted} fontSize={8}>
              S{i + 1}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

export default function ExerciseStatsScreen({ route }: any) {
  const { exerciseId } = route.params;
  const exercise = getExerciseById(exerciseId);
  const { sessions } = useSessionStore();
  const [period, setPeriod] = useState<Period>('3m');

  const filteredSessions = useMemo(() => {
    const now = Date.now();
    const cutoff: Record<Period, number> = {
      '1m': now - 30 * 24 * 3600 * 1000,
      '3m': now - 90 * 24 * 3600 * 1000,
      '6m': now - 180 * 24 * 3600 * 1000,
      'all': 0,
    };
    return sessions
      .filter(
        (s) =>
          s.startedAt >= cutoff[period] &&
          s.exercises.some((e) => e.exerciseId === exerciseId)
      )
      .sort((a, b) => a.startedAt - b.startedAt);
  }, [sessions, exerciseId, period]);

  const chartData = useMemo(() => {
    return filteredSessions.map((session) => {
      const ex = session.exercises.find((e) => e.exerciseId === exerciseId);
      if (!ex) return { date: session.date, maxWeight: 0, estimated1RM: 0, volume: 0 };
      const doneSets = ex.sets.filter((s) => s.done);
      const maxWeight = Math.max(0, ...doneSets.map((s) => s.kg));
      const estimated = Math.max(0, ...doneSets.map((s) => estimate1RM(s.kg, s.reps)));
      const volume = doneSets.reduce((v, s) => v + s.kg * s.reps, 0);
      return { date: session.date, maxWeight, estimated1RM: estimated, volume };
    });
  }, [filteredSessions, exerciseId]);

  const currentMax = chartData.length > 0 ? chartData[chartData.length - 1].maxWeight : 0;
  const current1RM = chartData.length > 0 ? chartData[chartData.length - 1].estimated1RM : 0;
  const bestEver1RM = Math.max(0, ...chartData.map((d) => d.estimated1RM));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{exercise?.nameFr || exerciseId}</Text>

      {/* Period selector */}
      <View style={styles.periodRow}>
        {(['1m', '3m', '6m', 'all'] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === 'all' ? 'Tout' : p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary stats */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{currentMax}kg</Text>
          <Text style={styles.summaryLabel}>Charge actuelle</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: colors.blue }]}>{Math.round(current1RM)}kg</Text>
          <Text style={styles.summaryLabel}>1RM estime</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: colors.gold }]}>{Math.round(bestEver1RM)}kg</Text>
          <Text style={styles.summaryLabel}>Meilleur 1RM</Text>
        </View>
      </View>

      {chartData.length < 2 ? (
        <View style={styles.noData}>
          <Text style={styles.noDataText}>
            {chartData.length === 0 ? 'Pas encore de donnees pour cette periode' : 'Il faut au moins 2 seances pour les graphiques'}
          </Text>
        </View>
      ) : (
        <>
          {/* Max Weight Chart */}
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Charge max par seance</Text>
            <View style={styles.chartContainer}>
              <MiniLineChart data={chartData.map((d) => d.maxWeight)} color={colors.accent} label="kg" />
            </View>
          </View>

          {/* 1RM Chart */}
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>1RM estime (Epley)</Text>
            <View style={styles.chartContainer}>
              <MiniLineChart data={chartData.map((d) => d.estimated1RM)} color={colors.blue} label="kg" />
            </View>
          </View>

          {/* Volume Chart */}
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Volume total (kg)</Text>
            <View style={styles.chartContainer}>
              <MiniBarChart data={chartData.map((d) => d.volume)} color={colors.green} />
            </View>
          </View>
        </>
      )}

      {/* History table */}
      <View style={styles.historySection}>
        <Text style={styles.chartTitle}>Historique detaille</Text>
        {[...filteredSessions].reverse().map((session, i) => {
          const ex = session.exercises.find((e) => e.exerciseId === exerciseId);
          if (!ex) return null;
          return (
            <View key={i} style={styles.historyRow}>
              <Text style={styles.historyDate}>{session.date}</Text>
              <View style={styles.historySets}>
                {ex.sets.filter((s) => s.done).map((s, j) => (
                  <View key={j} style={styles.historySet}>
                    <Text style={styles.historySetText}>{s.kg}kg x {s.reps}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxxl,
    color: colors.text,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  periodText: { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.muted },
  periodTextActive: { color: colors.white },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryValue: { fontFamily: fonts.heading, fontSize: fontSize.xl, color: colors.text },
  summaryLabel: { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.muted, marginTop: 2, textAlign: 'center' },
  noData: { padding: spacing.xxxl, alignItems: 'center' },
  noDataText: { fontFamily: fonts.body, fontSize: fontSize.md, color: colors.muted, textAlign: 'center' },
  chartSection: { marginBottom: spacing.xl },
  chartTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  chartContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
  },
  historySection: { marginBottom: spacing.xl },
  historyRow: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyDate: { fontFamily: fonts.bodyBold, fontSize: fontSize.sm, color: colors.text, marginBottom: spacing.xs },
  historySets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  historySet: { backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  historySetText: { fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.text },
});
