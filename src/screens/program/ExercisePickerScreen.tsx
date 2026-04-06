import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, fonts, borderRadius, spacing, fontSize } from '../../theme';
import { exercises, muscleGroupLabels, muscleGroups } from '../../data/exercises';
import { Exercise, MuscleGroup } from '../../types';
import MiniMuscleIcon from '../../components/MiniMuscleIcon';

export default function ExercisePickerScreen({ navigation, route }: any) {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | 'all'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let result = exercises;
    if (selectedGroup !== 'all') {
      result = result.filter((e) => e.muscleGroup === selectedGroup);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) => e.nameFr.toLowerCase().includes(q) || e.nameEn.toLowerCase().includes(q)
      );
    }
    return result;
  }, [search, selectedGroup]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const returnProgramId = route?.params?.returnProgramId;

  const confirm = () => {
    navigation.navigate('CreateProgram', {
      selectedExercises: Array.from(selected),
      programId: returnProgramId,
    });
  };

  const renderExercise = useCallback(({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={[styles.card, selected.has(item.id) && styles.cardSelected]}
      onPress={() => toggleSelect(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardRow}>
        <MiniMuscleIcon muscleGroup={item.muscleGroup} size={36} />
        <View style={styles.cardContent}>
          <Text style={styles.cardName} numberOfLines={1}>{item.nameFr}</Text>
          <Text style={styles.cardNameEn} numberOfLines={1}>{item.nameEn}</Text>
          <View style={styles.tags}>
            <View style={[styles.tag, { backgroundColor: colors.accent + '20' }]}>
              <Text style={[styles.tagText, { color: colors.accent }]}>
                {muscleGroupLabels[item.muscleGroup]}
              </Text>
            </View>
            <View style={[styles.tag, { backgroundColor: colors.blue + '20' }]}>
              <Text style={[styles.tagText, { color: colors.blue }]}>
                {item.type === 'compound' ? 'Polyarticulaire' : item.type === 'isolation' ? 'Isolation' : 'Cardio'}
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.checkbox, selected.has(item.id) && styles.checkboxActive]}>
          {selected.has(item.id) && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </View>
    </TouchableOpacity>
  ), [selected, toggleSelect]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un exercice..."
          placeholderTextColor={colors.muted}
          autoCorrect={false}
        />
      </View>

      {/* Muscle group filters — horizontal scroll, not cut off */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, selectedGroup === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedGroup('all')}
        >
          <Text style={[styles.filterText, selectedGroup === 'all' && styles.filterTextActive]}>
            Tous
          </Text>
        </TouchableOpacity>
        {muscleGroups.map((g) => (
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
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderExercise}
        initialNumToRender={15}
      />

      {selected.size > 0 && (
        <View style={styles.confirmContainer}>
          <TouchableOpacity style={styles.confirmBtn} onPress={confirm}>
            <Text style={styles.confirmText}>
              AJOUTER {selected.size} EXERCICE{selected.size > 1 ? 'S' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchContainer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterScroll: {
    maxHeight: 48,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    height: 36,
    justifyContent: 'center',
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
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSelected: {
    borderColor: colors.accent + '60',
    backgroundColor: colors.accent + '08',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  cardName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  cardNameEn: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 1,
  },
  tags: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  confirmContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.bg + 'ee',
  },
  confirmBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: fonts.heading,
    fontSize: fontSize.lg,
    color: colors.white,
    letterSpacing: 2,
  },
});
