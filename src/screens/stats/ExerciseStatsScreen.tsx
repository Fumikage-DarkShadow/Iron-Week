import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { CartesianChart, Line, Bar } from 'victory-native';
import { colors, fonts, borderRadius, spacing, fontSize } from '../../theme';
import { useSessionStore } from '../../stores/sessionStore';
import { getExerciseById } from '../../data/exercises';
import { estimate1RM } from '../../utils/coachEngine';

type Period = '1m' | '3m' | '6m' | 'all';

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
    return filteredSessions.map((session, i) => {
      const ex = session.exercises.find((e) => e.exerciseId === exerciseId);
      if (!ex) return { idx: i, date: session.date, maxWeight: 0, estimated1RM: 0, volume: 0 };

      const doneSets = ex.sets.filter((s) => s.done);
      const maxWeight = Math.max(0, ...doneSets.map((s) => s.kg));
      const estimated = Math.max(0, ...doneSets.map((s) => estimate1RM(s.kg, s.reps)));
      const volume = doneSets.reduce((v, s) => v + s.kg * s.reps, 0);

      return { idx: i, date: session.date, maxWeight, estimated1RM: estimated, volume };
    });
  }, [filteredSessions, exerciseId]);

  const currentMax = chartData.length > 0 ? chartData[chartData.length - 1].maxWeight : 0;
  const current1RM = chartData.length > 0 ? chartData[chartData.length - 1].estimated1RM : 0;
  const bestEver1RM = Math.max(0, ...chartData.map((d) => d.estimated1RM));

  const formatXLabel = (value: number) => {
    const idx = Math.round(value);
    if (idx >= 0 && idx < chartData.length) {
      return chartData[idx].date.split('-').slice(1).join('/');
    }
    return '';
  };

  const CHART_HEIGHT = 200;
  const CHART_PADDING = { left: 45, right: 16, top: 16, bottom: 32 };

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

      {chartData.length === 0 ? (
        <View style={styles.noData}>
          <Text style={styles.noDataText}>Pas encore de donnees pour cette periode</Text>
        </View>
      ) : (
        <>
          {/* Max Weight Chart - VictoryLine */}
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Charge max par seance</Text>
            <View style={[styles.chartContainer, { height: CHART_HEIGHT }]}>
              <CartesianChart
                data={chartData}
                xKey="idx"
                yKeys={["maxWeight"]}
                padding={CHART_PADDING}
                domainPadding={{ top: 20, bottom: 10 }}
                axisOptions={{
                  font: null,
                  tickCount: { x: Math.min(chartData.length, 6), y: 5 },
                  lineColor: colors.border,
                  labelColor: colors.muted,
                  formatXLabel,
                  formatYLabel: (v) => `${Math.round(v as number)}`,
                }}
              >
                {({ points }) => (
                  <Line
                    points={points.maxWeight}
                    color={colors.accent}
                    strokeWidth={2.5}
                    curveType="natural"
                  />
                )}
              </CartesianChart>
            </View>
          </View>

          {/* 1RM Chart - VictoryLine */}
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>1RM estime (Epley)</Text>
            <View style={[styles.chartContainer, { height: CHART_HEIGHT }]}>
              <CartesianChart
                data={chartData}
                xKey="idx"
                yKeys={["estimated1RM"]}
                padding={CHART_PADDING}
                domainPadding={{ top: 20, bottom: 10 }}
                axisOptions={{
                  font: null,
                  tickCount: { x: Math.min(chartData.length, 6), y: 5 },
                  lineColor: colors.border,
                  labelColor: colors.muted,
                  formatXLabel,
                  formatYLabel: (v) => `${Math.round(v as number)}`,
                }}
              >
                {({ points }) => (
                  <Line
                    points={points.estimated1RM}
                    color={colors.blue}
                    strokeWidth={2.5}
                    curveType="natural"
                  />
                )}
              </CartesianChart>
            </View>
          </View>

          {/* Volume Chart - VictoryBar */}
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Volume total (kg)</Text>
            <View style={[styles.chartContainer, { height: CHART_HEIGHT }]}>
              <CartesianChart
                data={chartData}
                xKey="idx"
                yKeys={["volume"]}
                padding={CHART_PADDING}
                domainPadding={{ top: 20, bottom: 10 }}
                axisOptions={{
                  font: null,
                  tickCount: { x: Math.min(chartData.length, 6), y: 5 },
                  lineColor: colors.border,
                  labelColor: colors.muted,
                  formatXLabel,
                  formatYLabel: (v) => `${Math.round(v as number)}`,
                }}
              >
                {({ points, chartBounds }) => (
                  <Bar
                    points={points.volume}
                    chartBounds={chartBounds}
                    color={colors.green}
                    roundedCorners={{ topLeft: 4, topRight: 4 }}
                    innerPadding={0.3}
                  />
                )}
              </CartesianChart>
            </View>
          </View>

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
                        <Text style={styles.historySetText}>
                          {s.kg}kg x {s.reps}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}
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
  periodBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  periodText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.muted,
  },
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
  summaryValue: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xl,
    color: colors.text,
  },
  summaryLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  noData: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  noDataText: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.muted,
  },
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
  historyDate: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  historySets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  historySet: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  historySetText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text,
  },
});
