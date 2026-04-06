import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_EMOJIS = ['🎉', '🔥', '💪', '⭐', '🏅', '✨', '🚀', '💥', '👑', '🎯'];
const NUM_CONFETTI = 20;
const DISMISS_DELAY = 3000;

interface PRCelebrationProps {
  visible: boolean;
  exerciseName: string;
  newValue: number;
  unit?: string;
  onDismiss: () => void;
}

function ConfettiEmoji({ delay }: { delay: number }) {
  const translateY = useRef(new Animated.Value(-60)).current;
  const translateX = useRef(
    new Animated.Value(Math.random() * SCREEN_WIDTH)
  ).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const emoji = CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)];

  useEffect(() => {
    const horizontalDrift = (Math.random() - 0.5) * 120;
    const duration = 2000 + Math.random() * 1500;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT + 60,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: Math.random() * SCREEN_WIDTH + horizontalDrift,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration,
          delay: duration * 0.6,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: (Math.random() - 0.5) * 6,
          duration,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [delay, translateY, translateX, opacity, rotate]);

  const spin = rotate.interpolate({
    inputRange: [-3, 3],
    outputRange: ['-180deg', '180deg'],
  });

  return (
    <Animated.Text
      style={[
        styles.confettiEmoji,
        {
          transform: [{ translateX }, { translateY }, { rotate: spin }],
          opacity,
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

export default function PRCelebration({
  visible,
  exerciseName,
  newValue,
  unit = 'kg',
  onDismiss,
}: PRCelebrationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss();
      });
    }, DISMISS_DELAY);

    return () => clearTimeout(timer);
  }, [visible, scaleAnim, opacityAnim, onDismiss]);

  if (!visible) return null;

  const confettiDelays = Array.from({ length: NUM_CONFETTI }, (_, i) =>
    Math.random() * 800
  );

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        {/* Confetti rain */}
        {confettiDelays.map((delay, i) => (
          <ConfettiEmoji key={i} delay={delay} />
        ))}

        {/* Central card */}
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.title}>NOUVEAU RECORD!</Text>
          <Text style={styles.exerciseName}>{exerciseName}</Text>
          <Text style={styles.value}>
            {newValue} {unit}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiEmoji: {
    position: 'absolute',
    fontSize: 28,
    top: 0,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 48,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  trophy: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.hero,
    color: colors.gold,
    letterSpacing: 2,
    textAlign: 'center',
  },
  exerciseName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.xl,
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  value: {
    fontFamily: fonts.heading,
    fontSize: 56,
    color: colors.accent,
    marginTop: 8,
    letterSpacing: 2,
  },
});
