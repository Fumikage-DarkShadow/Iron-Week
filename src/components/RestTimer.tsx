import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { colors, fonts, borderRadius, spacing, fontSize } from '../theme';
import { useSettingsStore } from '../stores/settingsStore';

interface Props {
  duration: number;
  onComplete: () => void;
  onSkip: () => void;
  visible: boolean;
  nextSetAdvice?: string | null;
}

const { width: SCREEN_W } = Dimensions.get('window');
const RING_SIZE = Math.min(SCREEN_W * 0.75, 320);
const STROKE_WIDTH = 14;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RestTimer({ duration, onComplete, onSkip, visible, nextSetAdvice }: Props) {
  const [remaining, setRemaining] = useState(duration);
  const [adjustedDuration, setAdjustedDuration] = useState(duration);
  const [isActive, setIsActive] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const notifIdRef = useRef<string | null>(null);
  const { settings } = useSettingsStore();

  // Pre-load sound
  useEffect(() => {
    const loadSound = async () => {
      try {
        if (Platform.OS !== 'web') {
          await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
        }
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/beep.wav')
        );
        soundRef.current = sound;
      } catch {
        // sound load failed silently
      }
    };
    loadSound();
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  // Schedule a notification so the timer rings even when phone is locked / app backgrounded
  const scheduleEndNotification = async (seconds: number) => {
    if (Platform.OS === 'web') return;
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        if (req.status !== 'granted') return;
      }
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Repos terminé !',
          body: 'C\'est l\'heure de la série suivante 💪',
          sound: settings.soundEnabled ? 'default' : false,
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: settings.hapticEnabled ? [0, 250, 250, 250] : undefined,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, seconds),
        },
      });
      notifIdRef.current = id;
    } catch {
      // notif fail silently
    }
  };

  const cancelScheduledNotification = async () => {
    if (Platform.OS === 'web' || !notifIdRef.current) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
    } catch {
      // ignore
    }
    notifIdRef.current = null;
  };

  // Start / stop on visibility change
  useEffect(() => {
    if (visible) {
      setRemaining(duration);
      setAdjustedDuration(duration);
      setIsActive(true);
      setFinished(false);
      scheduleEndNotification(duration);
    } else {
      setIsActive(false);
      setFinished(false);
      cancelScheduledNotification();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, duration]);

  // Read settings via a ref so the tick effect doesn't re-create the interval
  // each time the user toggles sound/haptic during a rest. Without this,
  // toggling mid-rest cleared the interval and re-armed it (skipping ticks
  // and potentially double-firing beeps).
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Tick — pure decrement, no side effects in updater (so React StrictMode
  // double-invocation doesn't double-beep).
  useEffect(() => {
    if (!isActive) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive]);

  // Side effects driven by `remaining` — runs exactly once per second change
  // because `remaining` is the only dep.
  useEffect(() => {
    if (!isActive) return;
    const s = settingsRef.current;
    // Last 5 seconds: single beep
    if (remaining >= 1 && remaining <= 5 && s.soundEnabled) {
      playBeep();
    }
    // Reached zero: triple beep + haptic, then mark finished
    if (remaining <= 0) {
      if (s.soundEnabled) {
        playBeep();
        setTimeout(() => playBeep(), 150);
        setTimeout(() => playBeep(), 300);
      }
      if (s.hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      setIsActive(false);
      setFinished(true);
    }
    // playBeep is stable (uses ref), no need in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, isActive]);

  const playBeep = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(0);
        await soundRef.current.playAsync();
      }
    } catch {
      // ignore
    }
  };

  const adjustTime = (delta: number) => {
    const newRemaining = Math.max(0, remaining + delta);
    const newDuration = Math.max(1, adjustedDuration + delta);
    setRemaining(newRemaining);
    setAdjustedDuration(newDuration);
    // Reschedule notification with the new time
    cancelScheduledNotification().then(() => scheduleEndNotification(newRemaining));
  };

  const handleSkip = async () => {
    await cancelScheduledNotification();
    setFinished(false);
    onSkip();
  };

  const handleDone = async () => {
    await cancelScheduledNotification();
    setFinished(false);
    onComplete();
  };

  if (!visible) return null;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = adjustedDuration > 0 ? remaining / adjustedDuration : 0;
  const strokeOffset = CIRCUMFERENCE * (1 - progress);
  const ringColor = remaining <= 5 ? colors.red : remaining <= 10 ? colors.gold : colors.accent;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <Text style={styles.title}>{finished ? "C'EST PARTI !" : 'REPOS'}</Text>

        {/* Circular ring with timer in center */}
        <View style={styles.ringContainer}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {/* Background track */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={colors.border}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              opacity={0.3}
            />
            {/* Progress arc — starts at top (12 o'clock) */}
            {!finished && (
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke={ringColor}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            )}
            {/* Filled circle when finished */}
            {finished && (
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke={colors.green}
                strokeWidth={STROKE_WIDTH}
                fill={colors.green + '20'}
              />
            )}
          </Svg>

          {/* Centered time / message */}
          <View style={styles.ringCenter}>
            {!finished ? (
              <>
                <Text style={[styles.time, { color: ringColor }]}>
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </Text>
                <Text style={styles.subtitle}>
                  {remaining <= 5 ? 'PRÉPARE-TOI' : remaining <= 10 ? 'BIENTÔT' : 'RESPIRE'}
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.time, { color: colors.green, fontSize: 56 }]}>GO</Text>
                <Text style={[styles.subtitle, { color: colors.green }]}>SÉRIE SUIVANTE</Text>
              </>
            )}
          </View>
        </View>

        {/* Coach advice — only when finished */}
        {finished && nextSetAdvice ? (
          <View style={styles.adviceCard}>
            <Text style={styles.adviceText}>{nextSetAdvice}</Text>
          </View>
        ) : null}

        {/* Controls */}
        {!finished ? (
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlBtn} onPress={() => adjustTime(-15)}>
              <Text style={styles.controlText}>−15s</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
              <Text style={styles.skipText}>PASSER</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlBtn} onPress={() => adjustTime(15)}>
              <Text style={styles.controlText}>+15s</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.goBtn} onPress={handleDone}>
            <Text style={styles.goBtnText}>COMMENCER LA SÉRIE →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 15, 0.96)',
    zIndex: 999,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxxl,
    color: colors.accent,
    letterSpacing: 6,
    marginBottom: spacing.xxl,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontFamily: fonts.heading,
    fontSize: 80,
    color: colors.text,
    letterSpacing: 2,
    lineHeight: 92,
  },
  subtitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.sm,
    color: colors.muted,
    letterSpacing: 3,
    marginTop: -4,
  },
  adviceCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.green + '40',
    maxWidth: SCREEN_W - 40,
  },
  adviceText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xxxl,
  },
  controlBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 80,
    alignItems: 'center',
  },
  controlText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  skipBtn: {
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    minWidth: 130,
    alignItems: 'center',
  },
  skipText: {
    fontFamily: fonts.heading,
    fontSize: fontSize.lg,
    color: colors.white,
    letterSpacing: 2,
  },
  goBtn: {
    backgroundColor: colors.green,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg,
    marginTop: spacing.xxxl,
  },
  goBtnText: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xl,
    color: colors.white,
    letterSpacing: 2,
  },
});
