import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert } from 'react-native';
import { colors, fonts, borderRadius, spacing, fontSize } from '../../theme';
import { useSettingsStore } from '../../stores/settingsStore';
import { UserGoal, UserLevel, WeightUnit } from '../../types';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useSessionStore } from '../../stores/sessionStore';
import { seedPrograms } from '../../data/seedPrograms';
import { scheduleWorkoutReminder, cancelAllReminders } from '../../utils/notifications';
import { shareCSV } from '../../utils/csvExport';
import { showAlert } from '../../utils/alert';

const goalLabels: Record<UserGoal, string> = {
  masse: 'Prise de masse',
  force: 'Force',
  seche: 'Sèche',
  endurance: 'Endurance',
};

const levelLabels: Record<UserLevel, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
};

interface RowProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  value?: string;
  danger?: boolean;
  right?: React.ReactNode;
}

function SettingRow({ icon, title, subtitle, onPress, value, danger, right }: RowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress} activeOpacity={0.6}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, danger && { color: colors.red }]}>{title}</Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {right}
      {onPress && !right && <Text style={styles.rowArrow}>›</Text>}
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }: any) {
  const { settings, updateSettings } = useSettingsStore();
  const { sessions } = useSessionStore();
  const [reminderHour, setReminderHour] = useState<number | null>(null);

  // Pickers as alerts — clean inline selection
  const pickGoal = () => {
    Alert.alert('Objectif principal', '', [
      ...Object.keys(goalLabels).map((g) => ({
        text: goalLabels[g as UserGoal],
        onPress: () => updateSettings({ goal: g as UserGoal }),
      })),
      { text: 'Annuler', style: 'cancel' as const },
    ]);
  };

  const pickLevel = () => {
    Alert.alert('Niveau', '', [
      ...Object.keys(levelLabels).map((l) => ({
        text: levelLabels[l as UserLevel],
        onPress: () => updateSettings({ level: l as UserLevel }),
      })),
      { text: 'Annuler', style: 'cancel' as const },
    ]);
  };

  const pickUnit = () => {
    Alert.alert('Unité', '', [
      { text: 'Kilogrammes (kg)', onPress: () => updateSettings({ unit: 'kg' }) },
      { text: 'Livres (lbs)', onPress: () => updateSettings({ unit: 'lbs' }) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const pickRest = () => {
    Alert.alert('Repos par défaut', '', [
      ...[60, 90, 120, 180].map((s) => ({
        text: `${s}s`,
        onPress: () => updateSettings({ defaultRestSeconds: s }),
      })),
      { text: 'Annuler', style: 'cancel' as const },
    ]);
  };

  const pickReminder = () => {
    Alert.alert('Rappel quotidien', '', [
      ...[7, 8, 9, 10, 18, 19].map((h) => ({
        text: `${h}h00`,
        onPress: async () => {
          setReminderHour(h);
          await scheduleWorkoutReminder(h, 0);
        },
      })),
      {
        text: 'Désactiver',
        style: 'destructive' as const,
        onPress: async () => { await cancelAllReminders(); setReminderHour(null); },
      },
      { text: 'Annuler', style: 'cancel' as const },
    ]);
  };

  const confirmReset = (full: boolean) => {
    showAlert(
      full ? 'Tout supprimer ?' : 'Réinitialiser les performances ?',
      full
        ? 'Programmes, séances, PRs et planning seront supprimés. Action irréversible.'
        : 'Séances, PRs et stats supprimés. Tes programmes sont conservés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            useSessionStore.getState().resetAllData();
            if (full) useWorkoutStore.getState().resetPrograms();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* PROFIL */}
      <Text style={styles.sectionTitle}>PROFIL</Text>
      <View style={styles.group}>
        <SettingRow icon="🎯" title="Objectif" value={goalLabels[settings.goal]} onPress={pickGoal} />
        <SettingRow icon="📊" title="Niveau" value={levelLabels[settings.level]} onPress={pickLevel} />
        <SettingRow
          icon="💪"
          title="Mes charges"
          subtitle="Configure tes charges par exercice"
          onPress={() => navigation.navigate('MyWeights')}
        />
      </View>

      {/* PREFERENCES */}
      <Text style={styles.sectionTitle}>PRÉFÉRENCES</Text>
      <View style={styles.group}>
        <SettingRow icon="⚖️" title="Unité" value={settings.unit.toUpperCase()} onPress={pickUnit} />
        <SettingRow icon="⏱️" title="Repos par défaut" value={`${settings.defaultRestSeconds}s`} onPress={pickRest} />
        <SettingRow
          icon="🔔"
          title="Rappel séance"
          value={reminderHour !== null ? `${reminderHour}h00` : 'Off'}
          onPress={pickReminder}
        />
        <SettingRow
          icon="🔊"
          title="Sons"
          right={
            <Switch
              value={settings.soundEnabled}
              onValueChange={(v) => updateSettings({ soundEnabled: v })}
              trackColor={{ false: colors.border, true: colors.accent + '80' }}
              thumbColor={settings.soundEnabled ? colors.accent : colors.muted}
            />
          }
        />
        <SettingRow
          icon="📳"
          title="Vibrations"
          right={
            <Switch
              value={settings.hapticEnabled}
              onValueChange={(v) => updateSettings({ hapticEnabled: v })}
              trackColor={{ false: colors.border, true: colors.accent + '80' }}
              thumbColor={settings.hapticEnabled ? colors.accent : colors.muted}
            />
          }
        />
      </View>

      {/* DONNEES */}
      <Text style={styles.sectionTitle}>DONNÉES</Text>
      <View style={styles.group}>
        <SettingRow
          icon="📥"
          title="Importer les programmes"
          subtitle="6 programmes prédéfinis"
          onPress={() => {
            useWorkoutStore.getState().importPrograms(seedPrograms);
            Alert.alert('Importé', `${seedPrograms.length} programmes ajoutés.`);
          }}
        />
        <SettingRow
          icon="📤"
          title="Exporter (CSV)"
          subtitle="Toutes tes séances dans un fichier"
          onPress={async () => {
            if (sessions.length === 0) {
              Alert.alert('Vide', 'Aucune séance à exporter.');
              return;
            }
            await shareCSV(sessions);
          }}
        />
        <SettingRow
          icon="☁️"
          title="Sync GitHub"
          subtitle="Configurer la sauvegarde"
          onPress={() => navigation.navigate('GithubSync')}
        />
      </View>

      {/* ZONE DANGER */}
      <Text style={styles.sectionTitle}>ZONE DANGER</Text>
      <View style={styles.group}>
        <SettingRow
          icon="🗑️"
          title="Réinitialiser les perfs"
          subtitle="Garde les programmes"
          danger
          onPress={() => confirmReset(false)}
        />
        <SettingRow
          icon="💣"
          title="Tout supprimer"
          subtitle="Programmes + performances"
          danger
          onPress={() => confirmReset(true)}
        />
      </View>

      <View style={styles.appInfo}>
        <Text style={styles.appName}>IRON WEEK PRO</Text>
        <Text style={styles.appVersion}>v2.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl * 2 },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.sm,
    color: colors.muted,
    letterSpacing: 2,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    marginLeft: spacing.sm,
  },
  group: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 56,
  },
  rowIcon: {
    fontSize: 20,
    width: 32,
  },
  rowContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  rowTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  rowSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
  rowValue: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
    marginRight: spacing.xs,
  },
  rowArrow: {
    fontSize: 22,
    color: colors.muted,
    marginLeft: spacing.xs,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginTop: spacing.xl,
  },
  appName: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xl,
    color: colors.accent,
    letterSpacing: 4,
  },
  appVersion: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 4,
  },
});
