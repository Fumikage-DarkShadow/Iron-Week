import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { WorkoutSet } from '../types';
import { colors, fonts, borderRadius, spacing, fontSize } from '../theme';
import { estimate1RM } from '../utils/coachEngine';

interface Props {
  set: WorkoutSet;
  index: number;
  previousSet?: { kg: number; reps: number };
  onUpdate: (updates: Partial<WorkoutSet>) => void;
  onToggleDone: () => void;
  onDelete?: () => void;
  isNewPR?: boolean;
  advice?: string;
  canDelete?: boolean;
}

export default function SetRow({
  set, index, previousSet, onUpdate, onToggleDone, onDelete, isNewPR, advice, canDelete,
}: Props) {
  const estimated = set.done && set.kg > 0 && set.reps > 0 ? estimate1RM(set.kg, set.reps) : null;

  return (
    <View>
      <View style={[styles.row, set.done && styles.rowDone]}>
        {/* Delete button */}
        {canDelete && !set.done && (
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
            <Text style={styles.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        )}

        <View style={styles.setNumber}>
          <Text style={styles.setLabel}>{set.isWarmup ? 'W' : `S${index + 1}`}</Text>
        </View>

        {previousSet && (
          <View style={styles.prevContainer}>
            <Text style={styles.prevText}>
              {previousSet.kg}×{previousSet.reps}
            </Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, set.done && styles.inputDone]}
            value={set.kg > 0 ? String(set.kg) : ''}
            onChangeText={(t) => {
              const cleaned = t.replace(',', '.');
              const val = parseFloat(cleaned);
              onUpdate({ kg: isNaN(val) ? 0 : val });
            }}
            keyboardType="decimal-pad"
            placeholder="kg"
            placeholderTextColor={colors.muted}
            editable={!set.done}
          />
          <Text style={styles.separator}>×</Text>
          <TextInput
            style={[styles.input, set.done && styles.inputDone]}
            value={set.reps > 0 ? String(set.reps) : ''}
            onChangeText={(t) => onUpdate({ reps: parseInt(t) || 0 })}
            keyboardType="numeric"
            placeholder="reps"
            placeholderTextColor={colors.muted}
            editable={!set.done}
          />
        </View>

        {estimated && (
          <Text style={styles.rmText}>1RM:{estimated}</Text>
        )}

        {isNewPR && set.done && (
          <Text style={styles.prBadge}>🏆</Text>
        )}

        <TouchableOpacity
          style={[styles.checkBtn, set.done && styles.checkBtnDone]}
          onPress={onToggleDone}
        >
          <Text style={styles.checkText}>{set.done ? '✓' : ''}</Text>
        </TouchableOpacity>
      </View>

      {/* Per-set coach advice (shown below the set row) */}
      {advice && !set.done && (
        <View style={styles.adviceRow}>
          <Text style={styles.adviceText}>{advice}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowDone: {
    borderColor: colors.green + '40',
    backgroundColor: colors.green + '08',
  },
  deleteBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.red + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  deleteBtnText: {
    fontSize: 10,
    color: colors.red,
    fontWeight: 'bold',
  },
  setNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  setLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  prevContainer: {
    marginRight: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
  },
  prevText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.muted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    width: 55,
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputDone: {
    borderColor: colors.green + '40',
    color: colors.green,
  },
  separator: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.muted,
    marginHorizontal: spacing.xs,
  },
  rmText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.blue,
    marginHorizontal: 2,
  },
  prBadge: {
    fontSize: 16,
    marginHorizontal: 2,
  },
  checkBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  checkBtnDone: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  checkText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.white,
  },
  adviceRow: {
    backgroundColor: colors.blue + '10',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
    marginLeft: 30 + spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.blue + '40',
  },
  adviceText: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.blue,
    lineHeight: 16,
  },
});
