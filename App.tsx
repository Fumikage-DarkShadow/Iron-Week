import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Navigation from './src/navigation';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import { colors, fonts } from './src/theme';
import { useSyncStore } from './src/stores/syncStore';
import { useSettingsStore } from './src/stores/settingsStore';

export default function App() {
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  const { pull } = useSyncStore();
  const { settings } = useSettingsStore();

  useEffect(() => {
    // Pull data from GitHub on startup
    pull().catch(() => {});
  }, [pull]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>IRON WEEK PRO</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  if (settings.hasOnboarded === false) {
    try {
      return (
        <GestureHandlerRootView style={{ flex: 1 }}>
          <OnboardingScreen />
          <StatusBar style="light" />
        </GestureHandlerRootView>
      );
    } catch {
      // If onboarding crashes, skip it
      useSettingsStore.getState().updateSettings({ hasOnboarded: true });
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Navigation />
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.accent,
    fontSize: 32,
    marginTop: 16,
    letterSpacing: 4,
  },
});
