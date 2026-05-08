import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { colors, fonts, borderRadius, spacing, fontSize } from '../../theme';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSyncStore } from '../../stores/syncStore';
import { saveToken, saveRepo, testConnection } from '../../utils/githubSync';

export default function GithubSyncScreen() {
  const { settings, updateSettings } = useSettingsStore();
  const { status, sync } = useSyncStore();
  const [token, setToken] = useState(settings.githubToken ? '***' : '');
  const [repo, setRepo] = useState(settings.githubRepo);

  const save = async () => {
    if (token && token !== '***') {
      await saveToken(token);
      updateSettings({ githubToken: token });
    }
    if (repo) {
      await saveRepo(repo);
      updateSettings({ githubRepo: repo });
    }
    const ok = await testConnection();
    Alert.alert(ok ? 'Connecté' : 'Erreur', ok ? 'GitHub est connecté !' : 'Vérifie ton token et repo.');
  };

  const doSync = async () => {
    await sync();
    const s = useSyncStore.getState();
    Alert.alert(s.status === 'success' ? 'Synchronisé' : 'Erreur', s.error || 'Terminé.');
  };

  const statusIcon = status === 'syncing' ? '⏳' : status === 'success' ? '✅' : status === 'error' ? '❌' : '☁️';
  const statusLabel = status === 'syncing' ? 'Synchronisation...' : status === 'success' ? 'Synchronisé' : status === 'error' ? 'Erreur' : 'Non configuré';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statusBox}>
        <Text style={styles.statusIcon}>{statusIcon}</Text>
        <Text style={styles.statusText}>{statusLabel}</Text>
      </View>

      <Text style={styles.label}>Token GitHub</Text>
      <TextInput
        style={styles.input}
        value={token}
        onChangeText={setToken}
        placeholder="ghp_..."
        placeholderTextColor={colors.muted}
        secureTextEntry
        autoCapitalize="none"
      />

      <Text style={styles.label}>Repo (username/repo-name)</Text>
      <TextInput
        style={styles.input}
        value={repo}
        onChangeText={setRepo}
        placeholder="mon-compte/iron-week-data"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
      />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={save}>
          <Text style={styles.btnText}>SAUVEGARDER</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={doSync}>
          <Text style={[styles.btnText, { color: colors.white }]}>SYNCHRONISER</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.helpBox}>
        <Text style={styles.helpTitle}>Comment ça marche ?</Text>
        <Text style={styles.helpText}>
          1. Crée un token sur github.com/settings/tokens (scope: repo){'\n'}
          2. Crée un repo privé vide (ex: iron-week-data){'\n'}
          3. Colle le token et le nom du repo ci-dessus{'\n'}
          4. Appuie sur SAUVEGARDER puis SYNCHRONISER
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusIcon: { fontSize: 24 },
  statusText: { fontFamily: fonts.bodyBold, fontSize: fontSize.md, color: colors.text },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.muted,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  btn: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  btnText: {
    fontFamily: fonts.heading,
    fontSize: fontSize.md,
    color: colors.text,
    letterSpacing: 1,
  },
  helpBox: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    backgroundColor: colors.blue + '10',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.blue + '25',
  },
  helpTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.blue,
    marginBottom: spacing.xs,
  },
  helpText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
});
