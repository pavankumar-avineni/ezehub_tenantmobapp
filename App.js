import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { QUERY_RETRY_COUNT, QUERY_STALE_TIME_MS } from '@env';
import { useAuthStore } from './src/stores/authStore';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { logAction, logError } from './src/utils/logger';

if (!QUERY_RETRY_COUNT || !QUERY_STALE_TIME_MS) {
  throw new Error('Missing QUERY_RETRY_COUNT or QUERY_STALE_TIME_MS in .env');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: Number(QUERY_RETRY_COUNT),
      staleTime: Number(QUERY_STALE_TIME_MS),
    },
  },
});

function AppContent() {
  const { accessToken, isLoading, loadAuth } = useAuthStore();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    logAction('APP_LIFECYCLE', 'AppContent mounted; invoking loadAuth()');
    loadAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      onStateChange={(state) => {
        const activeRoute = state?.routes?.[state.index]?.name;
        logAction('NAVIGATION', `Active root navigator route changed: ${activeRoute}`);
      }}
    >
      {accessToken ? <AppNavigator /> : <AuthNavigator />}
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    logAction('APP_LIFECYCLE', 'Loading Ionicons font assets');
    Font.loadAsync(Ionicons.font)
      .then(() => {
        logAction('APP_LIFECYCLE', 'Ionicons font assets loaded');
        setFontsLoaded(true);
      })
      .catch((err) => {
        logError('APP_LIFECYCLE', 'Failed loading Ionicons font assets', err);
        setFontsLoaded(true);
      });
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
