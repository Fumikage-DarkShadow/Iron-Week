import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Switch, StyleSheet, Alert } from 'react-native';
import { colors, fonts, borderRadius, spacing, fontSize } from '../../theme';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSyncStore } from '../../stores/syncStore';
import { saveToken, saveRepo, testConnection } from '../../utils/githubSync';
import { UserGoal, UserLevel, WeightUnit } from '../../types';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useSessionStore } from '../../stores/sessionStore';
import { seedPrograms } from '../../data/seedPrograms';

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

export default function SettingsScreen({ navigation }: any) {
  const { settings, updateSettings } = useSettingsStore();
  const { status: syncStatus, sync } = useSyncStore();
  const [token, setToken] = useState(settings.githubToken ? '***' : '');
  const [repo, setRepo] = useState(settings.githubRepo);

  const handleSaveGithub = async () => {
    if (token && token !== '***') {
      await saveToken(token);
      updateSettings({ githubToken: token });
    }
    if (repo) {
      await saveRepo(repo);
      updateSettings({ githubRepo: repo });
    }

    const ok = await testConnection();
    if (ok) {
      Alert.alert('Connexion réussie', 'GitHub est connecté !');
    } else {
      Alert.alert('Erreur', 'Impossible de se connecter. Vérifie ton token et repo.');
    }
  };

  const handleSync = async () => {
    await sync();
    const currentStatus = useSyncStore.getState().status;
    if (currentStatus === 'success') {
      Alert.alert('Sync OK', 'Données synchronisées !');
    } else if (currentStatus === 'error') {
      Alert.alert('Erreur', useSyncStore.getState().error || 'Erreur de synchronisation');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Goal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Objectif principal</Text>
        <View style={styles.optionGrid}>
          {(Object.keys(goalLabels) as UserGoal[]).map((goal) => (
            <TouchableOpacity
              key={goal}
              style={[styles.optionCard, settings.goal === goal && styles.optionCardActive]}
              onPress={() => updateSettings({ goal })}
            >
              <Text style={[styles.optionText, settings.goal === goal && styles.optionTextActive]}>
                {goalLabels[goal]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Level */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Niveau</Text>
        <View style={styles.optionGrid}>
          {(Object.keys(levelLabels) as UserLevel[]).map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.optionCard, settings.level === level && styles.optionCardActive]}
              onPress={() => updateSettings({ level })}
            >
              <Text style={[styles.optionText, settings.level === level && styles.optionTextActive]}>
                {levelLabels[level]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Units */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unité de poids</Text>
        <View style={styles.toggleRow}>
          {(['kg', 'lbs'] as WeightUnit[]).map((unit) => (
            <TouchableOpacity
              key={unit}
              style={[styles.toggleBtn, settings.unit === unit && styles.toggleBtnActive]}
              onPress={() => updateSettings({ unit })}
            >
              <Text style={[styles.toggleText, settings.unit === unit && styles.toggleTextActive]}>
                {unit.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Default rest */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Repos par défaut</Text>
        <View style={styles.toggleRow}>
          {[60, 90, 120, 180].map((sec) => (
            <TouchableOpacity
              key={sec}
              style={[styles.toggleBtn, settings.defaultRestSeconds === sec && styles.toggleBtnActive]}
              onPress={() => updateSettings({ defaultRestSeconds: sec })}
            >
              <Text style={[styles.toggleText, settings.defaultRestSeconds === sec && styles.toggleTextActive]}>
                {sec}s
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Toggles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Préférences</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Notifications</Text>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(v) => updateSettings({ notificationsEnabled: v })}
            trackColor={{ false: colors.border, true: colors.accent + '80' }}
            thumbColor={settings.notificationsEnabled ? colors.accent : colors.muted}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Sons</Text>
          <Switch
            value={settings.soundEnabled}
            onValueChange={(v) => updateSettings({ soundEnabled: v })}
            trackColor={{ false: colors.border, true: colors.accent + '80' }}
            thumbColor={settings.soundEnabled ? colors.accent : colors.muted}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Vibrations</Text>
          <Switch
            value={settings.hapticEnabled}
            onValueChange={(v) => updateSettings({ hapticEnabled: v })}
            trackColor={{ false: colors.border, true: colors.accent + '80' }}
            thumbColor={settings.hapticEnabled ? colors.accent : colors.muted}
          />
        </View>
      </View>

      {/* GitHub Sync */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Synchronisation GitHub</Text>
        <View style={styles.syncStatus}>
          <Text style={styles.syncIcon}>
            {syncStatus === 'syncing' ? '⏳' : syncStatus === 'success' ? '✅' : syncStatus === 'error' ? '❌' : '☁️'}
          </Text>
          <Text style={styles.syncText}>
            {syncStatus === 'syncing' ? 'Synchronisation...' :
              syncStatus === 'success' ? 'Synchronisé' :
                syncStatus === 'error' ? 'Erreur de sync' : 'Non configuré'}
          </Text>
        </View>
        <TextInput
          style={styles.input}
          value={token}
          onChangeText={setToken}
          placeholder="Token GitHub (ghp_...)"
          placeholderTextColor={colors.muted}
          secureTextEntry
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          value={repo}
          onChangeText={setRepo}
          placeholder="username/repo-name"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
        />
        <View style={styles.githubActions}>
          <TouchableOpacity style={styles.githubBtn} onPress={handleSaveGithub}>
            <Text style={styles.githubBtnText}>SAUVEGARDER</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.githubBtn, styles.syncBtn]} onPress={handleSync}>
            <Text style={styles.githubBtnText}>SYNC</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* My weights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profil de force</Text>
        <TouchableOpacity
          style={styles.dataBtn}
          onPress={() => navigation.navigate('MyWeights')}
        >
          <Text style={styles.dataBtnIcon}>💪</Text>
          <View style={styles.dataBtnContent}>
            <Text style={styles.dataBtnTitle}>Mes charges</Text>
            <Text style={styles.dataBtnSub}>Configure tes charges actuelles par exercice pour un coaching personnalisé</Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 18 }}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Data management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gestion des données</Text>

        <TouchableOpacity
          style={styles.dataBtn}
          onPress={() => {
            useWorkoutStore.getState().importPrograms(seedPrograms);
            Alert.alert('Importé', `${seedPrograms.length} programmes importés !`);
          }}
        >
          <Text style={styles.dataBtnIcon}>📥</Text>
          <View style={styles.dataBtnContent}>
            <Text style={styles.dataBtnTitle}>Importer mes programmes</Text>
            <Text style={styles.dataBtnSub}>Charge les 6 programmes prédéfinis</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dataBtn, styles.dataBtnDanger]}
          onPress={() => {
            Alert.alert(
              'Réinitialiser les performances',
              'Cela supprimera toutes tes séances, PRs et statistiques. Tes programmes seront conservés.',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Réinitialiser',
                  style: 'destructive',
                  onPress: () => {
                    useSessionStore.getState().resetAllData();
                    Alert.alert('Fait', 'Toutes les performances ont été supprimées.');
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.dataBtnIcon}>🗑️</Text>
          <View style={styles.dataBtnContent}>
            <Text style={[styles.dataBtnTitle, { color: colors.red }]}>Réinitialiser les perfs</Text>
            <Text style={styles.dataBtnSub}>Supprime séances, PRs et stats (garde les programmes)</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dataBtn, styles.dataBtnDanger]}
          onPress={() => {
            Alert.alert(
              'Tout supprimer',
              'Cela supprimera TOUT : programmes, séances, PRs, planning. Cette action est irréversible.',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Tout supprimer',
                  style: 'destructive',
                  onPress: () => {
                    useSessionStore.getState().resetAllData();
                    useWorkoutStore.getState().resetPrograms();
                    Alert.alert('Fait', 'Toutes les données ont été supprimées.');
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.dataBtnIcon}>💣</Text>
          <View style={styles.dataBtnContent}>
            <Text style={[styles.dataBtnTitle, { color: colors.red }]}>Tout réinitialiser</Text>
            <Text style={styles.dataBtnSub}>Supprime tout (programmes + performances)</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* App info */}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>IRON WEEK PRO</Text>
        <Text style={styles.appVersion}>v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl * 2 },
  section: { marginBottom: spacing.xxl },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionCardActive: {
    backgroundColor: colors.accent + '20',
    borderColor: colors.accent,
  },
  optionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.md,
    color: colors.muted,
  },
  optionTextActive: { color: colors.accent },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  toggleText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.muted,
  },
  toggleTextActive: { color: colors.white },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  syncIcon: { fontSize: 20 },
  syncText: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  githubActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  githubBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  syncBtn: {
    backgroundColor: colors.blue + '20',
    borderColor: colors.blue + '40',
  },
  githubBtnText: {
    fontFamily: fonts.heading,
    fontSize: fontSize.sm,
    color: colors.text,
    letterSpacing: 1,
  },
  dataBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  dataBtnDanger: {
    borderColor: colors.red + '25',
  },
  dataBtnIcon: { fontSize: 22 },
  dataBtnContent: { flex: 1 },
  dataBtnTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  dataBtnSub: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  appName: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxl,
    color: colors.accent,
    letterSpacing: 4,
  },
  appVersion: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.muted,
  },
});
