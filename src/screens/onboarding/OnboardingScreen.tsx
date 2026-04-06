import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../theme';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUserWeightsStore } from '../../stores/userWeightsStore';
import { UserGoal, UserLevel } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GOALS: { key: UserGoal; label: string; emoji: string; desc: string }[] = [
  { key: 'masse', label: 'Prise de Masse', emoji: '💪', desc: 'Gagner du muscle et du volume' },
  { key: 'force', label: 'Force', emoji: '🏋️', desc: 'Devenir plus fort sur les gros lifts' },
  { key: 'seche', label: 'Sèche', emoji: '🔥', desc: 'Perdre du gras, garder le muscle' },
  { key: 'endurance', label: 'Endurance', emoji: '🫀', desc: 'Améliorer la capacité cardiovasculaire' },
];

const LEVELS: { key: UserLevel; label: string; emoji: string; desc: string }[] = [
  { key: 'debutant', label: 'Débutant', emoji: '🌱', desc: 'Moins de 6 mois de pratique' },
  { key: 'intermediaire', label: 'Intermédiaire', emoji: '⚡', desc: '6 mois à 2 ans de pratique' },
  { key: 'avance', label: 'Avancé', emoji: '🏆', desc: 'Plus de 2 ans de pratique régulière' },
];

const TOP_EXERCISES = [
  { id: 'pec_dc_barre', label: 'Développé Couché' },
  { id: 'quads_squat_barre', label: 'Squat' },
  { id: 'ischio_sdt_roumain', label: 'Soulevé de Terre' },
  { id: 'epaules_dm_barre', label: 'Développé Militaire' },
  { id: 'dos_rowing_barre', label: 'Rowing Barre' },
  { id: 'dos_traction_large', label: 'Tractions' },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<UserGoal>('masse');
  const [level, setLevel] = useState<UserLevel>('intermediaire');
  const [weights, setWeights] = useState<Record<string, string>>({});
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const { updateSettings } = useSettingsStore();
  const { setWeight } = useUserWeightsStore();

  const animateTransition = (nextStep: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleNext = () => {
    if (step < 2) {
      animateTransition(step + 1);
    } else {
      // Save everything
      // Save weights
      Object.entries(weights).forEach(([exerciseId, val]) => {
        const kg = parseFloat(val);
        if (!isNaN(kg) && kg > 0) {
          setWeight(exerciseId, kg);
        }
      });

      // Save settings + mark onboarded
      updateSettings({ goal, level, hasOnboarded: true });
    }
  };

  const handleBack = () => {
    if (step > 0) {
      animateTransition(step - 1);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[styles.dot, step === i && styles.dotActive, step > i && styles.dotDone]}
        />
      ))}
    </View>
  );

  const renderGoalStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>TON OBJECTIF</Text>
      <Text style={styles.stepSubtitle}>Choisis ton objectif principal</Text>
      <View style={styles.cardsGrid}>
        {GOALS.map((g) => (
          <TouchableOpacity
            key={g.key}
            style={[styles.goalCard, goal === g.key && styles.goalCardSelected]}
            onPress={() => setGoal(g.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.goalEmoji}>{g.emoji}</Text>
            <Text style={styles.goalLabel}>{g.label}</Text>
            <Text style={styles.goalDesc}>{g.desc}</Text>
            {goal === g.key && <View style={styles.selectedBadge}><Text style={styles.selectedBadgeText}>✓</Text></View>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderLevelStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>TON NIVEAU</Text>
      <Text style={styles.stepSubtitle}>Où en es-tu dans ta pratique?</Text>
      <View style={styles.levelList}>
        {LEVELS.map((l) => (
          <TouchableOpacity
            key={l.key}
            style={[styles.levelCard, level === l.key && styles.levelCardSelected]}
            onPress={() => setLevel(l.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.levelEmoji}>{l.emoji}</Text>
            <View style={styles.levelTextContainer}>
              <Text style={styles.levelLabel}>{l.label}</Text>
              <Text style={styles.levelDesc}>{l.desc}</Text>
            </View>
            {level === l.key && (
              <View style={styles.radioSelected}>
                <View style={styles.radioInner} />
              </View>
            )}
            {level !== l.key && <View style={styles.radioUnselected} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderWeightsStep = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.stepContent}
    >
      <Text style={styles.stepTitle}>TES CHARGES</Text>
      <Text style={styles.stepSubtitle}>
        Indique tes charges de travail actuelles (optionnel)
      </Text>
      <ScrollView style={styles.weightsScroll} showsVerticalScrollIndicator={false}>
        {TOP_EXERCISES.map((ex) => (
          <View key={ex.id} style={styles.weightRow}>
            <Text style={styles.weightLabel}>{ex.label}</Text>
            <View style={styles.weightInputContainer}>
              <TextInput
                style={styles.weightInput}
                value={weights[ex.id] || ''}
                onChangeText={(t) =>
                  setWeights((prev) => ({ ...prev, [ex.id]: t }))
                }
                placeholder="—"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                returnKeyType="next"
              />
              <Text style={styles.weightUnit}>kg</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <View style={styles.container}>
      {renderStepIndicator()}

      <Animated.View style={[styles.animatedContent, { opacity: fadeAnim }]}>
        {step === 0 && renderGoalStep()}
        {step === 1 && renderLevelStep()}
        {step === 2 && renderWeightsStep()}
      </Animated.View>

      {/* Navigation buttons */}
      <View style={styles.bottomBar}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>Retour</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {step === 2 ? 'Commencer' : 'Suivant'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 60,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 28,
    borderRadius: 5,
  },
  dotDone: {
    backgroundColor: colors.accent,
  },
  animatedContent: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  stepTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.hero,
    color: colors.text,
    letterSpacing: 2,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },

  // Goal cards
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  goalCard: {
    width: (SCREEN_WIDTH - 72) / 2,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  goalCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '12',
  },
  goalEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  goalLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.lg,
    color: colors.text,
    textAlign: 'center',
  },
  goalDesc: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 6,
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },

  // Level cards
  levelList: {
    gap: 12,
  },
  levelCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  levelCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '12',
  },
  levelEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  levelTextContainer: {
    flex: 1,
  },
  levelLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  levelDesc: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 4,
  },
  radioSelected: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
  radioUnselected: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
  },

  // Weight inputs
  weightsScroll: {
    flex: 1,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weightLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weightInput: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxl,
    color: colors.accent,
    width: 70,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  weightUnit: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
    marginLeft: 4,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    paddingBottom: 40,
  },
  backBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minWidth: 100,
  },
  backBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.md,
    color: colors.muted,
  },
  nextBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    minWidth: 140,
    alignItems: 'center',
  },
  nextBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.lg,
    color: colors.white,
  },
});
