import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Circle, Ellipse, G } from 'react-native-svg';
import { MuscleGroup } from '../types';
import { colors } from '../theme';

interface Props {
  muscleGroup: MuscleGroup;
  size?: number;
}

// Returns a simplified body silhouette with the target muscle highlighted in red
export default function MiniMuscleIcon({ muscleGroup, size = 32 }: Props) {
  const highlight = colors.accent;
  const bodyColor = colors.muted + '40';
  const s = size;

  // Body proportions relative to size
  const cx = s / 2;

  return (
    <Svg width={s} height={s} viewBox="0 0 32 32">
      {/* Head */}
      <Circle cx="16" cy="4" r="3" fill={muscleGroup === 'cardio' ? highlight : bodyColor} />
      {/* Torso */}
      <Rect x="11" y="8" width="10" height="10" rx="2" fill={
        ['pectoraux', 'abdos'].includes(muscleGroup) ? highlight : bodyColor
      } />
      {/* Shoulders */}
      <Ellipse cx="8" cy="9" rx="3" ry="2" fill={muscleGroup === 'epaules' ? highlight : bodyColor} />
      <Ellipse cx="24" cy="9" rx="3" ry="2" fill={muscleGroup === 'epaules' ? highlight : bodyColor} />
      {/* Arms */}
      <Rect x="5" y="11" width="3" height="8" rx="1.5" fill={
        ['biceps', 'triceps'].includes(muscleGroup) ? highlight : bodyColor
      } />
      <Rect x="24" y="11" width="3" height="8" rx="1.5" fill={
        ['biceps', 'triceps'].includes(muscleGroup) ? highlight : bodyColor
      } />
      {/* Lower back / core */}
      <Rect x="12" y="18" width="8" height="3" rx="1" fill={
        ['lombaires', 'dos'].includes(muscleGroup) ? highlight : bodyColor
      } />
      {/* Upper legs */}
      <Rect x="10" y="21" width="4" height="7" rx="2" fill={
        ['quadriceps', 'ischio_fessiers'].includes(muscleGroup) ? highlight : bodyColor
      } />
      <Rect x="18" y="21" width="4" height="7" rx="2" fill={
        ['quadriceps', 'ischio_fessiers'].includes(muscleGroup) ? highlight : bodyColor
      } />
      {/* Calves */}
      <Rect x="10.5" y="28" width="3" height="3" rx="1" fill={
        muscleGroup === 'mollets' ? highlight : bodyColor
      } />
      <Rect x="18.5" y="28" width="3" height="3" rx="1" fill={
        muscleGroup === 'mollets' ? highlight : bodyColor
      } />
    </Svg>
  );
}
