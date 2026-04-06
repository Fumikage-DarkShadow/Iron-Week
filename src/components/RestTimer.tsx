import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { colors, fonts, borderRadius, spacing, fontSize } from '../theme';
import { useSettingsStore } from '../stores/settingsStore';
import { CoachRecommendation } from '../types';

interface Props {
  duration: number;
  onComplete: () => void;
  onSkip: () => void;
  visible: boolean;
  nextSetAdvice?: string | null;
}

export default function RestTimer({ duration, onComplete, onSkip, visible, nextSetAdvice }: Props) {
  const [remaining, setRemaining] = useState(duration);
  const [isActive, setIsActive] = useState(false);
  const [adjustedDuration, setAdjustedDuration] = useState(duration);
  const [finished, setFinished] = useState(false);
  const animatedValue = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const { settings } = useSettingsStore();

  // Pre-load sound
  useEffect(() => {
    const loadSound = async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/beep.wav')
        );
        soundRef.current = sound;
      } catch (e) {
        console.log('Sound load failed:', e);
      }
    };
    loadSound();
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setRemaining(duration);
      setAdjustedDuration(duration);
      setIsActive(true);
      setFinished(false);
      animatedValue.setValue(1);
    } else {
      setIsActive(false);
      setFinished(false);
    }
  }, [visible, duration]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          const next = prev - 1;
          animatedValue.setValue(adjustedDuration > 0 ? next / adjustedDuration : 0);

          // Beep on last 5 seconds: 5, 4, 3, 2, 1
          if (next >= 1 && next <= 5 && settings.soundEnabled) {
            playBeep();
          }
          if (next <= 0) {
            if (settings.soundEnabled) {
              // Triple beep at 0
              playBeep();
              setTimeout(() => playBeep(), 150);
              setTimeout(() => playBeep(), 300);
            }
            if (settings.hapticEnabled) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsActive(false);
            setFinished(true);
            return 0;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, adjustedDuration, settings.soundEnabled, settings.hapticEnabled]);

  const playBeep = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(0);
        await soundRef.current.playAsync();
      }
    } catch (e) {
      // Fail silently
    }
  };

  const adjustTime = (delta: number) => {
    setRemaining((prev) => Math.max(0, prev + delta));
    setAdjustedDuration((prev) => Math.max(1, prev + delta));
  };

  const handleDone = () => {
    setFinished(false);
    onComplete();
  };

  if (!visible) return null;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const progress = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={[styles.timerCard, finished && styles.timerCardFinished]}>
        <Text style={styles.title}>{finished ? 'C\'EST PARTI !' : 'REPOS'}</Text>

        {!finished ? (
          <>
            <View style={styles.timeContainer}>
              <Text style={styles.time}>
                {minutes}:{seconds.toString().padStart(2, '0')}
              </Text>
            </View>

            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, { width: progress }]} />
            </View>

            <View style={styles.controls}>
              <TouchableOpacity style={styles.controlBtn} onPress={() => adjustTime(-15)}>
                <Text style={styles.controlText}>-15s</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlBtn} onPress={() => adjustTime(15)}>
                <Text style={styles.controlText}>+15s</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Show advice for next set */}
            {nextSetAdvice ? (
              <View style={styles.adviceContainer}>
                <Text style={styles.adviceText}>{nextSetAdvice}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.goBtn} onPress={handleDone}>
              <Text style={styles.goBtnText}>SÉRIE SUIVANTE →</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.bg + 'ee',
  },
  timerCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent + '40',
  },
  timerCardFinished: {
    borderColor: colors.green + '60',
    backgroundColor: colors.green + '10',
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xl,
    color: colors.accent,
    letterSpacing: 2,
  },
  timeContainer: {
    marginVertical: spacing.lg,
  },
  time: {
    fontFamily: fonts.heading,
    fontSize: 64,
    color: colors.text,
    letterSpacing: 4,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  controlBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  controlText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  skipBtn: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.sm,
  },
  skipText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.white,
  },
  adviceContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginVertical: spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.blue + '30',
  },
  adviceText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.md,
    color: colors.blue,
    textAlign: 'center',
    lineHeight: 22,
  },
  goBtn: {
    backgroundColor: colors.green,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  goBtnText: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xl,
    color: colors.white,
    letterSpacing: 2,
  },
});
