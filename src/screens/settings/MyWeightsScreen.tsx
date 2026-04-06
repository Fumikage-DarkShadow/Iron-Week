import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, borderRadius, spacing, fontSize } from '../../theme';
import { exercises, muscleGroupLabels, muscleGroups } from '../../data/exercises';
import { useUserWeightsStore } from '../../stores/userWeightsStore';
import { MuscleGroup, Exercise } from '../../types';

export default function MyWeightsScreen() {
  const { weights, setWeight, removeWeight } = useUserWeightsStore();
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | 'configured' | 'all'>('configured');

  const filtered = useMemo(() => {
    let result = exercises;

    if (selectedGroup === 'configured') {
      result = result.filter((e) => weights[e.id] !== undefined && weights[e.id] > 0);
    } else if (selectedGroup !== 'all') {
      result = result.filter((e) => e.muscleGroup === selectedGroup);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) => e.nameFr.toLowerCase().includes(q) || e.nameEn.toLowerCase().includes(q)
      );
    }
    return result;
  }, [search, selectedGroup, weights]);

  const configuredCount = Object.values(weights).filter((v) => v > 0).length;

  const handleWeightChange = (exerciseId: string, text: string) => {
    const val = parseFloat(text);
    if (isNaN(val) || val <= 0) {
      removeWeight(exerciseId);
    } else {
      setWeight(exerciseId, val);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header explanation */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🎯 Configure tes charges</Text>
        <Text style={styles.infoText}>
          Renseigne la charge que tu utilises actuellement en série de travail pour chaque exercice.
          Le coach s'adaptera immédiatement au lieu de te traiter comme un débutant.
        </Text>
      </View>

      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Rechercher un exercice..."
        placeholderTextColor={colors.muted}
        autoCorrect={false}
      />

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, selectedGroup === 'configured' && styles.filterChipActive]}
          onPress={() => setSelectedGroup('configured')}
        >
          <Text style={[styles.filterText, selectedGroup === 'configured' && styles.filterTextActive]}>
            Configurés ({configuredCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, selectedGroup === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedGroup('all')}
        >
          <Text style={[styles.filterText, selectedGroup === 'all' && styles.filterTextActive]}>
            Tous
          </Text>
        </TouchableOpacity>
        {muscleGroups.slice(0, 6).map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.filterChip, selectedGroup === g && styles.filterChipActive]}
            onPress={() => setSelectedGroup(g)}
          >
            <Text style={[styles.filterText, selectedGroup === g && styles.filterTextActive]}>
              {muscleGroupLabels[g]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {selectedGroup === 'configured'
                ? 'Aucune charge configurée.\nSélectionne un groupe musculaire et renseigne tes charges.'
                : 'Aucun exercice trouvé.'}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const currentVal = weights[item.id];
          return (
            <View style={styles.exerciseRow}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName} numberOfLines={1}>{item.nameFr}</Text>
                <Text style={styles.exerciseSub}>{muscleGroupLabels[item.muscleGroup]}</Text>
              </View>
              <View style={styles.weightInput}>
                <TextInput
                  style={[styles.kgInput, currentVal ? styles.kgInputFilled : null]}
                  value={currentVal ? String(currentVal) : ''}
                  onChangeText={(t) => handleWeightChange(item.id, t)}
                  keyboardType="numeric"
                  placeholder="—"
                  placeholderTextColor={colors.muted}
                />
                <Text style={styles.kgLabel}>kg</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  infoBox: {
    backgroundColor: colors.accent + '12',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    margin: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent + '25',
  },
  infoTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  filterTextActive: { color: colors.white },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  exerciseSub: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  weightInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  kgInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    width: 65,
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.lg,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kgInputFilled: {
    borderColor: colors.green + '60',
    color: colors.green,
  },
  kgLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
  },
});
