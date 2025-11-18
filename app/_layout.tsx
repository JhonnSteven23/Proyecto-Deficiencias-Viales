import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

function RootLayoutNav() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === '(autoridad)' || segments[0] === '(admin)';
    if (profile && !inAuthGroup) {
      if (profile.role === 'admin') {
        router.replace('/(admin)');
      } else if (profile.role === 'autoridad') {
        router.replace('/(autoridad)');
      } else {
        router.replace('/(tabs)');
      }
    } else if (!profile && inAuthGroup) {
      router.replace('/');
    }
  }, [profile, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});