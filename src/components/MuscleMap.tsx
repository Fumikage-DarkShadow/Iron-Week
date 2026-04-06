import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { MuscleGroup } from '../types';
import { colors, fonts, spacing, fontSize } from '../theme';

interface Props {
  activeMuscles: Partial<Record<MuscleGroup, number>>; // 0-1 intensity
  width?: number;
  height?: number;
  showLabels?: boolean;
}

const muscleColorScale = (intensity: number): string => {
  if (intensity <= 0) return colors.card;
  if (intensity < 0.3) return '#22c55e40';
  if (intensity < 0.6) return '#f5c54280';
  return colors.accent;
};

// Simplified body outline paths — front view
const FRONT_BODY = {
  outline: 'M50,10 C55,10 58,14 58,20 C58,26 55,30 50,30 C45,30 42,26 42,20 C42,14 45,10 50,10 Z M38,32 L30,55 L33,55 L40,38 L45,35 L55,35 L60,38 L67,55 L70,55 L62,32 Z M40,55 L35,85 L38,85 L43,60 L50,58 L57,60 L62,85 L65,85 L60,55 Z',
  pectoraux: 'M42,34 L50,34 L50,44 L42,40 Z M50,34 L58,34 L58,40 L50,44 Z',
  epaules: 'M36,32 L42,32 L42,38 L36,36 Z M58,32 L64,32 L64,36 L58,38 Z',
  biceps: 'M33,40 L38,38 L38,50 L33,50 Z M62,38 L67,40 L67,50 L62,50 Z',
  abdos: 'M44,44 L56,44 L56,58 L44,58 Z',
  quadriceps: 'M40,60 L48,58 L48,78 L40,78 Z M52,58 L60,60 L60,78 L52,78 Z',
  mollets: 'M38,78 L44,78 L44,90 L38,90 Z M56,78 L62,78 L62,90 L56,90 Z',
};

// Simplified body outline — back view
const BACK_BODY = {
  dos: 'M43,34 L57,34 L57,52 L43,52 Z',
  lombaires: 'M45,52 L55,52 L55,58 L45,58 Z',
  triceps: 'M33,40 L38,38 L38,50 L33,50 Z M62,38 L67,40 L67,50 L62,50 Z',
  ischio_fessiers: 'M40,58 L60,58 L60,72 L40,72 Z',
};

export default function MuscleMap({ activeMuscles, width = 120, height = 180, showLabels }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.bodyContainer}>
        {/* Front view */}
        <View style={styles.viewContainer}>
          {showLabels && <Text style={styles.viewLabel}>Face</Text>}
          <Svg width={width} height={height} viewBox="0 0 100 100">
            <G>
              {/* Base body outline */}
              <Path d={FRONT_BODY.outline} fill={colors.card} stroke={colors.border} strokeWidth={0.5} />
              {/* Muscle overlays */}
              <Path d={FRONT_BODY.pectoraux} fill={muscleColorScale(activeMuscles.pectoraux || 0)} opacity={0.8} />
              <Path d={FRONT_BODY.epaules} fill={muscleColorScale(activeMuscles.epaules || 0)} opacity={0.8} />
              <Path d={FRONT_BODY.biceps} fill={muscleColorScale(activeMuscles.biceps || 0)} opacity={0.8} />
              <Path d={FRONT_BODY.abdos} fill={muscleColorScale(activeMuscles.abdos || 0)} opacity={0.8} />
              <Path d={FRONT_BODY.quadriceps} fill={muscleColorScale(activeMuscles.quadriceps || 0)} opacity={0.8} />
              <Path d={FRONT_BODY.mollets} fill={muscleColorScale(activeMuscles.mollets || 0)} opacity={0.8} />
            </G>
          </Svg>
        </View>

        {/* Back view */}
        <View style={styles.viewContainer}>
          {showLabels && <Text style={styles.viewLabel}>Dos</Text>}
          <Svg width={width} height={height} viewBox="0 0 100 100">
            <G>
              <Path d={FRONT_BODY.outline} fill={colors.card} stroke={colors.border} strokeWidth={0.5} />
              <Path d={BACK_BODY.dos} fill={muscleColorScale(activeMuscles.dos || 0)} opacity={0.8} />
              <Path d={BACK_BODY.lombaires} fill={muscleColorScale(activeMuscles.lombaires || 0)} opacity={0.8} />
              <Path d={BACK_BODY.triceps} fill={muscleColorScale(activeMuscles.triceps || 0)} opacity={0.8} />
              <Path d={BACK_BODY.ischio_fessiers} fill={muscleColorScale(activeMuscles.ischio_fessiers || 0)} opacity={0.8} />
            </G>
          </Svg>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  bodyContainer: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  viewContainer: {
    alignItems: 'center',
  },
  viewLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
});
