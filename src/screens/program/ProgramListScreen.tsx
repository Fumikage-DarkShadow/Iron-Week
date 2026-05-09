import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, StyleSheet, Alert } from 'react-native';
import { colors, fonts, borderRadius, spacing, fontSize } from '../../theme';
import { useWorkoutStore } from '../../stores/workoutStore';
import { getExerciseById } from '../../data/exercises';
import { showAlert } from '../../utils/alert';

export default function ProgramListScreen({ navigation }: any) {
  const { programs, deleteProgram, duplicateProgram, toggleFavorite, updateProgram } = useWorkoutStore();
  const [renameModal, setRenameModal] = useState<{ id: string; name: string } | null>(null);
  const [menuProgramId, setMenuProgramId] = useState<string | null>(null);

  const sortedPrograms = [...programs].sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });

  const handleDelete = (id: string, name: string) => {
    showAlert(
      'Supprimer le programme',
      `Es-tu sûr de vouloir supprimer "${name}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => { deleteProgram(id); setMenuProgramId(null); } },
      ]
    );
  };

  const handleRename = () => {
    if (renameModal && renameModal.name.trim()) {
      updateProgram(renameModal.id, { name: renameModal.name.trim() });
      setRenameModal(null);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedPrograms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={() => (
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('CreateProgram')}
            >
              <Text style={styles.createBtnText}>+ NOUVEAU PROGRAMME</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.planBtn}
              onPress={() => navigation.navigate('WeeklyPlan')}
            >
              <Text style={styles.planBtnText}>📅 PLANNING SEMAINE</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyText}>Aucun programme</Text>
            <Text style={styles.emptySubtext}>Crée ton premier programme d'entraînement</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const exerciseNames = item.exercises
            .map((e) => getExerciseById(e.exerciseId)?.nameFr)
            .filter(Boolean)
            .slice(0, 3);
          const isMenuOpen = menuProgramId === item.id;

          return (
            <View style={styles.cardWrapper}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('CreateProgram', { programId: item.id })}
              >
                <View style={[styles.colorBar, { backgroundColor: item.color }]} />
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <View style={styles.cardActions}>
                      <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                        <Text style={styles.favIcon}>{item.isFavorite ? '⭐' : '☆'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setMenuProgramId(isMenuOpen ? null : item.id)}>
                        <Text style={styles.menuIcon}>⋯</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.cardExCount}>{item.exercises.length} exercices</Text>
                  <Text style={styles.cardExList} numberOfLines={1}>
                    {exerciseNames.join(', ')}
                    {item.exercises.length > 3 ? ` +${item.exercises.length - 3}` : ''}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Action menu */}
              {isMenuOpen && (
                <View style={styles.actionMenu}>
                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() => {
                      setMenuProgramId(null);
                      setRenameModal({ id: item.id, name: item.name });
                    }}
                  >
                    <Text style={styles.actionIcon}>✏️</Text>
                    <Text style={styles.actionText}>Renommer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() => { duplicateProgram(item.id); setMenuProgramId(null); }}
                  >
                    <Text style={styles.actionIcon}>📋</Text>
                    <Text style={styles.actionText}>Dupliquer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() => navigation.navigate('CreateProgram', { programId: item.id })}
                  >
                    <Text style={styles.actionIcon}>🔧</Text>
                    <Text style={styles.actionText}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionItem, styles.actionItemDanger]}
                    onPress={() => handleDelete(item.id, item.name)}
                  >
                    <Text style={styles.actionIcon}>🗑️</Text>
                    <Text style={[styles.actionText, { color: colors.red }]}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* Rename Modal */}
      <Modal visible={renameModal !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Renommer le programme</Text>
            <TextInput
              style={styles.modalInput}
              value={renameModal?.name || ''}
              onChangeText={(t) => renameModal && setRenameModal({ ...renameModal, name: t })}
              placeholder="Nouveau nom..."
              placeholderTextColor={colors.muted}
              autoFocus
              autoCorrect={false}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRenameModal(null)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleRename}>
                <Text style={styles.modalConfirmText}>Renommer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg },
  headerRow: { gap: spacing.sm, marginBottom: spacing.lg },
  createBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  createBtnText: {
    fontFamily: fonts.heading,
    fontSize: fontSize.lg,
    color: colors.white,
    letterSpacing: 2,
  },
  planBtn: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  planBtnText: {
    fontFamily: fonts.heading,
    fontSize: fontSize.lg,
    color: colors.text,
    letterSpacing: 1,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyText: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxl,
    color: colors.text,
  },
  emptySubtext: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  cardWrapper: { marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  colorBar: { width: 4 },
  cardContent: { flex: 1, padding: spacing.lg },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.lg,
    color: colors.text,
    flex: 1,
  },
  cardActions: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  favIcon: { fontSize: 18 },
  menuIcon: {
    fontSize: 22,
    color: colors.muted,
    paddingHorizontal: 4,
  },
  cardExCount: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 4,
  },
  cardExList: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
  actionMenu: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionItemDanger: {
    borderBottomWidth: 0,
  },
  actionIcon: { fontSize: 16 },
  actionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  // Rename modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
  },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xl,
    color: colors.text,
    marginBottom: spacing.lg,
    letterSpacing: 1,
  },
  modalInput: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.lg,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalCancel: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.md,
    color: colors.muted,
  },
  modalConfirm: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.sm,
  },
  modalConfirmText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.white,
  },
});
