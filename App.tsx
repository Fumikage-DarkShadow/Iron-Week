import React, { useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, Platform, ScrollView } from 'react-native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Navigation from './src/navigation';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import { colors } from './src/theme';
import { useSyncStore } from './src/stores/syncStore';
import { useSettingsStore } from './src/stores/settingsStore';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ScrollView style={styles.errorContainer} contentContainerStyle={styles.errorContent}>
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorMessage}>{this.state.error?.message || 'Erreur inconnue'}</Text>
          <Text style={styles.errorStack}>{this.state.error?.stack?.substring(0, 1500)}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [fontsLoaded, fontsError] = useFonts({
    BebasNeue_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  const settings = useSettingsStore((s) => s.settings);

  useEffect(() => {
    // Pull data from GitHub on startup — native only (no GitHub config on web by default)
    if (Platform.OS !== 'web') {
      useSyncStore.getState().pull().catch(() => {});
    }
  }, []);

  // If fonts fail, still try to render (better than black screen forever)
  if (!fontsLoaded && !fontsError) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>IRON WEEK PRO</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {settings.hasOnboarded === false ? <OnboardingScreen /> : <Navigation />}
        <StatusBar style="light" />
      </GestureHandlerRootView>
    </ErrorBoundary>
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
  errorContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  errorContent: {
    padding: 24,
    paddingTop: 60,
  },
  errorTitle: {
    color: colors.red,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorMessage: {
    color: colors.text,
    fontSize: 16,
    marginBottom: 16,
  },
  errorStack: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
