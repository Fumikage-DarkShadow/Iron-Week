import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Ellipse, G, Line, Rect } from 'react-native-svg';
import { MuscleGroup } from '../types';
import { colors, fonts, fontSize, spacing, borderRadius } from '../theme';

interface Props {
  primary?: MuscleGroup;
  secondary?: MuscleGroup[];
  intensityMap?: Partial<Record<MuscleGroup, number>>;
  width?: number;
  showLabels?: boolean;
}

const BASE = colors.muted + '25';
const PRIMARY = colors.accent;
const SECONDARY = colors.accent2;

function getColor(
  muscle: MuscleGroup,
  primary?: MuscleGroup,
  secondary?: MuscleGroup[],
  intensityMap?: Partial<Record<MuscleGroup, number>>
): string {
  if (intensityMap) {
    const val = intensityMap[muscle] || 0;
    if (val <= 0) return BASE;
    if (val < 0.3) return colors.green + '60';
    if (val < 0.6) return colors.accent2;
    return colors.accent;
  }
  if (primary === muscle) return PRIMARY;
  if (secondary?.includes(muscle)) return SECONDARY;
  return BASE;
}

export default function BodyFigure({ primary, secondary = [], intensityMap, width = 140, showLabels = true }: Props) {
  const scale = width / 140;
  const h = width * 2.2;

  const c = (muscle: MuscleGroup) => getColor(muscle, primary, secondary, intensityMap);

  return (
    <View style={styles.container}>
      <View style={styles.bodyRow}>
        {/* FRONT VIEW */}
        <View style={styles.figureContainer}>
          {showLabels && <Text style={styles.viewLabel}>AVANT</Text>}
          <Svg width={width} height={h} viewBox="0 0 140 308">
            {/* Head */}
            <Ellipse cx="70" cy="20" rx="14" ry="17" fill={BASE} stroke={colors.border} strokeWidth={0.5} />

            {/* Neck */}
            <Rect x="63" y="35" width="14" height="10" rx="3" fill={BASE} />

            {/* Trapezius / shoulders */}
            <Path d="M46,45 Q38,44 28,52 L34,56 Q42,48 50,47 Z" fill={c('epaules')} stroke={colors.border} strokeWidth={0.3} />
            <Path d="M94,45 Q102,44 112,52 L106,56 Q98,48 90,47 Z" fill={c('epaules')} stroke={colors.border} strokeWidth={0.3} />

            {/* Deltoids */}
            <Ellipse cx="30" cy="60" rx="11" ry="14" fill={c('epaules')} stroke={colors.border} strokeWidth={0.3} />
            <Ellipse cx="110" cy="60" rx="11" ry="14" fill={c('epaules')} stroke={colors.border} strokeWidth={0.3} />

            {/* Pectoraux - upper */}
            <Path d="M42,50 Q55,48 68,52 L68,65 Q55,68 42,62 Z" fill={c('pectoraux')} stroke={colors.border} strokeWidth={0.3} />
            <Path d="M98,50 Q85,48 72,52 L72,65 Q85,68 98,62 Z" fill={c('pectoraux')} stroke={colors.border} strokeWidth={0.3} />
            {/* Pectoraux - lower */}
            <Path d="M44,63 Q55,68 68,66 L68,74 Q56,78 46,72 Z" fill={c('pectoraux')} stroke={colors.border} strokeWidth={0.3} />
            <Path d="M96,63 Q85,68 72,66 L72,74 Q84,78 94,72 Z" fill={c('pectoraux')} stroke={colors.border} strokeWidth={0.3} />

            {/* Biceps */}
            <Path d="M22,72 Q18,82 20,100 L30,100 Q34,82 32,72 Z" fill={c('biceps')} stroke={colors.border} strokeWidth={0.3} />
            <Path d="M118,72 Q122,82 120,100 L110,100 Q106,82 108,72 Z" fill={c('biceps')} stroke={colors.border} strokeWidth={0.3} />

            {/* Forearms */}
            <Path d="M20,102 Q16,118 18,132 L28,132 Q30,118 30,102 Z" fill={BASE} stroke={colors.border} strokeWidth={0.3} />
            <Path d="M120,102 Q124,118 122,132 L112,132 Q110,118 110,102 Z" fill={BASE} stroke={colors.border} strokeWidth={0.3} />

            {/* Abs - 6 blocks */}
            <Rect x="52" y="76" width="15" height="12" rx="2" fill={c('abdos')} stroke={colors.border} strokeWidth={0.3} />
            <Rect x="73" y="76" width="15" height="12" rx="2" fill={c('abdos')} stroke={colors.border} strokeWidth={0.3} />
            <Rect x="52" y="90" width="15" height="12" rx="2" fill={c('abdos')} stroke={colors.border} strokeWidth={0.3} />
            <Rect x="73" y="90" width="15" height="12" rx="2" fill={c('abdos')} stroke={colors.border} strokeWidth={0.3} />
            <Rect x="52" y="104" width="15" height="12" rx="2" fill={c('abdos')} stroke={colors.border} strokeWidth={0.3} />
            <Rect x="73" y="104" width="15" height="12" rx="2" fill={c('abdos')} stroke={colors.border} strokeWidth={0.3} />

            {/* Obliques */}
            <Path d="M42,74 L50,76 L50,116 L44,118 Q40,98 42,74 Z" fill={c('abdos')} stroke={colors.border} strokeWidth={0.3} opacity={0.6} />
            <Path d="M98,74 L90,76 L90,116 L96,118 Q100,98 98,74 Z" fill={c('abdos')} stroke={colors.border} strokeWidth={0.3} opacity={0.6} />

            {/* Hip area */}
            <Path d="M44,118 L70,124 L70,130 L42,126 Z" fill={BASE} stroke={colors.border} strokeWidth={0.2} />
            <Path d="M96,118 L70,124 L70,130 L98,126 Z" fill={BASE} stroke={colors.border} strokeWidth={0.2} />

            {/* Quadriceps */}
            <Path d="M42,128 Q38,155 40,185 L56,185 Q62,160 62,132 Z" fill={c('quadriceps')} stroke={colors.border} strokeWidth={0.3} />
            <Path d="M98,128 Q102,155 100,185 L84,185 Q78,160 78,132 Z" fill={c('quadriceps')} stroke={colors.border} strokeWidth={0.3} />

            {/* Inner quad / adductors */}
            <Path d="M62,134 L70,138 L70,178 L62,185 Z" fill={c('quadriceps')} stroke={colors.border} strokeWidth={0.2} opacity={0.7} />
            <Path d="M78,134 L70,138 L70,178 L78,185 Z" fill={c('quadriceps')} stroke={colors.border} strokeWidth={0.2} opacity={0.7} />

            {/* Knees */}
            <Ellipse cx="50" cy="192" rx="11" ry="8" fill={BASE} stroke={colors.border} strokeWidth={0.3} />
            <Ellipse cx="90" cy="192" rx="11" ry="8" fill={BASE} stroke={colors.border} strokeWidth={0.3} />

            {/* Tibialis (front shin) */}
            <Path d="M40,200 Q38,225 40,250 L52,250 Q54,225 52,200 Z" fill={BASE} stroke={colors.border} strokeWidth={0.3} />
            <Path d="M100,200 Q102,225 100,250 L88,250 Q86,225 88,200 Z" fill={BASE} stroke={colors.border} strokeWidth={0.3} />

            {/* Calves front hint */}
            <Path d="M52,202 Q58,220 56,248 L52,250 Q54,225 52,200 Z" fill={c('mollets')} stroke={colors.border} strokeWidth={0.2} opacity={0.5} />
            <Path d="M88,202 Q82,220 84,248 L88,250 Q86,225 88,200 Z" fill={c('mollets')} stroke={colors.border} strokeWidth={0.2} opacity={0.5} />

            {/* Feet */}
            <Ellipse cx="47" cy="258" rx="10" ry="6" fill={BASE} stroke={colors.border} strokeWidth={0.3} />
            <Ellipse cx="93" cy="258" rx="10" ry="6" fill={BASE} stroke={colors.border} strokeWidth={0.3} />

            {/* Hands */}
            <Ellipse cx="20" cy="140" rx="6" ry="8" fill={BASE} stroke={colors.border} strokeWidth={0.2} />
            <Ellipse cx="120" cy="140" rx="6" ry="8" fill={BASE} stroke={colors.border} strokeWidth={0.2} />
          </Svg>
        </View>

        {/* Separator */}
        <View style={styles.separator}>
          <Line x1="0" y1="0" x2="0" y2="100%" />
        </View>

        {/* BACK VIEW */}
        <View style={styles.figureContainer}>
          {showLabels && <Text style={styles.viewLabel}>ARRIERE</Text>}
          <Svg width={width} height={h} viewBox="0 0 140 308">
            {/* Head */}
            <Ellipse cx="70" cy="20" rx="14" ry="17" fill={BASE} stroke={colors.border} strokeWidth={0.5} />

            {/* Neck */}
            <Rect x="63" y="35" width="14" height="10" rx="3" fill={BASE} />

            {/* Trapezius */}
            <Path d="M46,44 Q55,40 70,42 Q85,40 94,44 L94,55 Q85,52 70,52 Q55,52 46,55 Z" fill={c('dos')} stroke={colors.border} strokeWidth={0.3} />

            {/* Rear delts */}
            <Ellipse cx="30" cy="60" rx="11" ry="14" fill={c('epaules')} stroke={colors.border} strokeWidth={0.3} />
            <Ellipse cx="110" cy="60" rx="11" ry="14" fill={c('epaules')} stroke={colors.border} strokeWidth={0.3} />

            {/* Upper back / lats */}
            <Path d="M42,54 Q50,52 68,56 L68,80 Q52,82 42,76 Z" fill={c('dos')} stroke={colors.border} strokeWidth={0.3} />
            <Path d="M98,54 Q90,52 72,56 L72,80 Q88,82 98,76 Z" fill={c('dos')} stroke={colors.border} strokeWidth={0.3} />

            {/* Mid back */}
            <Path d="M44,78 Q56,82 68,80 L68,100 Q56,104 44,98 Z" fill={c('dos')} stroke={colors.border} strokeWidth={0.3} />
            <Path d="M96,78 Q84,82 72,80 L72,100 Q84,104 96,98 Z" fill={c('dos')} stroke={colors.border} strokeWidth={0.3} />

            {/* Triceps */}
            <Path d="M22,72 Q18,82 20,100 L30,100 Q34,82 32,72 Z" fill={c('triceps')} stroke={colors.border} strokeWidth={0.3} />
            <Path d="M118,72 Q122,82 120,100 L110,100 Q106,82 108,72 Z" fill={c('triceps')} stroke={colors.border} strokeWidth={0.3} />

            {/* Forearms */}
            <Path d="M20,102 Q16,118 18,132 L28,132 Q30,118 30,102 Z" fill={BASE} stroke={colors.border} strokeWidth={0.3} />
            <Path d="M120,102 Q124,118 122,132 L112,132 Q110,118 110,102 Z" fill={BASE} stroke={colors.border} strokeWidth={0.3} />

            {/* Lower back / lombaires */}
            <Path d="M48,100 Q58,104 68,102 L68,118 Q58,120 48,116 Z" fill={c('lombaires')} stroke={colors.border} strokeWidth={0.3} />
            <Path d="M92,100 Q82,104 72,102 L72,118 Q82,120 92,116 Z" fill={c('lombaires')} stroke={colors.border} strokeWidth={0.3} />

            {/* Glutes */}
            <Path d="M42,118 Q48,122 68,124 L68,142 Q52,144 42,136 Z" fill={c('ischio_fessiers')} stroke={colors.border} strokeWidth={0.3} />
            <Path d="M98,118 Q92,122 72,124 L72,142 Q88,144 98,136 Z" fill={c('ischio_fessiers')} stroke={colors.border} strokeWidth={0.3} />

            {/* Hamstrings */}
            <Path d="M42,142 Q40,165 42,185 L58,185 Q62,165 60,142 Z" fill={c('ischio_fessiers')} stroke={colors.border} strokeWidth={0.3} />
            <Path d="M98,142 Q100,165 98,185 L82,185 Q78,165 80,142 Z" fill={c('ischio_fessiers')} stroke={colors.border} strokeWidth={0.3} />

            {/* Inner hamstring */}
            <Path d="M60,144 L70,146 L70,180 L60,185 Z" fill={c('ischio_fessiers')} stroke={colors.border} strokeWidth={0.2} opacity={0.7} />
            <Path d="M80,144 L70,146 L70,180 L80,185 Z" fill={c('ischio_fessiers')} stroke={colors.border} strokeWidth={0.2} opacity={0.7} />

            {/* Knees */}
            <Ellipse cx="50" cy="192" rx="11" ry="8" fill={BASE} stroke={colors.border} strokeWidth={0.3} />
            <Ellipse cx="90" cy="192" rx="11" ry="8" fill={BASE} stroke={colors.border} strokeWidth={0.3} />

            {/* Calves */}
            <Path d="M38,200 Q36,218 40,248 L56,248 Q58,218 54,200 Z" fill={c('mollets')} stroke={colors.border} strokeWidth={0.3} />
            <Path d="M102,200 Q104,218 100,248 L84,248 Q82,218 86,200 Z" fill={c('mollets')} stroke={colors.border} strokeWidth={0.3} />

            {/* Feet */}
            <Ellipse cx="47" cy="256" rx="10" ry="6" fill={BASE} stroke={colors.border} strokeWidth={0.3} />
            <Ellipse cx="93" cy="256" rx="10" ry="6" fill={BASE} stroke={colors.border} strokeWidth={0.3} />

            {/* Hands */}
            <Ellipse cx="20" cy="140" rx="6" ry="8" fill={BASE} stroke={colors.border} strokeWidth={0.2} />
            <Ellipse cx="120" cy="140" rx="6" ry="8" fill={BASE} stroke={colors.border} strokeWidth={0.2} />
          </Svg>
        </View>
      </View>

      {/* Legend */}
      {!intensityMap && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: PRIMARY }]} />
            <Text style={styles.legendText}>Ciblé</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: SECONDARY }]} />
            <Text style={styles.legendText}>Secondaire</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  figureContainer: {
    alignItems: 'center',
  },
  viewLabel: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xs,
    color: colors.muted,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  separator: {
    width: 1,
    backgroundColor: colors.border,
    alignSelf: 'stretch',
    marginVertical: spacing.xxl,
    opacity: 0.4,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
  },
});
