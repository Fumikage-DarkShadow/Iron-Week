import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../theme';
import { useSettingsStore } from '../../stores/settingsStore';
import { useWorkoutStore } from '../../stores/workoutStore';
import { TEMPLATES, ProgramTemplate } from '../../data/templates';
import { Program, DayOfWeek } from '../../types';

const { width: SCREEN_W } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { updateSettings } = useSettingsStore();

  const start = () => {
    if (!selectedId) return;
    const template = TEMPLATES.find((t) => t.id === selectedId);
    if (!template) return;

    // Apply level inferred from template
    updateSettings({ level: template.level });

    // Import the template's programs
    const now = Date.now();
    const programs: Program[] = template.programs.map((p) => ({
      ...p,
      createdAt: now,
      updatedAt: now,
    }));
    if (programs.length > 0) {
      useWorkoutStore.getState().importPrograms(programs);
    }

    // Apply weekly plan
    const days: DayOfWeek[] = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    days.forEach((d) => {
      const progId = template.weeklyPlan[d];
      if (progId) {
        useWorkoutStore.getState().setWeeklyPlan(d, progId);
      }
    });

    // Mark onboarded
    updateSettings({ hasOnboarded: true });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo + Welcome */}
        <View style={styles.header}>
          <Text style={styles.logoText}>IRON WEEK PRO</Text>
          <Text style={styles.welcomeTitle}>BIENVENUE 💪</Text>
          <Text style={styles.welcomeSubtitle}>
            Choisis un programme pour commencer.{'\n'}
            Tu pourras tout modifier après.
          </Text>
        </View>

        {/* Templates */}
        <View style={styles.templatesContainer}>
          {TEMPLATES.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              selected={selectedId === tpl.id}
              onPress={() => setSelectedId(tpl.id)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.startBtn, !selectedId && styles.startBtnDisabled]}
          onPress={start}
          disabled={!selectedId}
        >
          <Text style={[styles.startBtnText, !selectedId && styles.startBtnTextDisabled]}>
            {selectedId ? 'COMMENCER →' : 'Choisis un programme'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TemplateCard({
  template,
  selected,
  onPress,
}: {
  template: ProgramTemplate;
  selected: boolean;
  onPress: () => void;
}) {
  const dayCount = Object.keys(template.weeklyPlan).length;
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{template.emoji}</Text>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardName}>{template.name}</Text>
          <Text style={styles.cardFrequency}>{template.frequency}</Text>
        </View>
        {selected && <View style={styles.checkBadge}><Text style={styles.checkBadgeText}>✓</Text></View>}
      </View>

      <Text style={styles.cardDescription}>{template.description}</Text>

      {/* Programs preview */}
      {template.programs.length > 0 ? (
        <View style={styles.programsPreview}>
          {template.programs.slice(0, 4).map((p) => (
            <View key={p.id} style={styles.programChip}>
              <View style={[styles.programDot, { backgroundColor: p.color }]} />
              <Text style={styles.programChipText} numberOfLines={1}>{p.name}</Text>
            </View>
          ))}
          {template.programs.length > 4 && (
            <Text style={styles.moreText}>+{template.programs.length - 4}</Text>
          )}
        </View>
      ) : (
        <Text style={styles.emptyPreview}>Tu créeras tes propres programmes depuis zéro</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: 140,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoText: {
    fontFamily: fonts.heading,
    fontSize: fontSize.md,
    color: colors.accent,
    letterSpacing: 5,
    marginBottom: spacing.lg,
  },
  welcomeTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.hero,
    color: colors.text,
    letterSpacing: 3,
  },
  welcomeSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  templatesContainer: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '0d',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  cardEmoji: { fontSize: 36 },
  cardTitleBlock: { flex: 1 },
  cardName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  cardFrequency: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBadgeText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
  },
  cardDescription: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  programsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  programChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
  },
  programDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  programChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.text,
    maxWidth: SCREEN_W * 0.45,
  },
  moreText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
  },
  emptyPreview: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
    fontStyle: 'italic',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: 40,
    backgroundColor: colors.bg + 'f0',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  startBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  startBtnDisabled: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  startBtnText: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xl,
    color: colors.white,
    letterSpacing: 2,
  },
  startBtnTextDisabled: {
    color: colors.muted,
  },
});
