import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CoachRecommendation, RecommendationType } from '../types';
import { colors, fonts, borderRadius, spacing, fontSize } from '../theme';
import { getExerciseById } from '../data/exercises';

interface Props {
  recommendation: CoachRecommendation;
  compact?: boolean;
}

const typeStyles: Record<RecommendationType, { bg: string; border: string; accent: string }> = {
  increase: { bg: colors.green + '15', border: colors.green + '40', accent: colors.green },
  maintain: { bg: colors.blue + '15', border: colors.blue + '40', accent: colors.blue },
  decrease: { bg: colors.gold + '15', border: colors.gold + '40', accent: colors.gold },
  deload: { bg: colors.red + '15', border: colors.red + '40', accent: colors.red },
  variation: { bg: colors.purple + '15', border: colors.purple + '40', accent: colors.purple },
  first_time: { bg: colors.accent + '15', border: colors.accent + '40', accent: colors.accent },
};

export default function CoachCard({ recommendation, compact }: Props) {
  const exercise = getExerciseById(recommendation.exerciseId);
  const style = typeStyles[recommendation.recommendation];

  const noWeight = recommendation.suggestedWeight <= 0;

  if (compact) {
    return (
      <View style={[styles.compactCard, { backgroundColor: style.bg, borderColor: style.border }]}>
        <Text style={styles.emoji}>{recommendation.emoji}</Text>
        <View style={styles.compactContent}>
          <Text style={[styles.compactTitle, { color: style.accent }]}>
            {noWeight ? 'À découvrir' : `${recommendation.suggestedWeight}kg`}
          </Text>
          <Text style={styles.compactReason} numberOfLines={1}>{recommendation.reason}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: style.bg, borderColor: style.border }]}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{recommendation.emoji}</Text>
        <View style={styles.headerContent}>
          <Text style={styles.exerciseName}>{exercise?.nameFr || recommendation.exerciseId}</Text>
          {!noWeight && (
            <View style={styles.weightRow}>
              {recommendation.currentWeight > 0 && (
                <Text style={styles.currentWeight}>{recommendation.currentWeight}kg</Text>
              )}
              {recommendation.currentWeight > 0 && recommendation.suggestedWeight !== recommendation.currentWeight && (
                <Text style={[styles.arrow, { color: style.accent }]}> → </Text>
              )}
              <Text style={[styles.suggestedWeight, { color: style.accent }]}>
                {recommendation.suggestedWeight}kg
              </Text>
            </View>
          )}
        </View>
        {recommendation.confidence > 0 && (
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>{recommendation.confidence}%</Text>
          </View>
        )}
      </View>
      <Text style={styles.reason}>{recommendation.reason}</Text>
      <Text style={[styles.tip, { color: style.accent }]}>{recommendation.tip}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  currentWeight: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  arrow: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.sm,
  },
  suggestedWeight: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.lg,
  },
  confidenceBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  confidenceText: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  reason: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  tip: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
  },
  compactContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  compactTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
  },
  compactReason: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
  },
});
