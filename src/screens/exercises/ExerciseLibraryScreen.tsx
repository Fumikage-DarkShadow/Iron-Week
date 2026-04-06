import React, { useState, useMemo } from 'react';
import { View, Text, SectionList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, borderRadius, spacing, fontSize } from '../../theme';
import { exercises, muscleGroupLabels, muscleGroups } from '../../data/exercises';
import { MuscleGroup } from '../../types';
import ExerciseCard from '../../components/ExerciseCard';

export default function ExerciseLibraryScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | 'all'>('all');

  const sections = useMemo(() => {
    let filtered = exercises;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) => e.nameFr.toLowerCase().includes(q) || e.nameEn.toLowerCase().includes(q)
      );
    }

    if (selectedGroup !== 'all') {
      filtered = filtered.filter((e) => e.muscleGroup === selectedGroup);
      return [{ title: muscleGroupLabels[selectedGroup], data: filtered }];
    }

    return muscleGroups
      .map((group) => ({
        title: muscleGroupLabels[group],
        data: filtered.filter((e) => e.muscleGroup === group),
      }))
      .filter((section) => section.data.length > 0);
  }, [search, selectedGroup]);

  const totalExercises = useMemo(
    () => sections.reduce((sum, s) => sum + s.data.length, 0),
    [sections]
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder={`Rechercher parmi ${exercises.length} exercices...`}
        placeholderTextColor={colors.muted}
      />

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, selectedGroup === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedGroup('all')}
        >
          <Text style={[styles.filterText, selectedGroup === 'all' && styles.filterTextActive]}>
            Tous ({totalExercises})
          </Text>
        </TouchableOpacity>
        {muscleGroups.map((group) => (
          <TouchableOpacity
            key={group}
            style={[styles.filterChip, selectedGroup === group && styles.filterChipActive]}
            onPress={() => setSelectedGroup(group)}
          >
            <Text style={[styles.filterText, selectedGroup === group && styles.filterTextActive]}>
              {muscleGroupLabels[group]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>
            {section.title} ({section.data.length})
          </Text>
        )}
        renderItem={({ item }) => (
          <ExerciseCard
            exercise={item}
            onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
            showMuscleGroup={selectedGroup === 'all'}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    margin: spacing.lg,
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
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  sectionHeader: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xl,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
});
