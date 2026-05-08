import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
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

const RPE_COLORS: Record<number, string> = {
  6: colors.green,
  7: '#84cc16',
  8: colors.gold,
  9: colors.accent2,
  10: colors.red,
};

const RPE_INFO: Record<number, string> = {
  6: 'Très facile — tu pourrais faire 4+ reps en plus',
  7: 'Facile — 3 reps en réserve',
  8: 'Moyennement dur — 2 reps en réserve (idéal hypertrophie)',
  9: 'Très dur — 1 rep en réserve',
  10: 'Échec — impossible de faire une rep de plus',
};

export default function SetRow({
  set, index, previousSet, onUpdate, onToggleDone, onDelete, isNewPR, advice, canDelete,
}: Props) {
  const [showRpeInfo, setShowRpeInfo] = useState(false);
  const estimated = set.done && set.kg > 0 && set.reps > 0 ? estimate1RM(set.kg, set.reps) : null;

  return (
    <View style={styles.wrapper}>
      {/* Main row */}
      <View style={[styles.row, set.done && styles.rowDone, set.isWarmup && styles.rowWarmup]}>
        <View style={styles.setNumber}>
          <Text style={[styles.setLabel, set.isWarmup && { color: colors.gold }]}>
            {set.isWarmup ? 'W' : index + 1}
          </Text>
        </View>

        {/* Previous session hint */}
        {previousSet && !set.done && (
          <Text style={styles.prevHint}>{previousSet.kg}×{previousSet.reps}</Text>
        )}

        {/* Inputs */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, set.done && styles.inputDone]}
            value={set.kg > 0 ? String(set.kg) : ''}
            onChangeText={(t) => {
              const val = parseFloat(t.replace(',', '.'));
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

        {/* PR badge */}
        {isNewPR && set.done && <Text style={styles.prBadge}>🏆</Text>}

        {/* Action: validate OR delete */}
        {set.done ? (
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDone]} onPress={onToggleDone}>
            <Text style={styles.actionText}>✓</Text>
          </TouchableOpacity>
        ) : canDelete ? (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={onToggleDone}>
              <Text style={[styles.actionText, { color: colors.muted }]}>○</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={onToggleDone}>
            <Text style={[styles.actionText, { color: colors.muted }]}>○</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Secondary info line (1RM + RPE) — only after set done */}
      {set.done && estimated && (
        <View style={styles.secondaryRow}>
          <Text style={styles.rmInline}>1RM ~{estimated}kg</Text>
          <View style={styles.rpeContainer}>
            <TouchableOpacity onPress={() => setShowRpeInfo(true)} style={styles.rpeInfoBtn}>
              <Text style={styles.rpeInfoText}>RPE ?</Text>
            </TouchableOpacity>
            <View style={styles.rpeGroup}>
              {[6, 7, 8, 9, 10].map((val) => {
                const isSelected = set.rpe === val;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.rpeDot,
                      isSelected && { backgroundColor: RPE_COLORS[val], borderColor: RPE_COLORS[val] },
                    ]}
                    onPress={() => onUpdate({ rpe: val })}
                  >
                    <Text style={[styles.rpeDotText, isSelected && { color: colors.white }]}>
                      {val}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* RPE info modal */}
      <Modal visible={showRpeInfo} transparent animationType="fade" onRequestClose={() => setShowRpeInfo(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowRpeInfo(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Qu'est-ce que le RPE ?</Text>
            <Text style={styles.modalSubtitle}>
              Note l'effort ressenti après chaque série pour que le coach affine ses recommandations.
            </Text>
            {[6, 7, 8, 9, 10].map((v) => (
              <View key={v} style={styles.rpeInfoRow}>
                <View style={[styles.rpeInfoBadge, { backgroundColor: RPE_COLORS[v] }]}>
                  <Text style={styles.rpeInfoBadgeText}>{v}</Text>
                </View>
                <Text style={styles.rpeInfoLabel}>{RPE_INFO[v]}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowRpeInfo(false)}>
              <Text style={styles.modalCloseText}>Compris</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Coach advice — only for next undone set */}
      {advice && !set.done && (
        <Text style={styles.adviceText}>{advice}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowDone: {
    borderColor: colors.green + '40',
    backgroundColor: colors.green + '08',
  },
  rowWarmup: {
    borderColor: colors.gold + '30',
    backgroundColor: colors.gold + '06',
  },
  setNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  setLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  prevHint: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.muted,
    marginRight: spacing.xs,
    minWidth: 44,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    width: 58,
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
    backgroundColor: 'transparent',
  },
  separator: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.muted,
    marginHorizontal: spacing.xs,
  },
  prBadge: {
    fontSize: 18,
    marginHorizontal: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 14,
    color: colors.muted,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnDone: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  actionText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.white,
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 28 + spacing.sm,
    paddingTop: 4,
    paddingRight: spacing.sm,
  },
  rmInline: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.blue,
  },
  rpeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rpeInfoBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.blue + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.blue + '30',
  },
  rpeInfoText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.blue,
  },
  rpeGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xl,
    color: colors.text,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  rpeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  rpeInfoBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rpeInfoBadgeText: {
    fontFamily: fonts.heading,
    fontSize: fontSize.lg,
    color: colors.white,
  },
  rpeInfoLabel: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 18,
  },
  modalClose: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  modalCloseText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.white,
  },
  rpeDot: {
    width: 24,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rpeDotText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.muted,
  },
  adviceText: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.blue,
    paddingLeft: 28 + spacing.sm,
    paddingTop: 4,
    paddingRight: spacing.sm,
    lineHeight: 15,
  },
});
